/**
 * WhatsApp Business API Integration
 * Handles sending messages via WhatsApp Business API
 */

interface WhatsAppConfig {
  apiUrl: string;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
}

interface WhatsAppMessage {
  to: string; // Phone number in international format (e.g., +2348012345678)
  type: 'text' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private isConfigured: boolean;

  constructor() {
    this.config = {
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    };

    // Check if WhatsApp is properly configured
    this.isConfigured = !!(
      this.config.phoneNumberId &&
      this.config.accessToken &&
      this.config.businessAccountId
    );

    if (!this.isConfigured) {
      console.warn(
        'WhatsApp Business API is not configured. Messages will be logged but not sent.'
      );
    }
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendTextMessage(to: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Validate phone number format
      const phoneNumber = this.formatPhoneNumber(to);
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      // If not configured, just log and return success
      if (!this.isConfigured) {
        console.log('WhatsApp message (not sent - not configured):', {
          to: phoneNumber,
          message,
          timestamp: new Date().toISOString(),
        });
        return {
          success: true,
          messageId: `mock-${Date.now()}`,
        };
      }

      // Send message via WhatsApp Business API
      const url = `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`;
      
      const payload: WhatsAppMessage = {
        to: phoneNumber,
        type: 'text',
        text: {
          body: message,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          ...payload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        console.error('WhatsApp API error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || 'Failed to send WhatsApp message',
        };
      }

      const data = await response.json() as WhatsAppResponse;
      
      return {
        success: true,
        messageId: data.messages[0]?.id,
      };
    } catch (error) {
      console.error('Send WhatsApp message error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a template message via WhatsApp
   * Templates must be pre-approved by WhatsApp
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: any[]
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const phoneNumber = this.formatPhoneNumber(to);
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      if (!this.isConfigured) {
        console.log('WhatsApp template message (not sent - not configured):', {
          to: phoneNumber,
          templateName,
          languageCode,
          components,
          timestamp: new Date().toISOString(),
        });
        return {
          success: true,
          messageId: `mock-${Date.now()}`,
        };
      }

      const url = `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`;
      
      const payload: WhatsAppMessage = {
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          ...payload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        console.error('WhatsApp API error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || 'Failed to send WhatsApp template',
        };
      }

      const data = await response.json() as WhatsAppResponse;
      
      return {
        success: true,
        messageId: data.messages[0]?.id,
      };
    } catch (error) {
      console.error('Send WhatsApp template error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send messages to multiple recipients (broadcast)
   */
  async sendBroadcast(
    recipients: string[],
    message: string
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    results: Array<{
      phoneNumber: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }> {
    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      const result = await this.sendTextMessage(recipient, message);
      
      results.push({
        phoneNumber: recipient,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      // Add a small delay between messages to avoid rate limiting
      // WhatsApp Business API has rate limits (typically 80 messages/second)
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      results,
    };
  }

  /**
   * Format phone number to international format
   * Assumes Nigerian phone numbers if no country code is provided
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If starts with 0, replace with 234 (Nigeria country code)
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }

    // If doesn't start with country code, add 234
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }

    // Validate length (Nigerian numbers should be 13 digits with country code)
    if (cleaned.length !== 13) {
      return null;
    }

    return '+' + cleaned;
  }

  /**
   * Check if WhatsApp service is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
export default whatsappService;
