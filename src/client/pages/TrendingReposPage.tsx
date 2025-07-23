import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modelenceQuery } from '@modelence/react-query';
import { Link } from 'react-router-dom';
import Page from '../components/Page';
import SaveRepoButton from '../components/SaveRepoButton';

interface Repository {
  owner: string;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  starsToday: number;
  rank: number;
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
          {/* Rank Badge */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {repo.rank}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
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
        <SaveRepoButton repoId={`${repo.owner}/${repo.name}`} repoName={fullName} />
      </div>
      
      <div className="mb-4">
        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-5">
          <div className="flex items-center text-sm text-gray-600 group-hover:text-yellow-600 transition-colors">
            <span className="text-yellow-500 mr-1.5 text-base">⭐</span>
            <span className="font-semibold">{formatNumber(repo.starsToday)} today</span>
          </div>
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
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');
  
  const { data: repositories = [], isLoading, error } = useQuery(
    modelenceQuery<Repository[]>('githubTrending.getTrendingRepos', { period: selectedPeriod })
  );

  const timePeriods: { value: TimePeriod; label: string; description: string }[] = [
    { value: 'daily', label: 'Daily', description: 'Today\'s trending repositories' },
    { value: 'weekly', label: 'Weekly', description: 'This week\'s trending repositories' },
    { value: 'monthly', label: 'Monthly', description: 'This month\'s trending repositories' },
  ];

  return (
    <Page>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-6 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Trending Repositories
            </h1>
            <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Discover the most popular repositories on GitHub. Stay up-to-date with what's trending in the developer community.
            </p>
          </div>
          
          {/* Time Period Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200/50 backdrop-blur-sm">
              <div className="flex flex-wrap gap-1">
                {timePeriods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      selectedPeriod === period.value
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title={period.description}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Selected Period Info */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-gray-200/50">
              <span className="text-sm text-gray-600">
                Showing {timePeriods.find(p => p.value === selectedPeriod)?.description.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Loading State with Period Context */}
          {isLoading && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm text-blue-700 rounded-2xl shadow-lg border border-blue-200/50">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">Loading {selectedPeriod} trending repositories...</span>
                </div>
              </div>
              <LoadingState />
            </div>
          )}
        
        {error && <ErrorState error={error as Error} />}
        
        {!isLoading && !error && repositories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No repositories found</h2>
            <p className="text-gray-600">
              There are no {selectedPeriod} trending repositories available at the moment.
            </p>
          </div>
        )}
        
          {!isLoading && !error && repositories.length > 0 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200/50">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    Found {repositories.length} {selectedPeriod} trending repositories
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {repositories.map((repo) => (
                  <RepositoryCard key={`${repo.owner}/${repo.name}`} repo={repo} />
                ))}
              </div>
            </div>
                    )}
        </div>
      </div>
    </Page>
  );
} 