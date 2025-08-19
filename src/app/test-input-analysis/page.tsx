'use client'

import React, { useState } from 'react'
import { analyzeInput, EXAMPLE_INPUTS, getPrimarySmartPrompt, getQualityDescription } from '@/lib/utils/input-analysis'

const testInputs = {
  personalAnnouncements: [
    "I'm excited to launch StoryScale after seeing professionals struggle with LinkedIn content",
    "We're introducing our new AI-powered content creation tool", 
    "I'm announcing the launch of my latest project",
    "We just launched our revolutionary content studio",
    "I'm proud to share that we've built something amazing",
  ],
  storySharing: [
    "I remember when I first started creating content and struggled with consistency",
    "My journey from manual content creation to AI automation", 
    "The story of how we solved the content creation problem",
    "I experienced firsthand how time-consuming content creation can be",
  ],
  adviceGiving: [
    "I've learned that consistent posting is key to LinkedIn success",
    "My approach to content creation has evolved over the years",
    "I recommend using AI tools to streamline your workflow", 
    "I believe automation is the future of content marketing",
  ],
  generalTopics: [
    "AI tools for content creation are becoming popular",
    "Content marketing strategies for businesses",
    "The future of artificial intelligence in marketing",
    "LinkedIn best practices and engagement tips",
    "Marketing automation tools comparison",
  ],
  lowQuality: [
    "AI tool",
    "Content creation", 
    "Launch product",
    "New tool for LinkedIn",
    "AI content generator",
  ]
}

export default function TestInputAnalysisPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('personalAnnouncements')
  const [customInput, setCustomInput] = useState<string>('')
  
  const runCategoryTests = (category: string, inputs: string[]) => {
    return inputs.map((input, index) => {
      const analysis = analyzeInput(input)
      const smartPrompt = getPrimarySmartPrompt(analysis)
      const qualityDesc = getQualityDescription(analysis.overallQuality)
      
      return {
        index: index + 1,
        input,
        analysis,
        smartPrompt,
        qualityDesc
      }
    })
  }

  const runValidationTests = () => {
    // Personal announcement test
    const personalTest = analyzeInput("I'm launching StoryScale")
    const personalPass = personalTest.contentType === 'personal-announcement' && personalTest.personalityLevel > 40
    
    // Quality progression test
    const examples = [EXAMPLE_INPUTS.poor, EXAMPLE_INPUTS.decent, EXAMPLE_INPUTS.good, EXAMPLE_INPUTS.excellent]
    const scores = examples.map(input => analyzeInput(input).overallQuality)
    const isProgressive = scores.every((score, i) => i === 0 || score >= scores[i-1])
    
    // Suggestion test
    const lowQualityTest = analyzeInput("AI tool")
    const hasSuggestions = lowQualityTest.suggestions.length > 0
    const hasPersonalSuggestion = lowQualityTest.suggestions.some(s => s.includes('personal'))
    
    return {
      personalTest: { analysis: personalTest, pass: personalPass },
      qualityProgression: { scores, pass: isProgressive },
      suggestionTest: { analysis: lowQualityTest, pass: hasSuggestions, hasPersonalSuggestion }
    }
  }

  const categoryTests = runCategoryTests(selectedCategory, testInputs[selectedCategory as keyof typeof testInputs])
  const validationResults = runValidationTests()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Input Analysis System Test</h1>
          
          {/* Category Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">Test Category:</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(testInputs).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Category Test Results */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              📋 {selectedCategory.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Tests
            </h2>
            <div className="space-y-6">
              {categoryTests.map(test => (
                <div key={test.index} className="border border-gray-200 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Test {test.index}: "{test.input.substring(0, 80)}{test.input.length > 80 ? '...' : ''}"
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Content Type:</span>
                          <span className="text-sm font-medium">{test.analysis.contentType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Overall Quality:</span>
                          <span className="text-sm font-medium">{test.analysis.overallQuality}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Ready to Generate:</span>
                          <span className={`text-sm font-medium ${test.analysis.readyToGenerate ? 'text-green-600' : 'text-red-600'}`}>
                            {test.analysis.readyToGenerate ? '✅ Yes' : '❌ No'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-sm text-gray-600 mb-2">Quality Breakdown:</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Personal Level:</span>
                            <span>{test.analysis.personalityLevel}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Context Richness:</span>
                            <span>{test.analysis.contextRichness}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Actionable Details:</span>
                            <span>{test.analysis.actionableDetails}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      {test.smartPrompt && (
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">Smart Prompt:</div>
                          <div className="text-sm">
                            {test.smartPrompt.icon} {test.smartPrompt.message}
                          </div>
                          {test.smartPrompt.example && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              Example: "{test.smartPrompt.example}"
                            </div>
                          )}
                        </div>
                      )}
                      
                      {test.analysis.suggestions.length > 0 && (
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Suggestions:</div>
                          <ul className="text-sm space-y-1">
                            {test.analysis.suggestions.map((suggestion, i) => (
                              <li key={i} className="text-gray-700">• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Tests */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">🎯 Validation Tests</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Personal Detection Test */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Personal Detection</h3>
                <div className="space-y-2 text-sm">
                  <div>Input: "I'm launching StoryScale"</div>
                  <div>Detected: {validationResults.personalTest.analysis.contentType}</div>
                  <div>Personal Level: {validationResults.personalTest.analysis.personalityLevel}%</div>
                  <div className={`font-medium ${validationResults.personalTest.pass ? 'text-green-600' : 'text-red-600'}`}>
                    {validationResults.personalTest.pass ? '✅ PASS' : '❌ FAIL'}
                  </div>
                </div>
              </div>

              {/* Quality Progression Test */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Quality Progression</h3>
                <div className="space-y-2 text-sm">
                  {validationResults.qualityProgression.scores.map((score, i) => (
                    <div key={i}>
                      {['Poor', 'Decent', 'Good', 'Excellent'][i]}: {score}%
                    </div>
                  ))}
                  <div className={`font-medium ${validationResults.qualityProgression.pass ? 'text-green-600' : 'text-red-600'}`}>
                    {validationResults.qualityProgression.pass ? '✅ PASS' : '❌ FAIL'}
                  </div>
                </div>
              </div>

              {/* Suggestion System Test */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Suggestion System</h3>
                <div className="space-y-2 text-sm">
                  <div>Input: "AI tool"</div>
                  <div>Suggestions: {validationResults.suggestionTest.analysis.suggestions.length}</div>
                  <div>Has Personal: {validationResults.suggestionTest.hasPersonalSuggestion ? 'Yes' : 'No'}</div>
                  <div className={`font-medium ${validationResults.suggestionTest.pass ? 'text-green-600' : 'text-red-600'}`}>
                    {validationResults.suggestionTest.pass ? '✅ PASS' : '❌ FAIL'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Input Test */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">🔧 Custom Input Test</h2>
            <div className="space-y-4">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter your own text to test the analysis..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              
              {customInput.trim() && (
                <div className="border border-gray-200 rounded-lg p-4">
                  {(() => {
                    const analysis = analyzeInput(customInput)
                    const smartPrompt = getPrimarySmartPrompt(analysis)
                    const qualityDesc = getQualityDescription(analysis.overallQuality)
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Content Type:</span>
                              <span className="text-sm font-medium">{analysis.contentType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Overall Quality:</span>
                              <span className="text-sm font-medium">{analysis.overallQuality}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Quality Level:</span>
                              <span className="text-sm font-medium">{qualityDesc.emoji} {qualityDesc.text}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Ready to Generate:</span>
                              <span className={`text-sm font-medium ${analysis.readyToGenerate ? 'text-green-600' : 'text-red-600'}`}>
                                {analysis.readyToGenerate ? '✅ Yes' : '❌ No'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          {smartPrompt && (
                            <div className="mb-4">
                              <div className="text-sm text-gray-600 mb-2">Smart Prompt:</div>
                              <div className="text-sm">
                                {smartPrompt.icon} {smartPrompt.message}
                              </div>
                              {smartPrompt.example && (
                                <div className="text-xs text-gray-500 mt-1 italic">
                                  Example: "{smartPrompt.example}"
                                </div>
                              )}
                            </div>
                          )}
                          
                          {analysis.suggestions.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-600 mb-2">Suggestions:</div>
                              <ul className="text-sm space-y-1">
                                {analysis.suggestions.map((suggestion, i) => (
                                  <li key={i} className="text-gray-700">• {suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-gray-500 text-sm">
            🏁 Input Analysis System Test Complete
          </div>
        </div>
      </div>
    </div>
  )
}