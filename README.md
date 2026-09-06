# Personal Gemini Journal

An authenticated, production-grade journal app powered by Google Gemini — where users sign in, brainstorm or journal with AI, and have conversations automatically summarized and saved. Includes an **AI Mood Analytics** dashboard for emotional pattern tracking.

## Architecture

```
client/              React + Vite frontend
server/              Express API backend (Gemini proxy)
  src/
    auth.js          Firebase token verification middleware
    firebase.js      Firebase Admin SDK init
    firestore.js     Per-user isolated data access layer
    gemini.js        Gemini API integration + summarization
    routes.js        REST API endpoints
    secrets.js       Secret Manager abstraction layer
```

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Authentication** | Firebase Auth with Google OAuth — every request requires a valid ID token |
| **Data Isolation** | Firestore subcollections: `users/{uid}/journals/{id}` — zero cross-user leakage |
| **Secret Management** | Google Cloud Secret Manager abstraction (falls back to env vars in dev) |
| **API Key Protection** | Gemini API key never leaves the server; all AI calls proxied through backend |
| **Rate Limiting** | Express rate limiter: 60 req/min global, 20 req/min for chat |
| **Security Headers** | Helmet.js for CSP, HSTS, and other security headers |
| **Input Validation** | Message length limits, role verification, sanitized inputs |
| **Token Refresh** | Client auto-refreshes Firebase tokens every 10 minutes |

## Core Requirements Met

- ✅ **User Authentication** — Firebase Auth with Google sign-in
- ✅ **Multi-turn AI Interaction** — Real Gemini API conversations with context preservation
- ✅ **Isolated Data Storage** — Cloud Firestore with per-user subcollection structure
- ✅ **Secure Key Management** — Secret Manager abstraction (production-ready)

## Original Feature Enhancement

### AI Mood Analytics Dashboard
- Automatic mood detection from journal conversations (via Gemini system prompt)
- Mood distribution pie chart and timeline visualization
- AI-powered mood analysis: get insights on emotional patterns over time
- Mood scoring and trend identification

## Setup

### Prerequisites

- Node.js 18+
- Firebase project with Google Auth enabled
- Google AI Studio API key (Gemini)
- (Optional) Google Cloud project for Secret Manager

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Sign-in method → Google
4. Enable **Cloud Firestore**
5. Create a web app and copy the config values
6. Generate a service account key (Project Settings → Service Accounts → Generate New Private Key)

### 2. Environment Configuration

**Server** (`server/.env`):
```bash
cp server/.env.example server/.env
# Fill in Firebase credentials and Gemini API key
```

**Client** (`client/.env`):
```bash
cp client/.env.example client/.env
# Fill in Firebase client config
```

### 3. Install & Run

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start server (port 3001)
cd server && npm run dev

# Start client (port 5173) — in a new terminal
cd client && npm run dev
```

### 4. Google Cloud Secret Manager (Production)

For production, store the Gemini API key in Secret Manager:

```bash
echo -n "YOUR_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
```

The server will automatically try Secret Manager first, falling back to environment variables.

## API Endpoints

All endpoints require `Authorization: Bearer <firebase-id-token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message, get Gemini response |
| POST | `/api/journal` | Save journal entry with auto-summary |
| GET | `/api/journals` | List all user's journal entries |
| GET | `/api/journal/:id` | Get single journal with messages |
| DELETE | `/api/journal/:id` | Delete a journal entry |
| GET | `/api/stats` | Get mood stats and counts |
| POST | `/api/mood-analysis` | Get AI-powered mood insights |

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Recharts, React Markdown
- **Backend:** Node.js, Express, Helmet, Rate Limiting
- **Auth:** Firebase Authentication (Google OAuth)
- **Database:** Cloud Firestore (per-user subcollections)
- **AI:** Google Gemini 2.0 Flash
- **Security:** Secret Manager, Firebase Admin SDK token verification
