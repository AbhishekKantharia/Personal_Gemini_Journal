import { getDb } from './firebase.js';

const COLLECTIONS = {
  users: 'users',
  journals: 'journals',
  sessions: 'sessions',
};

export function getUserDoc(userId) {
  const db = getDb();
  if (!db) return null;
  return db.collection(COLLECTIONS.users).doc(userId);
}

export function getJournalsCollection(userId) {
  const db = getDb();
  if (!db) return null;
  return db.collection(COLLECTIONS.users).doc(userId).collection(COLLECTIONS.journals);
}

export function getSessionsCollection(userId, journalId) {
  const db = getDb();
  if (!db) return null;
  return db
    .collection(COLLECTIONS.users)
    .doc(userId)
    .collection(COLLECTIONS.journals)
    .doc(journalId)
    .collection(COLLECTIONS.sessions);
}

export async function ensureUser(userId, displayName, email, photoURL) {
  const userDoc = getUserDoc(userId);
  if (!userDoc) return null;

  const existing = await userDoc.get();
  if (!existing.exists) {
    await userDoc.set({
      displayName: displayName || 'Anonymous',
      email: email || '',
      photoURL: photoURL || '',
      createdAt: new Date().toISOString(),
      entryCount: 0,
    });
  }

  return userId;
}

export async function createJournalEntry(userId, title, summary, mood, messages) {
  const col = getJournalsCollection(userId);
  if (!col) return null;

  const docRef = await col.add({
    title: title || 'Untitled Entry',
    summary: summary || '',
    mood: mood || null,
    messages: messages || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const userDoc = getUserDoc(userId);
  if (userDoc) {
    const snap = await userDoc.get();
    if (snap.exists) {
      await userDoc.update({
        entryCount: (snap.data().entryCount || 0) + 1,
        lastEntryAt: new Date().toISOString(),
      });
    }
  }

  return docRef.id;
}

export async function updateJournalEntry(userId, journalId, updates) {
  const col = getJournalsCollection(userId);
  if (!col) return null;

  await col.doc(journalId).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  return journalId;
}

export async function listJournalEntries(userId, limit = 50) {
  const col = getJournalsCollection(userId);
  if (!col) return [];

  const snapshot = await col.orderBy('createdAt', 'desc').limit(limit).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getJournalEntry(userId, journalId) {
  const col = getJournalsCollection(userId);
  if (!col) return null;

  const doc = await col.doc(journalId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function deleteJournalEntry(userId, journalId) {
  const col = getJournalsCollection(userId);
  if (!col) return null;

  await col.doc(journalId).delete();
  return journalId;
}

export async function getUserStats(userId) {
  const entries = await listJournalEntries(userId, 100);

  const moodCounts = {};
  entries.forEach((e) => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
  });

  const moodTimeline = entries
    .filter((e) => e.mood)
    .map((e) => ({
      date: e.createdAt,
      mood: e.mood,
    }))
    .reverse();

  return {
    totalEntries: entries.length,
    moodCounts,
    moodTimeline,
    firstEntryAt: entries.length > 0 ? entries[entries.length - 1].createdAt : null,
    lastEntryAt: entries.length > 0 ? entries[0].createdAt : null,
  };
}
