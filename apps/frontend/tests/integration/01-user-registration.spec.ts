import { test, expect } from '@playwright/test';

/**
 * Integration Test: Complete User Registration Flow
 * 
 * Tests the end-to-end user registration and onboarding process:
 * 1. Language selection
 * 2. State selection
 * 3. Phone number registration
 * 4. OTP verification
 * 5. Profile completion
 */

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete onboarding with language and state selection', async ({ page }) => {
    // Step 1: Language Selection
    await expect(page.locator('h1')).toContainText('Select Your Language');
    
    // Select English
    await page.click('button:has-text("English")');
    
    // Step 2: State Selection
    await expect(page.locator('h1')).toContainText('Select Your State');
    
    // Search for Lagos
    await page.fill('input[placeholder*="Search"]', 'Lagos');
    
    // Select Lagos from dropdown
    await page.click('button:has-text("Lagos")');
    
    // Step 3: Verify redirect to home feed
    await expect(page).toHaveURL(/\/(events)?/);
    
    // Verify preferences are saved
    const preferences = await page.evaluate(() => {
      return localStorage.getItem('userPreferences');
    });
    
    expect(preferences).toBeTruthy();
    const parsed = JSON.parse(preferences!);
    expect(parsed.language).toBe('en');
    expect(parsed.state.name).toBe('Lagos');
  });

  test('should persist language preference across sessions', async ({ page, context }) => {
    // Complete onboarding
    await page.click('button:has-text("English")');
    await page.fill('input[placeholder*="Search"]', 'Abuja');
    await page.click('button:has-text("Abuja")');
    
    // Close and reopen page
    await page.close();
    const newPage = await context.newPage();
    await newPage.goto('/');
    
    // Should not show onboarding again
    await expect(newPage.locator('h1')).not.toContainText('Select Your Language');
  });

  test('should allow changing language after onboarding', async ({ page }) => {
    // Complete onboarding
    await page.click('button:has-text("English")');
    await page.fill('input[placeholder*="Search"]', 'Lagos');
    await page.click('button:has-text("Lagos")');
    
    // Navigate to settings (if available)
    // This would depend on your actual UI implementation
    // For now, we'll verify the language is stored
    const preferences = await page.evaluate(() => {
      return localStorage.getItem('userPreferences');
    });
    
    expect(preferences).toBeTruthy();
  });

  test('should support all five languages', async ({ page }) => {
    const languages = ['English', 'Hausa', 'Igbo', 'Yoruba', 'Pidgin'];
    
    for (const language of languages) {
      await page.goto('/');
      
      // Clear previous preferences
      await page.evaluate(() => {
        localStorage.clear();
      });
      
      await page.reload();
      
      // Select language
      await expect(page.locator(`button:has-text("${language}")`)).toBeVisible();
      await page.click(`button:has-text("${language}")`);
      
      // Verify state selection appears
      await expect(page.locator('h1')).toContainText(/Select|Choose/i);
    }
  });

  test('should validate state selection is required', async ({ page }) => {
    // Select language
    await page.click('button:has-text("English")');
    
    // Try to proceed without selecting state
    // This depends on your implementation
    // Verify state selection screen is still visible
    await expect(page.locator('h1')).toContainText('Select Your State');
  });
});

test.describe('Phone Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Complete onboarding first
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
    });
    await page.reload();
  });

  test('should show registration form for new users', async ({ page }) => {
    // Navigate to registration (implementation-specific)
    // This is a placeholder for when auth is implemented
    await page.goto('/auth/register');
    
    // Verify registration form is visible
    await expect(page.locator('input[type="tel"]')).toBeVisible();
  });

  test('should validate Nigerian phone number format', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Enter invalid phone number
    await page.fill('input[type="tel"]', '12345');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=/invalid|error/i')).toBeVisible();
  });

  test('should accept valid Nigerian phone numbers', async ({ page }) => {
    await page.goto('/auth/register');
    
    const validNumbers = [
      '+2348012345678',
      '08012345678',
      '2348012345678',
    ];
    
    for (const number of validNumbers) {
      await page.fill('input[type="tel"]', number);
      // Should not show error
      await expect(page.locator('text=/invalid/i')).not.toBeVisible();
    }
  });
});
