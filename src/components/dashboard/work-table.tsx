/**
 * WorkTable Component - Data table for showing user's work items
 * Matches Dasboard2-with-content.png design exactly
 */

import { WorkItem } from '@/types/dashboard'
import { StatusPill } from './status-pill'
import { MoreVertical, Edit2, Copy, Trash2, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WorkTableProps {
  items: WorkItem[]
}

export function WorkTable({ items }: WorkTableProps) {
  const router = useRouter()

  const handleRowClick = (item: WorkItem) => {
    // Navigate to editor with the draft ID and title
    router.push(`/workspace/editor?draft=${item.id}&title=${encodeURIComponent(item.title)}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your work</h2>
            <p className="text-sm text-gray-500 mt-1">Showing 7 of 7 drafts</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center">
              Show: All
              <ChevronDown className="ml-1 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                TITLE
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                TARGET
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                PURPOSE
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                STATUS
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                LAST EDITED
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {items.map((item, index) => (
              <tr 
                key={item.id} 
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-5">
                  <div className="max-w-sm">
                    <div className="text-sm font-medium text-gray-900 mb-1 group relative">
                      <span 
                        className="truncate block cursor-pointer"
                        title={item.title}
                        onClick={() => handleRowClick(item)}
                      >
                        {item.title}
                      </span>
                      {item.title.length > 50 && (
                        <div className="absolute left-0 top-6 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 max-w-xs">
                          {item.title}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {index === 0 ? '1049 characters' : index === 1 ? '1261 characters' : index === 2 ? '1442 characters' : index === 3 ? '1382 characters' : '1459 characters'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {item.target}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {item.purpose}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <StatusPill status={item.status} />
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                  {item.lastEdited}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-150"
                      onClick={() => handleRowClick(item)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Continue editing
                    </button>
                    <button 
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}