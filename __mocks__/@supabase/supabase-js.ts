/**
 * Mock for @supabase/supabase-js
 */

export const createClient = jest.fn(() => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({ 
      data: { 
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00.000Z',
        } 
      }, 
      error: null 
    }),
    getSession: jest.fn().mockResolvedValue({ 
      data: { 
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
          }
        } 
      }, 
      error: null 
    }),
    signInWithPassword: jest.fn().mockResolvedValue({ 
      data: { 
        user: {}, 
        session: {} 
      }, 
      error: null 
    }),
    signInWithOAuth: jest.fn().mockResolvedValue({ 
      data: { url: 'https://example.com/oauth' }, 
      error: null 
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn((callback) => {
      // Immediately call the callback with a mock event
      callback('SIGNED_IN', {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
        }
      })
      return {
        data: { 
          subscription: { 
            unsubscribe: jest.fn() 
          } 
        }
      }
    }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: jest.fn().mockResolvedValue({ data: { user: {} }, error: null }),
  },
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ 
      data: { id: 'mock-id', created_at: '2024-01-01T00:00:00.000Z' }, 
      error: null 
    }),
    maybeSingle: jest.fn().mockResolvedValue({ 
      data: null, 
      error: null 
    }),
    execute: jest.fn().mockResolvedValue({ 
      data: [], 
      error: null 
    }),
    then: jest.fn().mockResolvedValue({ 
      data: [], 
      error: null 
    }),
  })),
  storage: {
    from: jest.fn((bucket: string) => ({
      upload: jest.fn().mockResolvedValue({ 
        data: { path: 'mock-path' }, 
        error: null 
      }),
      download: jest.fn().mockResolvedValue({ 
        data: new Blob(['mock-content']), 
        error: null 
      }),
      getPublicUrl: jest.fn().mockReturnValue({ 
        data: { publicUrl: 'https://example.com/mock-file' } 
      }),
      remove: jest.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      }),
      list: jest.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      }),
      createSignedUrl: jest.fn().mockResolvedValue({ 
        data: { signedUrl: 'https://example.com/signed' }, 
        error: null 
      }),
    })),
  },
  realtime: {
    channel: jest.fn((name: string) => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback?: () => void) => {
        if (callback) callback()
        return { status: 'SUBSCRIBED' }
      }),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockReturnThis(),
    })),
  },
  rpc: jest.fn().mockResolvedValue({ 
    data: {}, 
    error: null 
  }),
}))

export const createServerComponentClient = createClient
export const createMiddlewareClient = createClient
export const createClientComponentClient = createClient
export const createRouteHandlerClient = createClient

export const SupabaseClient = jest.fn()
export const User = jest.fn()
export const Session = jest.fn()

export default {
  createClient,
  createServerComponentClient,
  createMiddlewareClient,
  createClientComponentClient,
  createRouteHandlerClient,
}