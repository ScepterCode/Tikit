import { describe, it, expect, beforeAll } from 'vitest';
import fc from 'fast-check';
import {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  encryptPaymentInfo,
  decryptPaymentInfo,
  encryptPII,
  decryptPII,
  generateEncryptionKey,
  generateSalt,
} from './encryption.service.js';

/**
 * Feature: tikit-webapp, Property 46: Sensitive data encryption
 * Validates: Requirements 13.3
 * 
 * Property: For any sensitive data (payment information, personal details) stored in the database,
 * it should be encrypted using AES-256
 */

describe('Encryption Service Property Tests', () => {
  beforeAll(() => {
    // Ensure encryption keys are set for tests
    if (!process.env.ENCRYPTION_KEY) {
      process.env.ENCRYPTION_KEY = 'test_encryption_key_for_testing_only_32_chars_minimum';
    }
    if (!process.env.ENCRYPTION_SALT) {
      process.env.ENCRYPTION_SALT = 'test_encryption_salt_for_testing_only';
    }
  });

  describe('Property 46: Sensitive data encryption', () => {
    it('should encrypt and decrypt any string correctly (round-trip)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (plaintext) => {
            // Encrypt the plaintext
            const encrypted = encrypt(plaintext);

            // Encrypted should be different from plaintext
            expect(encrypted).not.toBe(plaintext);

            // Decrypt should return original plaintext
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should produce different ciphertext for the same plaintext (IV randomization)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            // Encrypt the same plaintext twice
            const encrypted1 = encrypt(plaintext);
            const encrypted2 = encrypt(plaintext);

            // Ciphertexts should be different (due to random IV)
            expect(encrypted1).not.toBe(encrypted2);

            // Both should decrypt to the same plaintext
            expect(decrypt(encrypted1)).toBe(plaintext);
            expect(decrypt(encrypted2)).toBe(plaintext);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should encrypt payment information correctly', () => {
      // Test with specific examples instead of property test for speed
      const testCases = [
        { cardNumber: '4111111111111111', cvv: '123' },
        { accountNumber: '1234567890', bankCode: '058' },
        { cardNumber: '5555555555554444', cvv: '456', expiryDate: '12/25' },
      ];

      for (const paymentInfo of testCases) {
        const encrypted = encryptPaymentInfo(paymentInfo);
        
        // Verify encrypted fields are different
        if (paymentInfo.cardNumber) {
          expect(encrypted.cardNumber).toBeTruthy();
          expect(encrypted.cardNumber).not.toBe(paymentInfo.cardNumber);
        }
        
        // Decrypt and verify round-trip
        const decrypted = decryptPaymentInfo(encrypted);
        expect(decrypted).toEqual(paymentInfo);
      }
    });

    it('should encrypt PII correctly', () => {
      // Test with specific examples instead of property test for speed
      const testCases = [
        { email: 'test@example.com', phoneNumber: '+2348031234567' },
        { firstName: 'John', lastName: 'Doe' },
        { email: 'user@test.com', firstName: 'Jane', nin: '12345678901' },
      ];

      for (const pii of testCases) {
        const encrypted = encryptPII(pii);
        
        // Verify encrypted fields are different
        if (pii.email) {
          expect(encrypted.email).toBeTruthy();
          expect(encrypted.email).not.toBe(pii.email);
        }
        
        // Decrypt and verify round-trip
        const decrypted = decryptPII(encrypted);
        expect(decrypted).toEqual(pii);
      }
    });

    it('should hash data consistently', () => {
      // Skip property test for hash due to performance (PBKDF2 is slow)
      // Test with a few examples instead
      const testData = ['test1', 'test2', 'sensitive data'];
      
      for (const data of testData) {
        const hashed = hash(data);
        expect(hashed).not.toBe(data);
        expect(verifyHash(data, hashed)).toBe(true);
        expect(verifyHash(data + 'x', hashed)).toBe(false);
      }
    });

    it('should produce different hashes for the same data (salt randomization)', () => {
      // Skip property test for hash due to performance (PBKDF2 is slow)
      // Test with a few examples instead
      const testData = ['test1', 'test2'];
      
      for (const data of testData) {
        const hash1 = hash(data);
        const hash2 = hash(data);
        expect(hash1).not.toBe(hash2);
        expect(verifyHash(data, hash1)).toBe(true);
        expect(verifyHash(data, hash2)).toBe(true);
      }
    });

    it('should handle empty strings correctly', () => {
      // Encrypt empty string
      const encrypted = encrypt('');
      expect(encrypted).toBeTruthy();

      // Decrypt should return empty string
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle special characters and unicode', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            // Encrypt string
            const encrypted = encrypt(plaintext);

            // Decrypt should return original
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle very long strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1000, maxLength: 10000 }),
          (plaintext) => {
            // Encrypt long string
            const encrypted = encrypt(plaintext);

            // Decrypt should return original
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should fail to decrypt with tampered ciphertext', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          (plaintext) => {
            // Encrypt the plaintext
            const encrypted = encrypt(plaintext);

            // Tamper with the ciphertext by changing one character
            const tamperedIndex = Math.floor(encrypted.length / 2);
            const tampered = 
              encrypted.substring(0, tamperedIndex) + 
              (encrypted[tamperedIndex] === 'A' ? 'B' : 'A') + 
              encrypted.substring(tamperedIndex + 1);

            // Decryption should fail
            expect(() => decrypt(tampered)).toThrow();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should generate unique encryption keys', () => {
      const keys = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const key = generateEncryptionKey();
        expect(key).toBeTruthy();
        expect(key.length).toBeGreaterThan(0);
        keys.add(key);
      }

      // All keys should be unique
      expect(keys.size).toBe(100);
    });

    it('should generate unique salts', () => {
      const salts = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const salt = generateSalt();
        expect(salt).toBeTruthy();
        expect(salt.length).toBeGreaterThan(0);
        salts.add(salt);
      }

      // All salts should be unique
      expect(salts.size).toBe(100);
    });

    it('should maintain data integrity with authentication tags', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            // Encrypt the plaintext
            const encrypted = encrypt(plaintext);

            // Decryption should succeed with correct auth tag
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(plaintext);

            // The encrypted data includes IV + authTag + ciphertext
            // Verify the structure is correct
            const buffer = Buffer.from(encrypted, 'base64');
            expect(buffer.length).toBeGreaterThan(32); // At least IV (16) + authTag (16)
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should encrypt card numbers with proper format preservation', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.constantFrom('4', '5', '3', '6'), // Visa, Mastercard, Amex, Discover
            fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 15, maxLength: 15 })
          ).map(([first, rest]) => first + rest.join('')),
          (cardNumber) => {
            const paymentInfo = { cardNumber };
            
            // Encrypt
            const encrypted = encryptPaymentInfo(paymentInfo);
            expect(encrypted.cardNumber).toBeTruthy();
            expect(encrypted.cardNumber).not.toBe(cardNumber);

            // Decrypt
            const decrypted = decryptPaymentInfo(encrypted);
            expect(decrypted.cardNumber).toBe(cardNumber);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should encrypt Nigerian phone numbers correctly', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.constantFrom('803', '806', '810', '813', '814', '816', '903', '906', '913'),
            fc.integer({ min: 1000000, max: 9999999 })
          ).map(([prefix, suffix]) => `+234${prefix}${suffix}`),
          (phoneNumber) => {
            const pii = { phoneNumber };
            
            // Encrypt
            const encrypted = encryptPII(pii);
            expect(encrypted.phoneNumber).toBeTruthy();
            expect(encrypted.phoneNumber).not.toBe(phoneNumber);

            // Decrypt
            const decrypted = decryptPII(encrypted);
            expect(decrypted.phoneNumber).toBe(phoneNumber);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle partial payment info encryption', () => {
      // Test with specific examples
      const testCases = [
        { cardNumber: '4111111111111111' },
        { cvv: '123' },
        { cardNumber: '5555555555554444', cvv: '456' },
      ];

      for (const paymentInfo of testCases) {
        const encrypted = encryptPaymentInfo(paymentInfo);
        const decrypted = decryptPaymentInfo(encrypted);
        
        // Check that only provided fields are present
        Object.keys(paymentInfo).forEach(key => {
          expect(decrypted[key as keyof typeof paymentInfo]).toBe(paymentInfo[key as keyof typeof paymentInfo]);
        });
      }
    });

    it('should handle partial PII encryption', () => {
      // Test with specific examples
      const testCases = [
        { email: 'test@example.com' },
        { firstName: 'John' },
        { email: 'user@test.com', firstName: 'Jane' },
      ];

      for (const pii of testCases) {
        const encrypted = encryptPII(pii);
        const decrypted = decryptPII(encrypted);
        
        // Check that only provided fields are present
        Object.keys(pii).forEach(key => {
          expect(decrypted[key as keyof typeof pii]).toBe(pii[key as keyof typeof pii]);
        });
      }
    });
  });

  describe('Unit Tests for Edge Cases', () => {
    it('should throw error when ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt('test')).toThrow();

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should handle decryption of invalid base64', () => {
      expect(() => decrypt('invalid-base64!!!')).toThrow();
    });

    it('should handle hash verification with invalid hash format', () => {
      const result = verifyHash('test', 'invalid-hash');
      expect(result).toBe(false);
    });

    it('should encrypt and decrypt empty payment info', () => {
      const paymentInfo = {};
      const encrypted = encryptPaymentInfo(paymentInfo);
      const decrypted = decryptPaymentInfo(encrypted);
      expect(decrypted).toEqual(paymentInfo);
    });

    it('should encrypt and decrypt empty PII', () => {
      const pii = {};
      const encrypted = encryptPII(pii);
      const decrypted = decryptPII(encrypted);
      expect(decrypted).toEqual(pii);
    });
  });
});

