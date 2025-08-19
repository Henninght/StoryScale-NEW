/**
 * Breadcrumb Navigation - Displays current location within workspace
 * Shows navigation path with clickable links to parent sections
 */

'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useWorkspace } from '@/context/workspace-context'

export function BreadcrumbNavigation() {
  const { state } = useWorkspace()

  // Don't show breadcrumb on dashboard (home)
  if (state.currentView === 'dashboard' && state.breadcrumb.length === 1) {
    return (
      <div className="flex items-center">
        <HomeIcon className="h-5 w-5 text-gray-500" />
        <span className="ml-2 text-sm font-medium text-gray-900">Dashboard</span>
      </div>
    )
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {/* Home link */}
        <li>
          <div>
            <Link 
              href="/workspace" 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-150"
              aria-label="Dashboard"
            >
              <HomeIcon className="h-5 w-5" />
            </Link>
          </div>
        </li>

        {/* Breadcrumb items */}
        {state.breadcrumb.map((item, index) => {
          const isLast = index === state.breadcrumb.length - 1
          
          return (
            <Fragment key={item.label}>
              {/* Separator */}
              <li>
                <div className="flex items-center">
                  <ChevronRightIcon className="h-5 w-5 text-gray-300" />
                </div>
              </li>

              {/* Breadcrumb item */}
              <li>
                <div className="flex items-center">
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-150"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span 
                      className={`text-sm font-medium ${
                        isLast 
                          ? 'text-gray-900' 
                          : 'text-gray-500'
                      }`}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}