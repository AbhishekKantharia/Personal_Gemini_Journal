import { Router } from 'express';
import { chat, summarizeConversation, analyzeMood } from './gemini.js';
import {
  ensureUser,
  createJournalEntry,
  updateJournalEntry,
  listJournalEntries,
  getJournalEntry,
  deleteJournalEntry,
  getUserStats,
} from './firestore.js';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages, journalId } = req.body;
    const userId = req.user.uid;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user' });
    }

    if (lastMsg.content.length > 5000) {
      return res.status(400).json({ error: 'Message too long (max 5000 chars)' });
    }

    await ensureUser(userId, req.user.name, req.user.email);

    const result = await chat(messages);

    if (journalId) {
      const journal = await getJournalEntry(userId, journalId);
      if (journal) {
        const updatedMessages = [...(journal.messages || []), ...messages.slice(-2)];
        const updates = { messages: updatedMessages };
        if (result.mood) updates.mood = result.mood;
        await updateJournalEntry(userId, journalId, updates);
      }
    }

    res.json({
      response: result.response,
      mood: result.mood,
    });
  } catch (err) {
    console.error('[Chat] Error:', err.message);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

router.post('/journal', async (req, res) => {
  try {
    const { title, messages, summary, mood } = req.body;
    const userId = req.user.uid;

    await ensureUser(userId, req.user.name, req.user.email);

    let finalSummary = summary;
    if (!finalSummary && messages && messages.length > 0) {
      finalSummary = await summarizeConversation(messages);
    }

    const journalId = await createJournalEntry(userId, title, finalSummary, mood, messages);
    res.json({ journalId, summary: finalSummary });
  } catch (err) {
    console.error('[Journal] Create error:', err.message);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

router.get('/journals', async (req, res) => {
  try {
    const userId = req.user.uid;
    const entries = await listJournalEntries(userId);
    res.json({ entries });
  } catch (err) {
    console.error('[Journal] List error:', err.message);
    res.status(500).json({ error: 'Failed to list journals' });
  }
});

router.get('/journal/:id', async (req, res) => {
  try {
    const userId = req.user.uid;
    const entry = await getJournalEntry(userId, req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json({ entry });
  } catch (err) {
    console.error('[Journal] Get error:', err.message);
    res.status(500).json({ error: 'Failed to get journal entry' });
  }
});

router.delete('/journal/:id', async (req, res) => {
  try {
    const userId = req.user.uid;
    await deleteJournalEntry(userId, req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    console.error('[Journal] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.uid;
    const stats = await getUserStats(userId);
    res.json({ stats });
  } catch (err) {
    console.error('[Stats] Error:', err.message);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.post('/mood-analysis', async (req, res) => {
  try {
    const userId = req.user.uid;
    const entries = await listJournalEntries(userId, 30);
    const analysis = await analyzeMood(entries);
    res.json({ analysis });
  } catch (err) {
    console.error('[MoodAnalysis] Error:', err.message);
    res.status(500).json({ error: 'Failed to analyze mood' });
  }
});

export default router;
