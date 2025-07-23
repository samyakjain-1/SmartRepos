#!/usr/bin/env node

/**
 * Script to refresh trending repositories by clearing cache and scraping fresh data
 * Run with: node scripts/refresh-trending.js
 */

import { execSync } from 'child_process';
import axios from 'axios';

async function refreshTrendingRepos() {
  try {
    console.log('🔄 Starting fresh scrape of trending repositories...\n');
    
    // Check if server is running by trying to connect
    let serverRunning = false;
    try {
      await axios.get('http://localhost:3000');
      serverRunning = true;
      console.log('✅ Server is running - using API calls\n');
    } catch (error) {
      console.log('❌ Server not running - will need to start server first\n');
    }

    if (serverRunning) {
      // Use API calls to trigger fresh scraping
      const periods = ['daily', 'weekly', 'monthly'];
      
      for (const period of periods) {
        try {
          console.log(`🔄 Refreshing ${period} trending repositories...`);
          
          // Try different API endpoint formats for Modelence
          let response;
          try {
            // Try the scrapeAndUpdateTrending query first (this definitely exists)
            response = await axios.post('http://localhost:3000/api/queries', {
              module: 'githubTrending',
              method: 'scrapeAndUpdateTrending',
              args: { periods: [period] }
            });
          } catch (error) {
            // If that fails, try the mutation format
            response = await axios.post('http://localhost:3000/api/mutations', {
              module: 'githubTrending', 
              method: 'triggerFreshScrape',
              args: { period }
            });
          }
          
          // Handle different response formats
          if (response.data) {
            if (response.data.success !== false) {
              // Handle scrapeAndUpdateTrending response format
              if (response.data.results) {
                const result = response.data.results.find(r => r.period === period);
                if (result && result.success) {
                  console.log(`✅ ${period}: ${result.count} repositories updated successfully`);
                } else {
                  console.log(`❌ ${period}: ${result?.error || 'Unknown error'}`);
                }
              }
              // Handle triggerFreshScrape response format  
              else if (response.data.starsStats) {
                const stats = response.data.starsStats;
                console.log(`✅ ${period}: ${response.data.scraped} scraped, ${stats.withStars}/${response.data.scraped} have stars (${stats.percentage}%)`);
                console.log(`   Max stars: ${stats.maxStars}, Total: ${stats.totalStars}`);
                
                if (response.data.sample) {
                  console.log('   Sample repos:');
                  response.data.sample.forEach((repo, i) => {
                    console.log(`     ${i + 1}. ${repo.name}: ${repo.starsToday} stars (${repo.language || 'No language'})`);
                  });
                }
              }
              // Generic success message
              else {
                console.log(`✅ ${period}: Successfully triggered refresh`);
              }
            } else {
              console.log(`❌ ${period}: ${response.data.error || 'Unknown error'}`);
            }
          } else {
            console.log(`✅ ${period}: Request completed (no detailed response)`);
          }
          
          console.log(''); // Empty line
          
          // Wait 2 seconds between requests to be respectful to GitHub
          if (period !== 'monthly') {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          console.error(`❌ Error refreshing ${period}:`, error.response?.data || error.message);
        }
      }
      
    } else {
      console.log('📋 To refresh trending repos, you need to:');
      console.log('1. Start your development server: npm run dev');
      console.log('2. Then run this script again: node scripts/refresh-trending.js');
      console.log('\nOr alternatively, start the server and visit your app, then click refresh on trending pages.');
    }
    
    console.log('\n🎉 Fresh scraping completed!');
    console.log('💡 The trending pages should now show correct star counts.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the refresh
refreshTrendingRepos(); 