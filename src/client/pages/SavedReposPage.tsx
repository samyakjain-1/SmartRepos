import { useQuery } from '@tanstack/react-query';
import { useSession } from 'modelence/client';
import { modelenceQuery } from '@modelence/react-query';
import { Link, Navigate } from 'react-router-dom';
import Page from '../components/Page';
import SaveRepoButton from '../components/SaveRepoButton';

interface SavedRepo {
  _id: string;
  owner: string;
  name: string;
  createdAt: string;
}

export default function SavedReposPage() {
  const { user } = useSession();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login?_redirect=/saved-repos" replace />;
  }

  // Fetch user's saved repositories using Modelence query system
  const { data: savedRepos, isLoading, error } = useQuery(
    modelenceQuery<SavedRepo[]>('savedRepos.getUserSavedRepos', {})
  );

  if (isLoading) {
    return (
      <Page>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl font-semibold text-gray-900">Loading your saved repositories...</h2>
          </div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading saved repositories</h2>
            <p className="text-gray-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      </Page>
    );
  }

  if (!savedRepos || savedRepos.length === 0) {
    return (
      <Page>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Saved Repositories</h1>
            <p className="text-gray-600">Repositories you've bookmarked for easy access</p>
          </div>

          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No saved repositories yet</h2>
            <p className="text-gray-600 mb-8">
              Start exploring trending repositories and save the ones you find interesting!
            </p>
            <Link 
              to="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Explore Trending Repos
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Saved Repositories</h1>
          <p className="text-gray-600">
            You have saved {savedRepos.length} {savedRepos.length === 1 ? 'repository' : 'repositories'}
          </p>
        </div>

        {/* Saved Repositories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedRepos.map((repo) => (
            <div key={repo._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Repository Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Owner Avatar */}
                    <div className="flex-shrink-0">
                      <img
                        src={`https://github.com/${repo.owner}.png?size=64`}
                        alt={`${repo.owner} avatar`}
                        className="w-12 h-12 rounded-full border-2 border-gray-100 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.src = `https://github.com/${repo.owner}.png?size=64`;
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {repo.name}
                      </h3>
                      <p className="text-sm text-gray-500">by {repo.owner}</p>
                    </div>
                  </div>
                  <SaveRepoButton owner={repo.owner} name={repo.name} />
                </div>

                {/* Repository Links */}
                <div className="flex flex-col space-y-3">
                  <Link
                    to={`/repo/${repo.owner}/${repo.name}`}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-lg transition-colors text-sm font-medium"
                  >
                    <span>📋</span>
                    <span>View Details</span>
                  </Link>

                  <a
                    href={`https://github.com/${repo.owner}/${repo.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <span>🔗</span>
                    <span>View on GitHub</span>
                  </a>
                </div>

                {/* Saved Date */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Saved on {new Date(repo.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link 
            to="/"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <span>Discover more trending repositories</span>
          </Link>
        </div>
      </div>
    </Page>
  );
} 