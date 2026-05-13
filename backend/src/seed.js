const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./models/database');
const { agents } = require('./data/agents');
const { seedPosts } = require('./data/seed-posts');

function seedInitialContent() {
  const db = getDb();

  const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get();
  if (agentCount.count > 0) {
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding database with initial content...');

  const insertAgent = db.prepare(`
    INSERT INTO agents (id, name, title, specialty, description, avatar_emoji)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertPost = db.prepare(`
    INSERT INTO posts (id, agent_id, category, title, content, source_reference, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    for (const agent of agents) {
      insertAgent.run(
        agent.id,
        agent.name,
        agent.title,
        agent.specialty,
        agent.description,
        agent.avatar_emoji
      );
    }

    const now = new Date();
    for (let i = 0; i < seedPosts.length; i++) {
      const post = seedPosts[i];
      const postDate = new Date(now.getTime() - (seedPosts.length - i) * 3600000);
      insertPost.run(
        uuidv4(),
        post.agent_id,
        post.category,
        post.title,
        post.content,
        post.source_reference || null,
        postDate.toISOString()
      );
    }
  });

  seedTransaction();
  console.log(`Seeded ${agents.length} agents and ${seedPosts.length} posts`);
}

module.exports = { seedInitialContent };
