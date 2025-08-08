# Database Setup Guide

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose your organization
4. Set project name: `storyscale`
5. Generate a strong database password
6. Select region closest to your users
7. Wait for project to initialize (~2 minutes)

## Step 2: Get Connection Details

1. Go to Project Settings → API
2. Copy the following values to `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Execute Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Copy ALL SQL from `/storyscale-v3/database.md` lines 82-633
3. Execute the complete schema in this order:
   - Users table and policies
   - Documents table and policies  
   - Sources table and policies
   - User patterns and templates tables
   - All indexes and functions

## Step 4: Enable Google OAuth

1. Go to Authentication → Providers
2. Enable Google provider
3. Add authorized redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourapp.vercel.app/auth/callback` (production)

## Step 5: Test Connection

Run the health check to verify everything is connected:
```bash
npm run dev
curl http://localhost:3000/api/health
```

## Next Steps

Once database is set up, we can continue with:
- AI Provider Integration (Phase 2.1)
- Agent Pipeline Implementation (Phase 2.2)
- Research Attribution System (Phase 2.3)

## Database Schema Reference

The complete schema is available in `/storyscale-v3/database.md`:
- Lines 82-167: Documents table with full-text search
- Lines 176-214: Sources table for research attribution  
- Lines 225-261: User patterns for AI learning
- Lines 263-306: Templates generated from patterns
- Lines 459-509: Row Level Security policies