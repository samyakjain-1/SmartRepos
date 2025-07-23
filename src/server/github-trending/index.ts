import { Module } from 'modelence/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import { dbTrendingRepos } from './db';

// Schema for a trending repository
const TrendingRepoSchema = z.object({
  owner: z.string(),
  name: z.string(),
  url: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  starsToday: z.number(),
  rank: z.number(),
  ownerAvatar: z.string().nullable(),
});

type TrendingRepo = z.infer<typeof TrendingRepoSchema>;

// Helper function to get current date in YYYY-MM-DD format
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper function to scrape GitHub trending (used by both API and scheduled job)
async function scrapeGitHubTrending(period: 'daily' | 'weekly' | 'monthly'): Promise<TrendingRepo[]> {
  try {
    // Construct the GitHub trending URL
    const url = period === 'daily' 
      ? 'https://github.com/trending'
      : `https://github.com/trending?since=${period}`;

    // Fetch the HTML page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Parse the HTML with cheerio
    const $ = cheerio.load(response.data);
    const repos: TrendingRepo[] = [];

    // Find all repository articles on the trending page
    $('article.Box-row').each((index, element) => {
      try {
        const $repo = $(element);
        
        // Extract the repository link and parse owner/name
        const repoLink = $repo.find('h2 a').attr('href');
        if (!repoLink) return;

        const [, owner, name] = repoLink.split('/');
        if (!owner || !name) return;

        // Extract description
        const description = $repo.find('p.col-9').text().trim() || null;

        // Extract language
        const languageElement = $repo.find('[itemprop="programmingLanguage"]');
        const language = languageElement.length > 0 ? languageElement.text().trim() : null;

        // Extract stars gained today - try multiple selectors for robustness
        let starsToday = 0;
        
        // Try different possible selectors and text patterns
        const possibleSelectors = [
          '.f6.color-fg-muted.mt-2 span:last-child',  // Original selector
          '.f6.color-fg-muted span:contains("stars")', // More generic
          '.f6.mt-2 span:last-child',                 // Without color class
          '.color-fg-muted span:last-child',          // Without size class
          'span:contains("stars today")',             // Most generic
          'span:contains("star")',                    // Even more generic
        ];
        
        for (const selector of possibleSelectors) {
          try {
            let starsText = $repo.find(selector).text().trim();
            
            // If selector didn't work, try finding all text in the repo element
            if (!starsText) {
              starsText = $repo.text();
            }
            
            // Try multiple regex patterns to match different formats
            const patterns = [
              /(\d{1,3}(?:,\d{3})*)\s+stars?\s+today/i,           // "123 stars today"
              /(\d{1,3}(?:,\d{3})*)\s+star[s]?\s+this\s+week/i,  // "123 stars this week"
              /(\d{1,3}(?:,\d{3})*)\s+star[s]?\s+this\s+month/i, // "123 stars this month"
              /(\d+)\s*★\s*today/i,                              // "123 ★ today"
              /★\s*(\d+)\s*today/i,                              // "★ 123 today"
            ];
            
            for (const pattern of patterns) {
              const match = starsText.match(pattern);
              if (match) {
                starsToday = parseInt(match[1].replace(/,/g, ''), 10) || 0;
                if (starsToday > 0) {
                  console.log(`Found ${starsToday} stars for ${owner}/${name} using pattern: ${pattern}`);
                  break;
                }
              }
            }
            
            if (starsToday > 0) break;
          } catch (err) {
            // Continue with next selector
            continue;
          }
        }
        
        // If we still can't find stars, log for debugging
        if (starsToday === 0) {
          const debugText = $repo.text().replace(/\s+/g, ' ').trim();
          console.log(`Could not extract stars for ${owner}/${name}. Element text: "${debugText.substring(0, 200)}..."`);
        }

        // Extract owner avatar
        const avatarImg = $repo.find('img[alt*="avatar"]').first();
        const ownerAvatar = avatarImg.attr('src') || `https://github.com/${owner}.png?size=64`;

        // Create the repository object
        const repo: TrendingRepo = {
          owner,
          name,
          url: `https://github.com${repoLink}`,
          description,
          language,
          starsToday,
          rank: index + 1,
          ownerAvatar,
        };

        // Validate the data
        const validatedRepo = TrendingRepoSchema.parse(repo);
        repos.push(validatedRepo);

      } catch (error) {
        console.warn(`Failed to parse repository at index ${index}:`, error);
        // Continue with the next repository
      }
    });

    console.log(`Successfully scraped ${repos.length} trending repositories for ${period} period`);
    return repos;

  } catch (error) {
    console.error('Failed to fetch GitHub trending repositories:', error);
    throw new Error(`Failed to fetch trending repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default new Module('githubTrending', {
  stores: [dbTrendingRepos],
  queries: {
    // Get trending repos from database (primary method for frontend)
    async getTrendingRepos(args) {
      const { period = 'daily' } = z.object({
        period: z.enum(['daily', 'weekly', 'monthly']).optional()
      }).parse(args);

      const currentDate = getCurrentDate();

      try {
        // Try to get from database first
        const cachedRepos = await dbTrendingRepos.fetch({
          period,
          scrapedDate: currentDate,
        }, {
          sort: { rank: 1 },
        });

        if (cachedRepos.length > 0) {
          console.log(`Returning ${cachedRepos.length} cached trending repositories for ${period} period`);
          return cachedRepos.map((repo: any) => ({
            owner: repo.owner,
            name: repo.name,
            url: repo.url,
            description: repo.description || null,
            language: repo.language || null,
            starsToday: repo.starsToday,
            rank: repo.rank,
            ownerAvatar: repo.ownerAvatar || null,
          }));
        }

        // If no cached data, fall back to scraping (and cache the results)
        console.log(`No cached data found for ${period} on ${currentDate}, falling back to scraping`);
        const scrapedRepos = await scrapeGitHubTrending(period);
        
        // Cache the results in database
        const now = new Date();
        const reposToSave = scrapedRepos.map(repo => ({
          ...repo,
          description: repo.description || undefined,
          language: repo.language || undefined,
          ownerAvatar: repo.ownerAvatar || undefined,
          period,
          scrapedAt: now,
          scrapedDate: currentDate,
        }));

        for (const repo of reposToSave) {
          await dbTrendingRepos.insertOne(repo);
        }
        console.log(`Cached ${reposToSave.length} repositories for ${period} period`);

        return scrapedRepos;

      } catch (error) {
        console.error('Failed to get trending repositories:', error);
        throw new Error(`Failed to get trending repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // Scrape and update database (used by scheduled jobs)
    async scrapeAndUpdateTrending(args) {
      const { periods = ['daily', 'weekly', 'monthly'] } = z.object({
        periods: z.array(z.enum(['daily', 'weekly', 'monthly'])).optional()
      }).parse(args);

      const currentDate = getCurrentDate();
      const now = new Date();
      const results = [];

      for (const period of periods) {
        try {
          console.log(`Scraping ${period} trending repositories...`);
          
          // Scrape fresh data
          const scrapedRepos = await scrapeGitHubTrending(period);
          
          // Remove old data for this period and date first
          const existingRepos = await dbTrendingRepos.fetch({
            period,
            scrapedDate: currentDate,
          });
          
          for (const existingRepo of existingRepos) {
            await dbTrendingRepos.deleteOne({ _id: existingRepo._id });
          }
          
          // Save to database
          for (const repo of scrapedRepos) {
            await dbTrendingRepos.insertOne({
              owner: repo.owner,
              name: repo.name,
              url: repo.url,
              description: repo.description || undefined,
              language: repo.language || undefined,
              starsToday: repo.starsToday,
              rank: repo.rank,
              ownerAvatar: repo.ownerAvatar || undefined,
              period,
              scrapedAt: now,
              scrapedDate: currentDate,
            });
          }
          
          results.push({
            period,
            count: scrapedRepos.length,
            success: true,
          });

          console.log(`Successfully updated ${scrapedRepos.length} ${period} trending repositories`);
          
          // Add delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Failed to update ${period} trending repositories:`, error);
          results.push({
            period,
            count: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        date: currentDate,
        results,
        summary: `Updated ${results.filter(r => r.success).length}/${results.length} periods successfully`,
      };
    },

    // Clean up old data (optional, for maintenance)
    async cleanupOldData(args) {
      const { daysToKeep = 7 } = z.object({
        daysToKeep: z.number().optional()
      }).parse(args);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateString = cutoffDate.toISOString().split('T')[0];

      // Find old records
      const oldRepos = await dbTrendingRepos.fetch({
        scrapedDate: { $lt: cutoffDateString }
      });

      // Delete them one by one
      let deletedCount = 0;
      for (const repo of oldRepos) {
        await dbTrendingRepos.deleteOne({ _id: repo._id });
        deletedCount++;
      }

      return {
        deletedCount,
        cutoffDate: cutoffDateString,
        message: `Cleaned up ${deletedCount} old trending repository records`,
      };
    },

    // Debug query to test scraping immediately
    async debugScraping(args) {
      const { period = 'weekly', limit = 3 } = z.object({
        period: z.enum(['daily', 'weekly', 'monthly']).optional(),
        limit: z.number().optional()
      }).parse(args);

      try {
        console.log(`[DEBUG] Testing scraping for ${period} period...`);
        const scrapedRepos = await scrapeGitHubTrending(period);
        
        return {
          success: true,
          period,
          totalFound: scrapedRepos.length,
          sample: scrapedRepos.slice(0, limit).map(repo => ({
            owner: repo.owner,
            name: repo.name,
            starsToday: repo.starsToday,
            language: repo.language,
            description: repo.description?.substring(0, 100) + '...',
          })),
          starsDistribution: {
            withStars: scrapedRepos.filter(r => r.starsToday > 0).length,
            withoutStars: scrapedRepos.filter(r => r.starsToday === 0).length,
            maxStars: Math.max(...scrapedRepos.map(r => r.starsToday)),
            avgStars: Math.round(scrapedRepos.reduce((sum, r) => sum + r.starsToday, 0) / scrapedRepos.length),
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  },
  mutations: {
    /**
     * Manually trigger a fresh scrape and update database immediately
     */
    async triggerFreshScrape(args) {
      const { period = 'weekly' } = z.object({
        period: z.enum(['daily', 'weekly', 'monthly']).optional()
      }).parse(args);

      try {
        console.log(`[MANUAL SCRAPE] Starting fresh scrape for ${period} period...`);
        
        const currentDate = getCurrentDate();
        const now = new Date();
        
        // Clear existing data for this period and date
        const existingRepos = await dbTrendingRepos.fetch({
          period,
          scrapedDate: currentDate,
        });
        
        console.log(`[MANUAL SCRAPE] Clearing ${existingRepos.length} existing entries...`);
        for (const existingRepo of existingRepos) {
          await dbTrendingRepos.deleteOne({ _id: existingRepo._id });
        }
        
        // Scrape fresh data
        const scrapedRepos = await scrapeGitHubTrending(period);
        console.log(`[MANUAL SCRAPE] Scraped ${scrapedRepos.length} repositories`);
        
        // Save to database
        let savedCount = 0;
        for (const repo of scrapedRepos) {
          await dbTrendingRepos.insertOne({
            owner: repo.owner,
            name: repo.name,
            url: repo.url,
            description: repo.description || undefined,
            language: repo.language || undefined,
            starsToday: repo.starsToday,
            rank: repo.rank,
            ownerAvatar: repo.ownerAvatar || undefined,
            period,
            scrapedAt: now,
            scrapedDate: currentDate,
          });
          savedCount++;
        }
        
        // Calculate stats
        const withStars = scrapedRepos.filter(r => r.starsToday > 0).length;
        const withoutStars = scrapedRepos.filter(r => r.starsToday === 0).length;
        
        return {
          success: true,
          period,
          date: currentDate,
          scraped: scrapedRepos.length,
          saved: savedCount,
          cleared: existingRepos.length,
          starsStats: {
            withStars,
            withoutStars,
            percentage: Math.round((withStars / scrapedRepos.length) * 100),
            maxStars: Math.max(...scrapedRepos.map(r => r.starsToday)),
            totalStars: scrapedRepos.reduce((sum, r) => sum + r.starsToday, 0),
          },
          sample: scrapedRepos.slice(0, 3).map(repo => ({
            name: `${repo.owner}/${repo.name}`,
            starsToday: repo.starsToday,
            language: repo.language,
          })),
          message: `Successfully scraped and saved ${savedCount} ${period} trending repositories`,
        };
        
      } catch (error) {
        console.error(`[MANUAL SCRAPE] Error:`, error);
        return {
          success: false,
          period,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: `Failed to scrape ${period} trending repositories`,
        };
      }
    }
  }
}); 