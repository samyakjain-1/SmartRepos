import { Module, ObjectId, Store, schema } from 'modelence/server';
import { z } from 'zod';

// Create the preferences store using Modelence Store
const userPreferencesStore = new Store('userPreferences', {
  schema: {
    userId: schema.userId(),
    programmingLanguages: schema.array(schema.string()).default([]),
    experienceLevel: schema.string().optional(),
    techInterests: schema.array(schema.string()).default([]),
    goals: schema.string().optional(),
    onboardingCompleted: schema.boolean().default(false),
    createdAt: schema.date().default(() => new Date()),
    updatedAt: schema.date().default(() => new Date()),
  },
  indexes: [
    { key: { userId: 1 }, unique: true },
  ],
});

export default new Module('userPreferences', {
  stores: [userPreferencesStore],
  
  queries: {
    async getUserPreferences(_, { user }) {
      if (!user) return null;

      try {
        const preferences = await userPreferencesStore.fetch({ userId: new ObjectId(user.id) });
        return preferences[0] || null;
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        return null;
      }
    },

    async hasCompletedOnboarding(_, { user }) {
      if (!user) return false;

      try {
        const preferences = await userPreferencesStore.fetch({ userId: new ObjectId(user.id) });
        return preferences[0]?.onboardingCompleted || false;
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        return false;
      }
    },

    async getTechRecommendationContext(_, { user }) {
      if (!user) return null;

      try {
        const preferences = await userPreferencesStore.fetch({ userId: new ObjectId(user.id) });
        const userPrefs = preferences[0];
        
        if (!userPrefs || !userPrefs.onboardingCompleted) {
          return null;
        }

        // Format for AI analysis
        return {
          programmingLanguages: userPrefs.programmingLanguages || [],
          experienceLevel: userPrefs.experienceLevel || 'Beginner',
          techInterests: userPrefs.techInterests || [],
          goals: userPrefs.goals || '',
          onboardingCompleted: userPrefs.onboardingCompleted,
        };
      } catch (error) {
        console.error('Error getting tech recommendation context:', error);
        return null;
      }
    },
  },

  mutations: {
    async saveUserPreferences(args, { user }) {
      if (!user) throw new Error('Unauthorized');

      const { preferences } = z.object({
        preferences: z.object({
          programmingLanguages: z.array(z.string()),
          experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']),
          techInterests: z.array(z.string()),
          goals: z.string(),
        }),
      }).parse(args);

      try {
        console.log(`Saving preferences for user: ${user.id}`, preferences);

        // Check if user preferences already exist
        const existing = await userPreferencesStore.fetch({ userId: new ObjectId(user.id) });
        
        if (existing.length > 0) {
          // Update existing preferences
          await userPreferencesStore.updateOne(
            { userId: new ObjectId(user.id) },
            {
              $set: {
                programmingLanguages: preferences.programmingLanguages,
                experienceLevel: preferences.experienceLevel,
                techInterests: preferences.techInterests,
                goals: preferences.goals,
                onboardingCompleted: true,
                updatedAt: new Date(),
              }
            }
          );
        } else {
          // Insert new preferences
          await userPreferencesStore.insertOne({
            userId: new ObjectId(user.id),
            programmingLanguages: preferences.programmingLanguages,
            experienceLevel: preferences.experienceLevel,
            techInterests: preferences.techInterests,
            goals: preferences.goals,
            onboardingCompleted: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        console.log('Successfully saved user preferences');
        return { success: true };
      } catch (error) {
        console.error('Error saving user preferences:', error);
        throw new Error(`Failed to save user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async updateOnboardingStatus(args, { user }) {
      if (!user) throw new Error('Unauthorized');

      const { completed } = z.object({
        completed: z.boolean(),
      }).parse(args);

      try {
        // Check if user preferences already exist
        const existing = await userPreferencesStore.fetch({ userId: new ObjectId(user.id) });
        
        if (existing.length > 0) {
          // Update existing preferences
          await userPreferencesStore.updateOne(
            { userId: new ObjectId(user.id) },
            {
              $set: {
                onboardingCompleted: completed,
                updatedAt: new Date(),
              }
            }
          );
        } else {
          // Insert new preferences record
          await userPreferencesStore.insertOne({
            userId: new ObjectId(user.id),
            programmingLanguages: [],
            techInterests: [],
            onboardingCompleted: completed,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Error updating onboarding status:', error);
        throw new Error(`Failed to update onboarding status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
}); 
