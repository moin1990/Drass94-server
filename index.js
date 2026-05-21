import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

import ideasRouter from './routes/ideas.js';
import commentsRouter from './routes/comments.js';
import usersRouter from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL || 'https://ideavault.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('ideavault');
    app.locals.db = db;

    // Create indexes
    await db.collection('ideas').createIndex({ title: 'text' });
    await db.collection('ideas').createIndex({ category: 1 });
    await db.collection('ideas').createIndex({ authorEmail: 1 });
    await db.collection('comments').createIndex({ ideaId: 1 });
    await db.collection('comments').createIndex({ authorEmail: 1 });

    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 IdeaVault server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

connectDB();

// Routes
app.get('/', (req, res) => res.json({ message: 'IdeaVault API is running 🚀' }));
app.use('/api/ideas', ideasRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/users', usersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});
