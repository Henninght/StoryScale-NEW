/**
 * Mock for Anthropic SDK
 */

export default class Anthropic {
  apiKey: string
  
  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey
  }
  
  messages = {
    create: jest.fn().mockResolvedValue({
      id: 'mock-message-id',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'Mock Claude response for testing',
        },
      ],
      model: 'claude-3-opus-20240229',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
    }),
    
    stream: jest.fn().mockImplementation(() => ({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: 'message_start',
          message: {
            id: 'mock-message-id',
            type: 'message',
            role: 'assistant',
            content: [],
            model: 'claude-3-opus-20240229',
            stop_reason: null,
            stop_sequence: null,
            usage: {
              input_tokens: 100,
              output_tokens: 0,
            },
          },
        }
        
        yield {
          type: 'content_block_start',
          index: 0,
          content_block: {
            type: 'text',
            text: '',
          },
        }
        
        yield {
          type: 'content_block_delta',
          index: 0,
          delta: {
            type: 'text_delta',
            text: 'Mock streaming ',
          },
        }
        
        yield {
          type: 'content_block_delta',
          index: 0,
          delta: {
            type: 'text_delta',
            text: 'response',
          },
        }
        
        yield {
          type: 'content_block_stop',
          index: 0,
        }
        
        yield {
          type: 'message_delta',
          delta: {
            stop_reason: 'end_turn',
            stop_sequence: null,
          },
          usage: {
            output_tokens: 10,
          },
        }
        
        yield {
          type: 'message_stop',
        }
      },
    })),
  }
  
  completions = {
    create: jest.fn().mockResolvedValue({
      id: 'mock-completion-id',
      type: 'completion',
      completion: 'Mock Claude completion for testing',
      stop_reason: 'stop_sequence',
      model: 'claude-2.1',
      stop: null,
      log_id: 'mock-log-id',
    }),
  }
}

export const AI_PROMPT = 'Human: '
export const HUMAN_PROMPT = 'Human: '
export const ASSISTANT_PROMPT = 'Assistant: '

export class AnthropicError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AnthropicError'
  }
}

export class APIError extends AnthropicError {
  status: number
  
  constructor(message: string, status: number) {
    super(message)
    this.name = 'APIError'
    this.status = status
  }
}

export class RateLimitError extends APIError {
  constructor(message: string) {
    super(message, 429)
    this.name = 'RateLimitError'
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string) {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}