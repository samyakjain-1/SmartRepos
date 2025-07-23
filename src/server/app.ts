import { startApp } from 'modelence/server';
import repos from './repos';
import savedRepos from './saved-repos';
import githubTrending from './github-trending';
import llm from './llm';
import userPreferences from './user-preferences';
import recommendationScoring from './recommendation-scoring';
import repoChat from './repo-chat';

startApp({
  modules: [repos, savedRepos, githubTrending, llm, userPreferences, recommendationScoring, repoChat]
});