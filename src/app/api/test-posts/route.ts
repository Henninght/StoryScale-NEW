import { NextResponse } from 'next/server'
import { SaveService } from '@/lib/dashboard/save-service'

export async function GET() {
  try {
    // Create mock posts
    SaveService.createMockSavedPosts()
    
    // Get all saved posts
    const posts = await SaveService.getSavedPosts()
    
    // Get a specific post by ID
    const post1 = await SaveService.getSavedPost('1')
    const post2 = await SaveService.getSavedPost('2')
    
    return NextResponse.json({
      success: true,
      totalPosts: posts.length,
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        hasContent: !!p.content,
        contentLength: p.content?.length || 0,
        hasWizardSettings: !!p.wizardSettings
      })),
      post1: post1 ? {
        id: post1.id,
        title: post1.title,
        hasContent: !!post1.content,
        contentLength: post1.content?.length || 0,
        contentPreview: post1.content?.substring(0, 100) + '...'
      } : null,
      post2: post2 ? {
        id: post2.id,
        title: post2.title,
        hasContent: !!post2.content,
        contentLength: post2.content?.length || 0,
        contentPreview: post2.content?.substring(0, 100) + '...'
      } : null
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}