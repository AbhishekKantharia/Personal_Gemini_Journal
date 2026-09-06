import { useState, useEffect } from 'react';
import { getStats, getMoodAnalysis } from '../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const MOOD_COLORS = {
  happy: '#22c55e',
  excited: '#f59e0b',
  grateful: '#8b5cf6',
  hopeful: '#06b6d4',
  calm: '#6366f1',
  reflective: '#64748b',
  anxious: '#f97316',
  frustrated: '#ef4444',
  sad: '#3b82f6',
  neutral: '#94a3b8',
};

export default function MoodDashboard() {
  const [stats, setStats] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const result = await getStats();
      setStats(result.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const result = await getMoodAnalysis();
      setAnalysis(result.analysis);
    } catch (err) {
      console.error('Failed to analyze:', err);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const moodData = stats?.moodCounts
    ? Object.entries(stats.moodCounts).map(([mood, count]) => ({ name: mood, value: count }))
    : [];

  const timelineData = stats?.moodTimeline
    ? stats.moodTimeline.map((e) => ({
        date: format(new Date(e.date), 'MMM d'),
        moodScore: moodToScore(e.mood),
        mood: e.mood,
      }))
    : [];

  return (
    <div className="mood-page">
      <div className="page-header">
        <h1>Mood Insights</h1>
        <p className="page-subtitle">Track your emotional patterns over time</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalEntries || 0}</div>
          <div className="stat-label">Total Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Object.keys(stats?.moodCounts || {}).length}</div>
          <div className="stat-label">Unique Moods</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats?.firstEntryAt
              ? format(new Date(stats.firstEntryAt), 'MMM d')
              : '—'}
          </div>
          <div className="stat-label">First Entry</div>
        </div>
      </div>

      {moodData.length > 0 ? (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Mood Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={moodData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {moodData.map((entry) => (
                    <Cell key={entry.name} fill={MOOD_COLORS[entry.name] || '#888'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {timelineData.length > 1 && (
            <div className="chart-card">
              <h3>Mood Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} tick={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="chart-tooltip">
                          <strong>{d.date}</strong>
                          <p>{d.mood}</p>
                        </div>
                      );
                    }}
                  />
                  <Line type="monotone" dataKey="moodScore" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <p>Start journaling to see your mood patterns here!</p>
        </div>
      )}

      <div className="analysis-section">
        <h3>AI Mood Analysis</h3>
        <button onClick={handleAnalyze} disabled={analyzing} className="btn-secondary">
          {analyzing ? 'Analyzing...' : 'Get AI Insights'}
        </button>
        {analysis && (
          <div className="analysis-card">
            <p>{analysis}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function moodToScore(mood) {
  const scores = {
    excited: 9, happy: 8, grateful: 8, hopeful: 7, calm: 6,
    reflective: 5, neutral: 5, anxious: 3, frustrated: 2, sad: 1,
  };
  return scores[mood] || 5;
}
