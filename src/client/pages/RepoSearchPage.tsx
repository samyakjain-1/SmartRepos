import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { modelenceQuery } from '@modelence/react-query';
import { useSession } from 'modelence/client';
import Page from '../components/Page';
import PageTransition from '../components/PageTransition';
import SaveRepoButton from '../components/SaveRepoButton';
import RecommendationScore from '../components/RecommendationScore';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  updated_at: string;
  created_at: string;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  topics: string[];
}

export default function RepoSearchPage() {
  const { user } = useSession();
  const [searchUrl, setSearchUrl] = useState('');
  const [searchResult, setSearchResult] = useState<GitHubRepo | null>(null);
  const [recommendationScore, setRecommendationScore] = useState<number | null>(null);
  const [scoreMessage, setScoreMessage] = useState<string>('');

  // Mutation to search for repository by URL
  const searchMutation = useMutation({
    mutationFn: async (url: string) => {
      const query = modelenceQuery('repos.searchRepoByUrl', { url });
      return await query.queryFn() as GitHubRepo;
    },
    onSuccess: async (repo) => {
      setSearchResult(repo);
      
      // Calculate recommendation score if user is logged in
      if (user) {
        try {
          const prefsQuery = modelenceQuery('userPreferences.getTechRecommendationContext', {});
          const userPreferences = await prefsQuery.queryFn();
          
          if (userPreferences) {
            const scoreQuery = modelenceQuery('recommendationScoring.calculateRepoScore', {
              repo: {
                owner: repo.owner.login,
                name: repo.name,
                language: repo.language,
                description: repo.description,
                topics: repo.topics || []
              },
              userPreferences
            });
            
            const result = await scoreQuery.queryFn() as { score: number; message: string };
            setRecommendationScore(result.score);
            setScoreMessage(result.message);
          }
        } catch (error) {
          console.error('Error calculating recommendation score:', error);
        }
      }
    },
    onError: (error) => {
      console.error('Search error:', error);
      setSearchResult(null);
      setRecommendationScore(null);
      setScoreMessage('');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUrl.trim()) return;
    
    // Reset previous results
    setSearchResult(null);
    setRecommendationScore(null);
    setScoreMessage('');
    
    searchMutation.mutate(searchUrl.trim());
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Page title="Search Repository">
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Search GitHub Repository
              </h1>
              <p className="text-xl text-gray-600">
                Enter any GitHub repository URL to explore its details and insights
              </p>
            </div>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto mb-8">
              <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="url"
                    value={searchUrl}
                    onChange={(e) => setSearchUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={searchMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={searchMutation.isPending || !searchUrl.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {searchMutation.isPending ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {searchMutation.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">
                      {searchMutation.error instanceof Error ? searchMutation.error.message : 'Failed to fetch repository'}
                    </p>
                  </div>
                )}
              </form>
            </div>

            {/* Search Results */}
            {searchResult && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Repository Header */}
                  <div className="p-8 border-b border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={searchResult.owner.avatar_url}
                          alt={`${searchResult.owner.login} avatar`}
                          className="w-16 h-16 rounded-full ring-2 ring-gray-100"
                        />
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {searchResult.name}
                          </h2>
                          <p className="text-gray-500 text-lg mb-3 font-medium">
                            by {searchResult.owner.login}
                          </p>
                          {searchResult.description && (
                            <p className="text-gray-600 text-base leading-relaxed">
                              {searchResult.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
                        {/* Recommendation Score */}
                        {recommendationScore !== null && user && (
                          <div className="w-full sm:w-64">
                            <RecommendationScore score={recommendationScore} message={scoreMessage} />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 w-full sm:w-auto lg:w-64">
                          <SaveRepoButton owner={searchResult.owner.login} name={searchResult.name} />
                          <a
                            href={searchResult.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                            </svg>
                            View on GitHub
                          </a>
                          <a
                            href={`/repo/${searchResult.owner.login}/${searchResult.name}`}
                            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                          >
                            View Details
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Repository Stats */}
                  <div className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          ⭐ {formatNumber(searchResult.stargazers_count)}
                        </div>
                        <div className="text-sm text-gray-500">Stars</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {formatNumber(searchResult.forks_count)}
                        </div>
                        <div className="text-sm text-gray-500">Forks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {formatNumber(searchResult.open_issues_count)}
                        </div>
                        <div className="text-sm text-gray-500">Issues</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {searchResult.language || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Language</div>
                      </div>
                    </div>

                    {/* Topics */}
                    {searchResult.topics && searchResult.topics.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics</h3>
                        <div className="flex flex-wrap gap-2">
                          {searchResult.topics.map((topic, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Repository Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <h4 className="font-semibold text-gray-900 mb-2">Created</h4>
                        <p className="text-gray-600">{formatDate(searchResult.created_at)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <h4 className="font-semibold text-gray-900 mb-2">Last Updated</h4>
                        <p className="text-gray-600">{formatDate(searchResult.updated_at)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <h4 className="font-semibold text-gray-900 mb-2">Default Branch</h4>
                        <p className="text-gray-600">{searchResult.default_branch}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <h4 className="font-semibold text-gray-900 mb-2">Full Name</h4>
                        <p className="text-gray-600">{searchResult.full_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className="max-w-2xl mx-auto mt-12">
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">How to use</h3>
                <ul className="text-blue-700 space-y-2 text-sm">
                  <li>• Enter any GitHub repository URL (e.g., https://github.com/facebook/react)</li>
                  <li>• Get detailed information including stats, topics, and metadata</li>
                  <li>• Save interesting repositories to your collection</li>
                  <li>• View personalized recommendation scores (requires login)</li>
                  <li>• Access full repository details with AI-powered insights</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </Page>
  );
} 