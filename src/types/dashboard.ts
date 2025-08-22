/**
 * Dashboard Types - TypeScript interfaces for dashboard components
 */

import { PostLength } from './wizard'

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
  postLength?: PostLength
  content?: string
  wizardSettings?: {
    purpose?: string
    audience?: string
    tone?: string
    format?: string
    length?: PostLength
    enableResearch?: boolean
    outputLanguage?: 'en' | 'no'
    description?: string
    [key: string]: any
  }
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