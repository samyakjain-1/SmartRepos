import { Module } from 'modelence/server';
import { Octokit } from '@octokit/rest';
import { z } from 'zod';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export default new Module('repos', {
  queries: {
    async getTrending(args) {
      const { period = 'weekly' } = z.object({
        period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional()
      }).parse(args);

      // Calculate date range and build search query based on period
      const now = new Date();
      let searchQuery = '';
      
      switch (period) {
        case 'daily':
          // For daily trending, look for repos with recent activity (pushed in last day) and decent star count
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          searchQuery = `pushed:>${yesterday.toISOString().split('T')[0]} stars:>50`;
          break;
        case 'weekly':
          // For weekly, look for repos created or significantly updated in the last week
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          searchQuery = `created:>${weekAgo.toISOString().split('T')[0]} stars:>10`;
          break;
        case 'monthly':
          // For monthly, look for repos with recent pushes and higher star threshold
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          searchQuery = `pushed:>${monthAgo.toISOString().split('T')[0]} stars:>100`;
          break;
        case 'yearly':
          // For yearly, look for repos with activity in the past year and high star count
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          searchQuery = `pushed:>${yearAgo.toISOString().split('T')[0]} stars:>500`;
          break;
      }

      const response = await octokit.search.repos({
        q: searchQuery,
        sort: 'stars',
        order: 'desc',
        per_page: 30
      });

      return response.data.items.map(repo => {
        if (!repo.owner) {
          throw new Error(`Missing owner info for repo ${repo.full_name}`);
        }

        return {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name, // Add this field that the frontend expects
          owner: repo.owner.login,
          owner_avatar: repo.owner.avatar_url, // Owner's profile picture
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          url: repo.html_url,
          html_url: repo.html_url, // Add this field that the frontend expects
          last_updated: repo.updated_at,
          // Repository topics for additional context
          topics: repo.topics || []
        };
      });
    },

    async getRepoDetails(args) {
      const { owner, name } = z.object({
        owner: z.string(),
        name: z.string()
      }).parse(args);

      try {
        // Get basic repository information
        const { data: repo } = await octokit.repos.get({ owner, repo: name });

        if (!repo.owner) {
          throw new Error('Repository owner data missing from GitHub API response');
        }

        // Get repository languages
        let languages = {};
        try {
          const { data: languagesData } = await octokit.repos.listLanguages({ owner, repo: name });
          languages = languagesData;
        } catch (error) {
          console.warn(`Failed to fetch languages for ${owner}/${name}:`, error);
        }

        // Get README content
        let readmeContent = '';
        try {
          const { data: readme } = await octokit.repos.getReadme({ owner, repo: name });
          // Decode base64 content
          readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8');
        } catch (error) {
          console.warn(`No README found for ${owner}/${name}:`, error);
        }

        return {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          language: repo.language,
          languages: languages,
          updated_at: repo.updated_at,
          created_at: repo.created_at,
          default_branch: repo.default_branch,
          owner: {
            login: repo.owner.login,
            avatar_url: repo.owner.avatar_url
          },
          topics: repo.topics || [],
          readme_content: readmeContent
        };
      } catch (error) {
        console.error(`Failed to fetch repository details for ${owner}/${name}:`, error);
        throw new Error(`Repository ${owner}/${name} not found or access denied`);
      }
    },

    async searchRepoByUrl(args) {
      const { url } = z.object({
        url: z.string().url(),
      }).parse(args);

      // Parse GitHub URL to extract owner and repo name
      const parseGitHubUrl = (url: string): { owner: string; name: string } => {
        try {
          const urlObj = new URL(url);
          
          // Check if it's a GitHub URL
          if (!['github.com', 'www.github.com'].includes(urlObj.hostname)) {
            throw new Error('URL must be a GitHub repository URL');
          }

          // Extract path segments
          const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
          
          if (pathSegments.length < 2) {
            throw new Error('Invalid GitHub repository URL format');
          }

          const [owner, name] = pathSegments;
          
          // Remove .git suffix if present
          const cleanName = name.endsWith('.git') ? name.slice(0, -4) : name;
          
          return { owner, name: cleanName };
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Invalid GitHub repository URL');
        }
      };

      const { owner, name } = parseGitHubUrl(url);

      try {
        // Get basic repository information
        const { data: repo } = await octokit.repos.get({ owner, repo: name });

        if (!repo.owner) {
          throw new Error('Repository owner data missing from GitHub API response');
        }

        // Get repository languages
        let languages = {};
        try {
          const { data: languagesData } = await octokit.repos.listLanguages({ owner, repo: name });
          languages = languagesData;
        } catch (error) {
          console.warn(`Failed to fetch languages for ${owner}/${name}:`, error);
        }

        return {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          language: repo.language,
          languages: languages,
          updated_at: repo.updated_at,
          created_at: repo.created_at,
          default_branch: repo.default_branch,
          owner: {
            login: repo.owner.login,
            avatar_url: repo.owner.avatar_url
          },
          topics: repo.topics || []
        };
      } catch (error) {
        console.error(`Failed to fetch repository from URL ${url}:`, error);
        if (error instanceof Error) {
          throw new Error(`Repository not found: ${error.message}`);
        }
        throw new Error(`Repository not found or access denied`);
      }
    }
  }
});
