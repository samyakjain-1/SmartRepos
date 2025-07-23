import { Module } from 'modelence/server';
import { generateText } from '@modelence/ai';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { processRepository } from '../repomix';
import { repomixFileCache } from '../file-cache';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

/**
 * Get repository details for chat context (same as devora's getRepoDetails)
 */
async function getRepoDetails(owner: string, repoName: string, githubToken: string) {
  try {
    const octokit = new Octokit({ auth: githubToken });
    
    // Get repository data
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo: repoName,
    });

    // Get README content
    let readmeContent = null;
    try {
      const { data: readmeFile } = await octokit.repos.getReadme({
        owner,
        repo: repoName,
      });
      
      if (readmeFile.content) {
        readmeContent = Buffer.from(readmeFile.content, 'base64').toString('utf8');
      }
    } catch (error) {
      console.log(`No README found for ${owner}/${repoName}`);
    }

    return { repoData, readmeContent };
  } catch (error) {
    console.error(`Error fetching repo details for ${owner}/${repoName}:`, error);
    return null;
  }
}

export default new Module('repoChat', {
  queries: {
    /**
     * Get file cache statistics for monitoring
     */
    async getCacheStats() {
      const stats = repomixFileCache.getStats();
      const cleanupResult = await repomixFileCache.cleanup();
      
      return {
        ...stats,
        cleanup: cleanupResult,
        cacheDirectory: './cache/repomix/',
        maxAge: '7 days',
      };
    },

    async chatWithRepository(args) {
      const { message, owner, repoName, chatHistory } = z.object({
        message: z.string(),
        owner: z.string(),  
        repoName: z.string(),
        chatHistory: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })).optional().default([]),
      }).parse(args);

      const githubToken = process.env.GITHUB_TOKEN;

      if (!githubToken) {
        throw new Error('GitHub token not configured');
      }

      // Parallel processing - get repo details and check file cache simultaneously
      const [repoDetails, cachedRepoContent] = await Promise.all([
        getRepoDetails(owner, repoName, githubToken),
        repomixFileCache.get(owner, repoName)
      ]);

      if (!repoDetails) {
        throw new Error('Repository not found');
      }

      const { repoData, readmeContent } = repoDetails;
      
      // Get repo code analysis through Repomix with file caching
      let repoContent = cachedRepoContent;
      
      if (!repoContent) {
        console.log(`Processing repository ${owner}/${repoName} - not in file cache...`);
        try {
          repoContent = await processRepository(owner, repoName, githubToken);
          // Save to file cache for next time
          if (repoContent) {
            await repomixFileCache.set(owner, repoName, repoContent);
          }
        } catch (error) {
          console.error("Error processing repository:", error);
          // Continue without repo content
        }
      }

      // Smart context building - prioritize based on message content
      const isQuickQuestion = message.length < 50 && 
        !message.toLowerCase().includes('code') && 
        !message.toLowerCase().includes('implement') &&
        !message.toLowerCase().includes('example');

      // Use smaller context for simple questions
      const repoContentSize = isQuickQuestion ? 5000 : 15000;
      const readmeSize = isQuickQuestion ? 2000 : 6000;

      const context = `
Repository Name: ${repoName}
Repository Owner: ${owner}
Repository Description: ${repoData.description || 'Not provided.'}
README Content: ${readmeContent ? readmeContent.substring(0, readmeSize) + (readmeContent.length > readmeSize ? '...(content truncated)' : '') : 'Not available.'}
${repoContent ? `\n\nRepository Analysis (via Repomix):\n${repoContent.substring(0, repoContentSize)}${repoContent.length > repoContentSize ? '...(content truncated)' : ''}` : 'Repository code analysis not available.'}
    
Stats: 
- Stars: ${repoData.stargazers_count}
- Forks: ${repoData.forks_count}
- Language: ${repoData.language || 'Not specified'}
- Topics: ${repoData.topics ? repoData.topics.join(', ') : 'None'}
`;

      // Format chat history for context - limit to last 4 exchanges to reduce tokens (exact same as devora)
      const formattedChatHistory = chatHistory.length > 0 ? chatHistory.slice(-4).map((msg: any) => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n') : '';

      // Build the prompt for Gemini (exact same as devora)
      const prompt = `You are an expert assistant specialized in the technology "${repoName}". 
You are helping a developer learn and use this technology.

Here's relevant information about the repository:
${context}

Previous conversation:
${formattedChatHistory}

The user asks: "${message}"

Provide a helpful response that directly answers their question about ${repoName}. 
Be specific and technical, using actual class names and methods where possible.
Keep your response focused and concise.`;

      try {
        // Use Modelence's generateText with GPT-4o mini (lightweight with large context)
        const response = await generateText({
          provider: 'openai',
          model: 'gpt-4o-mini', // Lightweight, fast, 128k context window
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Optimal for technical responses
          maxTokens: 2048,  // Sufficient for detailed answers
        });

        return { 
          response: response.text,
          timestamp: new Date().toISOString(),
          success: true,
        };
      } catch (error: any) {
        console.error('Error in repo chat:', error);
        
        // Handle rate limiting gracefully (same as devora)
        if (error?.message?.includes('429')) {
          return { 
            response: "I'm sorry, but I've reached my API rate limit. Please try again in a few minutes.",
            timestamp: new Date().toISOString(),
            success: false,
          };
        }
        
        // Generic error response (same as devora)
        return { 
          response: "I'm sorry, I encountered an error while processing your question. Please try a simpler question or try again later.",
          timestamp: new Date().toISOString(),
          success: false,
        };
      }
    },
  },
  mutations: {
    /**
     * Clear cache for a specific repository (useful for debugging)
     */
    async clearRepositoryCache(args) {
      const { owner, repoName } = z.object({
        owner: z.string(),
        repoName: z.string(),
      }).parse(args);

      const cleared = await repomixFileCache.clearRepo(owner, repoName);
      
      return {
        success: cleared,
        message: cleared 
          ? `Cache cleared for ${owner}/${repoName}` 
          : `No cache found for ${owner}/${repoName}`,
        repository: `${owner}/${repoName}`,
      };
    },

    /**
     * Run manual cache cleanup (remove expired files)
     */
    async cleanupCache() {
      const result = await repomixFileCache.cleanup();
      
      return {
        ...result,
        message: `Cleanup completed: ${result.deleted} files deleted, ${result.savedSpace} space freed`,
      };
    },
  },
}); 