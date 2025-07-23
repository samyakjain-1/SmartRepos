#!/usr/bin/env node

/**
 * Manual GitHub Trending Scraper
 * 
 * This script manually triggers the scraping process by making HTTP requests 
 * to the running Modelence server.
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

async function scrapeAndUpdate() {
  try {
    console.log('🚀 Starting manual GitHub trending scraping...');
    console.log('🌐 Making request to Modelence server...');
    
    // Make a request to trigger scraping for all periods
    const periods = ['daily', 'weekly', 'monthly'];
    const results = [];
    
    for (const period of periods) {
      console.log(`📈 Scraping ${period} trending repositories...`);
      
      try {
        // Make request to get trending repos (this will trigger scraping if no cache)
        const response = await fetch(`${API_BASE}/api/githubTrending/getTrendingRepos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ period })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        results.push({
          period,
          count: data.length || 0,
          success: true,
          sample: data.slice(0, 3).map(r => ({ owner: r.owner, name: r.name, starsToday: r.starsToday }))
        });
        
        console.log(`✅ ${period}: Found ${data.length || 0} repositories`);
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to scrape ${period}:`, error.message);
        results.push({
          period,
          count: 0,
          success: false,
          error: error.message
        });
      }
    }
    
    // Summary
    const summary = {
      timestamp: new Date().toISOString(),
      results,
      totalSuccess: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      status: results.some(r => r.success) ? 'partial-success' : 'failed'
    };
    
    console.log('\n🎉 === SCRAPING SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
    
    if (summary.totalSuccess > 0) {
      console.log('\n✅ Scraping completed! Check your app at http://localhost:3000');
    } else {
      console.log('\n❌ All scraping attempts failed. Check server logs.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ === SCRAPING FAILED ===');
    console.error('Error:', error.message);
    console.error('Make sure your dev server is running: npm run dev');
    process.exit(1);
  }
}

// Install node-fetch if not available
async function ensureFetch() {
  try {
    await import('node-fetch');
  } catch (error) {
    console.log('📦 Installing node-fetch for API requests...');
    const { execSync } = await import('child_process');
    execSync('npm install node-fetch', { stdio: 'inherit' });
    console.log('✅ Installation complete!');
  }
}

// Main execution
async function main() {
  await ensureFetch();
  await scrapeAndUpdate();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main }; 