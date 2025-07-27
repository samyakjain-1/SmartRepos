import { Octokit } from '@octokit/rest';

// Global cache for Repomix results
declare global {
  var _repomixCache: Record<string, string | null>;
}

/**
 * Retry utility function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; onRetry?: (error: any, attempt: number) => void }
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < options.maxRetries) {
        options.onRetry?.(error, attempt);
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Calculate importance score for a file based on its path
 * Higher score = more important (exact same as devora)
 */
function getFileImportanceScore(filePath: string): number {
  const lowercasePath = filePath.toLowerCase();
  
  // Check for key files
  if (/^readme\.md$/i.test(filePath)) return 1000;
  if (/^package\.json$/i.test(filePath)) return 950;
  if (/^requirements\.txt$/i.test(filePath)) return 950;
  if (/^dockerfile$/i.test(filePath)) return 900;
  if (/^docker-compose\.ya?ml$/i.test(filePath)) return 900;
  if (/^tsconfig\.json$/i.test(filePath)) return 850;
  if (/^\.env\.example$/i.test(filePath)) return 800;
  if (/^main\.[jt]s$/i.test(filePath)) return 800;
  if (/^index\.[jt]sx?$/i.test(filePath)) return 800;
  if (/^app\.[jt]sx?$/i.test(filePath)) return 800;
  if (/^server\.[jt]s$/i.test(filePath)) return 800;
  
  // Check for important directories
  if (lowercasePath.startsWith('src/')) return 700;
  if (lowercasePath.startsWith('app/')) return 700;
  if (lowercasePath.startsWith('api/')) return 650;
  if (lowercasePath.startsWith('components/')) return 600;
  if (lowercasePath.startsWith('pages/')) return 600;
  if (lowercasePath.startsWith('lib/')) return 550;
  if (lowercasePath.startsWith('utils/')) return 550;
  if (lowercasePath.startsWith('hooks/')) return 500;
  if (lowercasePath.startsWith('models/')) return 500;
  if (lowercasePath.startsWith('controllers/')) return 500;
  
  // Check for file types
  if (lowercasePath.endsWith('.ts') || lowercasePath.endsWith('.tsx')) return 400;
  if (lowercasePath.endsWith('.js') || lowercasePath.endsWith('.jsx')) return 390;
  if (lowercasePath.endsWith('.py')) return 380;
  if (lowercasePath.endsWith('.java')) return 370;
  if (lowercasePath.endsWith('.go')) return 360;
  if (lowercasePath.endsWith('.rs')) return 350;
  if (lowercasePath.endsWith('.md')) return 300;
  if (lowercasePath.endsWith('.json')) return 200;
  if (lowercasePath.endsWith('.yml') || lowercasePath.endsWith('.yaml')) return 200;
  
  // Default score
  return 100;
}

/**
 * Process a repository and create a condensed, AI-friendly representation
 * This is devora's exact implementation
 * @param owner Repository owner (username or organization)
 * @param repo Repository name
 * @param githubToken GitHub API token for authentication
 * @returns A promise that resolves to the AI-friendly repo content or null if unsuccessful
 */
export async function processRepository(
  owner: string,
  repo: string,
  githubToken: string
): Promise<string | null> {
  console.log(`Starting Repomix processing for ${owner}/${repo}...`);
  
  try {
    // Set up Octokit with the GitHub token
    const octokit = new Octokit({ auth: githubToken });
    
    // Get repository information with retry logic
    const { data: repository } = await withRetry(
      () => octokit.repos.get({ owner, repo }),
      {
        maxRetries: 3,
        onRetry: (error, attempt) => {
          console.log(`Retrying repository info fetch (attempt ${attempt}) after error: ${error.message}`);
        }
      }
    );
    
    // Get default branch
    const defaultBranch = repository.default_branch;
    
    // Initialize output
    let repomixOutput = `# Repository Analysis: ${repository.name}\n\n`;
    repomixOutput += `## Overview\n\n`;
    repomixOutput += `- Repository: ${repository.full_name}\n`;
    repomixOutput += `- Description: ${repository.description || 'No description provided'}\n`;
    repomixOutput += `- Default Branch: ${defaultBranch}\n`;
    repomixOutput += `- License: ${repository.license ? repository.license.name : 'Not specified'}\n`;
    repomixOutput += `- Language: ${repository.language || 'Not specified'}\n\n`;
    
    // Check if repository has actually been initialized/populated
    if (repository.size === 0) {
      console.log(`Repository ${owner}/${repo} is empty.`);
      repomixOutput += `\n## Files\n\nThis repository is empty and contains no files.\n`;
      return repomixOutput;
    }

    let tree;
    try {
      // Get the repository tree with retry logic
      const treeResponse = await withRetry(
        () => octokit.git.getTree({ 
          owner, 
          repo, 
          tree_sha: defaultBranch, 
          recursive: 'true' 
        }),
        {
          maxRetries: 3,
          onRetry: (error, attempt) => {
            console.log(`Retrying tree fetch (attempt ${attempt}) after error: ${error.message}`);
          }
        }
      );
      tree = treeResponse.data;
    } catch (error) {
      console.error(`Failed to fetch repository tree for ${owner}/${repo}:`, error);
      repomixOutput += `\n## Files\n\nCould not fetch repository file structure.\n`;
      return repomixOutput;
    }
    
    // Skip large binary files and non-code files
    const excludedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg', 
      '.mp4', '.mp3', '.wav', '.ogg', '.pdf', '.zip', '.tar', 
      '.gz', '.rar', '.exe', '.dll', '.so', '.pyc', '.class'
    ];
    
    // Smart file filtering for faster processing
    const filesToProcess = tree.tree
      .filter(file => 
        file.type === 'blob' && 
        file.path && 
        !file.path.startsWith('node_modules/') &&
        !file.path.startsWith('venv/') &&
        !file.path.startsWith('dist/') &&
        !file.path.startsWith('build/') &&
        !file.path.startsWith('.git/') &&
        !file.path.startsWith('assets/') &&
        !file.path.startsWith('public/') &&
        !excludedExtensions.some(ext => file.path!.endsWith(ext)) &&
        // Skip very large files for speed
        (!file.size || file.size < 100000) // Skip files > 100KB
      )
      .sort((a, b) => {
        // Prioritize important files
        const aScore = getFileImportanceScore(a.path!);
        const bScore = getFileImportanceScore(b.path!);
        return bScore - aScore;
      })
      .slice(0, 20); // Reduced from 30 to 20 for faster processing
    
    repomixOutput += `## File Structure\n\n`;
    repomixOutput += `Total Files in Analysis: ${filesToProcess.length}\n\n`;
    
    // Process each file
    for (const file of filesToProcess) {
      try {
        if (!file.path || !file.sha) continue;
        
        // Get file content with retry logic
        const contentResponse = await withRetry(
          () => octokit.git.getBlob({ owner, repo, file_sha: file.sha! }),
          {
            maxRetries: 2,
            onRetry: (error, attempt) => {
              console.log(`Retrying file content fetch for ${file.path} (attempt ${attempt})`);
            }
          }
        );
        
        // Decode content
        let content = '';
        if (contentResponse.data.encoding === 'base64') {
          content = Buffer.from(contentResponse.data.content, 'base64').toString('utf8');
        } else {
          content = contentResponse.data.content;
        }
        
        // Truncate files for faster processing (reduced from 3000)
        if (content.length > 2000) {
          content = content.substring(0, 2000) + '\n... (content truncated)';
        }
        
        repomixOutput += `### File: ${file.path}\n\n`;
        repomixOutput += '```\n';
        repomixOutput += content;
        repomixOutput += '\n```\n\n';
        
      } catch (error) {
        console.log(`Skipping file ${file.path} due to error:`, error);
        repomixOutput += `### File: ${file.path}\n\n`;
        repomixOutput += `Error reading file content.\n\n`;
      }
    }
    
    console.log(`Repomix processing completed for ${owner}/${repo} with ${filesToProcess.length} files`);
    return repomixOutput;
    
  } catch (error) {
    console.error(`Repomix processing failed for ${owner}/${repo}:`, error);
    return null;
  }
} 
