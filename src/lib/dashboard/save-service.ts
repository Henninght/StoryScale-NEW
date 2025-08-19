/**
 * Save Service - Handles saving generated content to dashboard
 * Manages saved posts for authenticated users
 */

import { WorkItem } from '@/types/dashboard'
import { supabaseClient } from '@/lib/database/supabase'

export interface SavedPost {
  id: string
  title: string
  content: string
  purpose: string
  target: string
  status: 'Draft' | 'Published' | 'Archived'
  createdAt: Date
  lastEdited: Date
  metadata: {
    characterCount: number
    wordCount: number
    hashtagCount: number
    modelUsed: string
    processingTime: number
    qualityScore?: number
  }
}

export class SaveService {
  private static readonly STORAGE_KEY = 'storyscale_saved_posts'
  private static cachedPosts: SavedPost[] | null = null
  private static cacheTimestamp = 0
  private static readonly CACHE_DURATION = 5000 // 5 seconds cache
  
  /**
   * Save a generated post to localStorage (guest mode) or database (authenticated)
   */
  static async savePost(
    content: string,
    metadata: {
      characterCount: number
      wordCount: number
      hashtagCount: number
      modelUsed: string
      processingTime: number
      qualityScore?: number
    },
    options?: {
      title?: string
      purpose?: string
      target?: string
      userId?: string
    }
  ): Promise<{ success: boolean; error?: string; postId?: string }> {
    try {
      console.log('🔥 SAVE SERVICE: Starting savePost')
      console.log('🔥 SAVE SERVICE: Content length:', content.length)
      console.log('🔥 SAVE SERVICE: Metadata:', metadata)
      console.log('🔥 SAVE SERVICE: Options:', options)
      console.log('🔥 SAVE SERVICE: User ID present:', !!options?.userId)
      console.log('🔥 SAVE SERVICE: Environment check - Supabase URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('🔥 SAVE SERVICE: Environment check - Supabase Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      // Generate title from content (first line or first 50 chars)
      const autoTitle = content.split('\n')[0].substring(0, 50).replace(/[^\w\s]/g, '').trim() + 
                       (content.length > 50 ? '...' : '')
      
      const savedPost: SavedPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: options?.title || autoTitle,
        content,
        purpose: options?.purpose || 'General',
        target: options?.target || 'Professionals',
        status: 'Draft',
        createdAt: new Date(),
        lastEdited: new Date(),
        metadata
      }

      if (options?.userId) {
        // Save to Supabase for authenticated users
        console.log('🔥 SAVE SERVICE: Saving to database for user:', options.userId)
        console.log('🔥 SAVE SERVICE: SavedPost object:', JSON.stringify(savedPost, null, 2))
        try {
          await this.saveToDatabase(savedPost, options.userId)
          console.log('🔥 SAVE SERVICE: Database save completed successfully')
        } catch (dbError) {
          console.error('🔥 SAVE SERVICE: Database save failed, falling back to localStorage:', dbError)
          // Fallback to localStorage if database save fails
          this.saveToLocalStorage(savedPost)
          console.log('🔥 SAVE SERVICE: Fallback localStorage save completed')
        }
      } else {
        // Save to localStorage for guest users
        console.log('🔥 SAVE SERVICE: Saving to localStorage (guest mode)')
        this.saveToLocalStorage(savedPost)
        console.log('🔥 SAVE SERVICE: localStorage save completed')
      }
      
      console.log('🔥 SAVE SERVICE: Save operation completed successfully')
      
      // Invalidate cache when new posts are saved
      this.cachedPosts = null
      this.cacheTimestamp = 0
      
      return { success: true, postId: savedPost.id }
    } catch (error) {
      console.error('🔥 SAVE SERVICE: Save post error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save post' 
      }
    }
  }

  /**
   * Save post to Supabase database for authenticated users
   */
  private static async saveToDatabase(post: SavedPost, userId: string): Promise<void> {
    try {
      // Map our SavedPost to the documents table structure
      const documentData = {
        user_id: userId,
        type: 'linkedin',
        media_type: 'text-only',
        purpose: this.mapPurposeToDatabase(post.purpose),
        format: this.mapFormatToDatabase(post.purpose),
        content: {
          selected: post.content,
          title: post.title,
          short: post.content, // For now, use same content for all lengths
          medium: post.content,
          long: post.content
        },
        selected_length: 'medium',
        status: post.status.toLowerCase(),
        generation_model: post.metadata.modelUsed,
        processing_time_ms: post.metadata.processingTime,
        ai_confidence: post.metadata.qualityScore || 0.8,
        emoji: '📝' // Default emoji, can be improved later
      }

      const { error } = await supabaseClient
        .from('documents')
        .insert([documentData])

      if (error) {
        console.error('Database save error:', error)
        throw new Error(`Failed to save to database: ${error.message}`)
      }
    } catch (error) {
      console.error('Save to database error:', error)
      throw error
    }
  }

  /**
   * Map purpose to database enum values
   */
  private static mapPurposeToDatabase(purpose: string): string {
    const purposeMap: Record<string, string> = {
      'Share Insights': 'thought-leadership',
      'Ask Question': 'question', 
      'Offer Value Exchange': 'value',
      'Share Story': 'thought-leadership',
      'Provide Solutions': 'thought-leadership',
      'Celebrate Success': 'thought-leadership',
      'General': 'thought-leadership'
    }
    return purposeMap[purpose] || 'thought-leadership'
  }

  /**
   * Map format to database enum values  
   */
  private static mapFormatToDatabase(purpose: string): string {
    const formatMap: Record<string, string> = {
      'Share Insights': 'insight',
      'Ask Question': 'question',
      'Offer Value Exchange': 'list',
      'Share Story': 'story',
      'Provide Solutions': 'howto',
      'Celebrate Success': 'story',
      'General': 'insight'
    }
    return formatMap[purpose] || 'insight'
  }

  /**
   * Save post to localStorage
   */
  private static saveToLocalStorage(post: SavedPost): void {
    try {
      console.log('🔥 SAVE SERVICE: Starting localStorage save...')
      
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        console.error('🔥 SAVE SERVICE: ERROR - Window is undefined (server side)')
        throw new Error('Cannot save to localStorage on server side')
      }
      
      console.log('🔥 SAVE SERVICE: Client side confirmed, getting existing posts...')
      const existingPosts = this.getSavedPostsFromLocalStorage()
      console.log('🔥 SAVE SERVICE: Existing posts count:', existingPosts.length)
      
      const updatedPosts = [post, ...existingPosts]
      console.log('🔥 SAVE SERVICE: Updated posts count:', updatedPosts.length)
      
      // Keep only the last 50 posts to avoid storage bloat
      const limitedPosts = updatedPosts.slice(0, 50)
      console.log('🔥 SAVE SERVICE: Limited posts count:', limitedPosts.length)
      
      console.log('🔥 SAVE SERVICE: Saving to localStorage with key:', this.STORAGE_KEY)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedPosts))
      console.log('🔥 SAVE SERVICE: localStorage save completed successfully')
      
      // Verify the save worked
      const verification = localStorage.getItem(this.STORAGE_KEY)
      console.log('🔥 SAVE SERVICE: Verification - localStorage now has:', verification ? 'data' : 'no data')
    } catch (error) {
      console.error('🔥 SAVE SERVICE: localStorage save error:', error)
      throw new Error('Failed to save to localStorage')
    }
  }

  /**
   * Get current authenticated user
   */
  private static async getCurrentUser() {
    try {
      console.log('👤👤👤 SAVE SERVICE: getCurrentUser - Starting auth check')
      const { data: { user }, error } = await supabaseClient.auth.getUser()
      console.log('👤👤👤 SAVE SERVICE: getCurrentUser - Got response, error:', !!error)
      console.log('👤👤👤 SAVE SERVICE: getCurrentUser - Got user:', !!user)
      if (error) {
        console.error('👤👤👤 SAVE SERVICE: Get user error:', error)
        return null
      }
      console.log('👤👤👤 SAVE SERVICE: getCurrentUser - Returning user:', user ? 'authenticated' : 'null')
      return user
    } catch (error) {
      console.error('👤👤👤 SAVE SERVICE: Get current user error:', error)
      return null
    }
  }

  /**
   * Get all saved posts - from database for authenticated users, localStorage for guests
   */
  static async getSavedPosts(): Promise<SavedPost[]> {
    try {
      console.log('📥📥📥 SAVE SERVICE: getSavedPosts called')
      
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        console.log('📥📥📥 SAVE SERVICE: Server side, returning empty array')
        return []
      }

      // Check cache first (but only for localStorage reads, not auth checks)
      const now = Date.now()
      if (this.cachedPosts && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
        console.log('📥📥📥 SAVE SERVICE: Returning cached posts:', this.cachedPosts.length)
        return this.cachedPosts
      }
      
      // Fast check: if localStorage has posts, we're likely in guest mode - skip auth check
      const hasLocalStorageData = !!localStorage.getItem(this.STORAGE_KEY)
      console.log('📥📥📥 SAVE SERVICE: Fast check - localStorage has data:', hasLocalStorageData)
      
      let user = null
      if (!hasLocalStorageData) {
        // Only do auth check if we don't have localStorage data (might be authenticated user)
        console.log('📥📥📥 SAVE SERVICE: Checking current user with timeout...')
        const startTime = Date.now()
        try {
          // Add timeout to prevent hanging
          const userPromise = this.getCurrentUser()
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth check timeout')), 1000)
          )
          user = await Promise.race([userPromise, timeoutPromise])
          const elapsed = Date.now() - startTime
          console.log('📥📥📥 SAVE SERVICE: User check result:', user ? 'authenticated' : 'guest', `(took ${elapsed}ms)`)
        } catch (authError) {
          const elapsed = Date.now() - startTime
          console.log('📥📥📥 SAVE SERVICE: Auth check failed/timeout, defaulting to guest mode:', authError.message, `(took ${elapsed}ms)`)
          user = null
        }
      } else {
        console.log('📥📥📥 SAVE SERVICE: Skipping auth check - using localStorage data for guest mode')
      }
      
      if (user) {
        // Get posts from database for authenticated users
        console.log('📥📥📥 SAVE SERVICE: Getting posts from database for user:', user.id)
        return await this.getSavedPostsFromDatabase(user.id)
      } else {
        // Get posts from localStorage for guest users
        console.log('📥📥📥 SAVE SERVICE: Getting posts from localStorage (guest mode)')
        const posts = this.getSavedPostsFromLocalStorage()
        console.log('📥📥📥 SAVE SERVICE: Retrieved posts count:', posts.length)
        
        // Cache the result
        this.cachedPosts = posts
        this.cacheTimestamp = Date.now()
        
        return posts
      }
    } catch (error) {
      console.error('📥📥📥 SAVE SERVICE: Get saved posts error:', error)
      // Fallback to localStorage if database fails
      console.log('📥📥📥 SAVE SERVICE: Falling back to localStorage due to error')
      const posts = this.getSavedPostsFromLocalStorage()
      
      // Cache the fallback result
      this.cachedPosts = posts
      this.cacheTimestamp = Date.now()
      
      return posts
    }
  }

  /**
   * Get saved posts from database for authenticated users
   */
  private static async getSavedPostsFromDatabase(userId: string): Promise<SavedPost[]> {
    try {
      const { data: documents, error } = await supabaseClient
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'linkedin')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database fetch error:', error)
        throw new Error(`Failed to fetch from database: ${error.message}`)
      }

      // Map database documents to SavedPost format
      return (documents || []).map((doc: any) => ({
        id: doc.id,
        title: doc.title || doc.content?.title || 'Untitled Post',
        content: doc.content?.selected || '',
        purpose: this.mapDatabasePurposeToLocal(doc.purpose),
        target: 'Professionals', // Default, can be enhanced later
        status: this.capitalizeFirst(doc.status) as 'Draft' | 'Published' | 'Archived',
        createdAt: new Date(doc.created_at),
        lastEdited: new Date(doc.updated_at),
        metadata: {
          characterCount: doc.character_count || doc.content?.selected?.length || 0,
          wordCount: Math.ceil((doc.content?.selected?.length || 0) / 5),
          hashtagCount: (doc.content?.selected?.match(/#\w+/g) || []).length,
          modelUsed: doc.generation_model || 'unknown',
          processingTime: doc.processing_time_ms || 0,
          qualityScore: doc.ai_confidence || 0.8
        }
      }))
    } catch (error) {
      console.error('Get posts from database error:', error)
      throw error
    }
  }

  /**
   * Get saved posts from localStorage for guest users
   */
  private static getSavedPostsFromLocalStorage(): SavedPost[] {
    try {
      console.log('🔍🔍🔍 SAVE SERVICE: getSavedPostsFromLocalStorage called')
      // Check if we're on the client side to avoid hydration issues
      if (typeof window === 'undefined') {
        console.log('🔍🔍🔍 SAVE SERVICE: Window is undefined, returning empty array')
        return []
      }
      
      console.log('🔍🔍🔍 SAVE SERVICE: Getting localStorage with key:', this.STORAGE_KEY)
      const posts = localStorage.getItem(this.STORAGE_KEY)
      console.log('🔍🔍🔍 SAVE SERVICE: Raw localStorage data:', posts ? 'found data' : 'no data')
      console.log('🔍🔍🔍 SAVE SERVICE: Raw data length:', posts?.length || 0)
      
      if (!posts) {
        console.log('🔍🔍🔍 SAVE SERVICE: No posts found, returning empty array')
        return []
      }
      
      const parsed = JSON.parse(posts)
      console.log('🔍🔍🔍 SAVE SERVICE: Parsed posts array length:', parsed.length)
      console.log('🔍🔍🔍 SAVE SERVICE: Parsed posts array:', parsed)
      
      // Convert date strings back to Date objects
      const convertedPosts = parsed.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        lastEdited: new Date(post.lastEdited)
      }))
      
      console.log('🔍🔍🔍 SAVE SERVICE: Returning converted posts count:', convertedPosts.length)
      return convertedPosts
    } catch (error) {
      console.error('🔍🔍🔍 SAVE SERVICE: Get saved posts from localStorage error:', error)
      return []
    }
  }

  /**
   * Map database purpose values back to local format
   */
  private static mapDatabasePurposeToLocal(purpose: string): string {
    const purposeMap: Record<string, string> = {
      'thought-leadership': 'Share Insights',
      'question': 'Ask Question',
      'value': 'Offer Value Exchange',
      'authority': 'Build Authority'
    }
    return purposeMap[purpose] || 'General'
  }

  /**
   * Capitalize first letter
   */
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * Get a specific saved post by ID
   */
  static async getSavedPost(postId: string): Promise<SavedPost | null> {
    const posts = await this.getSavedPosts()
    return posts.find(post => post.id === postId) || null
  }

  /**
   * Update a saved post
   */
  static async updatePost(
    postId: string, 
    updates: Partial<SavedPost>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return { success: false, error: 'Cannot update post on server side' }
      }
      
      const posts = await this.getSavedPosts()
      const postIndex = posts.findIndex(post => post.id === postId)
      
      if (postIndex === -1) {
        return { success: false, error: 'Post not found' }
      }

      posts[postIndex] = {
        ...posts[postIndex],
        ...updates,
        lastEdited: new Date()
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts))
      return { success: true }
    } catch (error) {
      console.error('Update post error:', error)
      return { success: false, error: 'Failed to update post' }
    }
  }

  /**
   * Delete a saved post
   */
  static async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return { success: false, error: 'Cannot delete post on server side' }
      }
      
      const posts = await this.getSavedPosts()
      const filteredPosts = posts.filter(post => post.id !== postId)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredPosts))
      return { success: true }
    } catch (error) {
      console.error('Delete post error:', error)
      return { success: false, error: 'Failed to delete post' }
    }
  }

  /**
   * Convert saved posts to dashboard WorkItem format
   */
  static async getSavedPostsAsWorkItems(): Promise<WorkItem[]> {
    console.log('🗂️🗂️🗂️ SAVE SERVICE: getSavedPostsAsWorkItems called')
    const posts = await this.getSavedPosts()
    console.log('🗂️🗂️🗂️ SAVE SERVICE: Got posts for conversion:', posts.length)
    
    const workItems = posts.map(post => ({
      id: post.id,
      title: post.title,
      target: post.target,
      purpose: post.purpose,
      status: post.status,
      lastEdited: this.formatTimeAgo(post.lastEdited),
      actions: {
        edit: true,
        delete: true,
        duplicate: true
      }
    }))
    
    console.log('🗂️🗂️🗂️ SAVE SERVICE: Converted to work items:', workItems.length)
    console.log('🗂️🗂️🗂️ SAVE SERVICE: Work items array:', workItems)
    return workItems
  }

  /**
   * Format timestamp to "time ago" format
   */
  private static formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`
    
    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths}mo ago`
  }

  /**
   * Get statistics for dashboard
   */
  static async getStats() {
    const posts = await this.getSavedPosts()
    
    return {
      totalPosts: posts.length,
      draftCount: posts.filter(p => p.status === 'Draft').length,
      publishedCount: posts.filter(p => p.status === 'Published').length,
      recentCount: posts.filter(p => {
        const dayAgo = new Date()
        dayAgo.setDate(dayAgo.getDate() - 1)
        return p.createdAt > dayAgo
      }).length
    }
  }

  /**
   * Calculate time saved based on average generation time
   * Reference: 51 minutes average per post saved
   */
  static calculateTimeSaved(postCount: number): { hours: number; minutes: number } {
    const totalMinutes = postCount * 51 // 51 min average per post
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return { hours, minutes }
  }
}