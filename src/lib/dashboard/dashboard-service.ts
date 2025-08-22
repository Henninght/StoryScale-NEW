/**
 * Dashboard Service - Data fetching and calculations for dashboard
 * Integrates with document_performance table for metrics
 */

import { DashboardStats, WorkItem } from '@/types/dashboard'
import { PostLength } from '@/types/wizard'

export class DashboardService {
  
  /**
   * Get dashboard statistics for a user
   */
  static async getDashboardStats(userId?: string): Promise<DashboardStats> {
    // Simplified - return mock data directly
    return Promise.resolve(this.getMockDashboardStats())
  }

  /**
   * Get work items for the dashboard table
   */
  static async getWorkItems(userId?: string): Promise<WorkItem[]> {
    // Simplified - return mock data directly
    return Promise.resolve(this.getMockWorkItems())
  }

  /**
   * Time savings mapping for different post lengths
   * Based on typical time to manually create content
   */
  static readonly TIME_SAVINGS_MAP = {
    short: 25,   // 25 minutes for short posts (quick thoughts, simple updates)
    medium: 45,  // 45 minutes for medium posts (standard LinkedIn posts)
    long: 75     // 75 minutes for long posts (detailed articles, storytelling)
  } as const

  /**
   * Calculate time saved based on post lengths
   * @param posts Array of work items with post lengths, or just a count for backward compatibility
   */
  static calculateTimeSaved(posts: WorkItem[] | number): { hours: number; minutes: number } {
    let totalMinutes = 0
    
    if (typeof posts === 'number') {
      // Backward compatibility: assume all posts are medium length
      totalMinutes = posts * this.TIME_SAVINGS_MAP.medium
    } else {
      // Calculate based on actual post lengths
      totalMinutes = posts.reduce((total, post) => {
        const postLength = post.postLength || 'medium' // Default to medium if not specified
        return total + this.TIME_SAVINGS_MAP[postLength]
      }, 0)
    }
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return { hours, minutes }
  }

  /**
   * Mock dashboard statistics - matches design reference data
   */
  private static getMockDashboardStats(): DashboardStats {
    const mockPosts = this.getMockWorkItems()
    
    return {
      totalPosts: mockPosts.length,
      timeSaved: this.calculateTimeSaved(mockPosts),
      completionRate: 70, // 70% completion rate
      postTypes: {
        thoughtLeadership: 60, // 60%
        personalStories: 30,   // 30% 
        promotional: 10        // 10%
      },
      recentActivity: [
        {
          id: '1',
          title: 'The AI revolution isn\'t just coming...',
          action: 'created',
          timestamp: '2h ago'
        },
        {
          id: '2', 
          title: 'When OpenAI\'s CEO Sam Altman sa...',
          action: 'edited',
          timestamp: '1d ago'
        },
        {
          id: '3',
          title: 'When OpenAI\'s CEO Sam Altman sa...',
          action: 'created', 
          timestamp: '1d ago'
        }
      ]
    }
  }

  /**
   * Mock work items - matches design reference data exactly
   */
  private static getMockWorkItems(): WorkItem[] {
    return [
      {
        id: '1',
        title: 'When OpenAI\'s CEO Sam Altman says ...',
        target: 'General',
        purpose: 'Thought Leadership',
        status: 'Published',
        lastEdited: '4h ago',
        postLength: 'long'
      },
      {
        id: '2', 
        title: '🤖 When OpenAI\'s CEO Sam Altman sa...',
        target: 'General',
        purpose: 'Question',
        status: 'Draft',
        lastEdited: '13h ago',
        postLength: 'short'
      },
      {
        id: '3',
        title: '🤖 When OpenAI\'s CEO Sam Altman sa...',
        target: 'General',
        purpose: 'Thought Leadership',
        status: 'Draft', 
        lastEdited: '14h ago',
        postLength: 'medium'
      },
      {
        id: '4',
        title: '🤖 The AI revolution isn\'t just coming - ...',
        target: 'Professionals',
        purpose: 'Value',
        status: 'Draft',
        lastEdited: '14h ago',
        postLength: 'long'
      },
      {
        id: '5',
        title: '🤖 The AI revolution isn\'t just changing...',
        target: 'Developers', 
        purpose: 'Authority',
        status: 'Draft',
        lastEdited: '15h ago',
        postLength: 'medium'
      }
    ]
  }
}