/**
 * Test Utilities for E2E Tests
 * Common functions and helpers for Playwright tests
 */

import { Page, expect, Locator } from '@playwright/test';

// Test data attributes helper
export const testId = (id: string) => `[data-testid="${id}"]`;

// Common assertions
export class CommonAssertions {
  static async expectPageTitle(page: Page, title: string) {
    await expect(page.locator('h1')).toContainText(title);
  }

  static async expectPageLoaded(page: Page) {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  }

  static async expectElementVisible(page: Page, selector: string) {
    await expect(page.locator(selector)).toBeVisible();
  }

  static async expectElementText(page: Page, selector: string, text: string) {
    await expect(page.locator(selector)).toContainText(text);
  }
}

// Navigation helpers
export class NavigationHelpers {
  static async goHome(page: Page) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  }

  static async goToWizard(page: Page) {
    await page.goto('/wizard');
    await page.waitForLoadState('networkidle');
  }

  static async goToSettings(page: Page) {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  }

  static async navigateViaLink(page: Page, linkText: string) {
    await page.click(`a:has-text("${linkText}")`);
    await page.waitForLoadState('networkidle');
  }

  static async navigateViaHref(page: Page, href: string) {
    await page.click(`a[href="${href}"]`);
    await page.waitForLoadState('networkidle');
  }
}

// Form helpers
export class FormHelpers {
  static async fillInput(page: Page, selector: string, value: string) {
    await page.fill(selector, value);
  }

  static async selectOption(page: Page, selector: string, value: string) {
    await page.selectOption(selector, value);
  }

  static async checkCheckbox(page: Page, selector: string, checked: boolean = true) {
    if (checked) {
      await page.check(selector);
    } else {
      await page.uncheck(selector);
    }
  }

  static async clickButton(page: Page, buttonText: string) {
    await page.click(`button:has-text("${buttonText}")`);
  }

  static async submitForm(page: Page, formSelector?: string) {
    const form = formSelector ? page.locator(formSelector) : page.locator('form').first();
    await form.submit();
  }
}

// Wait helpers
export class WaitHelpers {
  static async waitForElement(page: Page, selector: string, timeout: number = 5000) {
    await page.waitForSelector(selector, { timeout });
  }

  static async waitForText(page: Page, text: string, timeout: number = 5000) {
    await page.waitForSelector(`text=${text}`, { timeout });
  }

  static async waitForNavigation(page: Page, url: string) {
    await page.waitForURL(url);
  }

  static async waitForApiResponse(page: Page, apiEndpoint: string) {
    await page.waitForResponse(response => 
      response.url().includes(apiEndpoint) && response.status() === 200
    );
  }
}

// Language helpers specific to StoryScale
export class LanguageHelpers {
  static async selectLanguage(page: Page, language: 'en' | 'no') {
    // Try different possible selectors for language selector
    const selectors = [
      testId('language-selector'),
      testId('compact-language-selector'), 
      testId('wizard-language-selector'),
      'select[name="language"]',
      'select'
    ];

    for (const selector of selectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await element.selectOption(language);
        break;
      }
    }
  }

  static async expectLanguageSelection(page: Page, language: 'English' | 'Norwegian') {
    await expect(page.locator(`text=Content will be generated in: ${language}`)).toBeVisible();
  }

  static async expectCulturalAdaptation(page: Page, enabled: boolean) {
    const checkbox = page.locator('input[type="checkbox"]:near(:text("Apply cultural adaptations"))');
    if (enabled) {
      await expect(checkbox).toBeChecked();
    } else {
      await expect(checkbox).not.toBeChecked();
    }
  }
}

// Content wizard specific helpers
export class WizardHelpers {
  static async expectCurrentStep(page: Page, stepNumber: number) {
    const activeStep = page.locator('.bg-blue-600').first();
    await expect(activeStep).toContainText(stepNumber.toString());
  }

  static async goToStep(page: Page, stepNumber: number) {
    // Navigate through steps
    const currentStepEl = page.locator('.bg-blue-600').first();
    const currentStep = parseInt(await currentStepEl.textContent() || '1');
    
    if (stepNumber > currentStep) {
      // Go forward
      for (let i = currentStep; i < stepNumber; i++) {
        await page.click('button:has-text("Generate Content"), button:has-text("Next")');
        await page.waitForTimeout(500);
      }
    } else if (stepNumber < currentStep) {
      // Go backward
      for (let i = currentStep; i > stepNumber; i--) {
        await page.click('button:has-text("Previous"), button:has-text("Back")');
        await page.waitForTimeout(500);
      }
    }
  }

  static async enableResearch(page: Page) {
    await page.check('input[type="checkbox"]:near(:text("Enable web research"))');
  }

  static async enableCulturalAdaptation(page: Page) {
    await page.check('input[type="checkbox"]:near(:text("Apply cultural adaptations"))');
  }

  static async generateContent(page: Page) {
    await page.click('button:has-text("Generate Content")');
    // Wait for content generation with extended timeout
    await page.waitForSelector('[data-testid="generated-content"], .prose', { timeout: 15000 });
  }

  static async expectContentGenerated(page: Page) {
    await expect(page.locator('[data-testid="generated-content"], .prose')).toBeVisible();
  }
}

// Browser and viewport helpers
export class ViewportHelpers {
  static async setMobile(page: Page) {
    await page.setViewportSize({ width: 375, height: 667 });
  }

  static async setTablet(page: Page) {
    await page.setViewportSize({ width: 768, height: 1024 });
  }

  static async setDesktop(page: Page) {
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  static async setLargeDesktop(page: Page) {
    await page.setViewportSize({ width: 1920, height: 1080 });
  }
}

// Storage helpers for testing guest mode
export class StorageHelpers {
  static async clearAllStorage(page: Page) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  static async setLocalStorageItem(page: Page, key: string, value: string) {
    await page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, { key, value });
  }

  static async getLocalStorageItem(page: Page, key: string): Promise<string | null> {
    return await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, key);
  }

  static async hasLocalStorageData(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return localStorage.length > 0;
    });
  }
}

// Network helpers
export class NetworkHelpers {
  static async waitForApiCall(page: Page, endpoint: string) {
    return await page.waitForResponse(response => 
      response.url().includes(endpoint)
    );
  }

  static async mockApiResponse(page: Page, endpoint: string, response: any) {
    await page.route(`**/*${endpoint}*`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  static async interceptApiCall(page: Page, endpoint: string, handler: (route: any) => void) {
    await page.route(`**/*${endpoint}*`, handler);
  }
}

// Screenshot helpers
export class ScreenshotHelpers {
  static async takeFullPageScreenshot(page: Page, name: string) {
    await page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  static async takeElementScreenshot(page: Page, selector: string, name: string) {
    await page.locator(selector).screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`
    });
  }
}

// Error handling helpers
export class ErrorHelpers {
  static async expectNoConsoleErrors(page: Page) {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // After test execution, check for errors
    expect(errors).toHaveLength(0);
  }

  static async expectNoNetworkErrors(page: Page) {
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()}`);
    });

    // After test execution, check for failed requests
    expect(failedRequests).toHaveLength(0);
  }
}