import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { SponsorshipService } from './sponsorship.service.js';

/**
 * Feature: tikit-webapp, Property 38: Sponsorship code uniqueness
 * Validates: Requirements 11.3
 * 
 * For any sponsorship request, a unique code should be generated that no other 
 * sponsorship request possesses
 */

describe('Property 38: Sponsorship code uniqueness', () => {
  let sponsorshipService: SponsorshipService;

  beforeEach(() => {
    sponsorshipService = new SponsorshipService();
  });

  it('should generate unique sponsorship codes for any number of requests', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }), // Number of sponsorship requests
        (numRequests) => {
          const generatedCodes = new Set<string>();

          // Generate multiple sponsorship codes
          for (let i = 0; i < numRequests; i++) {
            const code = sponsorshipService.generateSponsorshipCode();
            
            // Property: Each code should be unique
            expect(generatedCodes.has(code)).toBe(false);
            
            generatedCodes.add(code);
          }

          // Property: Total unique codes should equal number of requests
          expect(generatedCodes.size).toBe(numRequests);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate codes with consistent format', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (numCodes) => {
          const codes: string[] = [];

          for (let i = 0; i < numCodes; i++) {
            const code = sponsorshipService.generateSponsorshipCode();
            codes.push(code);
          }

          // Property: All codes should start with "SP-"
          codes.forEach(code => {
            expect(code).toMatch(/^SP-/);
          });

          // Property: All codes should be unique
          const uniqueCodes = new Set(codes);
          expect(uniqueCodes.size).toBe(codes.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create unique codes for sponsorship requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(
            fc.integer({ min: 8030000000, max: 9099999999 }), // Valid Nigerian phone
            fc.integer({ min: 10000, max: 100000 })
          ),
          { minLength: 1, maxLength: 20 }
        ),
        async (requests) => {
          const createdCodes = new Set<string>();

          for (const [phone, amount] of requests) {
            const code = await sponsorshipService.createSponsorshipRequest({
              requesterId: 'test-user',
              requesterPhone: `+234${phone}`,
              sponsorPhone: `+234${phone + 1}`,
              amount,
            });

            // Property: Newly created code should be unique
            expect(createdCodes.has(code)).toBe(false);
            
            // Property: Code should not be marked as unique after creation
            expect(sponsorshipService.isSponsorshipCodeUnique(code)).toBe(false);

            createdCodes.add(code);
          }

          // Property: All created codes should be different
          expect(createdCodes.size).toBe(requests.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure no two codes are ever identical', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        (numCodes) => {
          const codes: string[] = [];

          // Generate codes sequentially
          for (let i = 0; i < numCodes; i++) {
            const code = sponsorshipService.generateSponsorshipCode();
            codes.push(code);
          }

          // Property: All codes should be unique
          const uniqueCodes = new Set(codes);
          expect(uniqueCodes.size).toBe(codes.length);

          // Property: No two codes should be identical
          for (let i = 0; i < codes.length; i++) {
            for (let j = i + 1; j < codes.length; j++) {
              expect(codes[i]).not.toBe(codes[j]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
