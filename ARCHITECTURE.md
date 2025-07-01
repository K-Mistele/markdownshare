# MarkdownShare - Architecture & Technology Decisions

## Project Overview
MarkdownShare is a Next.js-based platform for collaborative markdown editing, sharing, and management with full MDX support, real-time collaboration, and comprehensive access controls.

## Core Requirements
- Next.js app with ShadCN/UI and Tailwind CSS
- Full MDX support with syntax highlighting
- Rich markdown editor (shadcn-editor)
- User authentication and authorization
- Document management with visibility controls (public, link-only, password-protected)
- Comments system
- Multiplayer/collaborative editing
- File upload and copy/paste support

## Technology Stack

### Frontend Framework
- **Next.js 14+** with App Router
- **React 18+** with TypeScript
- **ShadCN/UI** for component library
- **Tailwind CSS** for styling
- **Bun** as package manager and runtime

### Authentication
- **Better Auth** - Selected for its comprehensive TypeScript support, modern architecture, and extensive plugin ecosystem
- Supports email/password, OAuth providers, 2FA, and session management
- Framework agnostic with excellent Next.js integration

### Markdown Editor
- **shadcn-editor** - Built on Lexical with ShadCN/UI components
- Provides rich text editing with markdown support
- Extensible plugin architecture for custom functionality

### Database & Backend Options Evaluated

#### Option 1: Supabase (Recommended)
**Pros:**
- Full PostgreSQL database with real-time subscriptions
- Built-in authentication (though we'll use Better Auth)
- Real-time capabilities for multiplayer editing
- File storage for document attachments
- Edge functions for serverless logic
- Excellent TypeScript support
- Built-in RLS (Row Level Security)

**Cons:**
- Vendor lock-in
- Cost scaling with usage

#### Option 2: PlanetScale + Pusher
**Pros:**
- Excellent MySQL scaling
- Dedicated real-time service with Pusher
- Great developer experience

**Cons:**
- Multiple services to manage
- Higher complexity
- PlanetScale pricing changes

#### Option 3: Vercel Postgres + Ably
**Pros:**
- Tight Vercel integration
- Ably for real-time features
- Serverless scaling

**Cons:**
- Multiple paid services
- Less mature ecosystem

#### Option 4: Self-hosted PostgreSQL + Socket.io
**Pros:**
- Full control
- Cost effective at scale
- No vendor lock-in

**Cons:**
- Infrastructure management overhead
- More complex deployment

### Final Backend Decision: Supabase
**Rationale:** Supabase provides the best balance of features, developer experience, and real-time capabilities needed for multiplayer editing and comments. Its PostgreSQL foundation offers robust querying, while real-time subscriptions handle collaborative features elegantly.

### Real-time Collaboration
- **Supabase Realtime** for document synchronization
- **Y.js** for operational transformation and conflict resolution
- **WebSocket** connections for live cursors and presence

### File Storage
- **Supabase Storage** for uploaded markdown files and assets
- **Signed URLs** for secure file access based on document permissions

### MDX Processing
- **@mdx-js/react** for MDX compilation and rendering
- **remark/rehype** plugins for enhanced markdown processing
- **Prism.js** or **Shiki** for syntax highlighting with filename support
- **remark-gfm** for GitHub Flavored Markdown

### Comments System
- **Database-driven** comments stored in Supabase
- **Real-time updates** via Supabase subscriptions
- **Nested threading** support
- **Mentions** and **notifications**

## Database Schema Design

### Core Tables
```sql
-- Users (managed by Better Auth)
users
  - id (uuid, primary key)
  - email (text, unique)
  - name (text)
  - avatar_url (text)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Documents
documents
  - id (uuid, primary key)
  - title (text)
  - content (text) -- MDX content
  - author_id (uuid, foreign key to users)
  - visibility ('public' | 'link_only' | 'password_protected')
  - password_hash (text, nullable)
  - access_token (uuid) -- For link-only access
  - created_at (timestamp)
  - updated_at (timestamp)
  - version (integer) -- For version control

-- Document Collaborators
document_collaborators
  - id (uuid, primary key)
  - document_id (uuid, foreign key)
  - user_id (uuid, foreign key)
  - permission ('read' | 'write' | 'admin')
  - created_at (timestamp)

-- Comments
comments
  - id (uuid, primary key)
  - document_id (uuid, foreign key)
  - user_id (uuid, foreign key)
  - content (text)
  - parent_comment_id (uuid, nullable) -- For threading
  - position (jsonb) -- For inline comments
  - created_at (timestamp)
  - updated_at (timestamp)

-- Document Versions (for history)
document_versions
  - id (uuid, primary key)
  - document_id (uuid, foreign key)
  - content (text)
  - version_number (integer)
  - created_by (uuid, foreign key to users)
  - created_at (timestamp)
```

## Security Considerations

### Authentication & Authorization
- Better Auth handles secure session management
- JWT tokens for API authentication
- Role-based access control (RBAC)

### Document Access Control
- Public documents: accessible to everyone
- Link-only: accessible via UUID token in query params
- Password-protected: requires password verification
- Private: only accessible to author and collaborators

### Data Protection
- Row Level Security (RLS) in Supabase
- Input sanitization for MDX content
- XSS prevention in rendered content
- CSRF protection on API routes

## Performance Considerations

### Optimization Strategies
- **SSG/ISR** for public documents
- **Client-side caching** with SWR or TanStack Query
- **Virtual scrolling** for large documents
- **Lazy loading** of comments and collaborators
- **CDN** delivery via Vercel Edge Network

### Real-time Performance
- **Debounced updates** to prevent excessive API calls
- **Operational transformation** for conflict-free concurrent editing
- **Presence indicators** showing active collaborators

## Development Phases

### Phase 1: Core Infrastructure
1. Next.js setup with ShadCN/UI
2. Better Auth integration
3. Supabase configuration
4. Basic document CRUD

### Phase 2: Editor & MDX
1. shadcn-editor integration
2. MDX rendering pipeline
3. Syntax highlighting
4. File upload functionality

### Phase 3: Collaboration
1. Real-time editing with Y.js
2. User presence indicators
3. Document sharing controls
4. Access management

### Phase 4: Comments & Social
1. Comments system
2. Threading and mentions
3. Notifications
4. Activity feeds

### Phase 5: Polish & Deploy
1. Performance optimization
2. Error handling and monitoring
3. Testing and QA
4. Production deployment

## Alternative Considerations

### CMS Alternatives Considered:
1. **Strapi** - Too heavy for our use case
2. **Sanity** - Great but overkill for markdown-focused content
3. **Contentful** - Expensive and not optimized for collaborative editing
4. **Ghost** - Blog-focused, not suitable for collaborative documents
5. **Custom API** - Selected approach with Supabase as the backend

### Editor Alternatives:
1. **TipTap** - Excellent but shadcn-editor provides better ShadCN integration
2. **Slate.js** - Powerful but more complex to implement
3. **Monaco Editor** - Great for code but less suitable for rich text
4. **CodeMirror** - Similar to Monaco, more code-focused

The chosen architecture provides a robust, scalable foundation for a collaborative markdown platform while maintaining simplicity and developer experience.