/**
 * Database Setup API - Creates necessary tables if they don't exist
 */

import { supabaseClient } from '@/lib/database/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Check if users table exists
    const { data: tables, error: tablesError } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      return NextResponse.json({ error: 'Failed to check database tables' }, { status: 500 })
    }

    if (tables && tables.length === 0) {
      // Users table doesn't exist, create minimal version
      const { error: createError } = await supabaseClient.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE,
            provider TEXT DEFAULT 'google',
            subscription_tier TEXT DEFAULT 'free',
            quota_usage JSONB DEFAULT '{"documents": 0, "research_calls": 0}',
            preferences JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            migrated_from_guest BOOLEAN DEFAULT FALSE
          );

          -- Enable RLS
          ALTER TABLE users ENABLE ROW LEVEL SECURITY;

          -- Basic RLS policy
          CREATE POLICY "Users can view own record" ON users
            FOR SELECT USING (auth.uid() = id);

          CREATE POLICY "Users can update own record" ON users
            FOR UPDATE USING (auth.uid() = id);

          CREATE POLICY "Users can insert own record" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
        `
      })

      if (createError) {
        console.error('Error creating users table:', createError)
        return NextResponse.json({ error: 'Failed to create users table' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Users table created successfully',
        tablesCreated: ['users']
      })
    }

    return NextResponse.json({ 
      message: 'Database is already set up',
      tablesFound: tables.map(t => t.table_name)
    })

  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({ 
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}