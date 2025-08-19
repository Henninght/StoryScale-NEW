import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Anthropic API key...')
    console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY)
    console.log('ANTHROPIC_API_KEY starts with sk-ant:', process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant'))
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'ANTHROPIC_API_KEY not found in environment variables' 
      }, { status: 500 })
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [
        { role: 'user', content: 'Say "API key works!" and nothing else.' }
      ]
    })

    const content = completion.content[0].type === 'text' 
      ? completion.content[0].text 
      : 'Unexpected response format'

    return NextResponse.json({ 
      success: true, 
      content,
      keyExists: !!process.env.ANTHROPIC_API_KEY,
      keyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 10) + '...'
    })

  } catch (error: any) {
    console.error('Anthropic test error:', error)
    return NextResponse.json({ 
      error: error.message,
      keyExists: !!process.env.ANTHROPIC_API_KEY,
      keyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 10) + '...'
    }, { status: 500 })
  }
}