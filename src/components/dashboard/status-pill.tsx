/**
 * StatusPill Component - Colored status indicators for work items
 * Matches design reference status pills exactly
 */

import { StatusPillProps } from '@/types/dashboard'

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'Published': 
        return 'bg-blue-100 text-blue-800'
      case 'Archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${getStatusStyles()}
      ${className}
    `}>
      {status}
    </span>
  )
}