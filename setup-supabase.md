# Supabase Setup Guide for MarkdownShare

Follow these steps to set up Supabase for your MarkdownShare project.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Node.js 18+ installed
- Bun package manager (as per project requirements)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in/sign up
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `markdownshare` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (usually 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **Project Reference ID** (the part before `.supabase.co`)
   - **anon** key (public key)
   - **service_role** key (secret key - keep this secure!)

## Step 3: Set Up Environment Variables

1. In your project root, create a `.env.local` file:

```bash
touch .env.local
```

2. Add the following content (replace the placeholder values):

```env
# Database - Replace with your actual values
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_PROJECT_ID=your-project-ref-here

# Authentication - Generate a secure random string
BETTER_AUTH_SECRET=your-very-long-random-secret-here-make-it-at-least-32-characters-long
NEXT_PUBLIC_AUTH_URL=http://localhost:3000

# OAuth Providers (optional - set up later if needed)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generate BETTER_AUTH_SECRET

You can generate a secure secret using:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire content of `supabase-schema.sql` into the editor
4. Click "Run" to execute the schema
5. You should see "Success. No rows returned" if everything worked correctly

## Step 5: Configure Row Level Security (RLS)

The schema file already includes RLS policies, but you may need to adjust them based on your needs. The current policies provide:

- **Users**: Can only view/update their own profiles
- **Documents**: Authors have full control, collaborators have limited access based on permissions
- **Comments**: Users can comment on accessible documents and manage their own comments
- **Collaborators**: Document authors can manage collaborators
- **Versions**: Tracked for documents users can edit

## Step 6: Install Dependencies

Make sure all Supabase packages are installed:

```bash
bun install @supabase/supabase-js
```

## Step 7: Test the Connection

1. Start your development server:

```bash
bun run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. Try to sign up for a new account
4. Check your Supabase dashboard → **Authentication** → **Users** to see if the user was created

## Step 8: Generate TypeScript Types (Optional)

To keep your TypeScript types in sync with your database:

1. Install Supabase CLI:

```bash
bun install -g supabase
```

2. Login to Supabase:

```bash
supabase login
```

3. Link your project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Generate types:

```bash
bun run db:generate
```

This will update your `types/supabase.ts` file with the latest database schema.

## Troubleshooting

### Common Issues

1. **Connection Error**: Double-check your environment variables
2. **RLS Errors**: Make sure you're using the service role key for server-side operations
3. **Auth Issues**: Verify your BETTER_AUTH_SECRET is at least 32 characters
4. **CORS Issues**: Ensure your domain is added to Supabase allowed origins (Settings → API → CORS)

### Useful Supabase Dashboard Sections

- **Table Editor**: View and edit your data
- **SQL Editor**: Run custom queries
- **Authentication**: Manage users and auth settings
- **Storage**: File uploads (if you add this feature later)
- **Edge Functions**: Serverless functions (for advanced features)
- **Logs**: Debug issues with real-time logs

## Next Steps

Once Supabase is set up:

1. **Test Authentication**: Try signing up and signing in
2. **Create Documents**: Test document creation and editing
3. **Set Up OAuth** (optional): Configure GitHub/Google OAuth
4. **Deploy**: Set up production environment variables for deployment

## Production Considerations

When deploying to production:

1. **Environment Variables**: Update URLs to your production domain
2. **OAuth Callbacks**: Update OAuth provider callback URLs
3. **CORS Settings**: Add your production domain to Supabase CORS settings
4. **Database Backups**: Enable automatic backups in Supabase
5. **Monitoring**: Set up alerts for database usage and errors

## Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
3. Check your browser's developer console for errors
4. Review Supabase logs in the dashboard 