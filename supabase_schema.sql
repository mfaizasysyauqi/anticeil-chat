-- ==============================================================================
-- ANTICEIL SUPABASE CLOUD DATABASE SCHEMA
-- Tiered Storage Strategy (Free: Local Storage | Pro: Supabase Cloud Database)
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Holds User Tier & Preferences)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'enterprise'
  storage_quota_bytes BIGINT DEFAULT 1073741824, -- 1 GB for Pro / Custom for Enterprise
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  provider_id TEXT NOT NULL DEFAULT 'groq',
  model_id TEXT NOT NULL DEFAULT 'compound-beta',
  system_prompt TEXT DEFAULT '',
  temperature FLOAT DEFAULT 0.7,
  max_tokens INTEGER,
  is_pinned BOOLEAN DEFAULT FALSE,
  project_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  reasoning_content TEXT,
  timestamp BIGINT NOT NULL,
  tokens_used JSONB,
  estimated_cost_usd FLOAT,
  status TEXT DEFAULT 'done',
  error TEXT,
  attachments JSONB,
  image_url TEXT,
  video_url TEXT,
  tool_results JSONB,
  versions JSONB,
  version_index INTEGER DEFAULT 0,
  branch_contents JSONB,
  branch_reasoning_contents JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Project Folders Table
CREATE TABLE IF NOT EXISTS public.project_folders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  session_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. User Prompts (Custom Personas & Templates)
CREATE TABLE IF NOT EXISTS public.user_prompts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  description TEXT,
  icon TEXT DEFAULT '💡',
  category TEXT DEFAULT 'general',
  system_prompt TEXT,
  default_temperature FLOAT DEFAULT 0.7,
  suggested_starters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. User Connectors (OAuth & API configurations)
CREATE TABLE IF NOT EXISTS public.user_connectors (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_connector_unique UNIQUE (user_id, connector_id)
);

-- 7. Workspace Collections & Data
CREATE TABLE IF NOT EXISTS public.workspace_data (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Document Folders (Docs Studio Project Folders)
CREATE TABLE IF NOT EXISTS public.doc_folders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  doc_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Documents (Docs Studio - Markdown, LaTeX, Spreadsheet, Slide & Overleaf Multi-Files)
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT 'markdown', -- 'markdown' | 'latex' | 'spreadsheet' | 'slide'
  is_pinned BOOLEAN DEFAULT FALSE,
  folder_id TEXT,
  files JSONB NOT NULL DEFAULT '[]'::jsonb, -- Overleaf-style subfiles [{id, name, content, isMain, ...}]
  active_file_id TEXT,
  is_link_sharing_on BOOLEAN NOT NULL DEFAULT TRUE,
  view_token TEXT UNIQUE,
  edit_token TEXT UNIQUE,
  collaborators JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{email, role, invitedAt}]
  comments JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{id, subFileId, selectedText, fromLine, toLine, authorName, authorEmail, content, createdAt, resolved, replies}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Document Collaborators (Direct Email Collaborations)
CREATE TABLE IF NOT EXISTS public.document_collaborators (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'viewer' | 'editor'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT doc_collab_unique UNIQUE (document_id, email)
);

-- 11. Document Review Comments (Overleaf Review Panel & Inline Annotations)
CREATE TABLE IF NOT EXISTS public.document_comments (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  sub_file_id TEXT,
  selected_text TEXT NOT NULL DEFAULT '',
  from_line INTEGER DEFAULT 1,
  to_line INTEGER DEFAULT 1,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  replies JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{id, authorName, authorEmail, content, createdAt}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON public.chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_project_folders_user ON public.project_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prompts_user ON public.user_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connectors_user ON public.user_connectors(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_data_user ON public.workspace_data(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_folders_user ON public.doc_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON public.documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated ON public.documents(updated_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Each authenticated user can only access their own data
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Chat Sessions Policies
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage own sessions" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Chat Messages Policies
DROP POLICY IF EXISTS "Users can manage own messages" ON public.chat_messages;
CREATE POLICY "Users can manage own messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- Project Folders Policies
DROP POLICY IF EXISTS "Users can manage own project folders" ON public.project_folders;
CREATE POLICY "Users can manage own project folders" ON public.project_folders
  FOR ALL USING (auth.uid() = user_id);

-- Document Folders Policies (Docs Studio)
DROP POLICY IF EXISTS "Users can manage own doc folders" ON public.doc_folders;
CREATE POLICY "Users can manage own doc folders" ON public.doc_folders
  FOR ALL USING (auth.uid() = user_id);

-- Documents Policies (Docs Studio - Owner & Collaborator Access)
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc
      WHERE dc.document_id = public.documents.id
      AND (dc.user_id = auth.uid() OR dc.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND dc.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "Collaborators and public can view shared documents" ON public.documents;
CREATE POLICY "Collaborators and public can view shared documents" ON public.documents
  FOR SELECT USING (
    auth.uid() = user_id OR
    is_link_sharing_on = TRUE OR
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc
      WHERE dc.document_id = public.documents.id
      AND (dc.user_id = auth.uid() OR dc.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- Document Collaborators Policies
DROP POLICY IF EXISTS "Owners and collaborators can view collaborators" ON public.document_collaborators;
CREATE POLICY "Owners and collaborators can view collaborators" ON public.document_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND (
        d.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.document_collaborators dc2
          WHERE dc2.document_id = d.id
          AND (dc2.user_id = auth.uid() OR dc2.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        )
      )
    )
  );

DROP POLICY IF EXISTS "Document owners can manage collaborators" ON public.document_collaborators;
CREATE POLICY "Document owners can manage collaborators" ON public.document_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- Document Review Comments Policies
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view doc comments" ON public.document_comments;
CREATE POLICY "Users can view doc comments" ON public.document_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND (
        d.user_id = auth.uid() OR
        d.is_link_sharing_on = TRUE OR
        EXISTS (
          SELECT 1 FROM public.document_collaborators dc
          WHERE dc.document_id = d.id
          AND (dc.user_id = auth.uid() OR dc.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage doc comments" ON public.document_comments;
CREATE POLICY "Users can manage doc comments" ON public.document_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND (
        d.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.document_collaborators dc
          WHERE dc.document_id = d.id
          AND dc.role = 'editor'
          AND (dc.user_id = auth.uid() OR dc.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        )
      )
    )
  );

-- User Prompts Policies
DROP POLICY IF EXISTS "Users can manage own prompts" ON public.user_prompts;
CREATE POLICY "Users can manage own prompts" ON public.user_prompts
  FOR ALL USING (auth.uid() = user_id);

-- User Connectors Policies
DROP POLICY IF EXISTS "Users can manage own connectors" ON public.user_connectors;
CREATE POLICY "Users can manage own connectors" ON public.user_connectors
  FOR ALL USING (auth.uid() = user_id);

-- Workspace Data Policies
DROP POLICY IF EXISTS "Users can manage own workspace data" ON public.workspace_data;
CREATE POLICY "Users can manage own workspace data" ON public.workspace_data
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, tier)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'tier', 'free'))
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- SUPABASE STORAGE BUCKET & RLS POLICIES (FOR MEDIA STORAGE)
-- ==============================================================================
-- 1. Create the public bucket 'anticeil-media' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('anticeil-media', 'anticeil-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS Policies for anticeil-media
DROP POLICY IF EXISTS "Public Media Access" ON storage.objects;
CREATE POLICY "Public Media Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'anticeil-media');

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'anticeil-media');

DROP POLICY IF EXISTS "Authenticated users can update own media" ON storage.objects;
CREATE POLICY "Authenticated users can update own media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'anticeil-media' AND (auth.uid() = owner OR auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "Authenticated users can delete own media" ON storage.objects;
CREATE POLICY "Authenticated users can delete own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'anticeil-media' AND (auth.uid() = owner OR auth.uid()::text = (storage.foldername(name))[1]));

