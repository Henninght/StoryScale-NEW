/**
 * Mobile Sidebar - Overlay sidebar for mobile and tablet devices
 * Slides in from the left with backdrop overlay
 */

'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useWorkspace } from '@/context/workspace-context'
import { SidebarNavigation } from '../navigation/sidebar-navigation'

export function MobileSidebar() {
  const { state, closeSidebar } = useWorkspace()

  return (
    <Transition.Root show={state.sidebarOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={closeSidebar}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          {/* Sidebar panel */}
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              {/* Close button */}
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={closeSidebar}
                    aria-label="Close sidebar"
                  >
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>

              {/* Sidebar content */}
              <div className="flex flex-col w-full h-full bg-gray-50 border-r border-gray-200">
                {/* Sidebar Header */}
                <div className="flex items-center h-16 px-6 border-b border-gray-200">
                  <div className="flex items-center">
                    {/* StoryScale Logo */}
                    <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">StoryScale</h1>
                  </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                  <div onClick={closeSidebar}>
                    <SidebarNavigation />
                  </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center">
                    {/* User Avatar Placeholder */}
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">U</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        User Account
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Free Plan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}