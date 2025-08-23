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
  wizardSettings?: {
    purpose?: string
    audience?: string
    tone?: string
    format?: string
    length?: string
    enableResearch?: boolean
    outputLanguage?: 'en' | 'no'
    description?: string
    [key: string]: any
  }
}

export class SaveService {
  private static readonly STORAGE_KEY = 'storyscale_saved_posts'
  private static cachedPosts: SavedPost[] | null = null
  private static cacheTimestamp = 0
  private static cachedUserId: string | null = null // Track which user the cache belongs to
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
      wizardSettings?: {
        purpose?: string
        audience?: string
        tone?: string
        format?: string
        length?: string
        enableResearch?: boolean
        outputLanguage?: 'en' | 'no'
        description?: string
        [key: string]: any
      }
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
        metadata,
        wizardSettings: options?.wizardSettings
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
        emoji: '📝', // Default emoji, can be improved later
        wizard_settings: post.wizardSettings || null
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
   * Get current authenticated user - DEPRECATED: Use passed user object instead
   * Only use this as a fallback when no user is provided
   */
  private static async getCurrentUserFallback() {
    try {
      console.log('👤👤👤 SAVE SERVICE: getCurrentUserFallback - Starting fallback auth check')
      
      if (!supabaseClient) {
        console.error('👤👤👤 SAVE SERVICE: Supabase client is null - environment variables missing?')
        return null
      }
      
      // Use getSession instead of getUser to avoid unnecessary network requests
      // and potential session invalidation
      const { data: { session }, error } = await supabaseClient.auth.getSession()
      console.log('👤👤👤 SAVE SERVICE: getCurrentUserFallback - Got session response, error:', !!error)
      console.log('👤👤👤 SAVE SERVICE: getCurrentUserFallback - Got session:', !!session)
      
      if (error) {
        console.error('👤👤👤 SAVE SERVICE: Get session error:', error)
        return null
      }
      
      const user = session?.user || null
      console.log('👤👤👤 SAVE SERVICE: getCurrentUserFallback - Returning user:', user ? 'authenticated' : 'null')
      return user
    } catch (error) {
      console.error('👤👤👤 SAVE SERVICE: Get current user fallback error:', error)
      return null
    }
  }

  /**
   * Get all saved posts - from database for authenticated users, localStorage for guests
   * @param providedUser Optional user object to avoid auth conflicts
   */
  static async getSavedPosts(providedUser?: any): Promise<SavedPost[]> {
    try {
      console.log('📥📥📥 SAVE SERVICE: getSavedPosts called with providedUser:', providedUser?.email || 'none')
      
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        console.log('📥📥📥 SAVE SERVICE: Server side, returning empty array')
        return []
      }

      let user = providedUser
      
      // Only do fallback auth check if no user provided (avoid auth conflicts)
      if (!user) {
        console.log('📥📥📥 SAVE SERVICE: No user provided, checking fallback auth...')
        
        const startTime = Date.now()
        
        try {
          // Use fallback auth check only when necessary
          user = await this.getCurrentUserFallback()
          const elapsed = Date.now() - startTime
          console.log('📥📥📥 SAVE SERVICE: Fallback user check result:', user ? `authenticated (${user.email})` : 'guest', `(took ${elapsed}ms)`)
          console.log('📥📥📥 SAVE SERVICE: User ID:', user?.id || 'none')
        } catch (authError) {
          const elapsed = Date.now() - startTime
          console.log('📥📥📥 SAVE SERVICE: Fallback auth check failed, defaulting to guest mode:', authError, `(took ${elapsed}ms)`)
          user = null
        }
      } else {
        console.log('📥📥📥 SAVE SERVICE: Using provided user:', user.email, 'ID:', user.id)
      }

      // Check cache with user-specific validation
      const now = Date.now()
      const cacheUserId = user?.id || 'guest'
      const isCacheValid = this.cachedPosts && 
                          this.cachedUserId === cacheUserId && 
                          (now - this.cacheTimestamp) < this.CACHE_DURATION

      if (isCacheValid) {
        console.log('📥📥📥 SAVE SERVICE: Returning cached posts for user:', cacheUserId, 'count:', this.cachedPosts.length)
        return this.cachedPosts
      }
      
      if (user) {
        // Get posts from database for authenticated users
        console.log('📥📥📥 SAVE SERVICE: Getting posts from database for user:', user.id)
        
        // Check if we should migrate localStorage data to database
        const localStoragePosts = this.getSavedPostsFromLocalStorage()
        if (localStoragePosts.length > 0) {
          console.log('📥📥📥 SAVE SERVICE: Found localStorage posts, migrating to database...')
          await this.migrateLocalStorageToDatabase(localStoragePosts, user.id)
        }
        
        const posts = await this.getSavedPostsFromDatabase(user.id)
        
        // Cache the result with user ID
        this.cachedPosts = posts
        this.cachedUserId = user.id
        this.cacheTimestamp = Date.now()
        
        return posts
      } else {
        // Get posts from localStorage for guest users
        console.log('📥📥📥 SAVE SERVICE: Getting posts from localStorage (guest mode)')
        const posts = this.getSavedPostsFromLocalStorage()
        console.log('📥📥📥 SAVE SERVICE: Retrieved posts count:', posts.length)
        
        // Cache the result for guest user
        this.cachedPosts = posts
        this.cachedUserId = 'guest'
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
      this.cachedUserId = 'guest'
      this.cacheTimestamp = Date.now()
      
      return posts
    }
  }

  /**
   * Get saved posts from database for authenticated users
   */
  private static async getSavedPostsFromDatabase(userId: string): Promise<SavedPost[]> {
    try {
      console.log('🗃️🗃️🗃️ SAVE SERVICE: getSavedPostsFromDatabase called for user:', userId)
      console.log('🗃️🗃️🗃️ SAVE SERVICE: About to query documents table...')
      
      // Query database without aggressive timeout to prevent session issues
      const { data: documents, error } = await supabaseClient
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'linkedin')
        .order('created_at', { ascending: false })

      console.log('🗃️🗃️🗃️ SAVE SERVICE: Database query completed')
      console.log('🗃️🗃️🗃️ SAVE SERVICE: Error:', error)
      console.log('🗃️🗃️🗃️ SAVE SERVICE: Documents found:', documents?.length || 0)
      console.log('🗃️🗃️🗃️ SAVE SERVICE: Raw documents:', documents)

      if (error) {
        console.error('🗃️🗃️🗃️ SAVE SERVICE: Database fetch error:', error)
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
        },
        wizardSettings: doc.wizard_settings || undefined
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
   * @param postId The ID of the post to retrieve
   * @param providedUser Optional user object to avoid auth conflicts
   */
  static async getSavedPost(postId: string, providedUser?: any): Promise<SavedPost | null> {
    console.log('🔍 getSavedPost: Looking for post with ID:', postId, 'with providedUser:', providedUser?.email || 'none')
    const posts = await this.getSavedPosts(providedUser)
    console.log('🔍 getSavedPost: Available posts:', posts.map(p => ({ id: p.id, title: p.title, hasContent: !!p.content })))
    const foundPost = posts.find(post => post.id === postId)
    console.log('🔍 getSavedPost: Found post:', foundPost ? { id: foundPost.id, title: foundPost.title, hasContent: !!foundPost.content, contentLength: foundPost.content?.length } : 'NOT FOUND')
    return foundPost || null
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
   * Get saved posts with explicit user (bypasses auth timeout issues)
   */
  static async getSavedPostsWithUser(user?: any): Promise<SavedPost[]> {
    try {
      console.log('📥🔄📥 SAVE SERVICE: getSavedPostsWithUser called with user:', user?.email || 'guest')
      
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        console.log('📥🔄📥 SAVE SERVICE: Server side, returning empty array')
        return []
      }

      // Check cache with user-specific validation
      const now = Date.now()
      const cacheUserId = user?.id || 'guest'
      const isCacheValid = this.cachedPosts && 
                          this.cachedUserId === cacheUserId && 
                          (now - this.cacheTimestamp) < this.CACHE_DURATION

      if (isCacheValid) {
        console.log('📥🔄📥 SAVE SERVICE: Returning cached posts for user:', cacheUserId, 'count:', this.cachedPosts.length)
        return this.cachedPosts
      }
      
      if (user) {
        // Get posts from database for authenticated users
        console.log('📥🔄📥 SAVE SERVICE: Getting posts from database for user:', user.id)
        
        // Check if we should migrate localStorage data to database
        const localStoragePosts = this.getSavedPostsFromLocalStorage()
        if (localStoragePosts.length > 0) {
          console.log('📥🔄📥 SAVE SERVICE: Found localStorage posts, migrating to database...')
          await this.migrateLocalStorageToDatabase(localStoragePosts, user.id)
        }
        
        const posts = await this.getSavedPostsFromDatabase(user.id)
        
        // Cache the result with user ID
        this.cachedPosts = posts
        this.cachedUserId = user.id
        this.cacheTimestamp = Date.now()
        
        return posts
      } else {
        // Get posts from localStorage for guest users
        console.log('📥🔄📥 SAVE SERVICE: Getting posts from localStorage (guest mode)')
        const posts = this.getSavedPostsFromLocalStorage()
        console.log('📥🔄📥 SAVE SERVICE: Retrieved posts count:', posts.length)
        
        // Cache the result for guest user
        this.cachedPosts = posts
        this.cachedUserId = 'guest'
        this.cacheTimestamp = Date.now()
        
        return posts
      }
    } catch (error) {
      console.error('📥🔄📥 SAVE SERVICE: Get saved posts with user error:', error)
      // Fallback to localStorage if database fails
      console.log('📥🔄📥 SAVE SERVICE: Falling back to localStorage due to error')
      const posts = this.getSavedPostsFromLocalStorage()
      
      // Cache the fallback result
      this.cachedPosts = posts
      this.cachedUserId = 'guest'
      this.cacheTimestamp = Date.now()
      
      return posts
    }
  }

  /**
   * Convert saved posts to dashboard WorkItem format - with explicit user
   * @param providedUser Optional user object to avoid auth conflicts
   */
  static async getSavedPostsAsWorkItems(providedUser?: any): Promise<WorkItem[]> {
    console.log('🗂️🗂️🗂️ SAVE SERVICE: getSavedPostsAsWorkItems called with providedUser:', providedUser?.email || 'guest')
    const posts = await this.getSavedPosts(providedUser) // Use consistent getSavedPosts method
    console.log('🗂️🗂️🗂️ SAVE SERVICE: Got posts for conversion:', posts.length)
    
    const workItems = posts.map(post => ({
      id: post.id,
      title: post.title,
      target: post.target,
      purpose: post.purpose,
      status: post.status,
      lastEdited: this.formatTimeAgo(post.lastEdited),
      content: post.content,
      wizardSettings: post.wizardSettings,
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

  /**
   * Migrate localStorage posts to database for newly authenticated users
   */
  private static async migrateLocalStorageToDatabase(localPosts: SavedPost[], userId: string): Promise<void> {
    try {
      console.log('🔄 SAVE SERVICE: Starting migration of', localPosts.length, 'localStorage posts to database')
      
      // Get existing posts from database to avoid duplicates
      const existingPosts = await this.getSavedPostsFromDatabase(userId)
      const existingTitles = new Set(existingPosts.map(p => p.title))
      
      // Filter out posts that already exist in database
      const postsToMigrate = localPosts.filter(post => !existingTitles.has(post.title))
      
      console.log('🔄 SAVE SERVICE: After deduplication, migrating', postsToMigrate.length, 'unique posts')
      
      // Save each post to database
      let migratedCount = 0
      for (const post of postsToMigrate) {
        try {
          await this.saveToDatabase(post, userId)
          migratedCount++
        } catch (error) {
          console.error('🔄 SAVE SERVICE: Failed to migrate post:', post.title, error)
        }
      }
      
      console.log('🔄 SAVE SERVICE: Successfully migrated', migratedCount, 'posts to database')
      
      // Clear localStorage after successful migration
      if (migratedCount > 0) {
        console.log('🔄 SAVE SERVICE: Clearing localStorage after successful migration')
        localStorage.removeItem(this.STORAGE_KEY)
      }
      
    } catch (error) {
      console.error('🔄 SAVE SERVICE: Migration failed:', error)
      // Don't clear localStorage if migration failed
    }
  }

  /**
   * Clear localStorage data (useful when switching between guest and authenticated modes)
   */
  static clearLocalStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY)
        console.log('🗑️ SAVE SERVICE: localStorage cleared')
      }
    } catch (error) {
      console.error('🗑️ SAVE SERVICE: Failed to clear localStorage:', error)
    }
  }

  /**
   * Clear cache to force fresh data fetch
   */
  static async clearCache() {
    this.cachedPosts = null
    this.cachedUserId = null
    this.cacheTimestamp = 0
    console.log('🗑️🗑️🗑️ SAVE SERVICE: Cache cleared, forcing fresh auth check')
  }

  /**
   * Create mock saved posts for testing (development only)
   */
  static createMockSavedPosts(): void {
    if (typeof window === 'undefined') return
    
    console.log('🎭 MOCK: Creating mock saved posts...')
    
    // Clear existing posts first
    localStorage.removeItem(this.STORAGE_KEY)
    
    const mockPosts: SavedPost[] = [
      {
        id: '1',
        title: 'When OpenAI\'s CEO Sam Altman says...',
        content: `When OpenAI's CEO Sam Altman says "AGI could be achieved within the next few years," it's not just a prediction—it's a roadmap.

Here's what this means for professionals:

🧠 **The Skills Revolution**
• Critical thinking becomes more valuable than memorization
• Human creativity and empathy can't be automated
• Continuous learning isn't optional—it's survival

💼 **Industry Transformation**
• Legal: AI will draft contracts, lawyers will focus on strategy
• Healthcare: AI will diagnose, doctors will focus on patient care
• Education: AI will personalize learning, teachers will mentor and inspire

🤖 **The Partnership Model**
Stop thinking "AI vs Humans"
Start thinking "AI + Humans = Exponential Results"

The question isn't whether AGI will change your industry.
The question is: Will you be ready to lead that change?

What's your take? How are you preparing for this shift?

#AI #Leadership #FutureOfWork #AGI #Innovation`,
        purpose: 'Thought Leadership',
        target: 'Professionals',
        status: 'Draft',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        lastEdited: new Date(Date.now() - 4 * 60 * 60 * 1000),
        metadata: {
          characterCount: 1024,
          wordCount: 156,
          hashtagCount: 5,
          modelUsed: 'claude-3-5-sonnet',
          processingTime: 3500,
          qualityScore: 0.92
        },
        wizardSettings: {
          purpose: 'share-insights',
          description: 'Discussing AGI implications for professionals',
          audience: 'professionals',
          tone: 'professional',
          format: 'modern',
          length: 'medium',
          outputLanguage: 'en',
          enableResearch: true
        }
      },
      {
        id: '2',
        title: '🤖 The AI revolution isn\'t just coming...',
        content: `🤖 The AI revolution isn't just coming—it's here.

And it's changing how we think about productivity forever.

I just spent 15 minutes with Claude to:
✅ Draft a complete project proposal
✅ Create a content calendar for next month
✅ Write 5 different email templates
✅ Generate ideas for team building activities

Tasks that used to take me hours now take minutes.

But here's the thing most people miss:

AI doesn't replace good thinking.
It amplifies it.

The professionals who thrive in the next decade won't be those who avoid AI.

They'll be those who learn to think WITH it.

What's one task you could automate today to free up time for higher-level thinking?

#ProductivityTips #AI #WorkSmarter #Leadership #Efficiency`,
        purpose: 'Value',
        target: 'Professionals',
        status: 'Draft',
        createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago
        lastEdited: new Date(Date.now() - 14 * 60 * 60 * 1000),
        metadata: {
          characterCount: 756,
          wordCount: 132,
          hashtagCount: 5,
          modelUsed: 'claude-3-5-sonnet',
          processingTime: 2800,
          qualityScore: 0.88
        },
        wizardSettings: {
          purpose: 'offer-value',
          description: 'Share AI productivity insights',
          audience: 'professionals',
          tone: 'conversational',
          format: 'modern',
          length: 'short',
          outputLanguage: 'en',
          enableResearch: false
        }
      }
    ]

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mockPosts))
    console.log('🎭 MOCK: Created mock saved posts for testing')
    
    // Clear cache to force fresh load
    this.cachedPosts = null
    this.cacheTimestamp = 0
    
    // Verify the posts were saved correctly
    const verification = localStorage.getItem(this.STORAGE_KEY)
    if (verification) {
      const parsed = JSON.parse(verification)
      console.log('🎭 MOCK: Verification - saved', parsed.length, 'posts')
      console.log('🎭 MOCK: Post 1 content length:', parsed[0]?.content?.length || 0)
      console.log('🎭 MOCK: Post 2 content length:', parsed[1]?.content?.length || 0)
    } else {
      console.error('🎭 MOCK: ERROR - Failed to save posts to localStorage')
    }
  }
}