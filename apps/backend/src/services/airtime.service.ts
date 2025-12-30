import { prisma } from '../lib/prisma.js';

export interface AirtimePaymentData {
  userId: string;
  phoneNumber: string;
  amount: number;
  metadata?: Record<string, any>;
}

export interface AirtimeDeductionResult {
  success: boolean;
  reference: string;
  balance?: number;
  message?: string;
}

export class AirtimeService {
  /**
   * Process airtime payment
   * This integrates with mobile operator APIs to deduct airtime
   */
  async processAirtimePayment(data: AirtimePaymentData): Promise<AirtimeDeductionResult> {
    const reference = this.generateReference();

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        currency: 'NGN',
        method: 'airtime',
        status: 'pending',
        provider: 'airtime',
        reference,
        metadata: {
          ...data.metadata,
          phoneNumber: data.phoneNumber,
        },
        isInstallment: false,
      },
    });

    try {
      // Deduct airtime from user's balance
      const deductionResult = await this.deductAirtime(
        data.phoneNumber,
        data.amount,
        reference
      );

      if (deductionResult.success) {
        // Update payment status to successful
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'successful' },
        });

        return {
          success: true,
          reference,
          balance: deductionResult.balance,
          message: 'Airtime deducted successfully',
        };
      } else {
        // Update payment status to failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        });

        return {
          success: false,
          reference,
          message: deductionResult.message || 'Failed to deduct airtime',
        };
      }
    } catch (error) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      throw error;
    }
  }

  /**
   * Deduct airtime from user's mobile balance
   * This would integrate with mobile operator APIs (MTN, Glo, Airtel, 9mobile)
   */
  private async deductAirtime(
    phoneNumber: string,
    amount: number,
    reference: string
  ): Promise<{ success: boolean; balance?: number; message?: string }> {
    // In a real implementation, this would call the mobile operator's API
    // For now, we'll simulate the deduction
    
    // Detect operator from phone number prefix
    const operator = this.detectOperator(phoneNumber);
    
    if (!operator) {
      return {
        success: false,
        message: 'Invalid phone number or unsupported operator',
      };
    }

    // Simulate API call to operator
    // In production, this would be:
    // - MTN: Direct carrier billing API
    // - Glo: Direct carrier billing API
    // - Airtel: Direct carrier billing API
    // - 9mobile: Direct carrier billing API
    
    try {
      // Simulate deduction (in production, call actual operator API)
      const deductionSuccessful = await this.callOperatorAPI(
        operator,
        phoneNumber,
        amount,
        reference
      );

      if (deductionSuccessful) {
        return {
          success: true,
          balance: 0, // Would be returned by operator API
          message: 'Airtime deducted successfully',
        };
      } else {
        return {
          success: false,
          message: 'Insufficient airtime balance',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Deduction failed',
      };
    }
  }

  /**
   * Detect mobile operator from phone number
   */
  private detectOperator(phoneNumber: string): string | null {
    // Remove country code and normalize
    const normalized = phoneNumber.replace(/^\+234/, '0').replace(/\s/g, '');

    // MTN prefixes: 0803, 0806, 0810, 0813, 0814, 0816, 0903, 0906, 0913, 0916
    if (/^0(803|806|810|813|814|816|903|906|913|916)/.test(normalized)) {
      return 'MTN';
    }

    // Glo prefixes: 0805, 0807, 0811, 0815, 0905, 0915
    if (/^0(805|807|811|815|905|915)/.test(normalized)) {
      return 'GLO';
    }

    // Airtel prefixes: 0802, 0808, 0812, 0901, 0902, 0904, 0907, 0912
    if (/^0(802|808|812|901|902|904|907|912)/.test(normalized)) {
      return 'AIRTEL';
    }

    // 9mobile prefixes: 0809, 0817, 0818, 0909, 0908
    if (/^0(809|817|818|909|908)/.test(normalized)) {
      return '9MOBILE';
    }

    return null;
  }

  /**
   * Call operator API to deduct airtime
   * This is a placeholder for actual operator API integration
   */
  private async callOperatorAPI(
    operator: string,
    phoneNumber: string,
    amount: number,
    reference: string
  ): Promise<boolean> {
    // In production, this would make actual API calls to:
    // - MTN Direct Carrier Billing API
    // - Glo Direct Carrier Billing API
    // - Airtel Direct Carrier Billing API
    // - 9mobile Direct Carrier Billing API

    console.log(`Simulating ${operator} airtime deduction:`, {
      phoneNumber,
      amount: amount / 100, // Convert kobo to Naira
      reference,
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For testing purposes, simulate success
    // In production, this would return the actual API response
    return true;
  }

  /**
   * Generate a unique reference for airtime payment
   */
  private generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `AIR-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get airtime payment by reference
   */
  async getAirtimePayment(reference: string) {
    return await prisma.payment.findUnique({
      where: { reference },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}

export const airtimeService = new AirtimeService();
