import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

export interface SponsorshipRequest {
  requesterId: string;
  requesterPhone: string;
  sponsorPhone: string;
  amount: number;
  eventId?: string;
  metadata?: Record<string, any>;
}

export interface SponsorshipApproval {
  code: string;
  otp: string;
  sponsorId: string;
}

// In-memory storage for sponsorship codes and OTPs
// In production, this should be stored in Redis with expiration
const sponsorshipCodes = new Map<string, {
  requesterId: string;
  requesterPhone: string;
  sponsorPhone: string;
  amount: number;
  eventId?: string;
  metadata?: Record<string, any>;
  otp?: string;
  expiresAt: Date;
}>();

export class SponsorshipService {
  /**
   * Generate a unique sponsorship code
   */
  generateSponsorshipCode(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `SP-${timestamp}-${random}`;
  }

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create a sponsorship request
   */
  async createSponsorshipRequest(data: SponsorshipRequest): Promise<string> {
    const code = this.generateSponsorshipCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration

    // Store sponsorship request
    sponsorshipCodes.set(code, {
      requesterId: data.requesterId,
      requesterPhone: data.requesterPhone,
      sponsorPhone: data.sponsorPhone,
      amount: data.amount,
      eventId: data.eventId,
      metadata: data.metadata,
      expiresAt,
    });

    // In production, send SMS to sponsor with the code
    console.log(`Sponsorship code ${code} sent to ${data.sponsorPhone}`);

    return code;
  }

  /**
   * Get sponsorship request by code
   */
  getSponsorshipRequest(code: string) {
    const request = sponsorshipCodes.get(code);
    
    if (!request) {
      return null;
    }

    // Check if expired
    if (new Date() > request.expiresAt) {
      sponsorshipCodes.delete(code);
      return null;
    }

    return request;
  }

  /**
   * Send OTP to sponsor for approval
   */
  async sendApprovalOTP(code: string): Promise<boolean> {
    const request = sponsorshipCodes.get(code);
    
    if (!request) {
      throw new Error('Sponsorship request not found');
    }

    // Check if expired
    if (new Date() > request.expiresAt) {
      sponsorshipCodes.delete(code);
      throw new Error('Sponsorship request has expired');
    }

    // Generate OTP
    const otp = this.generateOTP();
    
    // Update request with OTP
    request.otp = otp;
    sponsorshipCodes.set(code, request);

    // In production, send OTP via SMS to sponsor
    console.log(`OTP ${otp} sent to ${request.sponsorPhone} for sponsorship ${code}`);

    return true;
  }

  /**
   * Verify OTP and approve sponsorship
   */
  async approveSponsorshipWithOTP(data: SponsorshipApproval): Promise<boolean> {
    const request = sponsorshipCodes.get(data.code);
    
    if (!request) {
      throw new Error('Sponsorship request not found');
    }

    // Check if expired
    if (new Date() > request.expiresAt) {
      sponsorshipCodes.delete(data.code);
      throw new Error('Sponsorship request has expired');
    }

    // Verify OTP
    if (!request.otp || request.otp !== data.otp) {
      throw new Error('Invalid OTP');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: request.requesterId,
        amount: request.amount,
        currency: 'NGN',
        method: 'sponsored',
        status: 'pending',
        provider: 'sponsorship',
        reference: this.generatePaymentReference(),
        metadata: {
          ...request.metadata,
          sponsorId: data.sponsorId,
          sponsorshipCode: data.code,
        },
        isInstallment: false,
      },
    });

    // In production, process the sponsor's payment here
    // For now, we'll mark it as successful
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'successful' },
    });

    // Clean up sponsorship request
    sponsorshipCodes.delete(data.code);

    return true;
  }

  /**
   * Cancel a sponsorship request
   */
  cancelSponsorshipRequest(code: string): boolean {
    return sponsorshipCodes.delete(code);
  }

  /**
   * Generate a unique payment reference
   */
  private generatePaymentReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `SPONSOR-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get all active sponsorship requests for a user
   */
  getUserSponsorshipRequests(userId: string) {
    const requests: Array<{ code: string; data: any }> = [];
    
    for (const [code, data] of sponsorshipCodes.entries()) {
      if (data.requesterId === userId && new Date() <= data.expiresAt) {
        requests.push({ code, data });
      }
    }
    
    return requests;
  }

  /**
   * Check if a sponsorship code is unique
   */
  isSponsorshipCodeUnique(code: string): boolean {
    return !sponsorshipCodes.has(code);
  }
}

export const sponsorshipService = new SponsorshipService();
