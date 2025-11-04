-- Enable pgvector extension
create extension if not exists vector with schema public;

-- 1. Documents Table
-- Stores the original uploaded CSV files.
create table documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  created_at timestamptz default now() not null
);
alter table documents enable row level security;

-- 2. Chunks Table
-- Stores text chunks from documents, their embeddings, and metadata.
create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  row_start integer,
  row_end integer,
  embedding public.vector(384) not null, -- Embedding dimension
  created_at timestamptz default now() not null,
  unique(document_id, chunk_index)
);
alter table chunks enable row level security;

-- 3. Chat Messages Table
-- Stores the history of conversations.
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  role text check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  created_at timestamptz default now() not null
);
alter table chat_messages enable row level security;

-- 4. Indexes
-- Create an IVFFlat index on the embedding column for faster similarity search.
create index on chunks using ivfflat (embedding public.vector_cosine_ops)
with
  (lists = 100);

-- 5. RPC Function: match_chunks
-- This function searches for chunks based on a query embedding.
create or replace function match_chunks (
  query_embedding public.vector(384),
  match_count int,
  similarity_threshold float
) returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  file_name text,
  row_start integer,
  row_end integer,
  chunk_index integer
) as $$
begin
  return query
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity,
    documents.file_name,
    chunks.row_start,
    chunks.row_end,
    chunks.chunk_index
  from chunks
  join documents on chunks.document_id = documents.id
  where 1 - (chunks.embedding <=> query_embedding) > similarity_threshold
  order by
    chunks.embedding <=> query_embedding
  limit match_count;
end;
$$ language plpgsql;

-- Training Sessions
create table if not exists training_sessions (
  id uuid primary key default gen_random_uuid(),
  session_name text not null,
  created_at timestamptz default now()
);
alter table training_sessions enable row level security;

-- Insert 3 default training sessions
insert into training_sessions (session_name) values
  ('Session 1 - Foundation Training'),
  ('Session 2 - Advanced Topics'),
  ('Session 3 - Specialized Content')
on conflict do nothing;

-- Training Documents: stores uploaded files for each session
create table if not exists training_documents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references training_sessions(id) on delete cascade,
  file_name text not null,
  file_size integer,
  mime_type text,
  created_at timestamptz default now()
);
alter table training_documents enable row level security;

-- Training Chunks: embeddings per training document
create table if not exists training_chunks (
  id uuid primary key default gen_random_uuid(),
  training_document_id uuid references training_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  row_start integer,
  row_end integer,
  embedding public.vector(384) not null,
  created_at timestamptz default now() not null,
  unique(training_document_id, chunk_index)
);
alter table training_chunks enable row level security;

-- IVFFlat index for training_chunks
create index if not exists training_chunks_embedding_ivfflat
on training_chunks using ivfflat (embedding public.vector_cosine_ops)
with (lists = 100);