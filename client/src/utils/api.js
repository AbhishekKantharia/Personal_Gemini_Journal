const API_URL = import.meta.env.VITE_API_URL || '';

async function apiRequest(path, options = {}) {
  const token = window.__authToken;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function setAuthToken(token) {
  window.__authToken = token;
}

export function sendMessage(messages, journalId) {
  return apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, journalId }),
  });
}

export function saveJournal({ title, messages, summary, mood }) {
  return apiRequest('/journal', {
    method: 'POST',
    body: JSON.stringify({ title, messages, summary, mood }),
  });
}

export function listJournals() {
  return apiRequest('/journals');
}

export function getJournal(id) {
  return apiRequest(`/journal/${id}`);
}

export function deleteJournal(id) {
  return apiRequest(`/journal/${id}`, { method: 'DELETE' });
}

export function getStats() {
  return apiRequest('/stats');
}

export function getMoodAnalysis() {
  return apiRequest('/mood-analysis', { method: 'POST' });
}
