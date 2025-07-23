import { startApp } from 'modelence/server';
import repos from './repos';
import savedRepos from './saved-repos';
import githubTrending from './github-trending';

startApp({
  modules: [repos, savedRepos, githubTrending]
});