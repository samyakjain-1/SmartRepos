import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'modelence/client';
import { modelenceQuery } from '@modelence/react-query';
import { Link } from 'react-router-dom';

interface SaveRepoButtonProps {
  owner: string;
  name: string;
}

export default function SaveRepoButton({ owner, name }: SaveRepoButtonProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);

  // Query to check if repo is already saved using Modelence query system
  const { data: savedRepos } = useQuery({
    ...modelenceQuery<any[]>('savedRepos.getUserSavedRepos', {}),
    enabled: !!user,
  });

  // Check if current repo is in saved repos
  useEffect(() => {
    if (savedRepos && Array.isArray(savedRepos)) {
      const isRepoSaved = savedRepos.some((repo: any) => 
        repo.owner === owner && repo.name === name
      );
      setIsSaved(isRepoSaved);
    }
  }, [savedRepos, owner, name]);

  // Mutation to save repo using Modelence mutation system
  const saveMutation = useMutation({
    mutationFn: async () => {
      const saveQuery = modelenceQuery('savedRepos.saveRepo', { owner, name });
      const result = await saveQuery.queryFn();
      return result;
    },
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({ 
        queryKey: modelenceQuery('savedRepos.getUserSavedRepos', {}).queryKey 
      });
    },
    onError: (error) => {
      console.error('Failed to save repository:', error);
    },
  });

  // Mutation to unsave repo using Modelence mutation system
  const unsaveMutation = useMutation({
    mutationFn: async () => {
      const unsaveQuery = modelenceQuery('savedRepos.unsaveRepo', { owner, name });
      const result = await unsaveQuery.queryFn();
      return result;
    },
    onSuccess: () => {
      setIsSaved(false);
      queryClient.invalidateQueries({ 
        queryKey: modelenceQuery('savedRepos.getUserSavedRepos', {}).queryKey 
      });
    },
    onError: (error) => {
      console.error('Failed to unsave repository:', error);
    },
  });

  const handleToggleSave = async () => {
    if (!user) return;
    
    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  const isLoading = saveMutation.isPending || unsaveMutation.isPending;

  // Show nothing for unauthenticated users
  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading}
      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
        isSaved
          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40'
          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-blue-100 hover:to-indigo-200 hover:text-blue-700 border border-gray-300/50 hover:border-blue-300/50'
      } ${isLoading ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
      title={isSaved ? `Unsave ${owner}/${name}` : `Save ${owner}/${name}`}
    >
      <span className="flex items-center space-x-1">
        <span className="text-base">{isLoading ? '⏳' : isSaved ? '⭐' : '☆'}</span>
        <span>{isLoading ? 'Saving...' : isSaved ? 'Saved' : 'Save'}</span>
      </span>
    </button>
  );
} 