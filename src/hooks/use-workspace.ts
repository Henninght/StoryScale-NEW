/**
 * useWorkspace Hook - Hook to access workspace context
 * Provides workspace state and actions
 */

'use client'

import { useContext } from 'react'
import { WorkspaceContext, WorkspaceContextValue } from '@/context/workspace-context'

// Hook to access workspace context
export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  
  return context
}