# Echo - Call Agent Training & Analytics Platform

## Technical Documentation

### Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Systems](#core-systems)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Environment Configuration](#environment-configuration)
8. [Installation & Setup](#installation--setup)
9. [Development Guide](#development-guide)
10. [Deployment](#deployment)

---

## Overview

**Echo** is an AI-powered platform designed to accelerate the training and performance evaluation of customer support call agents. The system provides three integrated solutions:

1. **Chat-Based Training Agent** - Interactive training with AI-powered feedback
2. **Live Call Agent** - Real-time conversational AI using Gemini Live API
3. **Audio Sentiment Analytics** - Comprehensive call performance analysis

### Key Features
- Multi-session training curriculum management
- RAG (Retrieval-Augmented Generation) powered Q&A system
- Real-time multilingual voice conversations (English, Sinhala, Tamil)
- Advanced behavioral metrics and sentiment analysis
- CSV-based knowledge base management

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│                     (Next.js 16 + React 19)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Admin         │  │Trainer       │  │Call Agent            │  │
│  │Dashboard     │  │Dashboard     │  │Interface             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Training      │  │Assessment    │  │Analytics             │  │
│  │Upload API    │  │API           │  │API                   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│    AI/ML Services Layer      │  │   Database Layer             │
│  ┌────────────────────────┐  │  │                              │
│  │ Hugging Face           │  │  │  Supabase PostgreSQL         │
│  │ - Embeddings (384D)    │  │  │  - pgvector extension        │
│  │ - MiniLM-L6-v2         │  │  │  - IVFFlat indexing          │
│  └────────────────────────┘  │  │  - RLS policies              │
│  ┌────────────────────────┐  │  └──────────────────────────────┘
│  │ Google Gemini AI       │  │
│  │ - Live API (Voice)     │  │  ┌──────────────────────────────┐
│  │ - 2.0 Flash (Text)     │  │  │  External Services           │
│  └────────────────────────┘  │  │                              │
│  ┌────────────────────────┐  │  │  AssemblyAI                  │
│  │ OpenRouter             │  │  │  - Transcription             │
│  │ - LLM for Analytics    │  │  │  - Speaker Diarization       │
│  └────────────────────────┘  │  │  - Sentiment Analysis        │
└──────────────────────────────┘  └──────────────────────────────┘
```

### Data Flow Diagrams

#### 1. Training Document Upload Flow
```
Admin → Upload CSV → API validates → Parse CSV rows
                                    ↓
                        Generate embeddings (HuggingFace)
                                    ↓
                        Store in Supabase (training_documents + training_chunks)
                                    ↓
                        Return success with chunk count
```

#### 2. Assessment Flow
```
Trainer → Start Assessment → Generate questions from knowledge base
                                    ↓
                        User answers → Retrieve relevant context (Vector search)
                                    ↓
                        LLM evaluates answer → Provide feedback
                                    ↓
                        Repeat for all questions → Generate final assessment
```

#### 3. Live Call Agent Flow
```
User → Connect to Gemini Live → WebRTC audio stream
                                    ↓
                        Real-time transcription (bidirectional)
                                    ↓
                        AI responds with knowledge base context
                                    ↓
                        End conversation → Generate summary
```

#### 4. Audio Analytics Flow
```
Admin → Upload audio file → AssemblyAI transcription
                                    ↓
                        Speaker diarization + sentiment analysis
                                    ↓
                        Calculate metrics (WPM, talk ratio, fillers, etc.)
                                    ↓
                        LLM generates behavioral metrics
                                    ↓
                        Return comprehensive analysis report
```

---

## Core Systems

### 1. Chat-Based Training Agent

#### Purpose
Accelerates call agent training by providing interactive Q&A sessions with AI-powered feedback based on company-specific knowledge bases.

#### Features
- **Session-Based Training**: Three predefined training levels
  - Session 1: Foundation Training
  - Session 2: Advanced Topics
  - Session 3: Specialized Content
- **Knowledge Base Management**: CSV upload with Q&A pairs
- **Vector Similarity Search**: Retrieves relevant context using embeddings
- **Multilingual Support**: English, Sinhala, Tamil
- **Intelligent Feedback**: Context-aware evaluation of trainee responses

#### Technical Implementation

**Document Processing Pipeline:**
```typescript
1. CSV Upload → Parse rows → Extract Q&A pairs
2. Generate embeddings using HuggingFace (sentence-transformers/all-MiniLM-L6-v2)
3. Store in training_chunks table with 384-dimensional vectors
4. Create IVFFlat index for fast similarity search
```

**Assessment Generation:**
```typescript
1. Call /api/assessment (action: 'start')
2. Generate 10 questions from knowledge base
3. For each question:
   - User submits answer
   - Retrieve top-k relevant chunks via match_training_chunks RPC
   - LLM evaluates answer with context
   - Provide immediate feedback
4. Final assessment summary with performance metrics
```

**Key Files:**
- `app/api/training/upload/route.ts` - CSV processing and embedding
- `app/api/assessment/route.ts` - Assessment orchestration
- `lib/ai/retriever.ts` - Vector similarity search
- `lib/assessment/training-questions.ts` - Question generation and feedback
- `sql/schema.sql` - Database schema with pgvector

---

### 2. Live Call Agent (Gemini Live Service)

#### Purpose
Provides real-time conversational AI for call agent practice and customer simulation scenarios.

#### Features
- **Real-time Voice Conversation**: Bidirectional audio streaming
- **Multilingual Understanding**: Automatic language detection and response
- **Knowledge Base Integration**: Contextual responses from training documents
- **Live Transcription**: Real-time text transcription of both user and AI
- **Conversation Summaries**: Automatic summary generation on session end
- **State Management**: Tracks conversation states (IDLE, CONNECTING, LISTENING, SPEAKING, etc.)

#### Technical Implementation

**Connection Flow:**
```typescript
1. Initialize GoogleGenAI client with API key
2. Create audio contexts (16kHz input, 24kHz output)
3. Request microphone access via MediaDevices API
4. Connect to Gemini Live session with:
   - Model: gemini-2.5-flash-native-audio-preview
   - Audio modality enabled
   - System instruction for multilingual support
5. Stream audio chunks via ScriptProcessorNode
6. Receive and playback model responses
```

**Audio Processing:**
- **Input**: Captured at 16kHz, converted to PCM, base64 encoded
- **Output**: Decoded from base64, converted to AudioBuffer, scheduled playback
- **Interruption Handling**: Stops playback when user interrupts

**Summary Generation:**
```typescript
On disconnect:
1. Collect conversation history
2. Send to Gemini 2.5-flash model
3. Generate concise summary (max 500 tokens)
4. Return to frontend for display
```

**Key Files:**
- `lib/ai/geminiLiveService.ts` - Core live session management
- `modules/component/Dashboard/trainer/CallAgentClient.tsx` - Frontend interface
- `app/dashboard/call-agent/page.tsx` - Page component

**State Machine:**
```
IDLE → CONNECTING → LISTENING ⇄ SPEAKING → CLOSING → SUMMARIZING → IDLE
                                    ↓
                                  ERROR
```

---

### 3. Audio Sentiment Analytics System

#### Purpose
Provides comprehensive behavioral and performance analysis of customer support calls using AI-driven metrics.

#### Features
- **Audio Transcription**: High-accuracy speech-to-text via AssemblyAI
- **Speaker Diarization**: Automatic speaker labeling (Agent/Customer)
- **Mathematical Metrics**: Objective performance calculations
- **Behavioral Analysis**: AI-generated soft skill evaluation
- **Multi-dimensional Scoring**: 10 distinct behavioral metrics

#### Mathematical Metrics (Equation-Based)

**1. Words Per Minute (WPM)**
```
WPM = Total Words / Speaking Window (minutes)
Speaking Window = (Last Word End Time - First Word Start Time)
```

**2. Talk Ratio**
```
Talk Ratio = Speaker Speaking Time / Total Call Time
Agent Talk Ratio + Customer Talk Ratio = 1.0
```

**3. Pronunciation Score**
```
Pronunciation Score = Average(Word Confidence Scores)
Based on AssemblyAI confidence values (0..1)
```

**4. Filler Count**
```
Detects: um, uh, ah, erm, like, you know
Also detects word repetitions
```

**5. Total Silence**
```
1. Merge all speaking intervals
2. Calculate total speaking time
3. Silence = Call Duration - Total Speaking Time
```

#### Behavioral Metrics (LLM-Generated)

Generated by OpenRouter API using structured prompts. Each metric scored 0-1 (or -1 to +1 for sentiment):

1. **Overall Sentiment Score** (-1 to +1)
   - Agent's emotional tone across the call

2. **Empathy Level** (0-1)
   - Understanding and acknowledgment of feelings

3. **Professionalism & Courtesy** (0-1)
   - Polite language, greetings, gratitude

4. **Conflict De-escalation** (0-1)
   - Ability to calm tense situations

5. **Active Listening** (0-1)
   - Acknowledgement, paraphrasing, relevance

6. **Tone Consistency** (0-1)
   - Emotional stability throughout call

7. **Customer Sentiment Impact** (-1 to +1)
   - Change in customer mood from start to end

8. **Problem-Solving Language** (0-1)
   - Solution-oriented vs. dismissive language

9. **Speech Pace & Clarity** (0-1)
   - Appropriate speed and clarity

10. **Personalization vs. Script** (0-1)
    - Balance between protocol and adaptation

Each metric includes:
- Numerical score
- Text description explaining the score
- Overall summary paragraph

#### Technical Implementation

**Processing Pipeline:**
```typescript
1. Upload audio file (POST /api/analyze-call)
2. Upload to AssemblyAI CDN
3. Request transcription with:
   - speaker_labels: true
   - sentiment_analysis: true
4. Poll for completion (3-second intervals)
5. Calculate mathematical metrics (lib/callMetrics.ts)
6. Generate behavioral metrics via LLM (lib/agentBehaviorLLM.ts)
7. Return comprehensive report
```

**API Response Structure:**
```json
{
  "message": "Analysis complete",
  "filename": "analysis-{transcriptId}.json",
  "metrics": {
    "agent": {
      "wpm": 145.2,
      "pronunciationScore": 0.94,
      "speakingSeconds": 234.5,
      "talkRatio": 0.65,
      "fillerCount": 8,
      "transcript": "..."
    },
    "customer": {
      "wpm": 128.7,
      "speakingSeconds": 125.3,
      "talkRatio": 0.35,
      "fillerCount": 12,
      "transcript": "..."
    },
    "overall": {
      "totalSilenceSeconds": 45.2,
      "totalWords": 892,
      "fullTranscript": "..."
    }
  },
  "behaviorMetrics": {
    "overallSentimentScore": 0.75,
    "empathyLevel": 0.82,
    // ... 10 total metrics
    "summary": "The agent demonstrated excellent...",
    "perSkillDescriptions": {
      "overallSentimentScore": "The agent maintained...",
      // ... descriptions for all metrics
    }
  },
  "transcript": {
    // Full AssemblyAI response
  }
}
```

**Key Files:**
- `app/api/analyze-call/route.ts` - Main orchestration endpoint
- `lib/callMetrics.ts` - Mathematical metric calculations
- `lib/agentBehaviorLLM.ts` - LLM-based behavioral analysis
- `modules/component/FeedbackReport.tsx` - Report visualization

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.1 (App Router)
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4 + tailwindcss-animate
- **Charts**: Recharts 3.3.0
- **Icons**: Lucide React 0.552.0
- **Animations**: tw-animate-css 1.4.0

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: Supabase (PostgreSQL + pgvector)

### AI/ML Services
- **Embeddings**: Hugging Face Inference API
  - Model: `sentence-transformers/all-MiniLM-L6-v2`
  - Dimension: 384
- **LLM (Text)**: Google Gemini 2.0 Flash (via OpenRouter)
- **LLM (Voice)**: Google Gemini 2.5 Flash Native Audio Preview
- **Transcription**: AssemblyAI API
- **Orchestration**: LangChain 1.0.2

### Development Tools
- **Language**: TypeScript 5
- **Package Manager**: Yarn 1.22.22
- **Linting**: ESLint 9 + eslint-config-next
- **Build**: Next.js built-in bundler

---

## Database Schema

### Tables

#### `training_sessions`
Represents the three training curriculum levels.

```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Data:**
- Session 1 - Foundation Training
- Session 2 - Advanced Topics
- Session 3 - Specialized Content

#### `training_documents`
Stores metadata for uploaded CSV files.

```sql
CREATE TABLE training_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `training_chunks`
Stores document chunks with vector embeddings.

```sql
CREATE TABLE training_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_document_id UUID REFERENCES training_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  row_start INTEGER,
  row_end INTEGER,
  embedding VECTOR(384) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(training_document_id, chunk_index)
);

CREATE INDEX training_chunks_embedding_ivfflat
ON training_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### `chat_messages`
Conversation history for training sessions.

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `training_assessment_questions`
Generated questions for assessments.

```sql
CREATE TABLE training_assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Remote Procedure Calls (RPCs)

#### `match_training_chunks`
Vector similarity search for relevant knowledge base chunks.

```sql
CREATE OR REPLACE FUNCTION match_training_chunks (
  p_session_id UUID,
  query_embedding VECTOR(384),
  match_count INT,
  similarity_threshold FLOAT
) RETURNS TABLE (
  id UUID,
  training_document_id UUID,
  content TEXT,
  similarity FLOAT,
  file_name TEXT,
  row_start INTEGER,
  row_end INTEGER,
  chunk_index INTEGER
)
```

**Usage Example:**
```typescript
const { data } = await supabaseAdmin.rpc('match_training_chunks', {
  p_session_id: 'uuid-here',
  query_embedding: [0.123, 0.456, ...], // 384 dimensions
  match_count: 6,
  similarity_threshold: 0.1
});
```

#### `get_random_chunk`
Retrieves a random chunk for question generation.

```sql
CREATE OR REPLACE FUNCTION get_random_chunk (p_session_id UUID)
RETURNS TABLE (content TEXT)
```

---

## API Endpoints

### Training Management

#### `POST /api/training/upload`
Upload CSV training documents.

**Request:**
```typescript
FormData {
  file: File (CSV),
  session_id: string
}
```

**Response:**
```json
{
  "message": "File uploaded and processed successfully. 150 chunks created for this training session.",
  "chunksCreated": 150
}
```

**Validation:**
- CSV format only
- Session must not have existing documents (or must be cleared first)
- Valid session_id required

#### `POST /api/training/clear`
Clear all training data for a session.

**Request:**
```json
{
  "session_id": "uuid"
}
```

#### `GET /api/training/documents`
List all training documents.

#### `GET /api/training/sessions`
List all training sessions.

### Assessment API

#### `POST /api/assessment`
Multi-action assessment endpoint.

**Action: start**
```json
{
  "action": "start",
  "session_id": "uuid",
  "language": "English" | "Sinhala" | "Tamil"
}
```

**Response:**
```json
{
  "questions": ["Question 1", "Question 2", ...],
  "message": "Welcome to your training assessment! ..."
}
```

**Action: answer-feedback**
```json
{
  "action": "answer-feedback",
  "session_id": "uuid",
  "question": "What is...",
  "userAnswer": "The answer is...",
  "language": "English"
}
```

**Response:**
```json
{
  "feedback": "Good attempt! However, ...",
  "message": "Assessment Complete! Here's your feedback:"
}
```

**Action: finish**
```json
{
  "action": "finish",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "language": "English"
}
```

**Response:**
```json
{
  "feedback": "Overall assessment: ...",
  "message": "Assessment Complete! Here's your feedback:"
}
```

### Audio Analytics

#### `POST /api/analyze-call`
Analyze uploaded audio files.

**Request:**
```typescript
FormData {
  audio: File (audio file)
}
```

**Response:**
```json
{
  "message": "Analysis complete",
  "filename": "analysis-{id}.json",
  "metrics": { /* CallMetrics */ },
  "behaviorMetrics": { /* BehaviorMetrics */ },
  "transcript": { /* Full AssemblyAI response */ }
}
```

**Process:**
1. Upload to AssemblyAI
2. Wait for transcription completion
3. Calculate mathematical metrics
4. Generate behavioral metrics via LLM
5. Return comprehensive report

### Document Management

#### `GET /api/documents`
List uploaded training documents.

#### `POST /api/documents`
Upload general documents.

#### `GET /api/sessions`
Get training session information.

### Authentication

#### `POST /api/login`
User authentication.

#### `POST /api/logout`
User logout.

---

## Environment Configuration

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Hugging Face API
HUGGINGFACE_API_KEY=your-huggingface-api-key
HF_EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# OpenRouter API (for LLM-based analytics)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# AssemblyAI
ASSEMBLYAI_API_KEY=your-assemblyai-api-key
```

### Environment Variables Reference

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access to Supabase | Yes |
| `HUGGINGFACE_API_KEY` | Embeddings generation | Yes |
| `HF_EMBEDDINGS_MODEL` | Embedding model name | No (default provided) |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Gemini Live and text API | Yes |
| `OPENROUTER_API_KEY` | LLM for analytics | Yes |
| `OPENROUTER_MODEL` | LLM model name | No (default provided) |
| `ASSEMBLYAI_API_KEY` | Audio transcription | Yes |

---

## Installation & Setup

### Prerequisites
- Node.js 20.x or higher
- Yarn 1.22.22
- Supabase account
- API keys for: Hugging Face, Google Gemini, OpenRouter, AssemblyAI

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd echo
```

### Step 2: Install Dependencies
```bash
yarn install
```

### Step 3: Database Setup

1. Create a Supabase project
2. Run the SQL schema:
   ```bash
   # Copy contents of sql/schema.sql to Supabase SQL Editor
   # Execute the script
   ```
3. Run security policies:
   ```bash
   # Copy contents of sql/policies.sql to Supabase SQL Editor
   # Execute the script
   ```
4. Verify pgvector extension is enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;
   ```

### Step 4: Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Step 5: Verify Setup
```bash
# Start development server
yarn dev

# Open browser to http://localhost:3000
```

### Step 6: Initialize Default Data
The database schema automatically creates three default training sessions:
- Session 1 - Foundation Training
- Session 2 - Advanced Topics
- Session 3 - Specialized Content

---

## Development Guide

### Project Structure
```
echo/
├── app/                          # Next.js App Router
│   ├── (open)/                  # Public routes
│   │   └── auth/login/
│   ├── api/                     # API endpoints
│   │   ├── analyze-call/       # Audio analytics
│   │   ├── assessment/         # Training assessment
│   │   ├── training/           # Training management
│   │   └── ...
│   ├── dashboard/              # Protected dashboards
│   │   ├── admin/             # Admin interface
│   │   ├── trainer/           # Trainer interface
│   │   └── call-agent/        # Live call interface
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── config/                      # Configuration files
│   ├── constants.ts
│   ├── routes.ts
│   └── speech.ts
├── hooks/                       # React hooks
│   ├── useAssessment.ts
│   └── useSpeech.ts
├── lib/                         # Core business logic
│   ├── ai/                     # AI/ML integrations
│   │   ├── agent.ts
│   │   ├── embeddings.ts
│   │   ├── geminiLiveService.ts
│   │   └── retriever.ts
│   ├── assessment/             # Assessment logic
│   │   ├── quiz.ts
│   │   ├── training-questions.ts
│   │   └── types.ts
│   ├── database/               # Database utilities
│   │   ├── supabase.ts
│   │   ├── state.ts
│   │   └── tracks.ts
│   ├── prompts/                # LLM prompts
│   │   └── chat-prompt.ts
│   ├── utils/                  # Utility functions
│   ├── agentBehaviorLLM.ts    # Behavioral analysis
│   ├── callMetrics.ts         # Metric calculations
│   └── types.ts
├── modules/                     # React components
│   └── component/
│       ├── AssessmentChat.tsx
│       ├── FeedbackReport.tsx
│       ├── Uploader.tsx
│       └── Dashboard/
├── public/                      # Static assets
├── sql/                         # Database scripts
│   ├── schema.sql
│   └── policies.sql
└── types/                       # TypeScript types
```

### Adding a New Training Session

1. **Database:**
```sql
INSERT INTO training_sessions (session_name)
VALUES ('Session 4 - Expert Level');
```

2. **Frontend:**
Update session selector in admin dashboard to include new session.

### Customizing Behavioral Metrics

Edit `lib/agentBehaviorLLM.ts`:
```typescript
export interface BehaviorMetrics {
  // Add new metric
  newMetric: number;
  perSkillDescriptions: {
    // Add description field
    newMetric: string;
  };
}
```

Update prompt in `analyzeAgentBehaviorWithLLM` function.

### Creating Custom Prompts

Add new prompts in `lib/prompts/`:
```typescript
export const customPrompt = `
Your custom prompt template here...
`;
```

### Running Tests

```bash
# Lint code
yarn lint

# Type check
yarn tsc --noEmit

# Build for production
yarn build
```

---

## Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository:**
   - Import project to Vercel
   - Connect GitHub repository

2. **Configure Environment Variables:**
   - Add all variables from `.env.local` to Vercel project settings
   - Ensure `NEXT_PUBLIC_*` variables are accessible client-side

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
```

Build and run:
```bash
docker build -t echo-platform .
docker run -p 3000:3000 --env-file .env.local echo-platform
```

### Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations executed
- [ ] Row Level Security policies enabled
- [ ] API rate limiting implemented
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Analytics enabled
- [ ] HTTPS enforced
- [ ] CORS policies configured
- [ ] Backup strategy implemented

---

## Performance Considerations

### Vector Search Optimization

**IVFFlat Index Parameters:**
```sql
CREATE INDEX training_chunks_embedding_ivfflat
ON training_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

- Increase `lists` for larger datasets (recommendation: sqrt(total_rows))
- Run `ANALYZE training_chunks;` after bulk inserts

### Embedding Generation

- Batch embedding requests to Hugging Face API
- Cache embeddings when possible
- Use smaller models for faster response (MiniLM-L6-v2 is 384D vs 768D)

### Audio Processing

- Limit audio file size (recommend max 50MB)
- Use AssemblyAI's batch processing for multiple files
- Cache transcription results

### Database

- Use connection pooling (Supabase handles this automatically)
- Implement pagination for large result sets
- Monitor RPC function performance

---

## Security Best Practices

### API Key Management
- Never commit `.env.local` to version control
- Rotate API keys regularly
- Use separate keys for development and production

### Database Security
- Enable Row Level Security (RLS) on all tables
- Use service role key only server-side
- Implement proper authentication checks

### File Upload Security
- Validate file types and sizes
- Use signed URLs for temporary access

### Rate Limiting
Implement rate limiting for API endpoints:
```typescript
// Example middleware
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

---

## Troubleshooting

### Common Issues

**1. Embedding Generation Fails**
- Verify Hugging Face API key
- Check model name is correct
- Ensure text is not empty or too long

**2. Vector Search Returns No Results**
- Check similarity threshold (default 0.1)
- Verify embeddings were generated correctly
- Run `ANALYZE training_chunks;`

**3. Gemini Live Connection Errors**
- Verify API key has access to preview models
- Check browser microphone permissions
- Ensure HTTPS in production

**4. AssemblyAI Timeout**
- Large files may take longer to process
- Implement exponential backoff for polling
- Check file format compatibility

### Debug Mode

Enable detailed logging:
```typescript
// In lib/ai/geminiLiveService.ts
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) console.log('Debug info:', data);
```

### Database Query Debugging

```sql
-- Check chunk distribution
SELECT 
  td.session_id,
  COUNT(*) as chunk_count
FROM training_chunks tc
JOIN training_documents td ON tc.training_document_id = td.id
GROUP BY td.session_id;

-- Test vector search
SELECT match_training_chunks(
  'session-uuid-here',
  (SELECT embedding FROM training_chunks LIMIT 1),
  5,
  0.1
);
```

---

## API Rate Limits

| Service | Limit | Notes |
|---------|-------|-------|
| Hugging Face | Varies by tier | Check your plan |
| Google Gemini | 60 RPM (free tier) | 360 RPM (paid) |
| AssemblyAI | Concurrent requests limited | Check your plan |
| OpenRouter | Model-dependent | Check dashboard |

---

## Support & Contributing

### Reporting Issues
Create issues on GitHub with:
- Detailed description
- Steps to reproduce
- Expected vs actual behavior
- Environment details

### Contributing Guidelines
1. Fork repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

---

## License

[Add your license information here]

---

## Changelog

### Version 0.1.0 (Current)
- Initial release
- Chat-based training agent
- Live call agent with Gemini Live
- Audio sentiment analytics
- Multi-session training management
- Multilingual support (English, Sinhala, Tamil)

---

## Roadmap

### Planned Features
- [ ] Real-time dashboard for active calls
- [ ] Advanced analytics with trends
- [ ] Multi-tenant support
- [ ] Mobile application
- [ ] Integration with CRM systems
- [ ] Custom voice models
- [ ] Automated performance reports
- [ ] Agent leaderboards

---

## Acknowledgments

- **Hugging Face** - Embedding models
- **Google** - Gemini AI platform
- **AssemblyAI** - Speech recognition
- **Supabase** - Backend infrastructure
- **Vercel** - Hosting platform
- **LangChain** - AI orchestration

---

**Last Updated:** November 26, 2025
**Version:** 0.1.0
