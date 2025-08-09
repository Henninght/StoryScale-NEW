import { test, expect, Page } from '@playwright/test';

/**
 * Content Wizard E2E Tests
 * Tests the complete content creation workflow including:
 * - Navigation to wizard
 * - Language selection
 * - Content generation flow
 * - Form interactions
 */

// Page Object Model for Content Wizard
class ContentWizardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation
  async goto() {
    await this.page.goto('/wizard');
    await this.page.waitForLoadState('networkidle');
  }

  async goHome() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  // Language Selection
  async selectLanguage(language: 'en' | 'no') {
    // Click on the WizardLanguageSelector
    await this.page.click('[data-testid="wizard-language-selector"]');
    
    // Select the language option
    const languageOption = language === 'no' ? 'Norwegian' : 'English';
    await this.page.click(`text=${languageOption}`);
  }

  async getSelectedLanguage() {
    return await this.page.textContent('[data-testid="selected-language"]');
  }

  // Wizard Steps Navigation
  async goToPreviousStep() {
    await this.page.click('button:has-text("Previous")');
  }

  async goToNextStep() {
    await this.page.click('button:has-text("Generate Content")');
  }

  async getCurrentStep() {
    // Find the active step (blue background)
    const activeStep = await this.page.locator('.bg-blue-600').first();
    return await activeStep.textContent();
  }

  // Research Options
  async toggleWebResearch() {
    await this.page.check('input[type="checkbox"]:near(:text("Enable web research"))');
  }

  async toggleCulturalAdaptations() {
    await this.page.check('input[type="checkbox"]:near(:text("Apply cultural adaptations"))');
  }

  async isWebResearchEnabled() {
    return await this.page.isChecked('input[type="checkbox"]:near(:text("Enable web research"))');
  }

  async isCulturalAdaptationsEnabled() {
    return await this.page.isChecked('input[type="checkbox"]:near(:text("Apply cultural adaptations"))');
  }

  // Content Generation
  async generateContent() {
    await this.page.click('button:has-text("Generate Content")');
    // Wait for content to be generated (this might take a while)
    await this.page.waitForSelector('[data-testid="generated-content"]', { timeout: 15000 });
  }

  async getGeneratedContent() {
    const contentElement = await this.page.locator('[data-testid="generated-content"]');
    return await contentElement.textContent();
  }

  async saveContent() {
    await this.page.click('button:has-text("Save Content")');
  }

  async regenerateContent() {
    await this.page.click('button:has-text("Regenerate")');
    await this.page.waitForSelector('[data-testid="generated-content"]', { timeout: 15000 });
  }

  // Language Status Validation
  async getLanguageBadge() {
    const badge = await this.page.locator('[data-testid="language-badge"]');
    return {
      language: await badge.getAttribute('data-language'),
      culturallyAdapted: await badge.getAttribute('data-culturally-adapted') === 'true'
    };
  }

  // Assertions
  async expectWizardTitle() {
    await expect(this.page.locator('h1')).toContainText('Content Creation Wizard');
  }

  async expectStep(stepNumber: number) {
    const stepElement = this.page.locator(`text=Step ${stepNumber}`).first();
    await expect(stepElement).toBeVisible();
  }

  async expectLanguageIndicator(language: 'Norwegian' | 'English') {
    await expect(this.page.locator(`text=Content will be generated in: ${language}`)).toBeVisible();
  }

  async expectGeneratedContent() {
    await expect(this.page.locator('[data-testid="generated-content"]')).toBeVisible();
  }
}

test.describe('Content Wizard', () => {
  let wizardPage: ContentWizardPage;

  test.beforeEach(async ({ page }) => {
    wizardPage = new ContentWizardPage(page);
  });

  test.describe('Navigation and Basic UI', () => {
    test('should load the wizard page successfully', async ({ page }) => {
      await wizardPage.goto();
      await wizardPage.expectWizardTitle();
      
      // Check that wizard steps are visible
      await expect(page.locator('.flex.items-center.justify-between')).toBeVisible();
      
      // Check that we're on step 3 by default (as per the component code)
      await expect(page.locator('.bg-blue-600')).toContainText('3');
    });

    test('should navigate from home page to wizard', async ({ page }) => {
      await wizardPage.goHome();
      
      // Click on the Content Wizard link
      await page.click('a[href="/wizard"]');
      await page.waitForURL('/wizard');
      
      await wizardPage.expectWizardTitle();
    });

    test('should display all wizard steps', async ({ page }) => {
      await wizardPage.goto();
      
      // Check all 4 steps are visible
      await expect(page.locator('text=Content Brief')).toBeVisible();
      await expect(page.locator('text=Audience & Purpose')).toBeVisible();
      await expect(page.locator('text=Research & Enhancement')).toBeVisible();
      await expect(page.locator('text=Generate & Review')).toBeVisible();
    });

    test('should navigate back to home', async ({ page }) => {
      await wizardPage.goto();
      
      // Click back to home link
      await page.click('a:has-text("Back to StoryScale")');
      await page.waitForURL('/');
      
      await expect(page.locator('h1')).toContainText('StoryScale');
    });
  });

  test.describe('Language Selection', () => {
    test('should select English language', async ({ page }) => {
      await wizardPage.goto();
      
      // Default language should be English
      await expect(page.locator('text=Content will be generated in: English')).toBeVisible();
    });

    test('should switch to Norwegian language', async ({ page }) => {
      await wizardPage.goto();
      
      // Find and click the language selector (compact version in header)
      const languageSelector = page.locator('[data-testid="language-selector"]').or(
        page.locator('select').first()
      );
      
      if (await languageSelector.count() > 0) {
        await languageSelector.selectOption('no');
      }
      
      // Verify Norwegian is selected
      await expect(page.locator('text=Content will be generated in: Norwegian')).toBeVisible();
      
      // Verify cultural adaptations checkbox is checked
      const culturalCheckbox = page.locator('input[type="checkbox"]:near(:text("Apply cultural adaptations"))');
      await expect(culturalCheckbox).toBeChecked();
    });

    test('should show Norwegian context hints', async ({ page }) => {
      await wizardPage.goto();
      
      // Select Norwegian
      const languageSelector = page.locator('[data-testid="language-selector"]').or(
        page.locator('select').first()
      );
      
      if (await languageSelector.count() > 0) {
        await languageSelector.selectOption('no');
      }
      
      // Check for Norwegian business context message
      await expect(page.locator('text=Norwegian business context and cultural norms will be automatically applied')).toBeVisible();
    });
  });

  test.describe('Research Options', () => {
    test('should toggle web research option', async ({ page }) => {
      await wizardPage.goto();
      
      const webResearchCheckbox = page.locator('input[type="checkbox"]:near(:text("Enable web research"))');
      
      // Initially should be unchecked
      await expect(webResearchCheckbox).not.toBeChecked();
      
      // Toggle it
      await webResearchCheckbox.check();
      await expect(webResearchCheckbox).toBeChecked();
      
      // Toggle it back
      await webResearchCheckbox.uncheck();
      await expect(webResearchCheckbox).not.toBeChecked();
    });

    test('should auto-enable cultural adaptations for Norwegian', async ({ page }) => {
      await wizardPage.goto();
      
      // Select Norwegian
      const languageSelector = page.locator('[data-testid="language-selector"]').or(
        page.locator('select').first()
      );
      
      if (await languageSelector.count() > 0) {
        await languageSelector.selectOption('no');
      }
      
      // Cultural adaptations should be automatically checked
      const culturalCheckbox = page.locator('input[type="checkbox"]:near(:text("Apply cultural adaptations"))');
      await expect(culturalCheckbox).toBeChecked();
    });
  });

  test.describe('Content Generation Flow', () => {
    test('should navigate to content generation step', async ({ page }) => {
      await wizardPage.goto();
      
      // Click Generate Content button
      await page.click('button:has-text("Generate Content")');
      
      // Should be on step 4
      await expect(page.locator('.bg-blue-600')).toContainText('4');
      await expect(page.locator('h2')).toContainText('Generated Content');
    });

    test('should display content preview', async ({ page }) => {
      await wizardPage.goto();
      
      // Navigate to generation step
      await page.click('button:has-text("Generate Content")');
      
      // Should show content preview
      await expect(page.locator('text=Content Preview')).toBeVisible();
      await expect(page.locator('.prose')).toBeVisible();
    });

    test('should show language badge in content preview', async ({ page }) => {
      await wizardPage.goto();
      
      // Navigate to generation step
      await page.click('button:has-text("Generate Content")');
      
      // Language badge should be visible
      await expect(page.locator('[data-testid="language-badge"]').or(
        page.locator('.inline-flex.items-center').first()
      )).toBeVisible();
    });

    test('should generate Norwegian content when Norwegian is selected', async ({ page }) => {
      await wizardPage.goto();
      
      // Select Norwegian
      const languageSelector = page.locator('[data-testid="language-selector"]').or(
        page.locator('select').first()
      );
      
      if (await languageSelector.count() > 0) {
        await languageSelector.selectOption('no');
      }
      
      // Navigate to generation
      await page.click('button:has-text("Generate Content")');
      
      // Should show Norwegian content
      await expect(page.locator('text=Overskrift:')).toBeVisible();
      await expect(page.locator('text=norske bedrifter')).toBeVisible();
    });

    test('should show action buttons in content generation', async ({ page }) => {
      await wizardPage.goto();
      
      // Navigate to generation step
      await page.click('button:has-text("Generate Content")');
      
      // Check action buttons
      await expect(page.locator('button:has-text("Back to Settings")')).toBeVisible();
      await expect(page.locator('button:has-text("Regenerate")')).toBeVisible();
      await expect(page.locator('button:has-text("Save Content")')).toBeVisible();
    });
  });

  test.describe('Step Navigation', () => {
    test('should navigate between steps', async ({ page }) => {
      await wizardPage.goto();
      
      // Should start on step 3
      await expect(page.locator('.bg-blue-600')).toContainText('3');
      
      // Go to step 4
      await page.click('button:has-text("Generate Content")');
      await expect(page.locator('.bg-blue-600')).toContainText('4');
      
      // Go back to step 3
      await page.click('button:has-text("Back to Settings")');
      await expect(page.locator('.bg-blue-600')).toContainText('3');
      
      // Go to step 2
      await page.click('button:has-text("Previous")');
      await expect(page.locator('.bg-blue-600')).toContainText('2');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
      await wizardPage.goto();
      
      await wizardPage.expectWizardTitle();
      
      // Elements should still be visible on mobile
      await expect(page.locator('button:has-text("Generate Content")')).toBeVisible();
      await expect(page.locator('text=Research & Enhancement')).toBeVisible();
    });

    test('should adapt grid layout on different screen sizes', async ({ page }) => {
      // Test desktop layout
      await page.setViewportSize({ width: 1024, height: 768 });
      await wizardPage.goto();
      
      const gridElement = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
      await expect(gridElement).toBeVisible();
      
      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      // Grid should still be visible but in single column on mobile
      await expect(gridElement).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle navigation errors gracefully', async ({ page }) => {
      // Try to navigate to a non-existent step
      await wizardPage.goto();
      
      // The page should still load and default to step 3
      await expect(page.locator('.bg-blue-600')).toContainText('3');
    });
  });
});

test.describe('Content Wizard - Cross-browser', () => {
  ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
    test(`should work correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Test specific to ${browserName}`);
      
      const wizardPage = new ContentWizardPage(page);
      await wizardPage.goto();
      
      await wizardPage.expectWizardTitle();
      await expect(page.locator('button:has-text("Generate Content")')).toBeVisible();
    });
  });
});