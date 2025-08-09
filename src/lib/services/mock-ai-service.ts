/**
 * Mock AI Service for Development
 * Provides simulated AI responses when API keys are not configured
 */

import { ContentGenerationRequest, ContentGenerationResponse } from '../types/generation'

export class MockAIService {
  private static instance: MockAIService

  static getInstance(): MockAIService {
    if (!MockAIService.instance) {
      MockAIService.instance = new MockAIService()
    }
    return MockAIService.instance
  }

  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    // Simulate processing delay
    await this.simulateDelay(1000, 3000)

    const mockContent = this.generateMockContent(request)
    
    return {
      content: mockContent,
      metadata: {
        model: 'mock-gpt-4',
        tokens: Math.floor(Math.random() * 500) + 100,
        processingTime: Math.floor(Math.random() * 2000) + 1000,
        language: request.language || 'en',
        culturalAdaptation: request.culturalContext || false
      },
      success: true
    }
  }

  private generateMockContent(request: ContentGenerationRequest): string {
    const { contentType, topic, audience, tone, language } = request
    
    const templates = {
      'linkedin-post': {
        en: `🚀 Exciting insights about ${topic || 'innovation'}!

After working with ${audience || 'professionals'} in this space, I've discovered three key points:

1️⃣ The landscape is rapidly evolving
2️⃣ Adaptation is crucial for success
3️⃣ Collaboration drives innovation

What's your experience with ${topic || 'this trend'}? I'd love to hear your thoughts below! 

#Innovation #${topic?.replace(/\s+/g, '') || 'Technology'} #ProfessionalDevelopment`,
        no: `🚀 Spennende innsikter om ${topic || 'innovasjon'}!

Etter å ha jobbet med ${audience || 'fagfolk'} på dette området, har jeg oppdaget tre nøkkelpunkter:

1️⃣ Landskapet utvikler seg raskt
2️⃣ Tilpasning er avgjørende for suksess
3️⃣ Samarbeid driver innovasjon

Hva er din erfaring med ${topic || 'denne trenden'}? Jeg vil gjerne høre dine tanker! 

#Innovasjon #${topic?.replace(/\s+/g, '') || 'Teknologi'} #Fagutvikling`
      },
      'blog-post': {
        en: `# ${topic || 'The Future of Technology'}

In today's rapidly evolving landscape, understanding ${topic || 'emerging trends'} has become essential for ${audience || 'forward-thinking professionals'}.

## Key Insights

The journey toward mastering ${topic || 'this domain'} requires dedication and continuous learning. Here are the main points to consider:

### 1. Current State of Affairs
The industry is experiencing unprecedented changes...

### 2. Emerging Opportunities
New possibilities are opening up for those willing to adapt...

### 3. Action Steps
To stay ahead, consider implementing these strategies...

## Conclusion

As we navigate these changes, remember that success comes from staying informed and taking action.`,
        no: `# ${topic || 'Fremtidens teknologi'}

I dagens raskt utviklende landskap har forståelse av ${topic || 'nye trender'} blitt essensielt for ${audience || 'fremtidsrettede fagfolk'}.

## Nøkkelinnsikter

Reisen mot å mestre ${topic || 'dette området'} krever dedikasjon og kontinuerlig læring. Her er hovedpunktene å vurdere:

### 1. Nåværende situasjon
Bransjen opplever enestående endringer...

### 2. Nye muligheter
Nye muligheter åpner seg for de som er villige til å tilpasse seg...

### 3. Handlingssteg
For å ligge i forkant, vurder å implementere disse strategiene...

## Konklusjon

Når vi navigerer disse endringene, husk at suksess kommer fra å holde seg informert og ta handling.`
      }
    }

    const selectedTemplate = templates[contentType as keyof typeof templates] || templates['linkedin-post']
    const selectedLanguage = language === 'no' ? 'no' : 'en'
    
    return selectedTemplate[selectedLanguage as keyof typeof selectedTemplate]
  }

  private async simulateDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min)) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  async performResearch(topic: string, providers: string[]): Promise<any> {
    await this.simulateDelay(500, 1500)
    
    return {
      insights: [
        `Current trends in ${topic} show significant growth`,
        `Industry leaders are investing heavily in ${topic}`,
        `The market for ${topic} is expected to expand by 25% this year`
      ],
      sources: [
        'Industry Report 2024',
        'Market Analysis Quarterly',
        'Tech Innovation Review'
      ],
      relevantData: {
        marketSize: '$45B',
        growthRate: '25%',
        keyPlayers: ['Company A', 'Company B', 'Company C']
      }
    }
  }
}

export const mockAIService = MockAIService.getInstance()