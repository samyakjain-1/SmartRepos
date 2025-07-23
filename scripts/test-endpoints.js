#!/usr/bin/env node

/**
 * Test script to discover the correct Modelence API endpoint format
 */

import axios from 'axios';

async function testEndpoints() {
  try {
    console.log('🔍 Testing different Modelence API endpoint formats...\n');
    
    // Check if server is running
    try {
      await axios.get('http://localhost:3000');
      console.log('✅ Server is running\n');
    } catch (error) {
      console.log('❌ Server not running! Please start it with: npm run dev');
      return;
    }

    // Test different endpoint formats
    const testCases = [
      {
        name: 'Standard Modelence Query Format',
        url: 'http://localhost:3000/api/queries',
        data: {
          module: 'githubTrending',
          method: 'getTrendingRepos',
          args: { period: 'weekly' }
        }
      },
      {
        name: 'Direct Module Path',
        url: 'http://localhost:3000/api/queries/githubTrending.getTrendingRepos',
        data: { period: 'weekly' }
      },
      {
        name: 'GraphQL Style',  
        url: 'http://localhost:3000/api/query',
        data: {
          query: 'githubTrending.getTrendingRepos',
          variables: { period: 'weekly' }
        }
      }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`🧪 Testing: ${testCase.name}`);
        console.log(`   POST ${testCase.url}`);
        console.log(`   Body: ${JSON.stringify(testCase.data, null, 2)}`);
        
        const response = await axios.post(testCase.url, testCase.data, {
          timeout: 10000
        });
        
        console.log(`✅ SUCCESS! Status: ${response.status}`);
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`📊 Got ${response.data.length} repositories`);
          const withStars = response.data.filter(r => r.starsToday > 0).length;
          console.log(`⭐ ${withStars} repositories have stars > 0`);
          
          if (response.data.length > 0) {
            const sample = response.data[0];
            console.log(`📝 Sample repo: ${sample.owner}/${sample.name} (${sample.starsToday} stars)`);
          }
        } else if (response.data) {
          console.log(`📄 Response type: ${typeof response.data}`);
          console.log(`📝 Response preview: ${JSON.stringify(response.data).substring(0, 200)}...`);
        }
        
        console.log(''); // Empty line
        
        // If we got a successful response with array data, this is likely the right format
        if (response.data && Array.isArray(response.data)) {
          console.log('🎉 This endpoint format works! Use this one.\n');
          break;
        }
        
      } catch (error) {
        console.log(`❌ FAILED: ${error.response?.status} ${error.response?.statusText || error.message}`);
        if (error.response?.data) {
          console.log(`📄 Error details: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
        }
        console.log(''); // Empty line
      }
    }
    
    console.log('🔍 Testing complete. Look for the successful endpoint format above.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the test
testEndpoints(); 