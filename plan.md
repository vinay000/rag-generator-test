# RAG Generator: Production Blueprint, Data Flow & Implementation Plan

## 1. Executive Summary & Objective

Build a self-contained, multi-provider **Retrieval-Augmented Generation (RAG) Generator** that allows users to:
1. Upload arbitrary documents (PDF, TXT, MD) dynamically at runtime to create named collections.
2. Index document chunks into dense vector embeddings using either **OpenAI** or **Google Gemini**.
3. Query collections and receive strictly grounded answers with verifiable source citations (`[1]`, `[2]`), cosine similarity score metrics, and zero-hallucination guarantees.
4. Interact via an intuitive, light-mode React web UI with green accent styling and clear error/mismatch diagnostics.

---

## 2. End-to-End Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               FLOW 1: INGESTION PIPELINE                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘
  User Uploads Files (PDF, TXT, MD) + Collection Name
                         │
                         ▼
  [1. Upload Route]      Multer in-memory upload (10MB limit, mime-type validation)
                         │
                         ▼
  [2. File Parser]       `pdfjs-dist/legacy/build/pdf.mjs` extracts text page-by-page.
                         TXT/MD parsed as UTF-8. Validates text non-emptiness.
                         │
                         ▼
  [3. Chunker]           Sliding-window word splitter (default: 300 words, 50-word overlap).
                         Attaches metadata: { id, filename, page, chunkIndex, text }.
                         │
                         ▼
  [4. Embedder]          Batches chunks (50 at a time) → calls active AI provider:
                         - OpenAI: `text-embedding-3-small` (1536 dims)
                         - Gemini: `text-embedding-004` (768 dims, max 100 per call)
                         - Resilience: `withRetry` (exponential backoff on 429/5xx).
                         │
                         ▼
  [5. Vector Store]      Creates Collection record with metadata:
                         { id, name, provider, model, dimension, chunks, createdAt }
                         │
                         ▼
  Returns: { collectionId: "...", name: "...", chunkCount: 12, dimension: 1536 }

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                FLOW 2: RETRIEVAL & CHAT                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘
  User submits Question + Collection ID
                         │
                         ▼
  [1. Query Route]       Validates collection existence & provider compatibility
                         │
                         ▼
  [2. Mismatch Guard]    Verifies active `EMBEDDING_PROVIDER` matches the collection's
                         original indexed provider & vector dimension.
                         │
                         ▼
  [3. Query Embedder]    Embeds question using active provider (`embedQuery`)
                         │
                         ▼
  [4. Vector Search]     Calculates Cosine Similarity across collection chunk vectors.
                         Ranks and slices Top-K candidates (default: top 4).
                         │
                         ▼
  [5. Threshold Check]   Checks `topScore >= MIN_SIMILARITY` (0.50 default):
                         - Below: Returns `{ found: false, answer: "...", sources: [] }`
                           (Bypasses LLM call to save latency/tokens and stop hallucinations).
                         - Above: Proceeds to prompt construction.
                         │
                         ▼
  [6. Prompt Builder]    Builds strict prompt instructing LLM to answer ONLY from context,
                         cite sources like [1], and state "I don't know" if missing.
                         │
                         ▼
  [7. LLM Chat Service]  Calls active chat model (`gpt-4o-mini` or `gemini-2.5-flash`)
                         wrapped with exponential retry backoff.
                         │
                         ▼
  [8. Citation Filter]   Regex extracts cited chunk indices `\[(\d+)\]` to tag active citations.
                         │
                         ▼
  Returns: { answer, found: true, topScore: 0.82, minScore: 0.50, sources: [...] }
```

---

## 3. Technology Stack & Dependencies

### Backend (`backend/`)
- **Runtime:** Node.js (v18+ with native ES Modules `"type": "module"` and native `fetch`)
- **Server Framework:** `express` ^4.19, `cors` ^2.8
- **Environment Management:** `dotenv` ^16.4
- **File Uploads:** `multer` ^1.4 (configured with `multer.memoryStorage()`)
- **PDF Extraction:** `pdfjs-dist` ^4.0 (imported via `pdfjs-dist/legacy/build/pdf.mjs`)
- **Unique IDs:** `nanoid` ^5.0

### Frontend (`frontend/`)
- **Tooling:** Vite ^5.0, `@vitejs/plugin-react` ^4.2
- **Framework:** React ^18.2, ReactDOM ^18.2
- **Styling:** Custom Vanilla CSS Design System with light mode and green accents

---

## 4. Complete Project Structure

```
rag-generator/
├── backend/
│   ├── src/
│   │   ├── server.js                  # Express app setup, CORS, route mounting, error handling
│   │   ├── config.js                  # Environment parsing with fallback defaults
│   │   │
│   │   ├── ingestion/
│   │   │   ├── parser.js              # PDF (pdfjs-dist), TXT, and MD text extractor
│   │   │   ├── chunker.js             # Sliding-window word chunker with overlap
│   │   │   └── ingest.js              # Coordinator: parse → chunk → embed → store
│   │   │
│   │   ├── retrieval/
│   │   │   ├── retriever.js           # Cosine similarity vector search & top-k ranker
│   │   │   ├── promptBuilder.js       # Grounded citation prompt builder
│   │   │   └── answer.js              # Query orchestrator with threshold & citation filtering
│   │   │
│   │   ├── services/
│   │   │   ├── embedder.js            # Provider-agnostic embedding facade
│   │   │   ├── llm.js                 # Provider-agnostic chat generation facade
│   │   │   ├── vectorStore.js         # In-memory vector store & collection manager
│   │   │   └── providers/             # Concrete provider integrations
│   │   │       ├── openai.js          # OpenAI REST API client (embeddings + chat)
│   │   │       ├── gemini.js          # Google Gemini REST API client (batchEmbed + generate)
│   │   │       └── retry.js           # Exponential backoff retry wrapper (429/5xx)
│   │   │
│   │   ├── routes/
│   │   │   └── collections.js         # REST endpoints for collections & queries
│   │   │
│   │   └── utils/
│   │       └── errors.js              # Custom AppError class & Express error middleware
│   │
│   ├── tests/
│   │   ├── parser.test.js             # PDF text extraction & empty file tests
│   │   ├── chunker.test.js            # Word counts, overlap boundaries, short file tests
│   │   ├── vectorStore.test.js        # Add, search, delete, dimension checks
│   │   └── retriever.test.js          # Top-k ranking & threshold validations
│   │
│   ├── sample-docs/
│   │   ├── tech/rag_handbook.pdf      # Technical evaluation document set
│   │   └── recipes/cookbook.pdf       # Non-technical evaluation document set
│   │
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api.js                     # Centralized API network client (fetch wrapper)
│   │   ├── App.jsx                    # Core application layout, state, and event wiring
│   │   ├── index.css                  # Modern design system (light green accent theme)
│   │   ├── main.jsx                   # React DOM root entry
│   │   └── components/
│   │       ├── Sidebar.jsx            # Collection selector & file drag-and-drop dropzone
│   │       ├── ChatHeader.jsx         # Active collection banner & clear chat action
│   │       ├── ChatInput.jsx          # Query textarea, enter-to-send, disabled states
│   │       ├── MessageItem.jsx        # User/Assistant bubbles with collapsible source cards
│   │       ├── ThinkingIndicator.jsx  # Pulse animation while waiting for response
│   │       └── EmptyState.jsx         # Clean placeholder visuals
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── dev.sh                             # One-command dual backend/frontend runner with trap cleanup
├── .gitignore
└── README.md
```

---

## 5. Configuration & Environment Variables (`.env.example`)

```env
# Server Port
PORT=3000

# Active Providers ("openai" or "gemini")
EMBEDDING_PROVIDER=openai
CHAT_PROVIDER=openai

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Model Names
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini

GEMINI_EMBEDDING_MODEL=text-embedding-004
GEMINI_CHAT_MODEL=gemini-2.5-flash

# Ingestion & Chunking
CHUNK_SIZE=300
CHUNK_OVERLAP=50
EMBEDDING_BATCH_SIZE=50

# Retrieval & Search Thresholds
TOP_K=4
OPENAI_MIN_SIMILARITY=0.50
GEMINI_MIN_SIMILARITY=0.50
```

---

## 6. Detailed Module Specifications

### 6.1. Ingestion Layer
- **`parser.js` (`parseDocument({ buffer, filename })`):**
  - Uses `pdfjs-dist/legacy/build/pdf.mjs` for PDFs; loops over pages 1 to `numPages`, calls `page.getTextContent()`, and aggregates page items into clean text with page indices.
  - Handles `.txt` and `.md` via `buffer.toString('utf-8')`.
  - Throws `AppError("File ... contains no extractable text", 400)` for blank/scanned documents.
- **`chunker.js` (`chunkDocument({ pages, filename, chunkSize, chunkOverlap })`):**
  - Tokenizes by whitespace words (`\s+`).
  - Sliding step = `chunkSize - chunkOverlap`.
  - Attaches `{ id, filename, page, chunkIndex, text, wordCount }`.
- **`ingest.js` (`ingestDocuments({ files, collectionName })`):**
  - Orchestrates parsing all uploaded files, chunking, generating embeddings in batches of 50, and creating the collection in `vectorStore`.

### 6.2. AI Provider Abstraction (`services/providers/`)
- **`retry.js` (`withRetry(fn, providerName, maxRetries=3, baseDelayMs=500)`):**
  - Detects retryable errors (`err.status === 429` or `>= 500`).
  - Implements exponential backoff: `baseDelayMs * 2^(attempt - 1)`.
- **`openai.js`:**
  - `embed(texts)`: POSTs to `https://api.openai.com/v1/embeddings` with `text-embedding-3-small`.
  - `generate(prompt)`: POSTs to `https://api.openai.com/v1/chat/completions` (`gpt-4o-mini`, temperature 0.2).
- **`gemini.js`:**
  - `embed(texts)`: POSTs to `https://generativelanguage.googleapis.com/v1beta/models/{model}:batchEmbedContents` in batches $\le 100$. Extracts vector values.
  - `generate(prompt)`: POSTs to `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` (`gemini-2.5-flash`, temperature 0.2).
- **`embedder.js` & `llm.js`:**
  - Dynamic facades that inspect `config.embeddingProvider` / `config.chatProvider` and route calls seamlessly.

### 6.3. In-Memory Vector Store (`services/vectorStore.js`)
- Stores collections in an in-memory Map: `collections.set(id, { id, name, provider, model, dimension, chunks, createdAt })`.
- **`cosineSimilarity(vecA, vecB)`:**
  $$	ext{sim}(\mathbf{A}, \mathbf{B}) = rac{\sum A_i B_i}{\sqrt{\sum A_i^2} \cdot \sqrt{\sum B_i^2}}$$
- **`search(collectionId, queryVector, { topK, minScore })`:** Computes similarity against all chunks, sorts descending, filters by `minScore`, and returns top-K with `{ ...chunk, score }`.
- **Safety checks:** Prevents inserting or searching vectors with mismatched dimensions.

### 6.4. Retrieval & Grounding (`retrieval/`)
- **`promptBuilder.js` (`buildPrompt(question, chunks)`):**
  - Formats chunks into numbered references:
    ```
    Context information is below:
    ---------------------
    [1] (Source: doc.pdf, Page: 1)
    <chunk text>
    ---------------------
    Given the context above, answer the question: "<question>"
    Rules:
    - Answer ONLY using facts directly mentioned in the context.
    - Cite sources using [1], [2] notation.
    - If the context does not contain the answer, say "I don't know based on the provided documents."
    ```
- **`answer.js` (`generateAnswerForQuery(collectionId, question)`):**
  - Retrieves top candidates.
  - Validates `topScore >= minSimilarity`. If below threshold, short-circuits with `{ found: false, answer: "I couldn't find this in the documents." }`.
  - Calls LLM, parses citations (`/\[(\d+)\]/g`), tags sources as cited/non-cited, and returns formatted response.

### 6.5. REST API Routes (`routes/collections.js`)
- `GET /api/health` → `{ status: "ok" }`
- `GET /api/collections` → `[{ id, name, chunkCount, provider, model, createdAt }]`
- `POST /api/collections` → Multi-file upload (`multipart/form-data`) → Returns new collection
- `POST /api/collections/:id/query` → `{ query: "..." }` → Returns answer + source cards
- `DELETE /api/collections/:id` → Removes collection from memory

### 6.6. Frontend Architecture (`frontend/src/`)
- `api.js`: Clean helper functions `fetchCollections()`, `uploadFiles(files, name)`, `deleteCollection(id)`, `queryCollection(id, query)`.
- `Sidebar.jsx`: Dropzone for drag-and-drop or browsing files, list of active collections with chunk badges and delete buttons.
- `MessageItem.jsx`: Renders assistant responses, markdown text, "not found" badges, and expandable source citation cards (filename, page, excerpt, similarity score).
- `dev.sh`: Dual-process runner script (`npm run dev` in backend and frontend) with POSIX trap cleanup.

---

## 7. Step-by-Step Implementation Sequence (15-20 Min Execution Plan)

| Step | Duration | Target Modules | Verification |
|---|---|---|---|
| **1. Setup & Config** | 2 mins | `package.json`, `.env.example`, `config.js`, `errors.js` | `node src/config.js` loads defaults |
| **2. Parser & Chunker** | 3 mins | `parser.js`, `chunker.js` | Run unit tests on sample PDF/TXT |
| **3. AI Providers & Vector Store** | 4 mins | `retry.js`, `openai.js`, `gemini.js`, `embedder.js`, `vectorStore.js` | Embed test chunk, store & run cosine similarity |
| **4. Retrieval & Ingest** | 3 mins | `ingest.js`, `retriever.js`, `promptBuilder.js`, `llm.js`, `answer.js` | Ingest sample doc & test query answering |
| **5. Express REST API** | 2 mins | `routes/collections.js`, `server.js` | Test `/api/health`, upload POST & query POST |
| **6. Frontend UI** | 4 mins | `api.js`, `Sidebar.jsx`, `MessageItem.jsx`, `App.jsx`, `index.css` | Verify upload, collection switch, chat, citations |
| **7. Verification & Eval** | 2 mins | `dev.sh`, end-to-end benchmark | Run sample queries on Tech & Recipe docsets |
