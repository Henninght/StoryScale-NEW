/**
 * Dashboard Types - TypeScript interfaces for dashboard components
 */

export interface MetricData {
  icon: React.ComponentType<{ className?: string }>
  title: string
  value: string | number
  subtitle: string
  color: 'purple' | 'green' | 'blue'
}

export interface WorkItem {
  id: string
  title: string
  target: string
  purpose: string
  status: 'Draft' | 'Published' | 'Archived'
  lastEdited: string
  actions?: {
    edit?: boolean
    delete?: boolean
    duplicate?: boolean
  }
}

export interface DashboardStats {
  totalPosts: number
  timeSaved: {
    hours: number
    minutes: number
  }
  completionRate: number
  postTypes: {
    thoughtLeadership: number
    personalStories: number  
    promotional: number
  }
  recentActivity: Array<{
    id: string
    title: string
    action: 'created' | 'edited' | 'published'
    timestamp: string
  }>
}

export interface StatusPillProps {
  status: WorkItem['status']
  className?: string
}