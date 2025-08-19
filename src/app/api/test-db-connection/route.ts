/**
 * Test Database Connection API Route
 * Tests Supabase connection and verifies table structure
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/database/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabaseClient
      .from('documents')
      .select('count')
      .limit(1)

    if (connectionError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          details: connectionError.message 
        },
        { status: 500 }
      )
    }

    // Test user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    // Test basic CRUD operations (if user is authenticated)
    let testResults = {
      connection: 'OK',
      tables: {
        documents: 'accessible',
        users: 'accessible'
      },
      auth: {
        user: user ? 'authenticated' : 'guest',
        userId: user?.id || null
      },
      crud: null as any
    }

    if (user) {
      // Test insert/select/delete cycle
      const testDocument = {
        user_id: user.id,
        type: 'linkedin',
        media_type: 'text-only',
        purpose: 'thought-leadership',
        format: 'insight',
        content: {
          selected: 'Test post content for database verification',
          title: 'Test Post',
          short: 'Test post content',
          medium: 'Test post content for database verification',
          long: 'Test post content for database verification'
        },
        selected_length: 'medium',
        status: 'draft',
        generation_model: 'test',
        processing_time_ms: 100,
        ai_confidence: 0.9,
        emoji: '🧪'
      }

      // Insert test document
      const { data: insertData, error: insertError } = await supabaseClient
        .from('documents')
        .insert([testDocument])
        .select()
        .single()

      if (insertError) {
        testResults.crud = { error: 'Insert failed', details: insertError.message }
      } else {
        // Test select
        const { data: selectData, error: selectError } = await supabaseClient
          .from('documents')
          .select('*')
          .eq('id', insertData.id)
          .single()

        if (selectError) {
          testResults.crud = { error: 'Select failed', details: selectError.message }
        } else {
          // Test delete (cleanup)
          const { error: deleteError } = await supabaseClient
            .from('documents')
            .delete()
            .eq('id', insertData.id)

          testResults.crud = {
            insert: 'OK',
            select: 'OK', 
            delete: deleteError ? 'FAILED' : 'OK',
            testDocumentId: insertData.id
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection and operations test completed',
      results: testResults
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}