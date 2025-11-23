# DoTheThing - Setup Instructions

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier is fine)

## 1. Clone the Repository

```bash
git clone <repository-url>
cd dothething
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:**
1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## 4. Run Database Migrations

Go to your Supabase Dashboard SQL Editor and run the migration scripts in order:

1. `supabase/migrations/001_create_tables.sql`
2. `supabase/migrations/002_create_indexes.sql`
3. `supabase/migrations/003_create_triggers.sql`
4. `supabase/migrations/004_enable_rls.sql`
5. `supabase/migrations/005_create_rls_policies.sql`

See `supabase/migrations/README.md` for detailed instructions.

## 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 - you should see "Database Connected" if everything is set up correctly.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run preview` - Preview production build

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Make sure `.env.local` exists and has the correct values
- Restart the dev server after creating/editing `.env.local`

**Error: "relation 'tags' does not exist"**
- You need to run the SQL migrations in Supabase Dashboard
- See step 4 above and `supabase/migrations/README.md`

**Database connection fails**
- Verify your Supabase credentials are correct
- Check that RLS is enabled and policies are created
- Make sure your Supabase project is active
