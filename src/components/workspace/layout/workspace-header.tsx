/**
 * Workspace Header - Top navigation bar with breadcrumb and tools dropdown
 * Contains mobile hamburger menu, breadcrumb navigation, and orange tools dropdown
 */

'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { 
  Bars3Icon, 
  ChevronDownIcon,
  PlusIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useWorkspace } from '@/context/workspace-context'
import { useResponsive } from '@/hooks/use-responsive'
import { BreadcrumbNavigation } from '../navigation/breadcrumb-navigation'

export function WorkspaceHeader() {
  const { state, toggleSidebar, navigate } = useWorkspace()
  const { isMobile, isTablet } = useResponsive()
  const shouldShowHamburger = isMobile || isTablet

  const toolsMenuItems = [
    {
      name: 'LinkedIn Post Wizard',
      description: 'Create engaging LinkedIn posts',
      href: '/workspace/linkedin',
      icon: PlusIcon,
    },
    {
      name: 'Content Editor',
      description: 'Edit and refine your content',
      href: '/workspace/editor',
      icon: PencilSquareIcon,
    },
    {
      name: 'Bulk Generator',
      description: 'Generate multiple posts at once',
      href: '/workspace/bulk',
      icon: DocumentDuplicateIcon,
    },
    {
      name: 'Settings',
      description: 'Manage your preferences',
      href: '/workspace/settings',
      icon: Cog6ToothIcon,
    },
  ]

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        {/* Left side - Mobile hamburger + Breadcrumb */}
        <div className="flex items-center space-x-4">
          {/* Mobile Hamburger Menu */}
          {shouldShowHamburger && (
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}

          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation />
        </div>

        {/* Right side - Tools Dropdown */}
        <div className="flex items-center">
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200">
              Tools
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {toolsMenuItems.map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <button
                        onClick={() => navigate(item.href)}
                        className={`${
                          active ? 'bg-gray-50' : ''
                        } flex w-full items-start px-4 py-3 text-left transition-colors duration-150`}
                      >
                        <item.icon className="h-6 w-6 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}