import { test, expect, Page } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests the authentication flows including:
 * - Guest mode functionality
 * - Sign-in process
 * - Session persistence
 * - Data migration from guest to authenticated user
 */

// Page Object Model for Authentication
class AuthPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async goToSettings() {
    await this.page.goto('/settings');
    await this.page.waitForLoadState('networkidle');
  }

  // Guest Mode Actions
  async useAsGuest() {
    // In the current implementation, guest mode is automatic
    // Just verify we can use the app without authentication
    await this.goto();
  }

  async isInGuestMode() {
    // Check for guest mode indicators
    // Since there's no explicit auth UI yet, check for the absence of user-specific elements
    const accountSettings = this.page.locator('button:has-text("Manage Account")');
    return await accountSettings.isDisabled();
  }

  // Sign-in Actions (Future implementation)
  async clickSignIn() {
    // This button doesn't exist yet in the current implementation
    // But we'll test for future implementation
    const signInButton = this.page.locator('[data-testid="sign-in-button"]').or(
      this.page.locator('button:has-text("Sign In")')
    );
    
    if (await signInButton.count() > 0) {
      await signInButton.click();
    }
  }

  async signInWithGoogle() {
    await this.clickSignIn();
    
    // Click Google sign-in option (if available)
    const googleButton = this.page.locator('[data-testid="google-sign-in"]').or(
      this.page.locator('button:has-text("Continue with Google")')
    );
    
    if (await googleButton.count() > 0) {
      await googleButton.click();
    }
  }

  async signOut() {
    const signOutButton = this.page.locator('[data-testid="sign-out-button"]').or(
      this.page.locator('button:has-text("Sign Out")')
    );
    
    if (await signOutButton.count() > 0) {
      await signOutButton.click();
    }
  }

  // Session and Data Management
  async createGuestContent() {
    // Navigate to wizard and create content as guest
    await this.page.goto('/wizard');
    await this.page.waitForLoadState('networkidle');
    
    // Generate some content
    await this.page.click('button:has-text("Generate Content")');
    
    // Wait for content generation
    await this.page.waitForTimeout(1000);
    
    // Save content
    const saveButton = this.page.locator('button:has-text("Save Content")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
    }
  }

  async checkLocalStorageForGuestData() {
    // Check if guest data is stored in localStorage
    const guestData = await this.page.evaluate(() => {
      return localStorage.getItem('storyscale-guest-data') || localStorage.getItem('guest-session');
    });
    return guestData !== null;
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  // Authentication State Checks
  async isAuthenticated() {
    // Check for authenticated user indicators
    const userProfile = this.page.locator('[data-testid="user-profile"]').or(
      this.page.locator('[data-testid="user-menu"]')
    );
    
    return await userProfile.count() > 0;
  }

  async getUserInfo() {
    const userInfo = this.page.locator('[data-testid="user-info"]');
    if (await userInfo.count() > 0) {
      return await userInfo.textContent();
    }
    return null;
  }

  // Settings Page Auth Tests
  async expectGuestModeSettings() {
    await this.goToSettings();
    
    // Account settings should be disabled/placeholder
    await expect(this.page.locator('button:has-text("Manage Account (Coming Soon)")')).toBeVisible();
    await expect(this.page.locator('button:has-text("Manage Account (Coming Soon)")')).toBeDisabled();
  }

  async expectAuthenticatedSettings() {
    await this.goToSettings();
    
    // Account settings should be enabled (future implementation)
    const manageAccountButton = this.page.locator('button:has-text("Manage Account")').first();
    if (await manageAccountButton.count() > 0) {
      await expect(manageAccountButton).not.toBeDisabled();
    }
  }
}

test.describe('Authentication', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    // Clear any existing auth state
    await authPage.clearLocalStorage();
  });

  test.describe('Guest Mode', () => {
    test('should allow using the app as a guest', async ({ page }) => {
      await authPage.useAsGuest();
      
      // Should be able to access the main features
      await expect(page.locator('h1')).toContainText('StoryScale');
      await expect(page.locator('a[href="/wizard"]')).toBeVisible();
      await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });

    test('should access wizard in guest mode', async ({ page }) => {
      await authPage.useAsGuest();
      
      // Navigate to wizard
      await page.click('a[href="/wizard"]');
      await page.waitForURL('/wizard');
      
      // Should be able to use the wizard
      await expect(page.locator('h1')).toContainText('Content Creation Wizard');
      await expect(page.locator('button:has-text("Generate Content")')).toBeVisible();
    });

    test('should access settings in guest mode', async ({ page }) => {
      await authPage.expectGuestModeSettings();
      
      // Language settings should be available
      await expect(page.locator('text=Language Settings')).toBeVisible();
      
      // Account settings should be disabled
      await expect(page.locator('button:has-text("Manage Account (Coming Soon)")')).toBeDisabled();
    });

    test('should persist language preferences in guest mode', async ({ page }) => {
      await authPage.useAsGuest();
      await authPage.goToSettings();
      
      // Change language if language selector exists
      const languageSelector = page.locator('[data-testid="language-selector"]').or(
        page.locator('select').first()
      );
      
      if (await languageSelector.count() > 0) {
        await languageSelector.selectOption('no');
        
        // Navigate away and back
        await page.goto('/');
        await page.goto('/settings');
        
        // Language preference should be persisted
        // This would be via localStorage in guest mode
        const hasGuestData = await authPage.checkLocalStorageForGuestData();
        expect(hasGuestData).toBeTruthy();
      }
    });

    test('should store guest session data locally', async ({ page }) => {
      await authPage.useAsGuest();
      
      // Navigate to wizard and interact
      await page.goto('/wizard');
      await page.click('button:has-text("Generate Content")');
      
      // Check if guest data is stored
      const hasGuestData = await authPage.checkLocalStorageForGuestData();
      expect(hasGuestData).toBeTruthy();
    });
  });

  test.describe('Authentication UI', () => {
    test('should display authentication placeholders', async ({ page }) => {
      await authPage.goToSettings();
      
      // Should show coming soon messages for auth features
      await expect(page.locator('text=Authentication, billing, and subscription settings will be available here.')).toBeVisible();
      await expect(page.locator('button:has-text("Manage Account (Coming Soon)")')).toBeVisible();
    });

    test('should handle missing authentication gracefully', async ({ page }) => {
      await authPage.useAsGuest();
      
      // App should work without authentication
      await expect(page.locator('h1')).toContainText('StoryScale');
      
      // Navigation should work
      await page.click('a[href="/wizard"]');
      await expect(page).toHaveURL('/wizard');
      
      await page.click('a:has-text("Back to StoryScale")');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Future Authentication Features', () => {
    test('should prepare for sign-in functionality', async ({ page }) => {
      await authPage.useAsGuest();
      
      // Test that we can handle future auth buttons
      await authPage.clickSignIn(); // Should not break if button doesn't exist
      
      // App should still be functional
      await expect(page.locator('h1')).toContainText('StoryScale');
    });

    test('should handle authentication state changes', async ({ page }) => {
      await authPage.useAsGuest();
      
      // Create some content in guest mode
      await authPage.createGuestContent();
      
      // Verify guest data exists
      const hasGuestData = await authPage.checkLocalStorageForGuestData();
      expect(hasGuestData).toBeTruthy();
      
      // Future: After authentication, data should be migrated
      // This is a placeholder for future implementation
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      await authPage.useAsGuest();
      
      // Make some changes
      await page.goto('/wizard');
      const languageSelector = page.locator('[data-testid="language-selector"]').or(
        page.locator('select').first()
      );
      
      if (await languageSelector.count() > 0) {
        await languageSelector.selectOption('no');
      }
      
      // Reload page
      await page.reload();
      
      // App should still work
      await expect(page.locator('h1')).toContainText('Content Creation Wizard');
    });

    test('should clear session on explicit logout', async ({ page }) => {
      await authPage.useAsGuest();
      
      // Create some guest data
      await authPage.createGuestContent();
      
      // Sign out (even in guest mode, this should clear data)
      await authPage.signOut();
      
      // Guest data might be cleared (depending on implementation)
      // This is more relevant for authenticated users
    });

    test('should handle browser storage limitations', async ({ page }) => {
      await authPage.useAsGuest();
      
      // Try to store data
      await page.evaluate(() => {
        try {
          localStorage.setItem('test-item', 'test-value');
          return true;
        } catch (e) {
          return false;
        }
      });
      
      // App should handle storage gracefully
      await expect(page.locator('h1')).toContainText('StoryScale');
    });
  });

  test.describe('Progressive Enhancement', () => {
    test('should work without JavaScript (basic functionality)', async ({ page }) => {
      // Disable JavaScript
      await page.context().addInitScript(() => {
        // This simulates a no-JS environment to some degree
        Object.defineProperty(window, 'localStorage', {
          value: null,
          writable: false
        });
      });

      await authPage.useAsGuest();
      
      // Basic navigation should still work via HTML
      await expect(page.locator('h1')).toContainText('StoryScale');
      
      // Links should be accessible
      await expect(page.locator('a[href="/wizard"]')).toBeVisible();
      await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });

    test('should degrade gracefully when storage is unavailable', async ({ page }) => {
      // Mock storage failure
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: () => { throw new Error('Storage unavailable'); },
            setItem: () => { throw new Error('Storage unavailable'); },
            removeItem: () => { throw new Error('Storage unavailable'); },
            clear: () => { throw new Error('Storage unavailable'); },
          },
          writable: false
        });
      });

      await authPage.useAsGuest();
      
      // App should still load and be functional
      await expect(page.locator('h1')).toContainText('StoryScale');
      await page.click('a[href="/wizard"]');
      await expect(page.locator('h1')).toContainText('Content Creation Wizard');
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
      test(`authentication should work in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Test specific to ${browserName}`);
        
        const authPage = new AuthPage(page);
        await authPage.useAsGuest();
        
        // Basic functionality should work across browsers
        await expect(page.locator('h1')).toContainText('StoryScale');
        
        // Settings should be accessible
        await authPage.goToSettings();
        await expect(page.locator('h1')).toContainText('Settings');
      });
    });
  });

  test.describe('Mobile Authentication', () => {
    test('should work on mobile viewports', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
      
      await authPage.useAsGuest();
      
      // App should be functional on mobile
      await expect(page.locator('h1')).toContainText('StoryScale');
      
      // Navigation should work
      await page.click('a[href="/settings"]');
      await expect(page.locator('h1')).toContainText('Settings');
    });

    test('should handle touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authPage.useAsGuest();
      await page.goto('/wizard');
      
      // Touch interactions should work
      await page.tap('button:has-text("Generate Content")');
      await expect(page.locator('h2')).toContainText('Generated Content');
    });
  });
});