import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { modelenceQuery, modelenceMutation } from '@modelence/react-query';
import { useSession } from 'modelence/client';
import { marked } from 'marked';
import Page from '../components/Page';
import PageTransition from '../components/PageTransition';
import SaveRepoButton from '../components/SaveRepoButton';
import RecommendationScore from '../components/RecommendationScore';
import RepoChatInterface from '../components/RepoChatInterface';
import { aiCache } from '../utils/aiCache';

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

type Tab = 'readme' | 'analysis' | 'description' | 'guide' | 'chat' | 'info';

interface TabConfig {
  id: Tab;
  label: string;
  icon: string;
}

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
  // Configure marked options for better rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const htmlContent = marked(content) as string;

  // Post-process HTML to enhance certain elements
  const enhanceHtml = (html: string) => {
    return html
      // Enhance badge/shield images
      .replace(
        /<img([^>]*src="[^"]*shields\.io[^"]*"[^>]*)>/gi,
        '<img$1 class="inline-block mx-1 my-0.5 max-h-6 shadow-none rounded">'
      )
      .replace(
        /<img([^>]*src="[^"]*badge[^"]*"[^>]*)>/gi,
        '<img$1 class="inline-block mx-1 my-0.5 max-h-6 shadow-none rounded">'
      )
      // Enhance external links
      .replace(
        /<a([^>]*href="https?:\/\/[^"]*"[^>]*)>/gi,
        '<a$1 target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 transition-colors duration-200">'
      )
      // Enhance contributor/avatar images
      .replace(
        /<img([^>]*src="[^"]*avatars[^"]*"[^>]*)>/gi,
        '<img$1 class="inline-block w-12 h-12 rounded-full mx-1 my-1 border-2 border-white shadow-md">'
      );
  };

  const enhancedHtml = enhanceHtml(htmlContent);

  return (
    <div className="prose prose-gray max-w-none 
      prose-headings:text-gray-900 
      prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-8 prose-h1:first:mt-0 prose-h1:pb-3 prose-h1:border-b-2 prose-h1:border-blue-200
      prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-4 prose-h2:mt-8 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
      prose-h3:text-xl prose-h3:font-medium prose-h3:mb-3 prose-h3:mt-6
      prose-h4:text-lg prose-h4:font-medium prose-h4:mb-2 prose-h4:mt-4
      prose-h5:text-base prose-h5:font-medium prose-h5:mb-2 prose-h5:mt-3
      prose-h6:text-sm prose-h6:font-medium prose-h6:mb-1 prose-h6:mt-2 prose-h6:uppercase prose-h6:tracking-wide prose-h6:text-gray-600
      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline prose-a:transition-colors prose-a:duration-200
      prose-strong:text-gray-900 prose-strong:font-semibold
      prose-em:text-gray-700 prose-em:italic
      prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:border prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4 prose-pre:border prose-pre:shadow-sm
      prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:bg-blue-50 prose-blockquote:text-gray-700 prose-blockquote:italic prose-blockquote:rounded-r
      prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ul:space-y-1
      prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4 prose-ol:space-y-1
      prose-li:text-gray-700 prose-li:leading-relaxed
      prose-table:border-collapse prose-table:w-full prose-table:mb-4 prose-table:border prose-table:border-gray-300 prose-table:rounded-lg prose-table:overflow-hidden prose-table:shadow-sm
      prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-3 prose-th:font-semibold prose-th:text-left prose-th:text-gray-800
      prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-3 prose-td:text-gray-700
      prose-img:rounded-lg prose-img:shadow-sm prose-img:max-w-full prose-img:h-auto prose-img:my-4
      prose-hr:border-0 prose-hr:border-t prose-hr:border-gray-300 prose-hr:my-8
    ">      
      <div 
        dangerouslySetInnerHTML={{ __html: enhancedHtml }} 
      />
    </div>
  );
}

function AIAnalysisContent({ owner, name, description, readmeContent }: {
  owner: string;
  name: string;
  description: string | null;
  readmeContent?: string;
}) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const analysisMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting analysis mutation');
      
      // Get user preferences for personalized analysis
      let userPreferences = null;
      try {
        const prefsQuery = modelenceQuery('userPreferences.getTechRecommendationContext', {} as any);
        userPreferences = await prefsQuery.queryFn();
        console.log('Retrieved user preferences:', userPreferences);
      } catch (error) {
        console.log('No user preferences found, using default analysis');
      }
      
      const query = modelenceQuery('llm.generateRepoAnalysis', {
        owner,
        name,
        description,
        readmeContent,
        userPreferences: userPreferences || {},
      } as any);
      const result = await query.queryFn();
      console.log('Analysis mutation raw result:', result);
      return result;
    },
    onSuccess: (data: any) => {
      console.log('Analysis mutation success, received data:', data);
      setAnalysis(data);
      setIsFromCache(false);
      // Cache the result for 7 days
      aiCache.set('analysis', owner, name, data);
    },
    onError: (error: any) => {
      console.error('Analysis mutation error:', error);
    },
  });

  // Check cache on mount
  useEffect(() => {
    const cached = aiCache.get('analysis', owner, name);
    if (cached) {
      console.log('Found cached analysis:', cached);
      setAnalysis(cached);
      setIsFromCache(true);
    }
  }, [owner, name]);

  // Debug logging
  useEffect(() => {
    console.log('Analysis state changed:', { analysis, isFromCache, isPending: analysisMutation.isPending });
  }, [analysis, isFromCache, analysisMutation.isPending]);

  const handleGenerateAnalysis = () => {
    console.log('handleGenerateAnalysis called');
    analysisMutation.mutate();
  };

  const handleRegenerateAnalysis = () => {
    aiCache.remove('analysis', owner, name);
    analysisMutation.mutate();
  };

  // Show initial state with generate button
  if (!analysis && !analysisMutation.isPending) {
    return (
      <div className="text-center py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Deep Dive Analysis</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Get personalized insights about this technology with our AI-powered analysis. 
          We'll analyze 5 key questions to help you decide if this tech is worth your time.
        </p>
        <button
          onClick={handleGenerateAnalysis}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          ✨ Generate AI Analysis
        </button>
        <p className="text-sm text-gray-500 mt-4">
          This uses GPT-4o to provide detailed insights
        </p>
      </div>
    );
  }

  // Show loading state
  if (analysisMutation.isPending) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Generating AI Analysis...</h2>
          <p className="text-gray-600">This may take 10-30 seconds</p>
        </div>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (analysisMutation.error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis Failed</h3>
        <p className="text-gray-600 mb-6">{(analysisMutation.error as Error).message}</p>
        <button
          onClick={handleGenerateAnalysis}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show analysis error from API
  if (analysis?.error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Analysis Error</h3>
        <p className="text-gray-600 mb-6">{analysis.message}</p>
        <button
          onClick={handleRegenerateAnalysis}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate New Analysis
        </button>
      </div>
    );
  }

  // Show results
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Deep Dive Analysis</h2>
        <p className="text-gray-600">Personalized insights about this technology</p>
        {isFromCache && (
          <p className="text-xs text-green-600 mb-2">⚡ Loaded from cache - no API cost!</p>
        )}
        <button
          onClick={handleRegenerateAnalysis}
          disabled={analysisMutation.isPending}
          className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          🔄 Regenerate Analysis
        </button>
      </div>

      {analysis?.sections?.map((section: any, index: number) => (
        <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
              {index + 1}
            </span>
            {section.title}
          </h3>
          <div 
            className="prose prose-gray max-w-none prose-p:text-gray-700 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: marked(section.content) }}
          />
        </div>
      ))}
    </div>
  );
}

function AIDescriptionContent({ owner, name, description, readmeContent }: {
  owner: string;
  name: string;
  description: string | null;
  readmeContent?: string;
}) {
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const descriptionMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting description mutation');
      const query = modelenceQuery('llm.generateTechDescription', {
        owner,
        name,
        description,
        readmeContent,
      } as any);
      const result = await query.queryFn();
      console.log('Description mutation raw result:', result);
      return result;
    },
    onSuccess: (data: any) => {
      console.log('Description mutation success:', data);
      setAiDescription(data);
      setIsFromCache(false);
      // Cache the result for 7 days
      aiCache.set('description', owner, name, data);
    },
    onError: (error: any) => {
      console.error('Description mutation error:', error);
    },
  });

  // Check cache on mount
  useEffect(() => {
    const cached = aiCache.get('description', owner, name);
    if (cached) {
      setAiDescription(cached);
      setIsFromCache(true);
    }
  }, [owner, name]);

  const handleGenerateDescription = () => {
    console.log('handleGenerateDescription called');
    descriptionMutation.mutate();
  };

  const handleRegenerateDescription = () => {
    aiCache.remove('description', owner, name);
    descriptionMutation.mutate();
  };

  // Show initial state with generate button
  if (!aiDescription && !descriptionMutation.isPending) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
  
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Enhanced Description</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Get a comprehensive, AI-generated description that goes beyond the basic GitHub description. 
            Our AI analyzes the README and codebase to provide deeper insights.
          </p>
          <button
            onClick={handleGenerateDescription}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            ✨ Generate Enhanced Description
          </button>
        </div>

        {/* Show original description for comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Original GitHub Description</h3>
          <p className="text-gray-600">{description || 'No original description provided'}</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (descriptionMutation.isPending) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Generating Enhanced Description...</h2>
          <p className="text-gray-600">Analyzing repository and README content</p>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (descriptionMutation.error) {
    return (
      <div className="text-center py-12">

        <h3 className="text-xl font-semibold text-gray-900 mb-2">Description Generation Failed</h3>
        <p className="text-gray-600 mb-6">{(descriptionMutation.error as Error).message}</p>
        <button
          onClick={handleGenerateDescription}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show results
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AI-Enhanced Description</h2>
        <p className="text-gray-600">A comprehensive overview powered by AI analysis</p>
        {isFromCache && (
          <p className="text-xs text-green-600 mb-2">⚡ Loaded from cache - no API cost!</p>
        )}
        <button
          onClick={handleRegenerateDescription}
          disabled={descriptionMutation.isPending}
          className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          🔄 Regenerate Description
        </button>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8">
        <div className="prose prose-lg prose-gray max-w-none">
          <p className="text-gray-800 leading-relaxed text-lg">{aiDescription}</p>
        </div>
      </div>

      {/* Additional context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Original Description</h3>
          <p className="text-gray-600">{description || 'No original description provided'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Why This Matters</h3>
          <p className="text-gray-600">Our AI analyzes the entire codebase and documentation to provide deeper insights than just the basic description.</p>
        </div>
      </div>
    </div>
  );
}

function AIGuideContent({ owner, name, description, readmeContent }: {
  owner: string;
  name: string;
  description: string | null;
  readmeContent?: string;
}) {
  const [guide, setGuide] = useState<any>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const guideMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting guide mutation');
      const query = modelenceQuery('llm.generateStepByStepGuide', {
        owner,
        name,
        description,
        readmeContent,
      } as any);
      const result = await query.queryFn();
      console.log('Guide mutation raw result:', result);
      return result;
    },
    onSuccess: (data: any) => {
      console.log('Guide mutation success:', data);
      setGuide(data);
      setIsFromCache(false);
      // Cache the result for 7 days
      aiCache.set('guide', owner, name, data);
    },
    onError: (error: any) => {
      console.error('Guide mutation error:', error);
    },
  });

  // Check cache on mount
  useEffect(() => {
    const cached = aiCache.get('guide', owner, name);
    if (cached) {
      setGuide(cached);
      setIsFromCache(true);
    }
  }, [owner, name]);

  const handleGenerateGuide = () => {
    console.log('handleGenerateGuide called');
    guideMutation.mutate();
  };

  const handleRegenerateGuide = () => {
    aiCache.remove('guide', owner, name);
    guideMutation.mutate();
  };

  // Show initial state with generate button
  if (!guide && !guideMutation.isPending) {
    return (
      <div className="text-center py-16">

        <h2 className="text-3xl font-bold text-gray-900 mb-4">Step-by-Step Learning Guide</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Get a comprehensive, AI-generated implementation guide tailored for developers. 
          Learn how to set up, configure, and use this technology with practical code examples.
        </p>
        <button
          onClick={handleGenerateGuide}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          ✨ Generate Learning Guide
        </button>
        <p className="text-sm text-gray-500 mt-4">
          Includes setup, examples, and best practices
        </p>
      </div>
    );
  }

  // Show loading state
  if (guideMutation.isPending) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Generating Learning Guide...</h2>
          <p className="text-gray-600">Creating step-by-step instructions with code examples</p>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded mb-4"></div>
                <div className="h-32 bg-gray-50 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (guideMutation.error) {
    return (
      <div className="text-center py-12">

        <h3 className="text-xl font-semibold text-gray-900 mb-2">Guide Generation Failed</h3>
        <p className="text-gray-600 mb-6">{(guideMutation.error as Error).message}</p>
        <button
          onClick={handleGenerateGuide}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show guide error from API
  if (guide?.error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Guide Generation Error</h3>
        <p className="text-gray-600 mb-6">{guide.message}</p>
        <button
          onClick={handleRegenerateGuide}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate New Guide
        </button>
      </div>
    );
  }

  // Show results
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Step-by-Step Learning Guide</h2>
        <p className="text-gray-600">AI-generated implementation guide tailored for developers</p>
        {isFromCache && (
          <p className="text-xs text-green-600 mb-2">⚡ Loaded from cache - no API cost!</p>
        )}
        <button
          onClick={handleRegenerateGuide}
          disabled={guideMutation.isPending}
          className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          🔄 Regenerate Guide
        </button>
      </div>

      {guide?.title && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{guide.title}</h3>
          {guide.introduction && (
            <p className="text-gray-700 text-lg leading-relaxed">{guide.introduction}</p>
          )}
        </div>
      )}

      {guide?.steps?.map((step: any, index: number) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h4>
              
              {step.content && (
                <div className="prose prose-gray max-w-none mb-4">
                  <p className="text-gray-700 leading-relaxed">{step.content}</p>
                </div>
              )}

              {step.code && (
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">💻 Code Example:</h5>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}

              {step.list && step.list.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">🔑 Key Points:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {step.list.map((item: string, itemIndex: number) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RepoDetailPage() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('readme');
  const [recommendationScore, setRecommendationScore] = useState<number | null>(null);
  const [scoreMessage, setScoreMessage] = useState<string>('');
  
  const tabs: TabConfig[] = [
    { id: 'readme', label: 'README', icon: '' },
    { id: 'analysis', label: 'AI Analysis', icon: '' },
    { id: 'description', label: 'Description', icon: '' },
    { id: 'guide', label: 'Learning Guide', icon: '' },
    { id: 'chat', label: 'Chat Assistant', icon: '' },
  ];

  const { data: repo, isLoading, error } = useQuery(
    modelenceQuery<RepoDetail>('repos.getRepoDetails', { owner, name })
  );

  // Get user preferences for scoring
  const { data: userPreferences } = useQuery({
    ...modelenceQuery('userPreferences.getTechRecommendationContext', {}),
    enabled: !!user,
  });

  // Calculate recommendation score when repo and user preferences are available
  useEffect(() => {
    const calculateScore = async () => {
      if (!repo || !owner || !name) return;

      try {
        // Get user preferences first
        let prefs = userPreferences;
        if (!prefs && user) {
          const prefsQuery = modelenceQuery('userPreferences.getTechRecommendationContext', {});
          prefs = await prefsQuery.queryFn();
        }

        // Calculate recommendation score
        const query = modelenceQuery('recommendationScoring.calculateRepoScore', {
          repo: {
            owner: repo.owner.login,
            name: repo.name,
            language: repo.language,
            description: repo.description,
            topics: repo.topics || []
          },
          userPreferences: prefs
        });

        const result = await query.queryFn() as { score: number; message: string };
        setRecommendationScore(result.score);
        setScoreMessage(result.message);
        console.log('Calculated recommendation score:', result);
      } catch (error) {
        console.error('Error calculating recommendation score:', error);
        setRecommendationScore(50);
        setScoreMessage(user ? 'Unable to calculate personalized score' : 'Sign in for personalized recommendations');
      }
    };

    calculateScore();
  }, [repo, userPreferences, user, owner, name]);

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
    <Page title={`${repo.name} - Repository Details`}>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container mx-auto px-6 py-8">
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
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      <img
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                        className="w-12 h-12 rounded-full mr-4 ring-2 ring-gray-100"
                      />
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                          <span className="text-blue-600">{repo.owner.login}</span>
                          <span className="text-gray-400 mx-2">/</span>
                          <span>{repo.name}</span>
                        </h1>
                        {repo.description && (
                          <p className="text-gray-600 text-lg mt-2 leading-relaxed">
                            {repo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Repository Stats */}
                  <div className="flex flex-wrap items-center gap-6 text-gray-600">
                    {repo.language && (
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                        <span className="font-medium">{repo.language}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{formatNumber(repo.stargazers_count)} stars</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{formatNumber(repo.forks_count)} forks</span>
                    </div>
                    {repo.open_issues_count > 0 && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">{formatNumber(repo.open_issues_count)} issues</span>
                      </div>
                    )}
                  </div>

                  {/* Topics */}
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {repo.topics.map((topic, index) => (
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
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
                  {/* Recommendation Score */}
                  {recommendationScore !== null && (
                    <div className="w-full sm:w-64">
                      <RecommendationScore score={recommendationScore} message={scoreMessage} />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 w-full sm:w-auto lg:w-64">
                    <SaveRepoButton owner={repo.owner.login} name={repo.name} />
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                                         >
                       {tab.label}
                     </button>
                  ))}
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

                {activeTab === 'analysis' && (
                  <AIAnalysisContent 
                    owner={repo.owner.login}
                    name={repo.name}
                    description={repo.description}
                    readmeContent={repo.readme_content}
                  />
                )}

                {activeTab === 'description' && (
                  <AIDescriptionContent 
                    owner={repo.owner.login}
                    name={repo.name}
                    description={repo.description}
                    readmeContent={repo.readme_content || ''}
                  />
                )}

                {activeTab === 'guide' && (
                  <AIGuideContent 
                    owner={repo.owner.login}
                    name={repo.name}
                    description={repo.description}
                    readmeContent={repo.readme_content || ''}
                  />
                )}

                {activeTab === 'chat' && (
                  <div style={{ height: '600px' }}>
                    <RepoChatInterface 
                      owner={repo.owner.login}
                      repoName={repo.name}
                    />
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
      </PageTransition>
    </Page>
  );
}
