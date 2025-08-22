import { test, expect } from '@playwright/test';

test('Create post and test Edit & Refine functionality', async ({ page }) => {
  // Navigate to the LinkedIn wizard
  await page.goto('http://localhost:3008/workspace/linkedin');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  console.log('📝 TEST: Starting LinkedIn post creation...');
  
  // Fill out Step 1 - Content & Purpose
  await page.fill('textarea[placeholder*="describe"]', 'Testing the AI revolution and how it impacts modern productivity');
  
  // Select purpose dropdown
  await page.click('[data-testid="purpose-select"], button:has-text("Select Purpose")');
  await page.click('text=Share Insights');
  
  // Select goal dropdown  
  await page.click('[data-testid="goal-select"], button:has-text("Select Goal")');
  await page.click('text=Increase Engagement');
  
  // Click Next to go to Step 2
  await page.click('button:has-text("Next")');
  
  // Fill out Step 2 - Audience & Style
  await page.click('[data-testid="audience-select"], button:has-text("Select Audience")');
  await page.click('text=Professionals');
  
  await page.click('[data-testid="tone-select"], button:has-text("Select Tone")');
  await page.click('text=Professional');
  
  await page.click('[data-testid="format-select"], button:has-text("Select Format")');
  await page.click('text=Modern');
  
  await page.click('[data-testid="length-select"], button:has-text("Select Length")');
  await page.click('text=Medium');
  
  // Click Next to go to Step 3
  await page.click('button:has-text("Next")');
  
  // Step 3 - Research & Enhancement (keep defaults)
  await page.click('button:has-text("Next")');
  
  // Step 4 - Generate content
  await page.click('button:has-text("Generate Post")');
  
  console.log('📝 TEST: Waiting for content generation...');
  
  // Wait for content to be generated (up to 30 seconds)
  await page.waitForSelector('text=Generated Content', { timeout: 30000 });
  
  // Save the post
  await page.click('button:has-text("Save Post")');
  
  // Wait for save confirmation
  await page.waitForSelector('text=Saved', { timeout: 10000 });
  
  console.log('📝 TEST: Post saved, navigating to dashboard...');
  
  // Navigate to dashboard
  await page.goto('http://localhost:3008/workspace');
  await page.waitForLoadState('networkidle');
  
  // Wait for dashboard to load with saved posts
  await page.waitForSelector('text=Your work', { timeout: 10000 });
  
  // Look for the Edit & Refine button
  const editButton = page.locator('button:has-text("Edit & Refine")').first();
  await expect(editButton).toBeVisible();
  
  console.log('📝 TEST: Clicking Edit & Refine button...');
  
  // Click the Edit & Refine button
  await editButton.click();
  
  // Wait for editor page to load
  await page.waitForURL('**/workspace/editor**');
  await page.waitForLoadState('networkidle');
  
  console.log('📝 TEST: Editor page loaded, checking for content...');
  
  // Check if the content is loaded in the editor
  const textareaContent = await page.locator('textarea').first().inputValue();
  
  console.log('📝 TEST: Editor textarea content:', textareaContent.substring(0, 100) + '...');
  
  // The content should not be empty or just placeholder text
  expect(textareaContent.trim()).not.toBe('');
  expect(textareaContent).not.toContain('Start editing your draft here...');
  expect(textareaContent.length).toBeGreaterThan(50);
  
  console.log('✅ TEST: Edit & Refine functionality works correctly!');
});