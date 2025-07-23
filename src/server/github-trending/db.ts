import { Store, schema } from 'modelence/server';

export const dbTrendingRepos = new Store('trendingRepos', {
  schema: {
    owner: schema.string(),
    name: schema.string(),
    url: schema.string(),
    description: schema.string().optional(),
    language: schema.string().optional(),
    starsToday: schema.number(),
    rank: schema.number(),
    period: schema.enum(['daily', 'weekly', 'monthly']),
    scrapedAt: schema.date(),
    scrapedDate: schema.string(), // YYYY-MM-DD format for easy querying
  },
  indexes: [
    { key: { period: 1, scrapedDate: 1 } },
    { key: { scrapedDate: 1 } },
    { key: { owner: 1, name: 1, period: 1, scrapedDate: 1 }, unique: true },
  ],
}); 