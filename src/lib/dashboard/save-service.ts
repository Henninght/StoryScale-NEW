/**
 * Save Service - Handles saving generated content to dashboard
 * Manages saved posts for authenticated users
 */

import { WorkItem } from '@/types/dashboard'

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
        // TODO: Save to database for authenticated users
        // For now, save to localStorage
        await this.saveToLocalStorage(savedPost)
      } else {
        // Save to localStorage for guest users
        await this.saveToLocalStorage(savedPost)
      }

      return { success: true, postId: savedPost.id }
    } catch (error) {
      console.error('Save post error:', error)
      return { success: false, error: 'Failed to save post' }
    }
  }

  /**
   * Save post to localStorage
   */
  private static async saveToLocalStorage(post: SavedPost): Promise<void> {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        throw new Error('Cannot save to localStorage on server side')
      }
      
      const existingPosts = this.getSavedPosts()
      const updatedPosts = [post, ...existingPosts]
      
      // Keep only the last 50 posts to avoid storage bloat
      const limitedPosts = updatedPosts.slice(0, 50)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedPosts))
    } catch (error) {
      throw new Error('Failed to save to localStorage')
    }
  }

  /**
   * Get all saved posts
   */
  static getSavedPosts(): SavedPost[] {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return []
      }
      
      const posts = localStorage.getItem(this.STORAGE_KEY)
      if (!posts) return []
      
      const parsed = JSON.parse(posts)
      
      // Convert date strings back to Date objects
      return parsed.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        lastEdited: new Date(post.lastEdited)
      }))
    } catch (error) {
      console.error('Get saved posts error:', error)
      return []
    }
  }

  /**
   * Get a specific saved post by ID
   */
  static getSavedPost(postId: string): SavedPost | null {
    const posts = this.getSavedPosts()
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
      
      const posts = this.getSavedPosts()
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
      
      const posts = this.getSavedPosts()
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
  static getSavedPostsAsWorkItems(): WorkItem[] {
    const posts = this.getSavedPosts()
    
    return posts.map(post => ({
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
  static getStats() {
    const posts = this.getSavedPosts()
    
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