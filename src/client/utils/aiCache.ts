interface CacheItem {
  data: any;
  timestamp: number;
  expiresIn: number; // in milliseconds
}

class AICache {
  private getKey(type: 'analysis' | 'description' | 'guide', owner: string, name: string): string {
    return `ai-${type}-${owner}-${name}`;
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.expiresIn;
  }

  // Cache for 7 days (7 * 24 * 60 * 60 * 1000)
  private readonly DEFAULT_EXPIRY = 7 * 24 * 60 * 60 * 1000;

  set(type: 'analysis' | 'description' | 'guide', owner: string, name: string, data: any, customExpiry?: number): void {
    try {
      const key = this.getKey(type, owner, name);
      const cacheItem: CacheItem = {
        data,
        timestamp: Date.now(),
        expiresIn: customExpiry || this.DEFAULT_EXPIRY,
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache AI result:', error);
    }
  }

  get(type: 'analysis' | 'description' | 'guide', owner: string, name: string): any | null {
    try {
      const key = this.getKey(type, owner, name);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const cacheItem: CacheItem = JSON.parse(cached);
      
      if (this.isExpired(cacheItem)) {
        this.remove(type, owner, name);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to retrieve cached AI result:', error);
      return null;
    }
  }

  remove(type: 'analysis' | 'description' | 'guide', owner: string, name: string): void {
    try {
      const key = this.getKey(type, owner, name);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached AI result:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('ai-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear AI cache:', error);
    }
  }

  // Get cache info for debugging
  getStats(): { total: number; expired: number; types: Record<string, number> } {
    const stats: { total: number; expired: number; types: Record<string, number> } = { 
      total: 0, 
      expired: 0, 
      types: {} 
    };
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('ai-')) {
          stats.total++;
          const type = key.split('-')[1];
          stats.types[type] = (stats.types[type] || 0) + 1;
          
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheItem: CacheItem = JSON.parse(cached);
              if (this.isExpired(cacheItem)) {
                stats.expired++;
              }
            }
          } catch (e) {
            // Invalid cache item
            stats.expired++;
          }
        }
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }
    
    return stats;
  }
}

export const aiCache = new AICache(); 