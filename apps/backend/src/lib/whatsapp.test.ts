import { describe, it, expect, beforeEach, vi } from 'vitest';
import { whatsappService } from './whatsapp.js';

describe('WhatsApp Service', () => {
  beforeEach(() => {
    // Clear any mocks
    vi.clearAllMocks();
  });

  describe('Phone Number Formatting', () => {
    it('should format Nigerian phone numbers correctly', async () => {
      // Test with various formats
      const testCases = [
        { input: '08012345678', expected: '+2348012345678' },
        { input: '2348012345678', expected: '+2348012345678' },
        { input: '+2348012345678', expected: '+2348012345678' },
        { input: '07012345678', expected: '+2347012345678' },
      ];

      for (const testCase of testCases) {
        const result = await whatsappService.sendTextMessage(
          testCase.input,
          'Test message'
        );
        
        // In development mode (not configured), it should still succeed
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid phone numbers', async () => {
      const invalidNumbers = [
        '123', // Too short
        '12345678901234567890', // Too long
        'invalid', // Not a number
      ];

      for (const number of invalidNumbers) {
        const result = await whatsappService.sendTextMessage(number, 'Test');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid phone number format');
      }
    });
  });

  describe('Text Message Sending', () => {
    it('should send text message successfully in development mode', async () => {
      const result = await whatsappService.sendTextMessage(
        '+2348012345678',
        'Test message'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle empty messages', async () => {
      const result = await whatsappService.sendTextMessage(
        '+2348012345678',
        ''
      );

      // Should still succeed in development mode
      expect(result.success).toBe(true);
    });
  });

  describe('Broadcast Sending', () => {
    it('should send broadcast to multiple recipients', async () => {
      const recipients = [
        '+2348012345678',
        '+2348012345679',
        '+2348012345680',
      ];

      const result = await whatsappService.sendBroadcast(
        recipients,
        'Broadcast message'
      );

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.results).toHaveLength(3);
    });

    it('should handle mixed valid and invalid numbers', async () => {
      const recipients = [
        '+2348012345678', // Valid
        'invalid', // Invalid
        '+2348012345679', // Valid
      ];

      const result = await whatsappService.sendBroadcast(
        recipients,
        'Broadcast message'
      );

      expect(result.sentCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.results).toHaveLength(3);
    });

    it('should handle empty recipient list', async () => {
      const result = await whatsappService.sendBroadcast([], 'Message');

      expect(result.success).toBe(false);
      expect(result.sentCount).toBe(0);
      expect(result.failedCount).toBe(0);
    });
  });

  describe('Service Configuration', () => {
    it('should report configuration status', () => {
      const isReady = whatsappService.isReady();
      
      // In test environment, should not be configured
      expect(typeof isReady).toBe('boolean');
    });
  });

  describe('Template Message Sending', () => {
    it('should send template message in development mode', async () => {
      const result = await whatsappService.sendTemplateMessage(
        '+2348012345678',
        'event_reminder',
        'en'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle template with components', async () => {
      const components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Event Name' },
            { type: 'text', text: 'Tomorrow at 5 PM' },
          ],
        },
      ];

      const result = await whatsappService.sendTemplateMessage(
        '+2348012345678',
        'event_reminder',
        'en',
        components
      );

      expect(result.success).toBe(true);
    });
  });
});
