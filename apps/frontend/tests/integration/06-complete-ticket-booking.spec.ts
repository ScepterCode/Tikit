import { test, expect } from '@playwright/test';

test.describe('Complete Ticket Booking System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001');
  });

  test('should complete full ticket booking workflow', async ({ page }) => {
    // 1. Register a new user
    await page.click('text=Register');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="phoneNumber"]', '+2348123456789');
    await page.selectOption('select[name="state"]', 'Lagos');
    await page.selectOption('select[name="lga"]', 'Lagos Island');
    await page.selectOption('select[name="role"]', 'attendee');
    await page.click('button[type="submit"]');

    // Wait for registration success and redirect
    await expect(page).toHaveURL(/\/attendee\/dashboard/);

    // 2. Navigate to Events page
    await page.click('text=Browse Events');
    await expect(page).toHaveURL(/\/events/);

    // 3. Click on an event to view details
    await page.click('.event-card').first();
    await expect(page).toHaveURL(/\/events\/\d+/);

    // 4. Verify event details page loads
    await expect(page.locator('h1')).toContainText('Lagos Music Festival 2024');
    
    // 5. Navigate to tickets tab
    await page.click('text=Buy Tickets');
    
    // 6. Select tickets (regular booking)
    await page.click('input[name="tier"][value="regular"]');
    await page.click('button[aria-label="Increase quantity"]');
    
    // 7. Select payment method
    await page.selectOption('select[name="payment"]', 'wallet');
    
    // 8. Click purchase button
    await page.click('text=Purchase Tickets');
    
    // 9. Verify checkout page
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.locator('h1')).toContainText('Checkout');
    
    // 10. Continue to payment
    await page.click('text=Continue to Payment');
    
    // 11. Complete payment
    await page.click('text=Pay ₦');
    
    // 12. Verify success page
    await expect(page.locator('text=Payment Successful!')).toBeVisible();
    
    // 13. Go to tickets
    await page.click('text=View My Tickets');
    await expect(page).toHaveURL(/\/attendee\/tickets/);
  });

  test('should create and join group buy', async ({ page }) => {
    // Login as attendee
    await page.click('text=Login');
    await page.fill('input[name="phoneNumber"]', '+2348123456789');
    await page.click('button[type="submit"]');
    
    // Navigate to event details
    await page.goto('http://localhost:3001/events/1');
    
    // Go to group buy tab
    await page.click('text=Group Buy');
    
    // Create a group buy
    await page.selectOption('select[name="tier"]', 'regular');
    await page.fill('input[type="range"]', '5');
    await page.click('text=Create Group Buy');
    
    // Verify group buy created
    await expect(page.locator('text=Group buy created successfully!')).toBeVisible();
  });

  test('should handle wedding event features', async ({ page }) => {
    // Login as attendee
    await page.click('text=Login');
    await page.fill('input[name="phoneNumber"]', '+2348123456789');
    await page.click('button[type="submit"]');
    
    // Navigate to wedding event
    await page.goto('http://localhost:3001/events/wedding-1');
    
    // Go to tickets tab
    await page.click('text=Buy Tickets');
    
    // Select ticket tier
    await page.click('input[name="tier"]').first();
    
    // Select food option
    await page.click('input[name="food"]').first();
    
    // Select aso-ebi tier
    await page.click('input[name="asoEbi"]').first();
    
    // Complete RSVP
    await page.click('text=Complete RSVP & Purchase');
    
    // Verify checkout
    await expect(page).toHaveURL(/\/checkout/);
    
    // Test spray money feature
    await page.goBack();
    await page.click('text=Spray Money');
    
    // Fill spray money form
    await page.fill('input[type="number"]', '5000');
    await page.fill('textarea', 'Congratulations!');
    await page.click('text=Spray ₦5,000');
    
    // Verify spray money success
    await expect(page.locator('text=Successfully sprayed')).toBeVisible();
  });

  test('should handle bulk booking', async ({ page }) => {
    // Login as attendee
    await page.click('text=Login');
    await page.fill('input[name="phoneNumber"]', '+2348123456789');
    await page.click('button[type="submit"]');
    
    // Navigate to event details
    await page.goto('http://localhost:3001/events/1');
    await page.click('text=Buy Tickets');
    
    // Switch to bulk booking
    await page.click('text=Bulk Booking (50+)');
    
    // Set bulk quantity
    await page.fill('input[type="number"]', '100');
    
    // Select tier for bulk booking
    await page.click('text=Book 100 Tickets').first();
    
    // Verify checkout with bulk pricing
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.locator('text=100')).toBeVisible();
  });

  test('should handle payment errors gracefully', async ({ page }) => {
    // Login as attendee
    await page.click('text=Login');
    await page.fill('input[name="phoneNumber"]', '+2348123456789');
    await page.click('button[type="submit"]');
    
    // Navigate to checkout (simulate direct navigation)
    await page.goto('http://localhost:3001/checkout', {
      state: {
        purchaseData: {
          eventId: '1',
          items: [{ tierId: 'regular', quantity: 1, price: 5000 }],
          paymentMethod: 'card'
        }
      }
    });
    
    // Continue to payment
    await page.click('text=Continue to Payment');
    
    // Select card payment (which has 10% failure rate in mock)
    await page.click('input[value="card"]');
    await page.click('text=Pay ₦');
    
    // If payment fails, verify error handling
    const errorVisible = await page.locator('text=Payment Failed').isVisible({ timeout: 5000 });
    if (errorVisible) {
      // Test retry functionality
      await page.click('text=Try Again');
      await expect(page.locator('text=Payment Method')).toBeVisible();
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test mobile navigation
    await page.goto('http://localhost:3001/events/1');
    
    // Verify mobile-friendly layout
    const eventCard = page.locator('.event-card').first();
    await expect(eventCard).toBeVisible();
    
    // Test mobile ticket selection
    await page.click('text=Buy Tickets');
    
    // Verify mobile-optimized controls
    const quantityControls = page.locator('.quantity-controls');
    await expect(quantityControls).toBeVisible();
    
    // Test mobile payment flow
    await page.click('input[name="tier"]').first();
    await page.click('text=Purchase Tickets');
    
    // Verify mobile checkout layout
    await expect(page.locator('h1')).toContainText('Checkout');
  });

  test('should handle real-time updates', async ({ page }) => {
    // Login as attendee
    await page.click('text=Login');
    await page.fill('input[name="phoneNumber"]', '+2348123456789');
    await page.click('button[type="submit"]');
    
    // Navigate to wedding event with spray money
    await page.goto('http://localhost:3001/events/wedding-1');
    await page.click('text=Spray Money');
    
    // Verify live badge is present
    await expect(page.locator('text=LIVE')).toBeVisible();
    
    // Test spray money leaderboard
    const leaderboard = page.locator('.leaderboard-list');
    await expect(leaderboard).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    // Login as attendee
    await page.click('text=Login');
    await page.fill('input[name="phoneNumber"]', '+2348123456789');
    await page.click('button[type="submit"]');
    
    // Navigate to event details
    await page.goto('http://localhost:3001/events/1');
    await page.click('text=Group Buy');
    
    // Try to create group buy without selecting tier
    await page.click('text=Create Group Buy');
    
    // Verify validation error
    await expect(page.locator('text=Please select a ticket tier')).toBeVisible();
    
    // Test spray money validation
    await page.goto('http://localhost:3001/events/wedding-1');
    await page.click('text=Spray Money');
    await page.click('text=💸 Spray Money');
    
    // Try to spray with invalid amount
    await page.fill('input[type="number"]', '50'); // Below minimum
    await page.click('button[type="submit"]');
    
    // Verify validation
    await expect(page.locator('text=Minimum spray amount is ₦100')).toBeVisible();
  });
});