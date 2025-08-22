/**
 * Database Check API - Check database connection and table status
 */

import { supabaseClient } from '@/lib/database/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)

    if (connectionError) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Database connection failed',
        error: connectionError.message 
      }, { status: 500 })
    }

    // Check specifically for users table
    const { data: usersTable, error: usersError } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')

    const hasUsersTable = usersTable && usersTable.length > 0

    // Test auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    return NextResponse.json({
      status: 'connected',
      tables: connectionTest?.map(t => t.table_name) || [],
      hasUsersTable,
      currentUser: user?.email || null,
      authError: authError?.message || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Database check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}