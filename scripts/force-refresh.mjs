#!/usr/bin/env node

/**
 * Force Refresh Script
 * 
 * Clears cached data and forces fresh scraping to get new avatar images
 */

import { execSync } from 'child_process';

async function forceRefresh() {
  try {
    console.log('🔄 Forcing fresh scraping with avatar images...');
    
    // Kill and restart the dev server to clear any memory cache
    console.log('🛑 Stopping dev server...');
    try {
      execSync('pkill -f "modelence dev"', { stdio: 'ignore' });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Ignore if no process to kill
    }
    
    console.log('🚀 Starting fresh dev server...');
    console.log('⏳ Please wait a moment, then visit http://localhost:3000');
    console.log('🖼️  The new avatar images should appear when you browse trending repos!');
    
    // Start the dev server in the background
    execSync('npm run dev', { 
      stdio: 'inherit',
      detached: false 
    });
    
  } catch (error) {
    console.error('❌ Error during refresh:', error.message);
    console.log('💡 Try running: npm run dev');
  }
}

forceRefresh(); 