import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { modelenceQuery } from '@modelence/react-query';
import { marked } from 'marked';
import Page from '../components/Page';

interface RepoDetail {
  id: string | number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  languages: { [key: string]: number };
  updated_at: string;
  created_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  topics: string[];
  readme_content?: string;
  default_branch: string;
}

type Tab = 'readme' | 'info';

function LoadingState() {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-8 bg-gray-300 rounded mb-2 w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-300 rounded mb-4 w-32"></div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load repository</h2>
      <p className="text-gray-600 mb-4">There was an error fetching the repository data.</p>
      <p className="text-sm text-gray-500 mb-4">{error.message}</p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Back to Trending
      </Link>
    </div>
  );
}

function StatCard({ icon, label, value, color = "text-gray-600" }: {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 text-center border border-gray-200/50 hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300 hover:-translate-y-1">
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
    </div>
  );
}

function LanguageBar({ languages }: { languages: { [key: string]: number } }) {
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  const sortedLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Show top 5 languages

  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-yellow-500',
    'bg-purple-500',
    'bg-red-500'
  ];

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-2">Languages</h3>
      <div className="flex rounded-full overflow-hidden h-2 mb-2">
        {sortedLanguages.map(([lang, bytes], index) => {
          const percentage = (bytes / total) * 100;
          return (
            <div
              key={lang}
              className={colors[index % colors.length]}
              style={{ width: `${percentage}%` }}
              title={`${lang}: ${percentage.toFixed(1)}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {sortedLanguages.map(([lang, bytes], index) => {
          const percentage = (bytes / total) * 100;
          return (
            <div key={lang} className="flex items-center text-xs text-gray-600">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-1`}></div>
              <span>{lang} {percentage.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
  }

function ReadmeContent({ content }: { content: string }) {
  // Configure marked options
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const htmlContent = marked(content);

  return (
    <div className="prose prose-gray max-w-none 
      prose-headings:text-gray-900 
      prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-8 prose-h1:first:mt-0
      prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-4 prose-h2:mt-8 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
      prose-h3:text-xl prose-h3:font-medium prose-h3:mb-3 prose-h3:mt-6
      prose-h4:text-lg prose-h4:font-medium prose-h4:mb-2 prose-h4:mt-4
      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline
      prose-strong:text-gray-900 prose-strong:font-semibold
      prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
      prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
      prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
      prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
      prose-li:mb-1
      prose-table:border-collapse prose-table:w-full prose-table:mb-4
      prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-th:font-semibold prose-th:text-left
      prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
      prose-img:rounded-lg prose-img:shadow-sm prose-img:max-w-full prose-img:h-auto
    ">
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    </div>
  );
}

export default function RepoDetailPage() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('readme');
  
  const { data: repo, isLoading, error } = useQuery(
    modelenceQuery<RepoDetail>('repos.getRepoDetails', { owner, name })
  );

  if (isLoading) {
    return (
      <Page title="Loading Repository...">
        <div className="container mx-auto px-6 py-8">
          <LoadingState />
        </div>
      </Page>
    );
  }

  if (error || !repo) {
    return (
      <Page>
        <div className="container mx-auto px-6 py-8">
          <ErrorState error={error as Error || new Error('Repository not found')} />
        </div>
      </Page>
    );
  }

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
    <Page>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-6 py-12">
          {/* Back button */}
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-blue-600 hover:text-blue-800 mb-8 transition-all duration-300 rounded-xl border border-blue-200/50 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-500/10"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Trending</span>
          </Link>

          {/* Repository Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 mb-8 shadow-lg">
            <div className="flex items-start space-x-6">
              <div className="relative">
                <img
                  src={repo.owner.avatar_url}
                  alt={`${repo.owner.login} avatar`}
                  className="w-20 h-20 rounded-2xl ring-4 ring-white shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-white"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{repo.name}</h1>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-110 shadow-lg"
                    title="View on GitHub"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </a>
                </div>
                <p className="text-gray-500 text-lg mb-4 font-medium">{repo.owner.login}/{repo.name}</p>
                {repo.description && (
                  <p className="text-gray-700 text-lg mb-6 leading-relaxed">{repo.description}</p>
                )}

                {/* Repository Topics */}
                {repo.topics && repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {repo.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full border border-blue-200/50 font-medium hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                             {/* Repository Stats */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                 <StatCard
                   icon="⭐"
                   label="Stars"
                   value={formatNumber(repo.stargazers_count)}
                   color="text-yellow-600"
                 />
                 <StatCard
                   icon="🍴"
                   label="Forks"
                   value={formatNumber(repo.forks_count)}
                   color="text-blue-600"
                 />
                 <StatCard
                   icon="🐛"
                   label="Issues"
                   value={formatNumber(repo.open_issues_count)}
                   color="text-red-600"
                 />
                 <StatCard
                   icon="📅"
                   label="Updated"
                   value={formatDate(repo.updated_at)}
                   color="text-green-600"
                 />
               </div>

               {/* Languages Bar */}
               {repo.languages && Object.keys(repo.languages).length > 0 && (
                 <LanguageBar languages={repo.languages} />
               )}
            </div>
          </div>
        </div>

                           {/* Content Area */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-lg">
            {/* Tabs */}
            <div className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('readme')}
                  className={`px-8 py-4 text-sm font-semibold border-b-2 transition-all duration-300 ${
                    activeTab === 'readme'
                      ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
                  }`}
                >
                  📖 README
                </button>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-8 py-4 text-sm font-semibold border-b-2 transition-all duration-300 ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
                  }`}
                >
                  ℹ️ Info
                </button>
              </nav>
            </div>

                       {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'readme' && (
                <div>
                  {repo.readme_content ? (
                    <ReadmeContent content={repo.readme_content} />
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-gray-300 text-8xl mb-6">📄</div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">No README found</h3>
                      <p className="text-gray-500 text-lg">This repository doesn't have a README file.</p>
                    </div>
                  )}
                </div>
              )}

                           {activeTab === 'info' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Repository Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200/50">
                        <span className="text-sm text-gray-500 font-medium">Created</span>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{formatDate(repo.created_at)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200/50">
                        <span className="text-sm text-gray-500 font-medium">Default Branch</span>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{repo.default_branch}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200/50">
                        <span className="text-sm text-gray-500 font-medium">Primary Language</span>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{repo.language || 'Not specified'}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200/50">
                        <span className="text-sm text-gray-500 font-medium">Owner</span>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{repo.owner.login}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                       </div>
          </div>
        </div>
      </div>
    </Page>
  );
} 