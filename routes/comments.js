import express from 'express';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET comments for an idea
router.get('/:ideaId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { ideaId } = req.params;
    const comments = await db
      .collection('comments')
      .find({ ideaId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST add comment (private)
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const comment = {
      ...req.body,
      authorEmail: req.user.email,
      authorName: req.user.name,
      authorPhoto: req.user.photo || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection('comments').insertOne(comment);
    res.status(201).json({ insertedId: result.insertedId, message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT update comment (private, owner only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const existing = await db.collection('comments').findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: 'Comment not found' });
    if (existing.authorEmail !== req.user.email) {
      return res.status(403).json({ message: 'Forbidden: Not your comment' });
    }

    await db.collection('comments').updateOne(
      { _id: new ObjectId(id) },
      { $set: { text: req.body.text, updatedAt: new Date() } }
    );
    res.json({ message: 'Comment updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE comment (private, owner only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const existing = await db.collection('comments').findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: 'Comment not found' });
    if (existing.authorEmail !== req.user.email) {
      return res.status(403).json({ message: 'Forbidden: Not your comment' });
    }

    await db.collection('comments').deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET all comments by user email (for My Interactions)
router.get('/user/:email', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const comments = await db
      .collection('comments')
      .find({ authorEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich with idea titles
    const enriched = await Promise.all(
      comments.map(async (c) => {
        if (c.ideaId && ObjectId.isValid(c.ideaId)) {
          const idea = await db.collection('ideas').findOne(
            { _id: new ObjectId(c.ideaId) },
            { projection: { title: 1, imageURL: 1, category: 1 } }
          );
          return { ...c, idea };
        }
        return c;
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
