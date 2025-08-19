/**
 * LinkedIn Tools Page - LinkedIn post creation wizard
 * Integrates the existing LinkedInPostWizard into the workspace layout
 */

import { Metadata } from 'next'
import { LinkedInPostWizard } from '@/components/wizard/linkedin-post-wizard'

export const metadata: Metadata = {
  title: 'LinkedIn Post Wizard - StoryScale Workspace',
  description: 'Create professional LinkedIn posts in under 15 seconds with AI assistance',
}

export default function LinkedInPage() {
  return (
    <div className="w-full">
      <div className="p-6 min-h-screen">
        <LinkedInPostWizard />
      </div>
    </div>
  )
}