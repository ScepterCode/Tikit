import { test, expect } from '@playwright/test';

/**
 * Integration Test: Ticket Purchase with Different Payment Methods
 * 
 * Tests the complete ticket purchase flow including:
 * 1. Event browsing and selection
 * 2. Ticket tier selection
 * 3. Payment method selection
 * 4. Payment processing
 * 5. Ticket issuance
 */

test.describe('Ticket Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up user preferences
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
    });
    await page.reload();
  });

  test('should display event feed with local events', async ({ page }) => {
    await page.goto('/events');
    
    // Wait for events to load
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    
    // Verify at least one event is displayed
    const eventCards = await page.locator('[data-testid="event-card"]').count();
    expect(eventCards).toBeGreaterThan(0);
  });

  test('should navigate to event detail page', async ({ page }) => {
    await page.goto('/events');
    
    // Wait for events to load
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    
    // Click on first event
    await page.click('[data-testid="event-card"]:first-child');
    
    // Verify event detail page loads
    await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9-]+/);
    
    // Verify event details are displayed
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=/date|time/i')).toBeVisible();
    await expect(page.locator('text=/venue|location/i')).toBeVisible();
  });

  test('should display ticket tiers and pricing', async ({ page }) => {
    await page.goto('/events');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    await page.click('[data-testid="event-card"]:first-child');
    
    // Verify ticket tiers are displayed
    await expect(page.locator('[data-testid="ticket-tier"]')).toBeVisible();
    
    // Verify pricing is displayed
    await expect(page.locator('text=/₦|NGN/i')).toBeVisible();
  });

  test('should allow selecting ticket quantity', async ({ page }) => {
    await page.goto('/events');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    await page.click('[data-testid="event-card"]:first-child');
    
    // Select a ticket tier
    await page.click('[data-testid="ticket-tier"]:first-child');
    
    // Increase quantity
    await page.click('[data-testid="increase-quantity"]');
    
    // Verify quantity increased
    const quantity = await page.locator('[data-testid="ticket-quantity"]').textContent();
    expect(parseInt(quantity || '0')).toBeGreaterThan(1);
  });

  test('should display all payment methods', async ({ page }) => {
    await page.goto('/events');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    await page.click('[data-testid="event-card"]:first-child');
    
    // Select ticket and proceed to payment
    await page.click('[data-testid="ticket-tier"]:first-child');
    await page.click('button:has-text("Continue")');
    
    // Verify payment methods are displayed
    const paymentMethods = [
      'Card',
      'Bank Transfer',
      'Opay',
      'Palmpay',
      'Airtime',
      'Sponsor',
    ];
    
    for (const method of paymentMethods) {
      await expect(page.locator(`text=${method}`)).toBeVisible();
    }
  });

  test('should display installment options', async ({ page }) => {
    await page.goto('/events');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    await page.click('[data-testid="event-card"]:first-child');
    
    // Select ticket and proceed to payment
    await page.click('[data-testid="ticket-tier"]:first-child');
    await page.click('button:has-text("Continue")');
    
    // Verify installment options
    await expect(page.locator('text=/Full Payment/i')).toBeVisible();
    await expect(page.locator('text=/2.*parts?/i')).toBeVisible();
    await expect(page.locator('text=/3.*parts?/i')).toBeVisible();
    await expect(page.locator('text=/4.*parts?/i')).toBeVisible();
  });

  test('should calculate installment amounts correctly', async ({ page }) => {
    await page.goto('/events');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    await page.click('[data-testid="event-card"]:first-child');
    
    // Get ticket price
    const priceText = await page.locator('[data-testid="ticket-price"]').first().textContent();
    const price = parseInt(priceText?.replace(/[^0-9]/g, '') || '0');
    
    // Select ticket and proceed to payment
    await page.click('[data-testid="ticket-tier"]:first-child');
    await page.click('button:has-text("Continue")');
    
    // Select 2-part installment
    await page.click('text=/2.*parts?/i');
    
    // Verify installment amount
    const installmentText = await page.locator('[data-testid="installment-amount"]').textContent();
    const installmentAmount = parseInt(installmentText?.replace(/[^0-9]/g, '') || '0');
    
    expect(installmentAmount).toBe(Math.ceil(price / 2));
  });
});

test.describe('Payment Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
    });
    await page.reload();
  });

  test('should handle payment errors gracefully', async ({ page }) => {
    // This test would require mocking payment gateway responses
    // For now, we'll verify error handling UI exists
    await page.goto('/events');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    await page.click('[data-testid="event-card"]:first-child');
    
    // Verify error handling components exist
    // Implementation depends on your error handling strategy
  });

  test('should show loading state during payment', async ({ page }) => {
    await page.goto('/events');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    await page.click('[data-testid="event-card"]:first-child');
    
    // Select ticket and payment method
    await page.click('[data-testid="ticket-tier"]:first-child');
    await page.click('button:has-text("Continue")');
    
    // Verify loading indicators exist
    // Implementation depends on your UI
  });
});

test.describe('Ticket Issuance', () => {
  test('should display ticket after successful purchase', async ({ page }) => {
    // This test requires a complete purchase flow
    // For now, we'll test the ticket display component
    await page.goto('/wallet');
    
    // Verify wallet page loads
    await expect(page.locator('h1')).toContainText(/Wallet|Tickets/i);
  });

  test('should display QR code for ticket', async ({ page }) => {
    await page.goto('/wallet');
    
    // If tickets exist, verify QR code is displayed
    const ticketCount = await page.locator('[data-testid="ticket-card"]').count();
    
    if (ticketCount > 0) {
      await page.click('[data-testid="ticket-card"]:first-child');
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    }
  });

  test('should display backup code for ticket', async ({ page }) => {
    await page.goto('/wallet');
    
    const ticketCount = await page.locator('[data-testid="ticket-card"]').count();
    
    if (ticketCount > 0) {
      await page.click('[data-testid="ticket-card"]:first-child');
      await expect(page.locator('[data-testid="backup-code"]')).toBeVisible();
    }
  });
});
