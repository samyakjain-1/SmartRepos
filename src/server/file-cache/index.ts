import fs from 'fs';
import path from 'path';

// File caching utility for Repomix results
class RepomixFileCache {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'cache', 'repomix');
    // Ensure cache directory exists
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log(`[FileCache] Created cache directory: ${this.cacheDir}`);
    }
  }

  private getCacheFilePath(owner: string, repoName: string): string {
    // Safe filename: facebook/react → facebook-react.json
    const safeFileName = `${owner}-${repoName}`.replace(/[^a-zA-Z0-9-_]/g, '-');
    return path.join(this.cacheDir, `${safeFileName}.json`);
  }

  /**
   * Check if cached version exists and is still valid (not expired)
   */
  async get(owner: string, repoName: string): Promise<string | null> {
    const filePath = this.getCacheFilePath(owner, repoName);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`[FileCache] MISS - No cache file for ${owner}/${repoName}`);
        return null;
      }

      const cached = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const now = Date.now();
      const cacheAge = now - cached.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      if (cacheAge > maxAge) {
        const daysOld = Math.floor(cacheAge / (24 * 60 * 60 * 1000));
        console.log(`[FileCache] EXPIRED - Cache for ${owner}/${repoName} is ${daysOld} days old, deleting...`);
        // Delete expired cache
        fs.unlinkSync(filePath);
        return null;
      }

      const hoursOld = Math.floor(cacheAge / (60 * 60 * 1000));
      const sizeKB = Math.round(cached.repoContent.length / 1024);
      console.log(`[FileCache] HIT ⚡ - Using cached ${owner}/${repoName} (${hoursOld}h old, ${sizeKB}KB)`);
      
      return cached.repoContent;

    } catch (error) {
      console.error(`[FileCache] Error reading cache for ${owner}/${repoName}:`, error);
      // Try to delete corrupted cache file
      try {
        fs.unlinkSync(filePath);
        console.log(`[FileCache] Deleted corrupted cache file for ${owner}/${repoName}`);
      } catch (deleteError) {
        // Ignore delete errors
      }
      return null;
    }
  }

  /**
   * Save repository content to cache file
   */
  async set(owner: string, repoName: string, repoContent: string): Promise<void> {
    const filePath = this.getCacheFilePath(owner, repoName);
    
    try {
      this.ensureCacheDir(); // Make sure directory exists
      
      const cacheData = {
        owner,
        repoName,
        repoContent,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        contentSize: repoContent.length,
        version: '1.0', // For future compatibility
      };

      // Write to temporary file first, then rename (atomic operation)
      const tempFilePath = `${filePath}.tmp`;
      fs.writeFileSync(tempFilePath, JSON.stringify(cacheData, null, 2));
      fs.renameSync(tempFilePath, filePath);

      const sizeKB = Math.round(repoContent.length / 1024);
      console.log(`[FileCache] CACHED ✅ - Saved ${owner}/${repoName} (${sizeKB}KB) to disk`);

    } catch (error) {
      console.error(`[FileCache] Error saving cache for ${owner}/${repoName}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { files: number; totalSize: string; oldestFile: string | null; newestFile: string | null } {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        return { files: 0, totalSize: '0MB', oldestFile: null, newestFile: null };
      }

      const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
      let totalSize = 0;
      let oldestTimestamp = Date.now();
      let newestTimestamp = 0;
      let oldestFile = null;
      let newestFile = null;

      for (const file of files) {
        try {
          const filePath = path.join(this.cacheDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
          
          const mtime = stats.mtime.getTime();
          if (mtime < oldestTimestamp) {
            oldestTimestamp = mtime;
            oldestFile = file;
          }
          if (mtime > newestTimestamp) {
            newestTimestamp = mtime;
            newestFile = file;
          }
        } catch (error) {
          // Skip problematic files
          continue;
        }
      }

      return {
        files: files.length,
        totalSize: `${Math.round(totalSize / 1024 / 1024 * 100) / 100}MB`,
        oldestFile: oldestFile ? `${oldestFile.replace('.json', '')} (${Math.floor((Date.now() - oldestTimestamp) / (24 * 60 * 60 * 1000))} days ago)` : null,
        newestFile: newestFile ? `${newestFile.replace('.json', '')} (${Math.floor((Date.now() - newestTimestamp) / (60 * 60 * 1000))} hours ago)` : null,
      };
    } catch (error) {
      console.error('[FileCache] Error getting stats:', error);
      return { files: 0, totalSize: '0MB', oldestFile: null, newestFile: null };
    }
  }

  /**
   * Clear expired cache files
   */
  async cleanup(): Promise<{ deleted: number; errors: number; savedSpace: string }> {
    let deleted = 0;
    let errors = 0;
    let savedSpace = 0;

    try {
      if (!fs.existsSync(this.cacheDir)) {
        return { deleted: 0, errors: 0, savedSpace: '0MB' };
      }

      const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const file of files) {
        try {
          const filePath = path.join(this.cacheDir, file);
          const cached = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const age = Date.now() - cached.timestamp;

          if (age > maxAge) {
            const stats = fs.statSync(filePath);
            savedSpace += stats.size;
            fs.unlinkSync(filePath);
            deleted++;
            console.log(`[FileCache] CLEANUP - Deleted expired ${file} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`);
          }
        } catch (error) {
          errors++;
          console.error(`[FileCache] CLEANUP ERROR - ${file}:`, error);
          // Try to delete corrupted file
          try {
            const filePath = path.join(this.cacheDir, file);
            fs.unlinkSync(filePath);
            console.log(`[FileCache] Deleted corrupted file: ${file}`);
          } catch (deleteError) {
            // Ignore delete errors
          }
        }
      }
    } catch (error) {
      errors++;
      console.error('[FileCache] CLEANUP ERROR:', error);
    }

    return { 
      deleted, 
      errors, 
      savedSpace: `${Math.round(savedSpace / 1024 / 1024 * 100) / 100}MB` 
    };
  }

  /**
   * Check if a specific repo is cached
   */
  isCached(owner: string, repoName: string): boolean {
    const filePath = this.getCacheFilePath(owner, repoName);
    return fs.existsSync(filePath);
  }

  /**
   * Clear cache for a specific repository
   */
  async clearRepo(owner: string, repoName: string): Promise<boolean> {
    const filePath = this.getCacheFilePath(owner, repoName);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[FileCache] Cleared cache for ${owner}/${repoName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[FileCache] Error clearing cache for ${owner}/${repoName}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const repomixFileCache = new RepomixFileCache();

// Run cleanup on startup
setTimeout(async () => {
  const result = await repomixFileCache.cleanup();
  if (result.deleted > 0) {
    console.log(`[FileCache] Startup cleanup: Deleted ${result.deleted} expired files, saved ${result.savedSpace}`);
  }
}, 5000); // Run after 5 seconds to not delay startup 