const { chromium } = require('playwright');

(async () => {
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false,  // Show the browser
    slowMo: 500      // Slow down actions so you can see them
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  try {
    console.log('🚀 Starting LinkedIn Post Wizard Test...\n');

    // Navigate to the wizard
    console.log('1️⃣ Navigating to wizard...');
    await page.goto('http://localhost:3000/wizard');
    await page.waitForSelector('h1:has-text("Create LinkedIn Post")');
    console.log('✅ Wizard loaded\n');

    // STEP 1: Content & Purpose
    console.log('2️⃣ Step 1: Content & Purpose');
    
    // Fill in the description
    await page.fill('textarea[placeholder*="share insights"]', 
      'The impact of AI on modern software development practices and how it\'s changing the way we build applications');
    console.log('   - Added description');
    
    // Select purpose
    await page.click('button:has-text("Share Insights")');
    console.log('   - Selected purpose: Share Insights');
    
    // Select goal
    await page.click('button:has-text("Increase Engagement")');
    console.log('   - Selected goal: Increase Engagement');
    
    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    console.log('✅ Step 1 completed\n');

    // STEP 2: Audience & Style
    console.log('3️⃣ Step 2: Audience & Style');
    
    // Select audience
    await page.click('button:has-text("Professionals")');
    console.log('   - Selected audience: Professionals');
    
    // Select tone
    await page.click('button:has-text("Professional")');
    console.log('   - Selected tone: Professional');
    
    // Select format
    await page.click('button:has-text("Story")');
    console.log('   - Selected format: Story');
    
    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    console.log('✅ Step 2 completed\n');

    // STEP 3: Research & Enhancement
    console.log('4️⃣ Step 3: Research & Enhancement');
    
    // Keep research disabled for faster generation
    console.log('   - Research: Disabled (for speed)');
    
    // Select language
    await page.click('button:has-text("English")');
    console.log('   - Selected language: English');
    
    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    console.log('✅ Step 3 completed\n');

    // STEP 4: Summary & Action
    console.log('5️⃣ Step 4: Summary & Action');
    
    // Review the summary
    await page.waitForSelector('text=Your Content Brief');
    console.log('   - Reviewing content brief...');
    
    // Add a call to action (optional)
    const ctaToggle = await page.$('button[role="switch"]');
    if (ctaToggle) {
      await ctaToggle.click();
      await page.fill('textarea[placeholder*="Comment with your thoughts"]', 
        'What\'s your experience with AI in development? Share your thoughts below!');
      console.log('   - Added call to action');
    }
    
    // Generate content
    console.log('\n🎯 Generating content with AI...');
    await page.click('button:has-text("Generate Content")');
    
    // Wait for generation (this calls the real API)
    console.log('⏳ Waiting for AI to generate content (5-10 seconds)...');
    
    // Wait for either success or error
    const result = await Promise.race([
      page.waitForSelector('text=Content generated successfully', { timeout: 30000 })
        .then(() => 'success'),
      page.waitForSelector('text=Generation Error', { timeout: 30000 })
        .then(() => 'error'),
      page.waitForSelector('.generated-content', { timeout: 30000 })
        .then(() => 'content')
    ]);

    if (result === 'success' || result === 'content') {
      console.log('✅ Content generated successfully!\n');
      
      // Try to get the generated content if it's displayed
      const contentElement = await page.$('.generated-content, [class*="content"], pre');
      if (contentElement) {
        const generatedText = await contentElement.textContent();
        console.log('📝 Generated LinkedIn Post:');
        console.log('=' * 50);
        console.log(generatedText);
        console.log('=' * 50);
      }
    } else {
      console.log('❌ Generation failed - check the error message in the UI');
    }

    // Keep browser open for 10 seconds to review
    console.log('\n👀 Keeping browser open for review (10 seconds)...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take a screenshot on error
    await page.screenshot({ path: 'wizard-error.png', fullPage: true });
    console.log('📸 Screenshot saved as wizard-error.png');
    
    // Log the current URL
    console.log('Current URL:', page.url());
  }

  // Close browser
  await browser.close();
  console.log('\n✅ Test completed!');
})();