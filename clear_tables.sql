-- Drop all tables in the public schema
-- This will remove all existing tables and their data

-- First, disable row level security policies
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_versions DISABLE ROW LEVEL SECURITY;

-- Drop tables in dependency order (child tables first)
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS document_collaborators CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any Better Auth tables if they exist
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS user CASCADE;

-- Drop the update trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Clear any remaining sequences
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS documents_id_seq CASCADE;
DROP SEQUENCE IF EXISTS document_collaborators_id_seq CASCADE;
DROP SEQUENCE IF EXISTS comments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS document_versions_id_seq CASCADE; 