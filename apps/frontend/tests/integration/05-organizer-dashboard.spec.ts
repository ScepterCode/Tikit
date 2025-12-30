import { test, expect } from '@playwright/test';

/**
 * Integration Test: Organizer Dashboard Operations
 * 
 * Tests organizer-specific features including:
 * 1. Event creation
 * 2. Analytics viewing
 * 3. Attendee management
 * 4. Broadcasting messages
 * 5. Role-based access control
 */

test.describe('Organizer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
      
      // Mock organizer authentication
      localStorage.setItem('userRole', 'organizer');
    });
    await page.reload();
  });

  test('should display organizer dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify dashboard loads
    await expect(page.locator('h1')).toContainText(/Dashboard|Events/i);
  });

  test('should show event creation button', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify create event button is visible
    await expect(page.locator('button:has-text("Create Event")')).toBeVisible();
  });

  test('should display event templates', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click create event
    await page.click('button:has-text("Create Event")');
    
    // Verify 5 templates are available
    const templates = [
      'Wedding',
      'Crusade',
      'Burial',
      'Festival',
      'General',
    ];
    
    for (const template of templates) {
      await expect(page.locator(`text=${template}`)).toBeVisible();
    }
  });

  test('should allow creating a wedding event', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Create Event")');
    
    // Select wedding template
    await page.click('text=Wedding');
    
    // Fill in event details
    await page.fill('[name="title"]', 'Test Wedding Event');
    await page.fill('[name="description"]', 'A beautiful wedding celebration');
    await page.fill('[name="venue"]', 'Grand Ballroom, Lagos');
    
    // Verify wedding-specific fields
    await expect(page.locator('text=/Aso-ebi|Food Options/i')).toBeVisible();
  });

  test('should display event analytics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on an existing event (if any)
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      
      // Verify analytics are displayed
      await expect(page.locator('text=/Sales|Revenue|Attendees/i')).toBeVisible();
    }
  });

  test('should show real-time sales counter', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      
      // Verify sales counter is displayed
      await expect(page.locator('[data-testid="sales-counter"]')).toBeVisible();
    }
  });

  test('should display attendee demographics', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      
      // Verify demographics section exists
      await expect(page.locator('text=/Demographics|Statistics/i')).toBeVisible();
    }
  });
});

test.describe('Attendee Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
      localStorage.setItem('userRole', 'organizer');
    });
    await page.reload();
  });

  test('should display attendee list', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      
      // Navigate to attendees tab
      await page.click('text=/Attendees|Guests/i');
      
      // Verify attendee list is displayed
      await expect(page.locator('[data-testid="attendee-list"]')).toBeVisible();
    }
  });

  test('should allow searching attendees', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      await page.click('text=/Attendees|Guests/i');
      
      // Verify search input exists
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    }
  });

  test('should allow exporting attendee data', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      await page.click('text=/Attendees|Guests/i');
      
      // Verify export button exists
      await expect(page.locator('button:has-text("Export")')).toBeVisible();
    }
  });

  test('should display attendee details', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      await page.click('text=/Attendees|Guests/i');
      
      // Verify attendee details columns
      await expect(page.locator('text=/Name|Phone|Ticket|Payment/i')).toBeVisible();
    }
  });
});

test.describe('Broadcasting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
      localStorage.setItem('userRole', 'organizer');
    });
    await page.reload();
  });

  test('should display broadcast composer', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      
      // Navigate to broadcast section
      await page.click('text=/Broadcast|Messages/i');
      
      // Verify composer is displayed
      await expect(page.locator('[data-testid="broadcast-composer"]')).toBeVisible();
    }
  });

  test('should allow composing WhatsApp message', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      await page.click('text=/Broadcast|Messages/i');
      
      // Verify message input exists
      await expect(page.locator('textarea[placeholder*="message"]')).toBeVisible();
    }
  });

  test('should show recipient count', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      await page.click('text=/Broadcast|Messages/i');
      
      // Verify recipient count is displayed
      await expect(page.locator('[data-testid="recipient-count"]')).toBeVisible();
    }
  });

  test('should validate message before sending', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      await page.click('text=/Broadcast|Messages/i');
      
      // Try to send empty message
      await page.click('button:has-text("Send")');
      
      // Should show validation error
      await expect(page.locator('text=/required|empty/i')).toBeVisible();
    }
  });
});

test.describe('Role-Based Access Control', () => {
  test('should restrict financial access for viewer role', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
      localStorage.setItem('userRole', 'viewer');
    });
    await page.reload();
    
    await page.goto('/dashboard');
    
    // Verify financial sections are hidden or disabled
    const hasFinancialAccess = await page.locator('text=/Revenue|Earnings|Payout/i').isVisible();
    expect(hasFinancialAccess).toBeFalsy();
  });

  test('should restrict editing for viewer role', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
      localStorage.setItem('userRole', 'viewer');
    });
    await page.reload();
    
    await page.goto('/dashboard');
    
    // Verify edit buttons are hidden or disabled
    const canEdit = await page.locator('button:has-text("Edit Event")').isVisible();
    expect(canEdit).toBeFalsy();
  });

  test('should allow full access for admin role', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
      localStorage.setItem('userRole', 'admin');
    });
    await page.reload();
    
    await page.goto('/dashboard');
    
    // Verify all sections are accessible
    await expect(page.locator('button:has-text("Create Event")')).toBeVisible();
  });
});

test.describe('Event Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userPreferences', JSON.stringify({
        language: 'en',
        state: { name: 'Lagos', code: 'LA' }
      }));
      localStorage.setItem('userRole', 'organizer');
    });
    await page.reload();
  });

  test('should allow editing event details', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      
      // Click edit button
      await page.click('button:has-text("Edit")');
      
      // Verify edit form is displayed
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('should allow canceling event', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      await page.click('[data-testid="event-card"]:first-child');
      
      // Verify cancel option exists
      await expect(page.locator('button:has-text("Cancel Event")')).toBeVisible();
    }
  });

  test('should display event status', async ({ page }) => {
    await page.goto('/dashboard');
    
    const eventCount = await page.locator('[data-testid="event-card"]').count();
    
    if (eventCount > 0) {
      // Verify status badge is displayed
      await expect(page.locator('[data-testid="event-status"]')).toBeVisible();
    }
  });
});
