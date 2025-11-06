-- Enable pgvector extension
create extension if not exists vector with schema public;

-- Training Sessions
create table if not exists training_sessions (
  id uuid primary key default gen_random_uuid(),
  session_name text not null,
  score integer default 0,
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

-- Chat Messages Table
-- Stores the history of conversations for each training session.
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references training_sessions(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  created_at timestamptz default now() not null
);
alter table chat_messages enable row level security;

-- Training Assessment Questions Table
create table if not exists training_assessment_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references training_sessions(id) on delete cascade,
  question_text text not null,
  created_at timestamptz default now()
);
alter table training_assessment_questions enable row level security;

-- RPC Function: match_training_chunks
-- This function searches for chunks based on a query embedding for a specific training session.
create or replace function match_training_chunks (
  p_session_id uuid,
  query_embedding public.vector(384),
  match_count int,
  similarity_threshold float
) returns table (
  id uuid,
  training_document_id uuid,
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
    tc.id,
    tc.training_document_id,
    tc.content,
    1 - (tc.embedding <=> query_embedding) as similarity,
    td.file_name,
    tc.row_start,
    tc.row_end,
    tc.chunk_index
  from training_chunks tc
  join training_documents td on tc.training_document_id = td.id
  where td.session_id = p_session_id
    and 1 - (tc.embedding <=> query_embedding) > similarity_threshold
  order by
    tc.embedding <=> query_embedding
  limit match_count;
end;
$$ language plpgsql;

-- RPC Function: get_random_chunk
-- This function gets a random chunk for a given session.
create or replace function get_random_chunk (p_session_id uuid)
returns table (
  content text
) as $$
begin
  return query
  select
    tc.content
  from
    training_chunks tc
  join
    training_documents td on tc.training_document_id = td.id
  where
    td.session_id = p_session_id
  order by
    random()
  limit 1;
end;
$$ language plpgsql;