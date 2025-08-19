/**
 * MetricCard Component - Dashboard metric cards with icons and values
 * Matches design reference styling exactly
 */

import { MetricData } from '@/types/dashboard'

interface MetricCardProps {
  data: MetricData
}

export function MetricCard({ data }: MetricCardProps) {
  const { icon: Icon, title, value, subtitle, color } = data

  // Icon color classes based on design tokens
  const iconColorClasses = {
    purple: 'text-purple-600 bg-purple-100',
    green: 'text-green-600 bg-green-100', 
    blue: 'text-blue-600 bg-blue-100'
  }

  // Value color classes
  const valueColorClasses = {
    purple: 'text-purple-600',
    green: 'text-green-600',
    blue: 'text-blue-600'
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      {/* Icon and Title */}
      <div className="flex items-center mb-4">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center mr-3
          ${iconColorClasses[color]}
        `}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{title === 'Post Types' ? 'Content Type Breakdown' : title === 'Draft Completion' ? 'Draft Completion Rate' : 'AI Productivity Impact'}</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        {title === 'Post Types' ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">📊 General Content</span>
                <span className="text-sm font-medium text-blue-600">50%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">👑 Authority Building</span>
                <span className="text-sm font-medium text-orange-600">33%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '33%' }}></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">💎 Value-driven</span>
                <span className="text-sm font-medium text-green-600">17%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '17%' }}></div>
              </div>
            </div>
          </div>
        ) : title === 'Draft Completion' ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">7 drafts started</span>
              <span className="text-sm text-gray-400">•</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">2 completed</span>
              <span className="text-sm text-gray-400">•</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">5 pending</span>
              <span className="text-sm text-gray-400">•</span>
            </div>
            <div className="mt-2 text-xs text-red-600">⚠️ Finish your drafts to stay consistent!</div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Time Saved:</span>
              <span className="text-sm font-semibold text-green-600">5h 6m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Time Saved per Post:</span>
              <span className="text-sm text-gray-500">51min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Productive Day:</span>
              <span className="text-sm text-gray-500">Friday</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}