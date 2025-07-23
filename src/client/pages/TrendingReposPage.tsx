import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modelenceQuery } from '@modelence/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from 'modelence/client';
import Page from '../components/Page';
import PageTransition from '../components/PageTransition';
import SaveRepoButton from '../components/SaveRepoButton';
import RotatingText from '../components/RotatingText';


interface Repository {
  owner: string;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  starsToday: number;
  rank: number;
  ownerAvatar: string | null;
  recommendationScore?: number;
  scoreMessage?: string;
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 animate-pulse">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-300 rounded-lg mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="flex space-x-2 mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-12"></div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load trending repositories</h2>
      <p className="text-gray-600 mb-4">There was an error fetching the data from GitHub.</p>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

function RepositoryCard({ repo }: { repo: Repository }) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Helper function to convert common emoji shortcodes to actual emojis
  const convertEmojis = (text: string) => {
    if (!text) return text;
    return text
      .replace(/:books:/g, '📚')
      .replace(/:rocket:/g, '🚀')
      .replace(/:fire:/g, '🔥')
      .replace(/:star:/g, '⭐')
      .replace(/:heart:/g, '❤️')
      .replace(/:computer:/g, '💻')
      .replace(/:zap:/g, '⚡')
      .replace(/:boom:/g, '💥')
      .replace(/:tada:/g, '🎉')
      .replace(/:thumbsup:/g, '👍')
      .replace(/:wave:/g, '👋')
      .replace(/:bulb:/g, '💡')
      .replace(/:lock:/g, '🔒')
      .replace(/:key:/g, '🔑')
      .replace(/:package:/g, '📦')
      .replace(/:wrench:/g, '🔧')
      .replace(/:gear:/g, '⚙️')
      .replace(/:art:/g, '🎨')
      .replace(/:sparkles:/g, '✨');
  };

  const fullName = `${repo.owner}/${repo.name}`;
  const description = convertEmojis(repo.description || 'No description available.');

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 mr-2">
          {/* Owner Avatar */}
          <div className="flex-shrink-0">
            <img
              src={repo.ownerAvatar || `https://github.com/${repo.owner}.png?size=64`}
              alt={`${repo.owner} avatar`}
              className="w-12 h-12 rounded-full border-2 border-gray-100 shadow-sm"
              onError={(e) => {
                e.currentTarget.src = `https://github.com/${repo.owner}.png?size=64`;
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              <Link
                to={`/repo/${repo.owner}/${repo.name}`}
                className="block group-hover:scale-[1.02] transition-transform duration-200"
              >
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 leading-tight">
                  {repo.name}
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors font-medium">
                  {fullName}
                </p>
              </Link>
              <Link
                to={`/repo/${repo.owner}/${repo.name}`}
                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                <span className="mr-1">🤖</span>
                AI Analysis
              </Link>
            </div>
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-gray-400 hover:text-blue-500 mt-2 transition-colors font-medium"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
        <SaveRepoButton owner={repo.owner} name={repo.name} />
      </div>
      
      <div className="mb-4">
        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>


      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-5">
          {repo.language && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 mr-1.5"></span>
              <span className="font-medium">{repo.language}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type TimePeriod = 'daily' | 'weekly' | 'monthly';

export default function TrendingReposPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');
  const [repositoriesWithScores, setRepositoriesWithScores] = useState<Repository[]>([]);

  // Check if user needs to complete onboarding
  const { data: hasCompletedOnboarding } = useQuery({
    ...modelenceQuery<boolean>('userPreferences.hasCompletedOnboarding', {}),
    enabled: !!user,
  });

  // Redirect to onboarding if user is logged in but hasn't completed it
  // Add delay to avoid race conditions with users just completing onboarding
  useEffect(() => {
    if (user && hasCompletedOnboarding === false) {
      console.log('User needs to complete onboarding, redirecting...');
      // Small delay to avoid race conditions with users just finishing onboarding
      const redirectTimer = setTimeout(() => {
        navigate('/onboarding');
      }, 300);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, hasCompletedOnboarding, navigate]);
  
  const { data: repositories = [], isLoading, error } = useQuery(
    modelenceQuery<Repository[]>('githubTrending.getTrendingRepos', { period: selectedPeriod })
  );

  // Debug: Log the first repository to see what avatar data we're getting
  useEffect(() => {
    if (repositories.length > 0) {
      console.log('First repository data:', repositories[0]);
      console.log('ownerAvatar field:', repositories[0].ownerAvatar);
    }
  }, [repositories]);

  // Get user preferences for scoring
  const { data: userPreferences } = useQuery({
    ...modelenceQuery('userPreferences.getTechRecommendationContext', {}),
    enabled: !!user && hasCompletedOnboarding === true,
  });

  // Calculate recommendation scores when repositories or user preferences change
  useEffect(() => {
    const calculateScores = async () => {
      if (!repositories.length) {
        setRepositoriesWithScores([]);
        return;
      }

      if (!user || !userPreferences || !(userPreferences as any)?.onboardingCompleted) {
        // For users without preferences, show repositories without scores
        setRepositoriesWithScores(repositories.map(repo => ({
          ...repo,
          recommendationScore: 50,
          scoreMessage: user ? 'Complete onboarding for personalized scores' : 'Sign in for personalized recommendations'
        })));
        return;
      }

      try {
        // Calculate scores for all repositories
        const query = modelenceQuery('recommendationScoring.calculateMultipleScores', {
          repos: repositories.map(repo => ({
            owner: repo.owner,
            name: repo.name,
            language: repo.language,
            description: repo.description,
            topics: [] // GitHub trending API doesn't provide topics, but our algorithm handles empty arrays
          })),
          userPreferences
        });

        const scoredRepos = await query.queryFn() as any[];
        
        // Merge scored data with original repository data and sort by score
        const reposWithScores = repositories.map(repo => {
          const scoredRepo = scoredRepos.find((scored: any) => 
            scored.owner === repo.owner && scored.name === repo.name
          );
          return {
            ...repo,
            recommendationScore: scoredRepo?.recommendationScore || 50,
            scoreMessage: scoredRepo?.scoreMessage || 'Unable to calculate score'
          };
        }).sort((a, b) => (b.recommendationScore || 50) - (a.recommendationScore || 50));

        setRepositoriesWithScores(reposWithScores);
        console.log('Calculated recommendation scores for', reposWithScores.length, 'repositories');
      } catch (error) {
        console.error('Error calculating recommendation scores:', error);
        // Fall back to repositories without scores
        setRepositoriesWithScores(repositories.map(repo => ({
          ...repo,
          recommendationScore: 50,
          scoreMessage: 'Unable to calculate personalized score'
        })));
      }
    };

    calculateScores();
  }, [repositories, userPreferences, user]);

  const timePeriods: { value: TimePeriod; label: string; description: string }[] = [
    { value: 'daily', label: 'Daily', description: 'Today\'s trending repositories' },
    { value: 'weekly', label: 'Weekly', description: 'This week\'s trending repositories' },
    { value: 'monthly', label: 'Monthly', description: 'This month\'s trending repositories' },
  ];

  return (
    <Page>
      <PageTransition>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                <RotatingText 
                  staticText="Discover trending"
                  rotatingWords={['repos', 'tools', 'frameworks', 'libraries']}
                />
              </h1>
              <p className="text-xl text-gray-600">
                Find the hottest repositories {user && hasCompletedOnboarding ? 'personalized for you' : 'on GitHub'}
              </p>
            </div>

            {/* Period selector */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
                {(['daily', 'weekly', 'monthly'] as TimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all duration-200 ${
                      selectedPeriod === period
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded mb-2 w-1/2"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-600 mb-4">
                  {error instanceof Error ? error.message : 'Failed to load trending repositories'}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Repository grid */}
            {!isLoading && !error && repositoriesWithScores.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {repositoriesWithScores.map((repo, index) => (
                  <div
                    key={`${repo.owner}-${repo.name}`}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300"
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <img
                          src={repo.ownerAvatar || `https://github.com/${repo.owner}.png?size=64`}
                          alt={`${repo.owner} avatar`}
                          className="w-12 h-12 rounded-full ring-2 ring-gray-100"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://github.com/${repo.owner}.png?size=64`;
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                            <a
                              href={`/repo/${repo.owner}/${repo.name}`}
                              className="hover:underline"
                            >
                              {repo.name}
                            </a>
                          </h3>
                          <p className="text-gray-500 text-sm mb-3 font-medium">
                            by {repo.owner}
                          </p>
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                            {repo.description || 'No description available'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <SaveRepoButton owner={repo.owner} name={repo.name} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                        <div className="flex items-center space-x-4">
                          {repo.language && (
                            <span className="flex items-center">
                              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                              {repo.language}
                            </span>
                          )}
                        </div>
                        <span className="text-green-600 font-semibold">
                          {repo.starsToday > 0 ? `+${repo.starsToday.toLocaleString()} today` : 
                           repo.starsToday === 0 ? '0 today' : 
                           `${repo.starsToday} today`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
                         {!isLoading && !error && repositoriesWithScores.length === 0 && (
               <div className="text-center py-12">
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">No repositories found</h2>
                <p className="text-gray-600">Try selecting a different time period</p>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </Page>
  );
}
