/**
 * Sidebar Navigation - Main navigation menu for workspace
 * Enhanced with consistent icons, section grouping, and improved hierarchy
 */

'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Disclosure, Transition } from '@headlessui/react'
import {
  Home,
  Linkedin,
  Plus,
  Edit3,
  Copy,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.ComponentProps<'svg'>>
  current?: boolean
  children?: NavigationItem[]
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

interface SidebarNavigationProps {
  collapsed?: boolean
}

export function SidebarNavigation({ collapsed = false }: SidebarNavigationProps) {
  const pathname = usePathname()

  // Define navigation structure with sections
  const navigationSections: NavigationSection[] = [
    {
      title: 'Workspace',
      items: [
        {
          name: 'Dashboard',
          href: '/workspace',
          icon: Home,
          current: pathname === '/workspace'
        },
        {
          name: 'LinkedIn',
          href: '/workspace/linkedin',
          icon: Linkedin,
          current: pathname.startsWith('/workspace/linkedin') || 
                   pathname.startsWith('/workspace/editor') ||
                   pathname.startsWith('/workspace/bulk'),
          children: [
            {
              name: 'Post Wizard',
              href: '/workspace/linkedin',
              icon: Plus,
              current: pathname === '/workspace/linkedin'
            },
            {
              name: 'Content Editor',
              href: '/workspace/editor',
              icon: Edit3,
              current: pathname === '/workspace/editor'
            },
            {
              name: 'Bulk Generator',
              href: '/workspace/bulk',
              icon: Copy,
              current: pathname === '/workspace/bulk'
            }
          ]
        }
      ]
    },
    {
      title: 'Insights & Settings',
      items: [
        {
          name: 'Analytics',
          href: '/workspace/analytics',
          icon: BarChart3,
          current: pathname === '/workspace/analytics'
        },
        {
          name: 'Settings',
          href: '/workspace/settings',
          icon: Settings,
          current: pathname === '/workspace/settings'
        }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {navigationSections.map((section, sectionIndex) => (
        <div key={section.title}>
          {/* Section Title - Hide when collapsed or for first section */}
          {sectionIndex > 0 && !collapsed && (
            <>
              <div className="border-t border-gray-200 mb-4" />
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            </>
          )}
          {/* Add subtle divider when collapsed */}
          {sectionIndex > 0 && collapsed && (
            <div className="border-t border-gray-200 mb-2 mx-2" />
          )}
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavigationItem key={item.name} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function NavigationItem({ item, collapsed = false }: { item: NavigationItem; collapsed?: boolean }) {
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = item.current || (item.children?.some(child => child.current) ?? false)
  const hasActiveChild = item.children?.some(child => child.current) ?? false

  if (!hasChildren) {
    // Simple navigation item without children
    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center text-sm font-medium rounded-lg transition-all duration-200",
          "hover:bg-gray-100",
          item.current && "bg-blue-100 text-blue-700 border-r-2 border-blue-600",
          !item.current && "text-gray-700 hover:text-gray-900",
          collapsed ? "px-2 py-3 justify-center" : "px-3 py-2"
        )}
      >
        <item.icon className={cn(
          "h-5 w-5 flex-shrink-0",
          collapsed ? "mx-auto" : "mr-3"
        )} strokeWidth={1.5} />
        {!collapsed && item.name}
      </Link>
    )

    // Wrap with tooltip when collapsed
    if (collapsed) {
      return (
        <div className="relative group">
          {linkContent}
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
            {item.name}
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
          </div>
        </div>
      )
    }

    return linkContent
  }

  // Navigation item with children (collapsible)
  // When collapsed, show parent as simple link, children accessible via hover menu
  if (collapsed) {
    // In collapsed mode, show parent as simple item with tooltip showing children
    return (
      <div className="relative group">
        <Link
          href={item.href}
          className={cn(
            "group flex items-center px-2 py-3 text-sm font-medium rounded-lg transition-all duration-200 justify-center",
            "hover:bg-gray-100",
            hasActiveChild && !item.current && "bg-blue-50/50 text-blue-600",
            item.current && "bg-blue-100 text-blue-700",
            !item.current && !hasActiveChild && "text-gray-700 hover:text-gray-900"
          )}
        >
          <item.icon className="h-5 w-5 flex-shrink-0 mx-auto" strokeWidth={1.5} />
        </Link>
        
        {/* Hover menu for children */}
        <div className="absolute left-full ml-2 bg-white shadow-lg rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 top-0 min-w-48">
          {/* Parent item header */}
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <div className="flex items-center">
              <item.icon className="mr-2 h-4 w-4 text-gray-600" strokeWidth={1.5} />
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
          </div>
          {/* Children */}
          <div className="py-1">
            {item.children?.map((child) => (
              <Link
                key={child.name}
                href={child.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm transition-colors duration-200",
                  "hover:bg-gray-50",
                  child.current && "bg-blue-50 text-blue-700 border-r-2 border-blue-600",
                  !child.current && "text-gray-700 hover:text-gray-900"
                )}
              >
                <child.icon className="mr-2 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Normal expanded mode with disclosure
  return (
    <Disclosure defaultOpen={isExpanded}>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={cn(
              "group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              "hover:bg-gray-100",
              // Parent highlighting - lighter when child is active, full when parent itself is active
              hasActiveChild && !item.current && "bg-blue-50/50 text-blue-600",
              item.current && "bg-blue-100 text-blue-700",
              !item.current && !hasActiveChild && "text-gray-700 hover:text-gray-900"
            )}
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-left">{item.name}</span>
            <ChevronRight
              className={cn(
                "ml-2 h-4 w-4 transition-transform duration-300 flex-shrink-0",
                open ? "rotate-90" : "rotate-0"
              )}
              strokeWidth={1.5}
            />
          </Disclosure.Button>

          <Transition
            enter="transition duration-200 ease-out"
            enterFrom="transform scale-95 opacity-0 -translate-y-2"
            enterTo="transform scale-100 opacity-100 translate-y-0"
            leave="transition duration-150 ease-out"
            leaveFrom="transform scale-100 opacity-100 translate-y-0"
            leaveTo="transform scale-95 opacity-0 -translate-y-2"
          >
            <Disclosure.Panel className="mt-2 space-y-1">
              {item.children?.map((child) => (
                <Link
                  key={child.name}
                  href={child.href}
                  className={cn(
                    "group flex items-center pl-10 pr-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    "hover:bg-gray-50",
                    child.current && "bg-blue-100 text-blue-700 border-r-2 border-blue-600",
                    !child.current && "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <child.icon className="mr-3 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                  {child.name}
                </Link>
              ))}
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}