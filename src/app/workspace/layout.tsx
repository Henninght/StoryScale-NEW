/**
 * Workspace Layout Route - Next.js App Router layout for workspace
 * Wraps all workspace pages with the WorkspaceLayout component
 */

import { Metadata } from 'next'
import { WorkspaceLayout } from '@/components/workspace/layout/workspace-layout'

export const metadata: Metadata = {
  title: 'Workspace - StoryScale',
  description: 'Create professional LinkedIn posts and marketing content with AI-powered tools',
}

interface WorkspaceLayoutProps {
  children: React.ReactNode
}

export default function WorkspaceLayoutRoute({ children }: WorkspaceLayoutProps) {
  return (
    <WorkspaceLayout>
      {children}
    </WorkspaceLayout>
  )
}