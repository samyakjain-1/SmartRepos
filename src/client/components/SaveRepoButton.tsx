import { useState } from 'react';

interface SaveRepoButtonProps {
  repoId: string;
  repoName: string;
  initialSaved?: boolean;
}

export default function SaveRepoButton({ repoId, repoName, initialSaved = false }: SaveRepoButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleSave = async () => {
    setIsLoading(true);
    
    // TODO: Implement actual save/unsave logic with backend
    // For now, just simulate the action
    setTimeout(() => {
      setIsSaved(!isSaved);
      setIsLoading(false);
    }, 300);
  };

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading}
      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
        isSaved
          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40'
          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-blue-100 hover:to-indigo-200 hover:text-blue-700 border border-gray-300/50 hover:border-blue-300/50'
      } ${isLoading ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
      title={isSaved ? `Unsave ${repoName}` : `Save ${repoName}`}
    >
      <span className="flex items-center space-x-1">
        <span className="text-base">{isLoading ? '⏳' : isSaved ? '⭐' : '☆'}</span>
        <span>{isLoading ? 'Saving...' : isSaved ? 'Saved' : 'Save'}</span>
      </span>
    </button>
  );
} 