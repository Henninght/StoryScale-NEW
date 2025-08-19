/**
 * EmptyState Component - Shows when user has no saved posts yet
 * Matches Dasboard1.png empty state design
 */

import { FileText, Plus } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="text-center py-12">
      {/* Icon */}
      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>
      
      {/* Text */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No saved posts yet
      </h3>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        Create your first LinkedIn post to see it here
      </p>
      
      {/* Call to Action */}
      <button 
        className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-150"
        onClick={() => window.location.href = '/workspace/linkedin'}
      >
        <Plus className="w-4 h-4 mr-2" />
        Create First Post
      </button>
    </div>
  )
}