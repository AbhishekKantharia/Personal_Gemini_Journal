import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendMessage, saveJournal } from '../utils/api';

const MOOD_EMOJI = {
  happy: '😊',
  excited: '🎉',
  grateful: '🙏',
  hopeful: '🌟',
  calm: '😌',
  reflective: '🤔',
  anxious: '😰',
  frustrated: '😤',
  sad: '😢',
  neutral: '😐',
};

export default function ChatInterface({ existingJournalId, existingMessages, onSave }) {
  const [messages, setMessages] = useState(existingMessages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState(null);
  const [journalId, setJournalId] = useState(existingJournalId || null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const result = await sendMessage(newMessages, journalId);
      const assistantMsg = { role: 'assistant', content: result.response };
      setMessages([...newMessages, assistantMsg]);
      if (result.mood) setCurrentMood(result.mood);
    } catch (err) {
      const errorMsg = { role: 'assistant', content: `Error: ${err.message}` };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (messages.length < 2 || saving) return;
    setSaving(true);
    try {
      const entryTitle = title.trim() || generateTitle(messages);
      const result = await saveJournal({
        title: entryTitle,
        messages,
        mood: currentMood,
      });
      setJournalId(result.journalId);
      if (onSave) onSave(result.journalId);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <h2>What's on your mind?</h2>
            <p>Start journaling, brainstorming, or just talk things through. I'm here to listen and help you reflect.</p>
            <div className="suggestions">
              {['Today I\'m feeling grateful for...', 'I need to brainstorm ideas for...', 'Let me reflect on this week...'].map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '🧑' : '✨'}
            </div>
            <div className="message-content">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">✨</div>
            <div className="message-content typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        {currentMood && (
          <div className="mood-indicator">
            Detected mood: {MOOD_EMOJI[currentMood] || '🔍'} {currentMood}
          </div>
        )}
        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write your thoughts..."
            disabled={loading}
            maxLength={5000}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-send">
            {loading ? '...' : '→'}
          </button>
        </form>
        {messages.length >= 2 && (
          <div className="save-section">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title (optional)"
              className="title-input"
            />
            <button onClick={handleSave} disabled={saving} className="btn-save">
              {saving ? 'Saving...' : journalId ? 'Update Entry' : 'Save Journal Entry'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function generateTitle(messages) {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'Untitled Entry';
  const words = firstUser.content.split(' ').slice(0, 8).join(' ');
  return words.length > 50 ? words.slice(0, 50) + '...' : words;
}
