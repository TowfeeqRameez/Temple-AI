# 🕉️ TempleVerse - Sacred Backend Architecture & API Guide

TempleVerse is now backed by a high-performance **Node.js + Express + SQLite** backend engine, providing persistent devotee accounts, authenticated sessions, SQL temple queries, and secure AI proxying.

---

## 🚀 Quick Start

To launch the TempleVerse full-stack application (both Backend API and Frontend UI):

```bash
cd "prototype 4"
npm start
```

Or directly with Node:

```bash
node server.js
```

The application will be live at:
- **Web App & Map UI**: [http://localhost:5001](http://localhost:5001)
- **API Health & Stats**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 💾 Architecture Overview

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Server Framework** | **Express 5** | RESTful routing, CORS, JSON body-parser, static asset streaming. |
| **Database** | **SQLite (`better-sqlite3`)** | High-concurrency WAL mode (`templeverse.db`). Zero external installation needed. |
| **Authentication** | **JWT + bcryptjs** | SHA-256 salted bcrypt hashing, 7-day signed JSON Web Tokens. |
| **Media & Audio** | **Static Express Streaming** | Gayatri Mantram MP3, temple artwork, SVGs streamed directly. |
| **AI Integration** | **Groq & Gemini Proxy** | Server-side endpoints to keep API keys secure. |

---

## 📡 REST API Reference

### 1. Devotee Authentication (`/api/auth`)
- **`POST /api/auth/signup`**: Register a new devotee account.
  - Body: `{ "name": "...", "email": "...", "password": "...", "state": "..." }`
  - Returns: `{ "success": true, "token": "...", "user": { ... } }`
- **`POST /api/auth/signin`**: Authenticate devotee.
  - Body: `{ "email": "...", "password": "..." }`
  - Returns: `{ "success": true, "token": "...", "user": { ... } }`
- **`GET /api/auth/me`**: Get logged-in devotee profile and live statistics (saved temples, offered prayers).
  - Header: `Authorization: Bearer <TOKEN>`
- **`PUT /api/auth/profile`**: Update devotee name, state, or avatar.
  - Header: `Authorization: Bearer <TOKEN>`

### 2. Sacred Temples & Circuits (`/api/temples`)
- **`GET /api/temples`**: List all shrines with optional search & filters.
  - Query parameters: `?state=IN-TN`, `?deity=Shiva`, `?circuit=jyotirlinga`, `?q=Venkateswara`, `?limit=50&offset=0`
- **`GET /api/temples/summary`**: Returns temple distribution across Indian states.
- **`GET /api/temples/circuits/:circuitKey`**: Retrieve curated pilgrimage circuit shrines:
  - `/api/temples/circuits/jyotirlinga` (12 Holy Jyotirlingas)
  - `/api/temples/circuits/chardham` (4 Himalayan Char Dham Shrines: Yamunotri, Gangotri, Badrinath, Kedarnath)
  - `/api/temples/circuits/panchabhoota` (5 Shiva Elemental Temples)
  - `/api/temples/circuits/visa` (Wish Fulfillment Temples)
- **`GET /api/temples/:id`**: Single shrine complete dossier.

### 3. Devotee Prayers & Favorites (`/api/devotee`)
*(All require `Authorization: Bearer <TOKEN>` header)*
- **`GET /api/devotee/favorites`**: Devotee's saved bookmarks.
- **`POST /api/devotee/favorites`**: Add shrine to favorites.
  - Body: `{ "templeId": "...", "templeName": "...", "stateId": "..." }`
- **`DELETE /api/devotee/favorites/:templeId`**: Remove shrine from favorites.
- **`GET /api/devotee/prarthana`**: Devotee's submitted prayer vows (Mannat).
- **`POST /api/devotee/prarthana`**: Submit a new prayer intention.
  - Body: `{ "templeId": "...", "templeName": "...", "prayerText": "...", "vowCategory": "..." }`

### 4. AI & Voice Proxy (`/api/ai`)
- **`GET /api/ai/status`**: Health check for Gemini and Groq AI providers.
- **`POST /api/ai/chat`**: Server-side proxy for TempleVerse AI.
- **`POST /api/ai/voice-transcribe`**: Voice command speech-to-text via Groq Whisper (`whisper-large-v3-turbo`).

---

## 🪔 Default Sample Account

You can immediately test sign-in with:
- **Email**: `pilgrim@templeverse.com`
- **Password**: `temple108`
