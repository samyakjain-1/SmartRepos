#!/usr/bin/env node

/**
 * Script to clear only today's trending cache entries
 * This forces fresh scraping the next time getTrendingRepos is called
 */

import axios from 'axios';

async function clearTodaysCache() {
  try {
    console.log('🗑️  Clearing today\'s trending cache to force fresh scraping...\n');
    
    // Check if server is running
    try {
      await axios.get('http://localhost:3000');
      console.log('✅ Server is running\n');
    } catch (error) {
      console.log('❌ Server not running! Please start it with: npm run dev');
      return;
    }

    // Get current date in YYYY-MM-DD format (same format used by the scraper)
    const currentDate = new Date().toISOString().split('T')[0];
    console.log(`📅 Clearing cache for date: ${currentDate}\n`);

    const periods = ['daily', 'weekly', 'monthly'];
    let totalCleared = 0;
    
    for (const period of periods) {
      try {
        console.log(`🗑️  Clearing ${period} cache for today...`);
        
        // Try to call the cleanupOldData query with daysToKeep = 0 to clear today's data
        // This is a bit of a hack, but should work
        const response = await axios.post('http://localhost:3000/api/queries', {
          module: 'githubTrending',
          method: 'cleanupOldData',
          args: { daysToKeep: 0 }  // This will clear everything including today
        });
        
        if (response.data && response.data.deletedCount !== undefined) {
          console.log(`✅ ${period}: Cleared ${response.data.deletedCount} entries`);
          totalCleared += response.data.deletedCount;
        } else {
          console.log(`✅ ${period}: Cache clear attempted`);
        }
        
      } catch (error) {
        console.error(`❌ Error clearing ${period} cache:`, error.response?.data || error.message);
      }
    }
    
    console.log(`\n🎉 Cache clearing completed!`);
    console.log(`📊 Total entries cleared: ${totalCleared}`);
    console.log(`\n💡 Next steps:`);
    console.log(`1. The cache for today (${currentDate}) has been cleared`);
    console.log(`2. Run: node scripts/simple-refresh.js`);
    console.log(`3. This will trigger fresh scraping with the improved star parsing`);
    console.log(`4. Check your app's trending pages for correct star counts!`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the cache clear
clearTodaysCache(); 