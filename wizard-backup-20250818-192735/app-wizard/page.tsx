/**
 * LinkedIn Post Creation Wizard Page
 * Uses the new 4-step wizard implementation
 */

'use client'

import React, { useState } from 'react'
import { LinkedInPostWizard } from '@/components/wizard/linkedin-post-wizard'
import { GeneratedContentDisplay } from '@/components/wizard/generated-content-display'
import { useRouter } from 'next/navigation'
import { GenerationPerformance } from '@/types/wizard'

export default function WizardPage() {
  const router = useRouter()
  const [generatedContent, setGeneratedContent] = useState<any>(null)

  const handleWizardComplete = (content: any) => {
    setGeneratedContent(content)
    // Could redirect to a content preview/edit page
    console.log('Generated content:', content)
  }

  const handleWizardCancel = () => {
    router.push('/')
  }

  if (generatedContent) {
    // Create performance metrics from generated content
    const performance: GenerationPerformance = {
      totalTime: generatedContent.metadata?.processingTime || 3000,
      aiGenerationTime: generatedContent.metadata?.processingTime || 3000,
      processingTime: 200,
      status: 'success',
      modelUsed: generatedContent.metadata?.modelUsed || 'claude-3-5-sonnet-20241022',
      tokensUsed: generatedContent.metadata?.tokensUsed || 0
    }

    // Show generated content result with new design
    return (
      <GeneratedContentDisplay
        content={generatedContent}
        performance={performance}
        onEdit={() => {
          // Go back to step 4 for editing
          setGeneratedContent(null)
        }}
        onStartFresh={() => {
          // Reset completely and start over
          setGeneratedContent(null)
        }}
        onSaveDraft={() => {
          // TODO: Implement save to drafts functionality
          console.log('Save draft functionality to be implemented')
        }}
        onShare={() => {
          // TODO: Implement share functionality
          console.log('Share functionality to be implemented')
        }}
        onPostToLinkedIn={() => {
          // TODO: Implement LinkedIn posting
          console.log('LinkedIn posting to be implemented')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <LinkedInPostWizard 
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </div>
    </div>
  )
}