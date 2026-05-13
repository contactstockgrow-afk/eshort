const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { initDatabase } = require('./models/database');
const { seedInitialContent } = require('./seed');
const { startContentScheduler } = require('./services/scheduler');
const postsRouter = require('./routes/posts');
const agentsRouter = require('./routes/agents');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/posts', postsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/chat', chatRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Darul Uloom GPT', version: '1.0.0' });
});

// Serve frontend static files in production
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

async function start() {
  initDatabase();
  seedInitialContent();

  if (process.env.GROQ_API_KEY) {
    startContentScheduler();
    console.log('AI content scheduler started');
  } else {
    console.log('No GROQ_API_KEY set - running with seeded content only');
  }

  app.listen(PORT, () => {
    console.log(`دارالعلوم جی پی ٹی backend running on port ${PORT}`);
  });
}

start().catch(console.error);
