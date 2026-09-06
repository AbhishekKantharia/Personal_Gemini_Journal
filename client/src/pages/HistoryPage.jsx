import { useState, useEffect } from 'react';
import { listJournals, getJournal, deleteJournal } from '../utils/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const MOOD_EMOJI = {
  happy: '😊', excited: '🎉', grateful: '🙏', hopeful: '🌟',
  calm: '😌', reflective: '🤔', anxious: '😰', frustrated: '😤',
  sad: '😢', neutral: '😐',
};

export default function HistoryPage() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadJournals();
  }, []);

  async function loadJournals() {
    try {
      const result = await listJournals();
      setJournals(result.entries);
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    try {
      const { entry } = await getJournal(id);
      setExpandedId(id);
      setExpandedData(entry);
    } catch (err) {
      console.error('Failed to load entry:', err);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await deleteJournal(id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="history-page">
      <div className="page-header">
        <h1>Journal History</h1>
        <button onClick={() => navigate('/')} className="btn-primary">New Entry</button>
      </div>

      {journals.length === 0 ? (
        <div className="empty-state">
          <p>No journal entries yet. Start your first one!</p>
          <button onClick={() => navigate('/')} className="btn-primary">Start Journaling</button>
        </div>
      ) : (
        <div className="journal-list">
          {journals.map((journal) => (
            <div key={journal.id} className="journal-card" onClick={() => handleExpand(journal.id)}>
              <div className="journal-card-header">
                <div>
                  <h3 className="journal-title">{journal.title}</h3>
                  <span className="journal-date">
                    {format(new Date(journal.createdAt), 'MMM d, yyyy · h:mm a')}
                  </span>
                </div>
                <div className="journal-meta">
                  {journal.mood && (
                    <span className="journal-mood">
                      {MOOD_EMOJI[journal.mood] || '🔍'} {journal.mood}
                    </span>
                  )}
                  <button
                    className="btn-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(journal.id); }}
                    title="Delete entry"
                  >×</button>
                </div>
              </div>
              {journal.summary && (
                <p className="journal-summary">{journal.summary}</p>
              )}
              {expandedId === journal.id && expandedData && (
                <div className="journal-expanded">
                  {expandedData.messages?.map((msg, i) => (
                    <div key={i} className={`history-message ${msg.role}`}>
                      <strong>{msg.role === 'user' ? 'You' : 'AI Companion'}</strong>
                      <p>{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
