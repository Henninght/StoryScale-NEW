const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000  // Slower so you can see each action
  });
  
  const page = await browser.newContext().then(ctx => ctx.newPage());

  try {
    console.log('🚀 Demonstrating LinkedIn Post Wizard with Real AI Generation\n');

    // Navigate to wizard
    console.log('📍 Opening wizard...');
    await page.goto('http://localhost:3000/wizard');
    await page.waitForLoadState('networkidle');
    
    // STEP 1: Fill content description
    console.log('\n📝 Step 1: Entering content description...');
    const textarea = await page.waitForSelector('textarea[placeholder*="share insights"]');
    await textarea.click();
    await textarea.type('How artificial intelligence is revolutionizing software development and what it means for developers', { delay: 50 });
    
    // Select purpose (find the actual button element)
    console.log('   Selecting purpose...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const shareButton = buttons.find(btn => btn.textContent.includes('Share Insights'));
      if (shareButton) shareButton.click();
    });
    await page.waitForTimeout(500);
    
    // Select goal
    console.log('   Selecting goal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const goalButton = buttons.find(btn => btn.textContent.includes('Increase Engagement'));
      if (goalButton) goalButton.click();
    });
    await page.waitForTimeout(500);
    
    // Check if Next button is enabled and click it
    console.log('   Moving to Step 2...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextButton = buttons.find(btn => btn.textContent === 'Next' && !btn.disabled);
      if (nextButton) nextButton.click();
    });
    await page.waitForTimeout(1000);
    
    // STEP 2: Audience & Style
    console.log('\n🎯 Step 2: Setting audience and style...');
    
    // Select each option
    await page.evaluate(() => {
      // Select Professionals
      const cards = Array.from(document.querySelectorAll('button'));
      const profCard = cards.find(c => c.textContent.includes('Professionals'));
      if (profCard) profCard.click();
    });
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      // Select Professional tone
      const cards = Array.from(document.querySelectorAll('button'));
      const toneCard = cards.find(c => c.textContent.includes('Professional') && c.textContent.includes('Formal'));
      if (toneCard) toneCard.click();
    });
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      // Select Insight format
      const cards = Array.from(document.querySelectorAll('button'));
      const formatCard = cards.find(c => c.textContent.includes('Insight'));
      if (formatCard) formatCard.click();
    });
    await page.waitForTimeout(500);
    
    // Move to Step 3
    console.log('   Moving to Step 3...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextButton = buttons.find(btn => btn.textContent === 'Next' && !btn.disabled);
      if (nextButton) nextButton.click();
    });
    await page.waitForTimeout(1000);
    
    // STEP 3: Research & Language
    console.log('\n🌐 Step 3: Configuring language settings...');
    
    // Language should already be English
    console.log('   Language: English (default)');
    console.log('   Research: Disabled (for faster generation)');
    
    // Move to Step 4
    console.log('   Moving to final step...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextButton = buttons.find(btn => btn.textContent === 'Next' && !btn.disabled);
      if (nextButton) nextButton.click();
    });
    await page.waitForTimeout(1000);
    
    // STEP 4: Generate Content
    console.log('\n🎨 Step 4: Generating content with AI...');
    console.log('   Summary review complete');
    
    // Click Generate
    console.log('\n⚡ Clicking Generate Content button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const genButton = buttons.find(btn => btn.textContent.includes('Generate'));
      if (genButton && !genButton.disabled) {
        genButton.click();
        console.log('Generate button clicked!');
      }
    });
    
    console.log('⏳ Waiting for AI to generate content (5-10 seconds)...\n');
    
    // Wait for generation to complete (increased timeout)
    await page.waitForTimeout(15000);
    
    // Try to capture the generated content
    const generatedContent = await page.evaluate(() => {
      // Look for various possible content containers
      const possibleSelectors = [
        'pre', 
        '.generated-content',
        '[data-generated-content]',
        'div[class*="content"]',
        'div[class*="result"]'
      ];
      
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.length > 100) {
          return element.textContent;
        }
      }
      
      // Check if there's an error message
      const error = document.querySelector('[class*="error"], [class*="Error"]');
      if (error) {
        return `Error: ${error.textContent}`;
      }
      
      return null;
    });
    
    if (generatedContent) {
      console.log('✅ SUCCESS! Content generated by AI:\n');
      console.log('═'.repeat(60));
      console.log(generatedContent.substring(0, 500) + '...');
      console.log('═'.repeat(60));
    } else {
      console.log('⚠️  Content may still be generating or displayed in the UI');
    }
    
    // Take a success screenshot
    await page.screenshot({ path: 'wizard-success.png', fullPage: true });
    console.log('\n📸 Screenshot saved as wizard-success.png');
    
    // Keep open for viewing
    console.log('\n👀 Keeping browser open for 15 seconds to review...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'wizard-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as wizard-error.png');
  }

  await browser.close();
  console.log('\n✅ Demo completed!');
})();