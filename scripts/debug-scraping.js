#!/usr/bin/env node

/**
 * Debug script to test GitHub trending scraping
 * Run with: node scripts/debug-scraping.js
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugScraping() {
  try {
    console.log('🔍 Testing GitHub trending scraping...\n');
    
    const url = 'https://github.com/trending?since=weekly';
    console.log(`Fetching: ${url}\n`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    console.log(`✅ Successfully loaded HTML (${response.data.length} chars)\n`);
    
    // Find repository articles
    const repoElements = $('article.Box-row');
    console.log(`📦 Found ${repoElements.length} repository elements\n`);
    
    if (repoElements.length === 0) {
      console.log('❌ No repository elements found! GitHub structure might have changed.');
      console.log('First 500 chars of HTML:');
      console.log(response.data.substring(0, 500));
      return;
    }
    
    // Analyze first 3 repositories
    repoElements.slice(0, 3).each((index, element) => {
      const $repo = $(element);
      
      console.log(`🔎 === Repository ${index + 1} ===`);
      
      // Extract basic info
      const repoLink = $repo.find('h2 a').attr('href');
      console.log(`Link: ${repoLink}`);
      
      if (repoLink) {
        const [, owner, name] = repoLink.split('/');
        console.log(`Owner/Name: ${owner}/${name}`);
      }
      
      // Find all text that might contain stars
      const allText = $repo.text().replace(/\s+/g, ' ').trim();
      console.log(`Full text: "${allText.substring(0, 300)}..."`);
      
      // Test various selectors for stars
      const selectors = [
        '.f6.color-fg-muted.mt-2 span:last-child',
        '.f6.color-fg-muted span',
        '.f6.mt-2 span',
        '.color-fg-muted span',
        'span:contains("star")',
        'span:contains("★")',
      ];
      
      console.log('Testing selectors:');
      selectors.forEach(selector => {
        const elements = $repo.find(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 0) {
              console.log(`  ${selector}: "${text}"`);
            }
          });
        }
      });
      
      // Test regex patterns on full text
      const patterns = [
        /(\d{1,3}(?:,\d{3})*)\s+stars?\s+today/i,
        /(\d{1,3}(?:,\d{3})*)\s+star[s]?\s+this\s+week/i,
        /(\d{1,3}(?:,\d{3})*)\s+star[s]?\s+this\s+month/i,
        /(\d+)\s*★/i,
        /★\s*(\d+)/i,
      ];
      
      console.log('Testing patterns:');
      patterns.forEach((pattern, i) => {
        const match = allText.match(pattern);
        if (match) {
          console.log(`  Pattern ${i + 1} (${pattern}): Found "${match[0]}" -> ${match[1]} stars`);
        }
      });
      
      console.log(''); // Empty line
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

// Run the debug
debugScraping(); 