# RAG Web App

This is a production-ready RAG web app where customers upload CSV files, we store + index them in Supabase (Postgres + pgvector), and the user chats with a LangChain React Agent that answers ONLY from the uploaded data.

## Tech Stack

- Framework: Next.js 14+ (App Router, Route Handlers), TypeScript strict.
- DB: Supabase Postgres with pgvector. Tables: documents, chunks, chat_messages. RPC: match_chunks(query_embedding, match_count).
- Embeddings: Hugging Face Inference API model `sentence-transformers/all-MiniLM-L6-v2` (or compatible). Dimension 384 (adjust vector column accordingly).
- LLM: Gemini 1.5 Pro for chat generation.
- Orchestration: LangChain.js React Agent with a single retrieval tool `retrieve_context`.
- Parsing: PapaParse for CSV on the server.
- Styling: TailwindCSS, minimalist modern; use semantic markup and responsive containers; no third-party UI kit required unless it speeds up delivery.

## Getting Started

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Set up your Supabase database:**

    - Go to your Supabase dashboard and create a new project.
    - Go to the SQL Editor and run the script in `sql/schema.sql`.

3.  **Set up your environment variables:**

    - Create a `.env.local` file in the root of the project.
    - Add the following environment variables:

      ```
      NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
      SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
      HUGGINGFACE_API_KEY="YOUR_HUGGINGFACE_API_KEY"
      HF_EMBEDDINGS_MODEL="sentence-transformers/all-MiniLM-L6-v2"
      GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
      GEMINI_MODEL="gemini-1.5-pro"
      ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Open your browser to `http://localhost:3000` to see the app.**

## Seed Script

To seed the database with an example CSV, you can create a script that uses the `/api/upload` endpoint.

## Example CSV

Create a file named `example.csv` with the following content:

```csv
name,age,city
John,30,New York
Jane,25,London
```