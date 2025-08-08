// Guest session management using localStorage
export interface GuestSession {
  id: string
  created: number
  documentCount: number
  researchCount: number
  lastActive: number
}

export class GuestSessionManager {
  private static readonly STORAGE_KEY = 'storyscale_guest_session'
  private static readonly EXPIRY_DAYS = 30

  // Create or get existing guest session
  static getOrCreateSession(): GuestSession {
    if (typeof window === 'undefined') {
      // Server-side: return temporary session
      return {
        id: crypto.randomUUID(),
        created: Date.now(),
        documentCount: 0,
        researchCount: 0,
        lastActive: Date.now()
      }
    }

    const stored = localStorage.getItem(this.STORAGE_KEY)
    
    if (stored) {
      try {
        const session: GuestSession = JSON.parse(stored)
        
        // Check if session is expired
        const isExpired = Date.now() - session.created > (this.EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        
        if (!isExpired) {
          // Update last active time
          session.lastActive = Date.now()
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))
          return session
        }
      } catch (error) {
        console.error('Invalid guest session data:', error)
      }
    }

    // Create new session
    const newSession: GuestSession = {
      id: crypto.randomUUID(),
      created: Date.now(),
      documentCount: 0,
      researchCount: 0,
      lastActive: Date.now()
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSession))
    return newSession
  }

  // Update session counters
  static updateSession(updates: Partial<GuestSession>): void {
    if (typeof window === 'undefined') return

    const session = this.getOrCreateSession()
    const updatedSession = { 
      ...session, 
      ...updates, 
      lastActive: Date.now() 
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSession))
  }

  // Check if guest has reached limits
  static isAtDocumentLimit(session: GuestSession): boolean {
    return session.documentCount >= 10 // Free tier limit
  }

  static isAtResearchLimit(session: GuestSession): boolean {
    return session.researchCount >= 20 // Free tier limit
  }

  // Clear session (for migration to authenticated)
  static clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  // Get session data for migration
  static getSessionForMigration(): GuestSession | null {
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return null

    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }
}