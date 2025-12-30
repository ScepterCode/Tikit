# Integration Tests

This directory contains end-to-end integration tests for the Tikit platform using Playwright.

## Overview

The integration tests cover critical user flows and ensure that all components work together correctly. Tests are organized by feature area:

1. **User Registration** (`01-user-registration.spec.ts`)
   - Language selection
   - State selection
   - Phone number registration
   - OTP verification
   - Onboarding flow

2. **Ticket Purchase** (`02-ticket-purchase.spec.ts`)
   - Event browsing
   - Ticket selection
   - Payment method selection
   - Payment processing
   - Ticket issuance

3. **Group Buy** (`03-group-buy.spec.ts`)
   - Group buy initiation
   - Payment link generation
   - Participant tracking
   - Group buy completion
   - Expiration handling

4. **Offline Wallet** (`04-offline-wallet.spec.ts`)
   - Offline ticket storage
   - QR code display without internet
   - Backup code access
   - Sync when connection restored
   - Service worker functionality

5. **Organizer Dashboard** (`05-organizer-dashboard.spec.ts`)
   - Event creation
   - Analytics viewing
   - Attendee management
   - Broadcasting messages
   - Role-based access control

## Running Tests

### Prerequisites

Install Playwright browsers:
```bash
pnpm playwright:install
```

### Run All Tests

```bash
# Run all integration tests
pnpm test:integration

# Run with UI mode (interactive)
pnpm test:integration:ui

# Run in headed mode (see browser)
pnpm test:integration:headed
```

### Run Specific Tests

```bash
# Run a specific test file
pnpm playwright test 01-user-registration.spec.ts

# Run tests matching a pattern
pnpm playwright test --grep "registration"

# Run a specific test
pnpm playwright test --grep "should complete onboarding"
```

### Run on Specific Browsers

```bash
# Run on Chrome only
pnpm playwright test --project=chromium

# Run on Firefox only
pnpm playwright test --project=firefox

# Run on mobile
pnpm playwright test --project="Mobile Chrome"
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (development) or `process.env.BASE_URL` (CI/production)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries on CI, 0 locally
- **Parallel**: Tests run in parallel by default
- **Reporters**: HTML, JSON, JUnit

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code that runs before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test code
    await page.click('button');
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable selectors:
   ```html
   <button data-testid="submit-button">Submit</button>
   ```
   ```typescript
   await page.click('[data-testid="submit-button"]');
   ```

2. **Wait for elements** before interacting:
   ```typescript
   await page.waitForSelector('[data-testid="event-card"]');
   await page.click('[data-testid="event-card"]:first-child');
   ```

3. **Use meaningful test names** that describe the behavior:
   ```typescript
   test('should display error message when phone number is invalid', async ({ page }) => {
     // ...
   });
   ```

4. **Clean up state** between tests:
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.evaluate(() => {
       localStorage.clear();
       sessionStorage.clear();
     });
   });
   ```

5. **Test user flows**, not implementation details:
   ```typescript
   // Good: Test the user flow
   test('should complete ticket purchase', async ({ page }) => {
     await page.goto('/events');
     await page.click('[data-testid="event-card"]:first-child');
     await page.click('[data-testid="buy-ticket"]');
     await page.fill('[data-testid="payment-card"]', '4242424242424242');
     await page.click('[data-testid="submit-payment"]');
     await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
   });
   
   // Bad: Test implementation details
   test('should call purchaseTicket function', async ({ page }) => {
     // Don't test internal function calls
   });
   ```

## Debugging Tests

### Visual Debugging

```bash
# Run with UI mode
pnpm test:integration:ui

# Run in headed mode
pnpm test:integration:headed

# Run with debug mode
pnpm playwright test --debug
```

### Screenshots and Videos

Tests automatically capture:
- Screenshots on failure
- Videos on failure (retained)
- Traces on first retry

View results:
```bash
# Open HTML report
pnpm playwright show-report
```

### Console Logs

Add console logs in tests:
```typescript
test('debug test', async ({ page }) => {
  console.log('Current URL:', page.url());
  
  const text = await page.locator('h1').textContent();
  console.log('Heading text:', text);
});
```

## CI/CD Integration

Tests run automatically in CI/CD pipeline:

1. **On Pull Request**: Run all integration tests
2. **On Staging Deploy**: Run smoke tests
3. **On Production Deploy**: Run full test suite

### Environment Variables

Set these in CI/CD:
```bash
BASE_URL=https://tikit.ng
API_URL=https://api.tikit.ng
```

## Test Data

### Mock Data

Tests use mock data for offline scenarios:
```typescript
await page.evaluate(() => {
  const mockTicket = {
    id: 'test-ticket-1',
    eventName: 'Test Event',
    qrCode: 'data:image/png;base64,test',
    backupCode: '123456',
  };
  
  localStorage.setItem('offlineTickets', JSON.stringify([mockTicket]));
});
```

### Test Users

For authenticated tests, use test accounts:
- Phone: `+2348012345678` (test account)
- OTP: `123456` (test OTP in staging)

## Troubleshooting

### Common Issues

**Issue: Tests timeout**
- Increase timeout in test:
  ```typescript
  test('slow test', async ({ page }) => {
    test.setTimeout(60000); // 60 seconds
    // ...
  });
  ```

**Issue: Element not found**
- Add explicit wait:
  ```typescript
  await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });
  ```

**Issue: Flaky tests**
- Use `waitForLoadState`:
  ```typescript
  await page.goto('/events');
  await page.waitForLoadState('networkidle');
  ```

**Issue: Tests pass locally but fail in CI**
- Check for timing issues
- Verify environment variables
- Check browser versions

## Performance

### Test Execution Time

- Full suite: ~10-15 minutes
- Single test file: ~1-2 minutes
- Smoke tests: ~30 seconds

### Optimization Tips

1. Run tests in parallel (default)
2. Use `test.describe.parallel()` for independent tests
3. Reuse browser contexts when possible
4. Skip unnecessary waits

## Maintenance

### Updating Tests

When UI changes:
1. Update selectors (prefer data-testid)
2. Update expected text/content
3. Update screenshots if using visual regression

### Adding New Tests

1. Create new spec file in appropriate category
2. Follow naming convention: `XX-feature-name.spec.ts`
3. Add to this README
4. Update CI/CD if needed

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)
