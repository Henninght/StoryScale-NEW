/**
 * Dashboard Service - Data fetching and calculations for dashboard
 * Integrates with document_performance table for metrics
 */

import { DashboardStats, WorkItem } from '@/types/dashboard'

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
   * Mock dashboard statistics - matches design reference data
   */
  private static getMockDashboardStats(): DashboardStats {
    return {
      totalPosts: 7,
      timeSaved: this.calculateTimeSaved(7),
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
        lastEdited: '4h ago'
      },
      {
        id: '2', 
        title: '🤖 When OpenAI\'s CEO Sam Altman sa...',
        target: 'General',
        purpose: 'Question',
        status: 'Draft',
        lastEdited: '13h ago'
      },
      {
        id: '3',
        title: '🤖 When OpenAI\'s CEO Sam Altman sa...',
        target: 'General',
        purpose: 'Thought Leadership',
        status: 'Draft', 
        lastEdited: '14h ago'
      },
      {
        id: '4',
        title: '🤖 The AI revolution isn\'t just coming - ...',
        target: 'Professionals',
        purpose: 'Value',
        status: 'Draft',
        lastEdited: '14h ago'
      },
      {
        id: '5',
        title: '🤖 The AI revolution isn\'t just changing...',
        target: 'Developers', 
        purpose: 'Authority',
        status: 'Draft',
        lastEdited: '15h ago'
      }
    ]
  }
}