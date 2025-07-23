#!/usr/bin/env node

/**
 * GitHub Trending Scraper using Modelence Backend
 * 
 * This script uses the Modelence framework's built-in database connection
 * and the githubTrending module to scrape and store trending repositories.
 */

const path = require('path');

async function main() {
  try {
    console.log('🚀 Starting GitHub trending scraping job...');
    console.log('📊 Using Modelence database connection');
    
    // Import the Modelence app and modules
    const { startApp } = require('../dist/server/app.js');
    
    // The app should initialize the database connection automatically
    console.log('🔗 Initializing Modelence app...');
    
    // Import the GitHub trending module
    const githubTrendingModule = require('../dist/server/github-trending/index.js').default;
    
    if (!githubTrendingModule || !githubTrendingModule.queries) {
      throw new Error('GitHub trending module not properly loaded');
    }
    
    // Run the scraping for all periods
    console.log('📈 Scraping trending repositories for all periods...');
    const scrapeResult = await githubTrendingModule.queries.scrapeAndUpdateTrending({
      periods: ['daily', 'weekly', 'monthly']
    });
    
    console.log('✅ Scraping completed successfully:');
    console.log(JSON.stringify(scrapeResult, null, 2));
    
    // Clean up old data (keep last 7 days)
    console.log('🧹 Cleaning up old data...');
    const cleanupResult = await githubTrendingModule.queries.cleanupOldData({ 
      daysToKeep: 7 
    });
    
    console.log('✅ Cleanup completed:');
    console.log(JSON.stringify(cleanupResult, null, 2));
    
    // Summary
    const summary = {
      timestamp: new Date().toISOString(),
      scraping: scrapeResult,
      cleanup: cleanupResult,
      status: 'success'
    };
    
    console.log('\n🎉 === OPERATION SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
    
    console.log('\n✅ All operations completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ === OPERATION FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    const errorSummary = {
      timestamp: new Date().toISOString(),
      error: error.message,
      status: 'failed'
    };
    
    console.error(JSON.stringify(errorSummary, null, 2));
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the script only if called directly
if (require.main === module) {
  main();
}

module.exports = { main }; 