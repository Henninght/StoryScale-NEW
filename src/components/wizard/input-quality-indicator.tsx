/**
 * Input Quality Indicator Component
 * Shows real-time feedback on input quality with smart suggestions
 */

'use client'

import React from 'react'
import { InputAnalysis, getPrimarySmartPrompt, getQualityDescription } from '@/lib/utils/input-analysis'
import { cn } from '@/lib/utils'

interface InputQualityIndicatorProps {
  analysis: InputAnalysis
  className?: string
}

export function InputQualityIndicator({ analysis, className }: InputQualityIndicatorProps) {
  const qualityDesc = getQualityDescription(analysis.overallQuality)
  const smartPrompt = getPrimarySmartPrompt(analysis)
  
  // Don't show indicator for very short inputs
  if (!analysis || analysis.overallQuality < 10) {
    return null
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getBackgroundColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-blue-50 border-blue-200'
    if (score >= 40) return 'bg-yellow-50 border-yellow-200'
    return 'bg-orange-50 border-orange-200'
  }

  return (
    <div className={cn("border rounded-lg p-3 transition-all duration-300", getBackgroundColor(analysis.overallQuality), className)}>
      {/* Quality Score Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{qualityDesc.emoji}</span>
          <span className="text-sm font-medium text-gray-700">
            Input Quality: {analysis.overallQuality}%
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {analysis.contentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={cn("h-2 rounded-full transition-all duration-500", getProgressColor(analysis.overallQuality))}
          style={{ width: `${analysis.overallQuality}%` }}
        />
      </div>
      
      {/* Quality Description */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-700">{qualityDesc.text}</span>
        {analysis.readyToGenerate && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-700 font-medium">Ready to generate!</span>
          </div>
        )}
      </div>

      {/* Smart Suggestion */}
      {smartPrompt && smartPrompt.priority !== 'low' && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-start space-x-2">
            <span className="text-sm">{smartPrompt.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{smartPrompt.message}</p>
              {smartPrompt.example && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  Example: {smartPrompt.example}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Breakdown (for debugging/advanced users) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            Analysis Breakdown
          </summary>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Personal Level:</span>
              <span>{analysis.personalityLevel}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Context Richness:</span>
              <span>{analysis.contextRichness}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Actionable Details:</span>
              <span>{analysis.actionableDetails}%</span>
            </div>
          </div>
        </details>
      )}
    </div>
  )
}

/**
 * Compact version for minimal UI space
 */
export function CompactQualityIndicator({ analysis, className }: InputQualityIndicatorProps) {
  if (!analysis || analysis.overallQuality < 10) {
    return null
  }

  const qualityDesc = getQualityDescription(analysis.overallQuality)
  const smartPrompt = getPrimarySmartPrompt(analysis)

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div className={cn("flex items-center space-x-3 p-2", className)}>
      {/* Mini progress bar */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">
            Quality: {analysis.overallQuality}%
          </span>
          {analysis.readyToGenerate && (
            <span className="text-xs text-green-600">✓ Ready</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={cn("h-1.5 rounded-full transition-all duration-300", getProgressColor(analysis.overallQuality))}
            style={{ width: `${analysis.overallQuality}%` }}
          />
        </div>
      </div>

      {/* Smart suggestion icon */}
      {smartPrompt && smartPrompt.priority === 'high' && (
        <div className="flex items-center space-x-1" title={smartPrompt.message}>
          <span className="text-sm">{smartPrompt.icon}</span>
          <span className="text-xs text-gray-500">Tip available</span>
        </div>
      )}
    </div>
  )
}