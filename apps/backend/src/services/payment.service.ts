import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

export interface PaymentInitializationData {
  userId: string;
  amount: number;
  email: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerificationData {
  reference: string;
  status: string;
  amount: number;
  metadata?: Record<string, any>;
}

export class PaymentService {
  private paystackSecretKey: string;
  private paystackBaseUrl = 'https://api.paystack.co';
  private flutterwaveSecretKey: string;
  private flutterwaveBaseUrl = 'https://api.flutterwave.com/v3';

  constructor() {
    this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    
    if (!this.paystackSecretKey) {
      console.warn('PAYSTACK_SECRET_KEY not set in environment variables');
    }
    if (!this.flutterwaveSecretKey) {
      console.warn('FLUTTERWAVE_SECRET_KEY not set in environment variables');
    }
  }

  /**
   * Initialize a payment with Paystack
   */
  async initializePayment(data: PaymentInitializationData) {
    const reference = this.generateReference();

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        currency: 'NGN',
        method: 'card',
        status: 'pending',
        provider: 'paystack',
        reference,
        metadata: data.metadata || {},
        isInstallment: false,
      },
    });

    // Try Paystack first, fallback to Flutterwave
    try {
      return await this.initializePaystackPayment(payment.id, reference, data);
    } catch (paystackError) {
      console.error('Paystack initialization failed, trying Flutterwave:', paystackError);
      
      try {
        // Update provider to Flutterwave
        await prisma.payment.update({
          where: { id: payment.id },
          data: { provider: 'flutterwave' },
        });
        
        return await this.initializeFlutterwavePayment(payment.id, reference, data);
      } catch (flutterwaveError) {
        // Both failed, update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        });
        throw new Error('Both payment gateways failed. Please try again later.');
      }
    }
  }

  /**
   * Initialize payment with Paystack
   */
  private async initializePaystackPayment(
    paymentId: string,
    reference: string,
    data: PaymentInitializationData
  ) {
    const response = await fetch(`${this.paystackBaseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amount,
        reference,
        metadata: data.metadata,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || 'Failed to initialize payment with Paystack');
    }

    return {
      paymentId,
      reference,
      authorizationUrl: result.data.authorization_url,
      accessCode: result.data.access_code,
      provider: 'paystack' as const,
    };
  }

  /**
   * Initialize payment with Flutterwave
   */
  private async initializeFlutterwavePayment(
    paymentId: string,
    reference: string,
    data: PaymentInitializationData
  ) {
    const response = await fetch(`${this.flutterwaveBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: data.amount / 100, // Flutterwave uses Naira, not kobo
        currency: 'NGN',
        redirect_url: process.env.FLUTTERWAVE_REDIRECT_URL || 'http://localhost:3000/payment/callback',
        customer: {
          email: data.email,
        },
        customizations: {
          title: 'Tikit Payment',
          description: 'Event ticket purchase',
        },
        meta: data.metadata,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.status !== 'success') {
      throw new Error(result.message || 'Failed to initialize payment with Flutterwave');
    }

    return {
      paymentId,
      reference,
      authorizationUrl: result.data.link,
      accessCode: result.data.link,
      provider: 'flutterwave' as const,
    };
  }

  /**
   * Verify a payment with Paystack or Flutterwave
   */
  async verifyPayment(reference: string): Promise<PaymentVerificationData> {
    // Get payment to determine provider
    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.provider === 'flutterwave') {
      return await this.verifyFlutterwavePayment(reference);
    } else {
      return await this.verifyPaystackPayment(reference);
    }
  }

  /**
   * Verify payment with Paystack
   */
  private async verifyPaystackPayment(reference: string): Promise<PaymentVerificationData> {
    try {
      const response = await fetch(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.paystackSecretKey}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Failed to verify payment');
      }

      const data = result.data;

      // Update payment in database
      await prisma.payment.update({
        where: { reference },
        data: {
          status: data.status === 'success' ? 'successful' : 'failed',
        },
      });

      return {
        reference: data.reference,
        status: data.status,
        amount: data.amount,
        metadata: data.metadata,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify payment with Flutterwave
   */
  private async verifyFlutterwavePayment(reference: string): Promise<PaymentVerificationData> {
    try {
      const response = await fetch(
        `${this.flutterwaveBaseUrl}/transactions/verify_by_reference?tx_ref=${reference}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.flutterwaveSecretKey}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || 'Failed to verify payment');
      }

      const data = result.data;

      // Update payment in database
      await prisma.payment.update({
        where: { reference },
        data: {
          status: data.status === 'successful' ? 'successful' : 'failed',
        },
      });

      return {
        reference: data.tx_ref,
        status: data.status,
        amount: data.amount * 100, // Convert back to kobo
        metadata: data.meta,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle Paystack webhook callback
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', this.paystackSecretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      // Update payment status
      await prisma.payment.update({
        where: { reference: data.reference },
        data: { status: 'successful' },
      });
    } else if (event === 'charge.failed') {
      await prisma.payment.update({
        where: { reference: data.reference },
        data: { status: 'failed' },
      });
    }
  }

  /**
   * Generate a unique payment reference
   */
  private generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `TKT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get payment by reference
   */
  async getPaymentByReference(reference: string) {
    return await prisma.payment.findUnique({
      where: { reference },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket: true,
      },
    });
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string) {
    return await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket: true,
      },
    });
  }
}

export const paymentService = new PaymentService();
