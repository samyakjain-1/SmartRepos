#!/usr/bin/env node

/**
 * Simple script to refresh trending repos by calling the getTrendingRepos query
 * This will automatically trigger fresh scraping if no cached data exists
 * Run with: node scripts/simple-refresh.js
 */

import axios from 'axios';

async function simpleRefresh() {
  try {
    console.log('🔄 Refreshing trending repositories the simple way...\n');
    
    // Check if server is running
    try {
      await axios.get('http://localhost:3000');
      console.log('✅ Server is running\n');
    } catch (error) {
      console.log('❌ Server not running! Please start it with: npm run dev');
      return;
    }

    const periods = ['daily', 'weekly', 'monthly'];
    
    for (const period of periods) {
      try {
        console.log(`🔄 Refreshing ${period} trending repositories...`);
        
        // Call the getTrendingRepos query - this will automatically scrape if cache is empty/old
        const startTime = Date.now();
        const response = await axios.post('http://localhost:3000/api/queries', {
          module: 'githubTrending',
          method: 'getTrendingRepos',
          args: { period }
        });
        const endTime = Date.now();
        
        if (response.data && Array.isArray(response.data)) {
          const repos = response.data;
          const withStars = repos.filter(r => r.starsToday > 0).length;
          const totalStars = repos.reduce((sum, r) => sum + r.starsToday, 0);
          const maxStars = Math.max(...repos.map(r => r.starsToday));
          
          console.log(`✅ ${period}: Got ${repos.length} repositories in ${endTime - startTime}ms`);
          console.log(`   With stars: ${withStars}/${repos.length} (${Math.round(withStars/repos.length*100)}%)`);
          console.log(`   Total stars: ${totalStars.toLocaleString()}, Max: ${maxStars.toLocaleString()}`);
          
          // Show top 3 repos
          console.log('   Top repos:');
          repos.slice(0, 3).forEach((repo, i) => {
            const starsText = repo.starsToday > 0 ? `${repo.starsToday.toLocaleString()} stars` : '0 stars';
            console.log(`     ${i + 1}. ${repo.owner}/${repo.name}: ${starsText} (${repo.language || 'No language'})`);
          });
          
        } else {
          console.log(`❌ ${period}: Unexpected response format`);
          console.log('Response:', JSON.stringify(response.data, null, 2));
        }
        
        console.log(''); // Empty line
        
        // Wait between requests
        if (period !== 'monthly') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Error refreshing ${period}:`, error.response?.data || error.message);
      }
    }
    
    console.log('🎉 Refresh completed!');
    console.log('💡 If you see "0 stars" above, the trending repos might need to be scraped fresh.');
    console.log('   The issue is likely that today\'s cache has old data with incorrect star parsing.');
    console.log('   Check your app\'s trending pages - they should now show correct star counts!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the refresh
simpleRefresh(); 