# vosh_chatbot

# Voosh RAG Backend + Frontend

A **Retrieval-Augmented Generation (RAG) chatbot** project using **Qdrant**, **Redis**, and **Generative AI** (Google Gemini API). This project stores context in Redis, searches relevant knowledge from Qdrant, and generates responses using an LLM.

---

## Folder Structure

voosh-rag-backend/
├─ src/
│ ├─ server.js # Express server entry point
│ ├─ routes/
│ │ └─ chat.js # Chat API routes
│ ├─ services/
│ │ ├─ redisClient.js # Redis connection
│ │ ├─ qdrantClient.js# Qdrant connection
│ │ └─ embeddings.js # Fake/embed API (Gemini/OpenAI/etc.)
│ └─ ingestData.js # Script to load news into Qdrant
├─ frontend/ # Frontend HTML/CSS/JS
│ ├─ index.html
│ ├─ style.css
│ └─ script.js
├─ package.json
└─ .env # Environment variables

yaml
Copy code

---

## Features

- Chat interface with **context-aware responses**.
- **Redis** to store session history.
- **Qdrant** for vector search of news/articles.
- **Generative AI** integration (Gemini/OpenAI) for response generation.
- Supports **file uploads** (DOCX, PDF, images) and voice input.
- Multi-image paste support in chat.

---

## Prerequisites

- Node.js >= 20
- Redis server (cloud or local)
- Qdrant instance (cloud or local)
- Google API key for Gemini (optional if using embeddings locally)
- npm or yarn

---

## Installation

1. **Clone the repo**

```bash
git clone <repo_url>
cd voosh-rag-backend
Install dependencies

bash
Copy code
npm install
Set up environment variables

Create a .env file:

env
Copy code
GOOGLE_API_KEY=your_gemini_api_key
REDIS_URL=redis://default:<password>@<host>:<port>
QDRANT_URL=https://<your-qdrant-instance>:6333
QDRANT_API_KEY=<your-qdrant-api-key>
Setup Qdrant Collection
If starting fresh, run ingestData.js to create a "news" collection and populate it:

bash
Copy code
node src/ingestData.js
This will:

Create "news" collection in Qdrant (dimension 768)

Insert initial dummy/news data

Ensure /query/:sessionId works without errors

Running the Backend
bash
Copy code
node src/server.js
Backend will run at:

arduino
Copy code
http://localhost:4000
Endpoints:

GET / → Health check

POST /chat/query/:sessionId → Send message

GET /chat/history/:sessionId → Get chat history

Running the Frontend
Open frontend/index.html in browser or use a simple HTTP server:

bash
Copy code
npx serve frontend
Frontend communicates with backend at http://localhost:4000.

Using the Chat
Type messages in the chat input and press Enter or click Send.

Supports:

File uploads (DOCX, PDF, images)

Multi-image paste

Voice input (if browser supports Web Speech API)

Chat history is stored in Redis for each session.

Project Notes
Qdrant search requires the collection to exist. Use ingestData.js to ensure "news" collection is present.

Placeholder embeddings (Array(768).fill(0.5)) are used if real embeddings are not available.

Modify embeddings.js to integrate OpenAI or Gemini embeddings.

License
MIT License © 2025

yaml
Copy code

---

If you want, I can also **write a `ingestData.js` template** that will **create the collection, insert dummy news, and fix the Qdrant `shard_key` error** so the backend works immediately.  

Do you want me to do that next?
