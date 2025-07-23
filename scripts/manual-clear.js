#!/usr/bin/env node

/**
 * Manual instructions to clear trending repository cache
 */

console.log('🛠️  Manual Cache Clear Instructions\n');

console.log('Since API endpoints aren\'t accessible, here are 3 manual methods:\n');

console.log('📋 METHOD 1: Browser Cache Clear');
console.log('1. Open your app: http://localhost:3000');
console.log('2. Press F12 (DevTools) → Application → Storage → Clear site data');
console.log('3. Visit these pages to trigger fresh scraping:');
console.log('   • http://localhost:3000/trending?period=daily');
console.log('   • http://localhost:3000/trending?period=weekly'); 
console.log('   • http://localhost:3000/trending?period=monthly');
console.log('4. Each page will show: "No cached data found, falling back to scraping"');
console.log('5. Fresh data with correct star counts will be displayed!\n');

console.log('📋 METHOD 2: DevTools Console');
console.log('1. Visit: http://localhost:3000/trending?period=weekly');
console.log('2. Press F12 → Console tab');
console.log('3. Run this command:');
console.log('   localStorage.clear(); location.reload();');
console.log('4. The page will refresh and trigger fresh scraping\n');

console.log('📋 METHOD 3: Database Direct (if you have MongoDB access)');
console.log('1. Connect to your MongoDB database');
console.log('2. Delete trending repos for today:');
console.log('   db.trendingRepos.deleteMany({scrapedDate: "' + new Date().toISOString().split('T')[0] + '"});');
console.log('3. Visit trending pages - they will auto-scrape fresh data\n');

console.log('✅ EXPECTED RESULT:');
console.log('After clearing cache, your trending repos should show:');
console.log('• "5,414 stars this week" instead of "0 today"');
console.log('• "7,091 stars this week" instead of "0 today"');  
console.log('• Correct star counts for all repositories\n');

console.log('💡 The improved scraping logic is already deployed!');
console.log('It now correctly parses "X stars this week" format.');
console.log('You just need to clear the old cached data with "0 stars".');

const currentDate = new Date().toISOString().split('T')[0];
console.log(`\n📅 Today's date: ${currentDate}`);
console.log('Cache entries with this date need to be refreshed.'); 