-- MarkdownShare Database Schema
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  visibility TEXT CHECK (visibility IN ('public', 'link_only', 'password_protected', 'private')) DEFAULT 'private',
  password_hash TEXT,
  access_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Create document collaborators table
CREATE TABLE IF NOT EXISTS document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('read', 'write', 'admin')) DEFAULT 'read',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  position JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_author_id ON documents(author_id);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_collaborators_document_id ON document_collaborators(document_id);
CREATE INDEX IF NOT EXISTS idx_document_collaborators_user_id ON document_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_document_id ON comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create RLS policies for documents table
CREATE POLICY "Authors can view their own documents" ON documents
  FOR SELECT USING (author_id::text = auth.uid()::text);

CREATE POLICY "Public documents are viewable by everyone" ON documents
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Link-only documents are viewable by everyone" ON documents
  FOR SELECT USING (visibility = 'link_only');

CREATE POLICY "Collaborators can view shared documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_collaborators 
      WHERE document_id = documents.id 
      AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Authors can update their own documents" ON documents
  FOR UPDATE USING (author_id::text = auth.uid()::text);

CREATE POLICY "Write collaborators can update documents" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM document_collaborators 
      WHERE document_id = documents.id 
      AND user_id::text = auth.uid()::text 
      AND permission IN ('write', 'admin')
    )
  );

CREATE POLICY "Authors can delete their own documents" ON documents
  FOR DELETE USING (author_id::text = auth.uid()::text);

CREATE POLICY "Authors can insert documents" ON documents
  FOR INSERT WITH CHECK (author_id::text = auth.uid()::text);

-- Create RLS policies for document_collaborators table
CREATE POLICY "Collaborators can view document collaborations" ON document_collaborators
  FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_collaborators.document_id 
      AND documents.author_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Document authors can manage collaborators" ON document_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_collaborators.document_id 
      AND documents.author_id::text = auth.uid()::text
    )
  );

-- Create RLS policies for comments table
CREATE POLICY "Users can view comments on accessible documents" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = comments.document_id 
      AND (
        documents.visibility = 'public' OR
        documents.visibility = 'link_only' OR
        documents.author_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM document_collaborators 
          WHERE document_collaborators.document_id = documents.id 
          AND document_collaborators.user_id::text = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "Users can create comments on accessible documents" ON comments
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = comments.document_id 
      AND (
        documents.visibility = 'public' OR
        documents.visibility = 'link_only' OR
        documents.author_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM document_collaborators 
          WHERE document_collaborators.document_id = documents.id 
          AND document_collaborators.user_id::text = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Create RLS policies for document_versions table
CREATE POLICY "Users can view versions of accessible documents" ON document_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_versions.document_id 
      AND (
        documents.author_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM document_collaborators 
          WHERE document_collaborators.document_id = documents.id 
          AND document_collaborators.user_id::text = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "Users can create versions for documents they can edit" ON document_versions
  FOR INSERT WITH CHECK (
    created_by::text = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_versions.document_id 
      AND (
        documents.author_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM document_collaborators 
          WHERE document_collaborators.document_id = documents.id 
          AND document_collaborators.user_id::text = auth.uid()::text
          AND document_collaborators.permission IN ('write', 'admin')
        )
      )
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 