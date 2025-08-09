/**
 * Mock for OpenAI SDK
 */

export default class OpenAI {
  apiKey: string
  
  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey
  }
  
  chat = {
    completions: {
      create: jest.fn().mockResolvedValue({
        id: 'mock-completion-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Mock AI response for testing',
            },
            logprobs: null,
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      }),
    },
  }
  
  embeddings = {
    create: jest.fn().mockResolvedValue({
      object: 'list',
      data: [
        {
          object: 'embedding',
          embedding: new Array(1536).fill(0.1),
          index: 0,
        },
      ],
      model: 'text-embedding-ada-002',
      usage: {
        prompt_tokens: 10,
        total_tokens: 10,
      },
    }),
  }
  
  images = {
    generate: jest.fn().mockResolvedValue({
      created: Date.now(),
      data: [
        {
          url: 'https://example.com/mock-generated-image.png',
        },
      ],
    }),
    edit: jest.fn().mockResolvedValue({
      created: Date.now(),
      data: [
        {
          url: 'https://example.com/mock-edited-image.png',
        },
      ],
    }),
    createVariation: jest.fn().mockResolvedValue({
      created: Date.now(),
      data: [
        {
          url: 'https://example.com/mock-variation-image.png',
        },
      ],
    }),
  }
  
  moderations = {
    create: jest.fn().mockResolvedValue({
      id: 'mock-moderation-id',
      model: 'text-moderation-stable',
      results: [
        {
          flagged: false,
          categories: {
            sexual: false,
            hate: false,
            harassment: false,
            'self-harm': false,
            'sexual/minors': false,
            'hate/threatening': false,
            'violence/graphic': false,
            'self-harm/intent': false,
            'self-harm/instructions': false,
            'harassment/threatening': false,
            violence: false,
          },
          category_scores: {
            sexual: 0.001,
            hate: 0.001,
            harassment: 0.001,
            'self-harm': 0.001,
            'sexual/minors': 0.001,
            'hate/threatening': 0.001,
            'violence/graphic': 0.001,
            'self-harm/intent': 0.001,
            'self-harm/instructions': 0.001,
            'harassment/threatening': 0.001,
            violence: 0.001,
          },
        },
      ],
    }),
  }
  
  completions = {
    create: jest.fn().mockResolvedValue({
      id: 'mock-completion-id',
      object: 'text_completion',
      created: Date.now(),
      model: 'gpt-3.5-turbo-instruct',
      choices: [
        {
          text: 'Mock text completion',
          index: 0,
          logprobs: null,
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 25,
        total_tokens: 75,
      },
    }),
  }
  
  models = {
    list: jest.fn().mockResolvedValue({
      object: 'list',
      data: [
        {
          id: 'gpt-4',
          object: 'model',
          created: Date.now(),
          owned_by: 'openai',
        },
        {
          id: 'gpt-3.5-turbo',
          object: 'model',
          created: Date.now(),
          owned_by: 'openai',
        },
      ],
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'gpt-4',
      object: 'model',
      created: Date.now(),
      owned_by: 'openai',
    }),
  }
}

export const Configuration = jest.fn()
export const OpenAIApi = jest.fn()