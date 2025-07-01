# MarkdownShare

A modern collaborative markdown editor built with Next.js, featuring real-time editing, comments, and powerful sharing controls.

## ✨ Features

- **� Rich Markdown Editor**: Custom MDX editor with live preview and syntax highlighting
- **� Secure Authentication**: Email/password and OAuth (GitHub, Google) via Better Auth
- **📋 Document Management**: Create, edit, and organize your markdown documents
- **🎨 Beautiful UI**: Modern design with dark/light theme support using shadcn/ui
- **🔒 Flexible Sharing**: Public, private, link-only, and password-protected documents
- **� Auto-save**: Documents are automatically saved as you type
- **📱 Responsive**: Works perfectly on desktop and mobile devices
- **� Fast & Modern**: Built with Next.js 14, React 18, and TypeScript

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Editor**: Custom MDX editor with syntax highlighting
- **Authentication**: Better Auth with social providers
- **Database**: Supabase (PostgreSQL)
- **MDX**: next-mdx-remote with syntax highlighting
- **Deployment**: Vercel-ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or bun
- Supabase account (free tier works great)

### 1. Clone and Install

```bash
git clone <repository-url>
cd markdownshare
npm install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp .env.example .env.local
```

### 3. Supabase Setup

1. **Create a Supabase project**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Get your project URL and keys from Settings > API

2. **Set up the database**:
   - Go to the SQL Editor in your Supabase dashboard
   - Run this SQL to create the required tables:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
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
CREATE TABLE document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('read', 'write', 'admin')) DEFAULT 'read',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Create comments table
CREATE TABLE comments (
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
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_documents_author_id ON documents(author_id);
CREATE INDEX idx_documents_visibility ON documents(visibility);
CREATE INDEX idx_document_collaborators_document_id ON document_collaborators(document_id);
CREATE INDEX idx_comments_document_id ON comments(document_id);

-- Enable Row Level Security (you can customize these policies)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
```

### 4. Configure Environment Variables

Fill in your `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-ref

# Authentication
BETTER_AUTH_SECRET=your-very-long-random-secret-here-make-it-at-least-32-characters
NEXT_PUBLIC_AUTH_URL=http://localhost:3000

# OAuth Providers (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start creating documents!

## 📚 Usage

1. **Sign up/Sign in**: Create an account or use OAuth providers
2. **Create documents**: Click "New Document" from the dashboard
3. **Write markdown**: Use the editor with live preview
4. **Save & share**: Documents auto-save and can be shared with custom visibility settings

## 🏗 Current Implementation Status

### ✅ Completed Features

- **Landing Page**: Feature showcase and navigation
- **Authentication**: Email/password + OAuth (GitHub, Google)
- **Document Management**: CRUD operations for documents
- **Rich Editor**: MDX editor with syntax highlighting
- **Dashboard**: Document listing and management
- **API Routes**: Complete REST API for documents
- **Responsive Design**: Mobile-friendly UI
- **Database Integration**: Full Supabase integration

### 🚧 Planned Features

- **Real-time Collaboration**: Y.js integration for collaborative editing
- **Comments System**: Threaded comments with mentions
- **File Uploads**: Image and file attachment support
- **Document Sharing**: Advanced sharing controls
- **Version History**: Document version tracking
- **Team Management**: User roles and permissions
- **Search**: Full-text search across documents
- **Export Options**: PDF, HTML, and other formats

## 🏛 Architecture

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── document/          # Document pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── editor/           # Editor components
│   ├── mdx/              # MDX rendering
│   └── ui/               # UI components (shadcn/ui)
├── lib/                  # Utility functions
│   ├── auth.ts           # Better Auth config
│   ├── database.ts       # Database operations
│   └── supabase.ts       # Supabase client
└── types/                # TypeScript definitions
```

## 🔧 API Routes

- `GET /api/documents` - List user's documents
- `POST /api/documents` - Create a new document
- `GET /api/documents/[id]` - Get a specific document
- `PUT /api/documents/[id]` - Update a document
- `DELETE /api/documents/[id]` - Delete a document
- `POST /api/auth/[...all]` - Better Auth routes

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Production Environment Variables

Make sure to update these for production:
- `NEXT_PUBLIC_AUTH_URL` - Your production domain
- `NEXT_PUBLIC_APP_URL` - Your production domain
- `BETTER_AUTH_SECRET` - Use a strong, unique secret
- Configure OAuth callback URLs in provider settings

### Setting up OAuth Providers

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `https://yourdomain.com/api/auth/callback/github`

#### Google OAuth
1. Go to Google Cloud Console
2. Create OAuth 2.0 Client IDs
3. Set Authorized redirect URI to: `https://yourdomain.com/api/auth/callback/google`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Better Auth](https://better-auth.com/) - Modern authentication
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

Built with ❤️ by developers who love markdown and collaboration.