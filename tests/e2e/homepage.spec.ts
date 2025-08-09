import { test, expect } from '@playwright/test';
import { NavigationHelpers, CommonAssertions, ViewportHelpers } from './helpers/test-utils';

/**
 * Homepage E2E Tests
 * Basic tests to verify the homepage loads and functions correctly
 */

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await NavigationHelpers.goHome(page);
    
    await CommonAssertions.expectPageTitle(page, 'StoryScale');
    await expect(page.locator('p')).toContainText('AI-Powered Content Studio - 3-Layer Architecture');
  });

  test('should display navigation links', async ({ page }) => {
    await NavigationHelpers.goHome(page);
    
    // Check main navigation elements
    await expect(page.locator('a[href="/wizard"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
  });

  test('should display architecture overview', async ({ page }) => {
    await NavigationHelpers.goHome(page);
    
    // Check for the three layers
    await expect(page.locator('text=Layer 1: Gateway')).toBeVisible();
    await expect(page.locator('text=Layer 2: Functions')).toBeVisible();
    await expect(page.locator('text=Layer 3: Intelligence')).toBeVisible();
  });

  test('should display API endpoints', async ({ page }) => {
    await NavigationHelpers.goHome(page);
    
    await expect(page.locator('a[href="/api/health"]')).toBeVisible();
    await expect(page.locator('a[href="/api/architecture"]')).toBeVisible();
    await expect(page.locator('a[href="/api/test"]')).toBeVisible();
  });

  test('should navigate to wizard from homepage', async ({ page }) => {
    await NavigationHelpers.goHome(page);
    
    await page.click('a[href="/wizard"]');
    await page.waitForURL('/wizard');
    
    await expect(page.locator('h1')).toContainText('Content Creation Wizard');
  });

  test('should navigate to settings from homepage', async ({ page }) => {
    await NavigationHelpers.goHome(page);
    
    await page.click('a[href="/settings"]');
    await page.waitForURL('/settings');
    
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await ViewportHelpers.setMobile(page);
    await NavigationHelpers.goHome(page);
    
    await CommonAssertions.expectPageTitle(page, 'StoryScale');
    
    // Elements should still be visible on mobile
    await expect(page.locator('a[href="/wizard"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
  });
});