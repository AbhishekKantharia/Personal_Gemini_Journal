import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

const JOURNAL_SYSTEM_PROMPT = `You are a thoughtful, empathetic journal companion powered by Gemini. Your role:

1. HELP USERS REFLECT: Ask insightful follow-up questions, help them explore their thoughts deeper.
2. BE EMPOWERING: Encourage positive self-reflection without being preachy.
3. REMEMBER CONTEXT: Reference earlier parts of the conversation naturally.
4. BE CONCISE: Keep responses focused and warm — typically 2-4 paragraphs max.
5. DETECT MOOD: When a user seems done sharing, briefly note the dominant mood of their entry (e.g., "grateful", "anxious", "excited", "reflective", "frustrated", "hopeful", "calm").

IMPORTANT: At the very end of your response, if you detect a mood, add a single line:
MOOD: <mood_label>

This helps with mood tracking. Only include it when the mood is clear from the conversation.`;

export function initGemini(apiKey) {
  if (!apiKey) {
    console.warn('[Gemini] No API key provided, running in demo mode');
    return;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: JOURNAL_SYSTEM_PROMPT,
  });
  console.log('[Gemini] AI model initialized');
}

export function getModel() {
  return model;
}

export async function chat(messages) {
  if (!model) {
    return {
      response: 'Demo mode: Gemini API is not configured. Please set up your GEMINI_API_KEY in the server environment or Google Cloud Secret Manager.',
      mood: null,
    };
  }

  const chatSession = model.startChat({
    history: messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chatSession.sendMessage(lastMessage.content);
  const text = result.response.text();

  let mood = null;
  const moodMatch = text.match(/\nMOOD:\s*(.+)$/i);
  if (moodMatch) {
    mood = moodMatch[1].trim().toLowerCase();
  }

  const cleanText = text.replace(/\nMOOD:\s*.+$/i, '').trim();

  return { response: cleanText, mood };
}

export async function summarizeConversation(messages) {
  if (!model) {
    return 'Demo mode: Summarization not available.';
  }

  const conversation = messages
    .map((m) => `${m.role === 'user' ? 'You' : 'Journal Companion'}: ${m.content}`)
    .join('\n\n');

  const result = await model.generateContent(
    `Summarize this journal conversation in 2-3 concise sentences, capturing the key themes and emotional arc:\n\n${conversation}`
  );

  return result.response.text().trim();
}

export async function analyzeMood(journalEntries) {
  if (!model) {
    return null;
  }

  const entriesText = journalEntries
    .map((e) => `Date: ${e.date}\nMood: ${e.mood || 'unknown'}\nSnippet: ${(e.summary || e.content || '').slice(0, 200)}`)
    .join('\n---\n');

  const result = await model.generateContent(
    `Analyze these journal entries for emotional patterns, trends, and insights. Be concise and actionable:\n\n${entriesText}`
  );

  return result.response.text().trim();
}
