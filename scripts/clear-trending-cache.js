#!/usr/bin/env node

/**
 * Direct database script to clear trending repositories cache
 * Run with: node scripts/clear-trending-cache.js
 */

import { MongoClient } from 'mongodb';

async function clearTrendingCache() {
  let client;
  
  try {
    console.log('🗑️  Clearing trending repositories cache...\n');
    
    // Get MongoDB connection string from environment
    // You'll need to replace this with your actual MongoDB connection string
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/yourdbname';
    
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(mongoUrl);
    await client.connect();
    
    const db = client.db();
    const collection = db.collection('trendingRepos');
    
    // Get current statistics
    const totalBefore = await collection.countDocuments();
    const byPeriod = {
      daily: await collection.countDocuments({ period: 'daily' }),
      weekly: await collection.countDocuments({ period: 'weekly' }),
      monthly: await collection.countDocuments({ period: 'monthly' })
    };
    
    console.log(`📊 Current cache contents:`);
    console.log(`   Total: ${totalBefore} entries`);
    console.log(`   Daily: ${byPeriod.daily}, Weekly: ${byPeriod.weekly}, Monthly: ${byPeriod.monthly}\n`);
    
    if (totalBefore === 0) {
      console.log('✅ Cache is already empty - nothing to clear!');
      return;
    }
    
    // Clear all trending repositories
    console.log('🗑️  Deleting all cached trending repositories...');
    const result = await collection.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} trending repository entries`);
    console.log('\n🎉 Cache cleared successfully!');
    console.log('💡 Next time you visit trending pages, fresh data will be scraped.');
    
  } catch (error) {
    console.error('\n❌ Error clearing cache:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('connection')) {
      console.log('\n💡 Connection tips:');
      console.log('1. Make sure MongoDB is running');
      console.log('2. Check your MONGODB_URL environment variable');
      console.log('3. Verify the database name is correct');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the clear cache
clearTrendingCache(); 