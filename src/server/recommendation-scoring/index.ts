import { Module } from 'modelence/server';
import { z } from 'zod';

/**
 * Calculate a recommendation score based on how well a technology matches a user's preferences
 * Uses the exact same algorithm as devora
 * @param repo Repository information
 * @param userPreferences User's quiz responses and preferences
 * @returns Score from 0-100 indicating how recommended the technology is for the user
 */
function calculateRecommendationScore(
  repo: {
    owner: string;
    name: string;
    language: string | null;
    description: string | null;
    topics?: string[];
  },
  userPreferences: any
): number {
  // Default score if no user preferences available
  if (!userPreferences || !userPreferences.onboardingCompleted) return 50;
  
  let score = 50; // Start with a neutral score
  let factors = 0; // Count the factors we're considering
  
  // 1. Language match
  if (userPreferences.programmingLanguages?.length > 0 && repo.language) {
    factors++;
    // Exact language match gives a high score
    if (userPreferences.programmingLanguages.some((lang: string) => 
        repo.language!.toLowerCase().includes(lang.toLowerCase()) ||
        lang.toLowerCase().includes(repo.language!.toLowerCase()))) {
      score += 25;
    } else {
      // No language match
      score -= 10;
    }
  }
  
  // 2. Experience level match (this is a bit more subjective)
  if (userPreferences.experienceLevel) {
    factors++;
    const repoComplexity = estimateRepoComplexity(repo);
    
    if (userPreferences.experienceLevel === 'Beginner' && repoComplexity <= 1) {
      score += 15; // Beginner-friendly repos are good for beginners
    } else if (userPreferences.experienceLevel === 'Intermediate') {
      if (repoComplexity === 2) {
        score += 15; // Moderate complexity is good for intermediate devs
      } else if (repoComplexity === 3) {
        score += 5; // More complex repos are challenging but doable
      }
    } else if (userPreferences.experienceLevel === 'Advanced') {
      if (repoComplexity >= 2) {
        score += 15; // More complex repos are better for advanced devs
      } else {
        score -= 5; // Simple repos might be less interesting
      }
    }
  }
  
  // 3. Interest match
  if (userPreferences.techInterests?.length > 0) {
    factors++;
    const matchingInterests = matchInterestsToRepo(userPreferences.techInterests, repo);
    
    if (matchingInterests >= 2) {
      score += 25; // Multiple interest matches
    } else if (matchingInterests === 1) {
      score += 15; // One interest match
    } else {
      score -= 10; // No interest matches
    }
  }
  
  // 4. Apply adjustment for goals if provided
  if (userPreferences.goals) {
    factors++;
    const goalAlignment = estimateGoalAlignment(userPreferences.goals, repo);
    score += goalAlignment;
  }
  
  // Normalize score based on factors considered
  if (factors > 0) {
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));
  }
  
  return Math.round(score);
}

/**
 * Estimate repository complexity based on name, description and topics
 * @returns Complexity level (1=Simple, 2=Moderate, 3=Complex)
 */
function estimateRepoComplexity(repo: any): number {
  const complexityKeywords = ['advanced', 'complex', 'enterprise', 'scalable', 'production'];
  const simpleKeywords = ['starter', 'beginner', 'simple', 'learn', 'tutorial', 'example'];
  
  // Convert everything to lowercase for case-insensitive matching
  const description = (repo.description || '').toLowerCase();
  const repoName = repo.name.toLowerCase();
  const topics = (repo.topics || []).map((t: string) => t.toLowerCase());
  
  // Check for complexity indicators
  const hasComplexityIndicators = 
    complexityKeywords.some((word: string) => description.includes(word) || repoName.includes(word)) ||
    topics.some((topic: string) => complexityKeywords.some((word: string) => topic.includes(word)));
    
  // Check for simplicity indicators
  const hasSimplicityIndicators = 
    simpleKeywords.some((word: string) => description.includes(word) || repoName.includes(word)) ||
    topics.some((topic: string) => simpleKeywords.some((word: string) => topic.includes(word)));
  
  if (hasComplexityIndicators) return 3;
  if (hasSimplicityIndicators) return 1;
  return 2; // Default to moderate complexity
}

/**
 * Match user interests to repository characteristics
 * @returns Number of matching interests
 */
function matchInterestsToRepo(interests: string[], repo: any): number {
  // Interest keyword mappings (exact same as devora)
  const interestKeywords: Record<string, string[]> = {
    'Web Development': ['web', 'frontend', 'backend', 'fullstack', 'html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular', 'node'],
    'Mobile Apps': ['mobile', 'android', 'ios', 'flutter', 'react-native', 'swift', 'kotlin'],
    'Machine Learning': ['ml', 'ai', 'machine-learning', 'deep-learning', 'neural', 'tensorflow', 'pytorch', 'model'],
    'DevOps': ['devops', 'ci/cd', 'pipeline', 'docker', 'kubernetes', 'container', 'deployment'],
    'Cloud Computing': ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'lambda'],
    'Blockchain': ['blockchain', 'crypto', 'web3', 'nft', 'token', 'defi'],
    'Game Development': ['game', 'unity', 'unreal', 'godot', '3d', 'rendering'],
    'Data Science': ['data', 'analytics', 'visualization', 'pandas', 'jupyter', 'statistics'],
    'Security': ['security', 'crypto', 'encryption', 'authentication', 'authorization', 'vulnerability'],
    'AI/ML': ['ai', 'ml', 'artificial-intelligence', 'machine-learning', 'deep-learning', 'neural', 'gpt', 'llm'],
    'Backend Development': ['backend', 'server', 'api', 'database', 'microservices', 'rest', 'graphql'],
    'Frontend Development': ['frontend', 'ui', 'ux', 'react', 'vue', 'angular', 'svelte', 'css', 'html']
  };
  
  // Convert repo text to lowercase
  const repoText = `${repo.name} ${repo.description || ''} ${repo.language || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  
  // Count matching interests
  let matchCount = 0;
  
  for (const interest of interests) {
    const keywords = interestKeywords[interest] || [];
    
    if (keywords.some((keyword: string) => repoText.includes(keyword.toLowerCase()))) {
      matchCount++;
    }
  }
  
  return matchCount;
}

/**
 * Estimate how well the repo aligns with the user's goals
 * @returns Score adjustment (-15 to +15)
 */
function estimateGoalAlignment(goals: string, repo: any): number {
  // Simple keyword matching for goals
  const goalText = goals.toLowerCase();
  const repoText = `${repo.name} ${repo.description || ''} ${repo.language || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  
  // Extract keywords from goals (simple approach)
  const goalKeywords = goalText
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word: string) => word.length > 3) // Only consider substantive words
    .slice(0, 10); // Limit to top keywords
  
  // Count how many goal keywords appear in repo text
  const matchingKeywords = goalKeywords.filter((keyword: string) => repoText.includes(keyword));
  
  // Calculate alignment score
  if (matchingKeywords.length >= 3) return 15;
  if (matchingKeywords.length >= 1) return 10;
  return -5; // No matches
}

// Export the calculation function for use in other modules
export { calculateRecommendationScore };

export default new Module('recommendationScoring', {
  queries: {
    async calculateRepoScore(args) {
      const { repo, userPreferences } = z.object({
        repo: z.object({
          owner: z.string(),
          name: z.string(),
          language: z.string().nullable(),
          description: z.string().nullable(),
          topics: z.array(z.string()).optional(),
        }),
        userPreferences: z.object({
          programmingLanguages: z.array(z.string()).optional(),
          experienceLevel: z.string().optional(),
          techInterests: z.array(z.string()).optional(),
          goals: z.string().optional(),
          onboardingCompleted: z.boolean().optional(),
        }).nullable().optional(),
      }).parse(args);

      if (!userPreferences || !userPreferences.onboardingCompleted) {
        return { score: 50, message: 'Complete onboarding for personalized scores' };
      }

      const score = calculateRecommendationScore(repo, userPreferences);
      
      // Generate score message (same as devora)
      let message = '';
      if (score >= 80) message = 'Highly recommended for you';
      else if (score >= 60) message = 'Good match for your skills';
      else if (score >= 40) message = 'Might be worth exploring';
      else message = 'Might be challenging based on your background';

      return { score, message };
    },

    async calculateMultipleScores(args) {
      const { repos, userPreferences } = z.object({
        repos: z.array(z.object({
          owner: z.string(),
          name: z.string(),
          language: z.string().nullable(),
          description: z.string().nullable(),  
          topics: z.array(z.string()).optional(),
        })),
        userPreferences: z.object({
          programmingLanguages: z.array(z.string()).optional(),
          experienceLevel: z.string().optional(),
          techInterests: z.array(z.string()).optional(),
          goals: z.string().optional(),
          onboardingCompleted: z.boolean().optional(),
        }).nullable().optional(),
      }).parse(args);

      if (!userPreferences || !userPreferences.onboardingCompleted) {
        return repos.map(repo => ({ 
          ...repo, 
          recommendationScore: 50, 
          scoreMessage: 'Complete onboarding for personalized scores' 
        }));
      }

      // Calculate scores for all repos
      return repos.map(repo => {
        const score = calculateRecommendationScore(repo, userPreferences);
        
        let scoreMessage = '';
        if (score >= 80) scoreMessage = 'Highly recommended for you';
        else if (score >= 60) scoreMessage = 'Good match for your skills';
        else if (score >= 40) scoreMessage = 'Might be worth exploring';
        else scoreMessage = 'Might be challenging based on your background';

        return {
          ...repo,
          recommendationScore: score,
          scoreMessage
        };
      });
    }
  }
}); 