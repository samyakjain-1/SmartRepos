import { Module, ObjectId, Store, schema } from 'modelence/server';

const savedRepos = new Store('savedRepos', {
  schema: {
    userId: schema.userId(),
    owner: schema.string(),
    name: schema.string(),
    createdAt: schema.date()
  },
  indexes: [
    { key: { userId: 1, owner: 1, name: 1 }, unique: true }
  ]
});

export default new Module('savedRepos', {
  stores: [savedRepos],
  queries: {
    async getUserSavedRepos(_, { user }) {
      if (!user) throw new Error('Unauthorized');

      return savedRepos.fetch(
        { userId: new ObjectId(user.id) },
        { sort: { createdAt: -1 } }
      );
    }
  },
  mutations: {
    async saveRepo(args, { user }) {
      if (!user) throw new Error('Unauthorized');

      const { owner, name } = args as { owner: string; name: string };

      await savedRepos.insertOne({
        userId: new ObjectId(user.id),
        owner,
        name,
        createdAt: new Date()
      });

      return { success: true };
    },
    async unsaveRepo(args, { user }) {
      if (!user) throw new Error('Unauthorized');

      const { owner, name } = args as { owner: string; name: string };

      await savedRepos.deleteOne({
        userId: new ObjectId(user.id),
        owner,
        name
      });

      return { success: true };
    }
  }
});