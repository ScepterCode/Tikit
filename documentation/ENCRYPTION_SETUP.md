# Encryption Setup Guide

This guide explains how to set up and manage encryption keys for the Tikit backend application.

## Overview

Tikit uses AES-256-GCM encryption to protect sensitive data including:
- Payment information (card numbers, CVV, account numbers)
- Personally Identifiable Information (PII) such as email, phone numbers, names
- Other sensitive user data

## Encryption Configuration

### Environment Variables

Two environment variables are required for encryption:

1. **ENCRYPTION_KEY**: The main encryption key (minimum 32 characters)
2. **ENCRYPTION_SALT**: A salt value for key derivation (recommended 64 characters)

### Generating Encryption Keys

You can generate secure encryption keys using the provided utility functions:

```typescript
import { generateEncryptionKey, generateSalt } from './services/encryption.service.js';

// Generate a new encryption key
const encryptionKey = generateEncryptionKey();
console.log('ENCRYPTION_KEY:', encryptionKey);

// Generate a new salt
const salt = generateSalt();
console.log('ENCRYPTION_SALT:', salt);
```

Or use Node.js crypto directly:

```bash
# Generate encryption key (32 bytes = 256 bits)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate salt (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Setting Up Environment Variables

1. **Development**: Add to `.env` file
```env
ENCRYPTION_KEY=your_generated_encryption_key_here
ENCRYPTION_SALT=your_generated_salt_here
```

2. **Testing**: Add to `.env.test` file
```env
ENCRYPTION_KEY=test_encryption_key_for_testing_only_32_chars_minimum
ENCRYPTION_SALT=test_encryption_salt_for_testing_only
```

3. **Production**: Set as environment variables in your hosting platform
   - Railway: Settings > Variables
   - Render: Environment > Environment Variables
   - Vercel: Settings > Environment Variables

## Usage

### Encrypting Data

```typescript
import { encrypt, decrypt } from './services/encryption.service.js';

// Encrypt sensitive data
const plaintext = 'sensitive information';
const encrypted = encrypt(plaintext);

// Decrypt data
const decrypted = decrypt(encrypted);
```

### Encrypting Payment Information

```typescript
import { encryptPaymentInfo, decryptPaymentInfo } from './services/encryption.service.js';

// Encrypt payment data
const paymentInfo = {
  cardNumber: '4111111111111111',
  cvv: '123',
  expiryDate: '12/25',
};

const encrypted = encryptPaymentInfo(paymentInfo);

// Decrypt payment data
const decrypted = decryptPaymentInfo(encrypted);
```

### Encrypting PII

```typescript
import { encryptPII, decryptPII } from './services/encryption.service.js';

// Encrypt PII
const pii = {
  email: 'user@example.com',
  phoneNumber: '+2348031234567',
  firstName: 'John',
  lastName: 'Doe',
};

const encrypted = encryptPII(pii);

// Decrypt PII
const decrypted = decryptPII(encrypted);
```

### Hashing Data (One-Way)

For data that needs to be compared but not decrypted (like passwords):

```typescript
import { hash, verifyHash } from './services/encryption.service.js';

// Hash data
const data = 'sensitive data';
const hashed = hash(data);

// Verify hash
const isValid = verifyHash(data, hashed);
```

## Security Best Practices

### Key Management

1. **Never commit encryption keys to version control**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use different keys for different environments**
   - Development keys should differ from production
   - Test keys should be separate from both

3. **Rotate keys periodically**
   - Plan for key rotation every 6-12 months
   - Implement a key rotation strategy before production

4. **Store keys securely**
   - Use a secrets manager in production (AWS Secrets Manager, HashiCorp Vault)
   - Limit access to encryption keys
   - Audit key access regularly

### Encryption Best Practices

1. **Encrypt at rest**: All sensitive data should be encrypted before storing in the database

2. **Encrypt in transit**: Use TLS 1.3 for all network communications

3. **Minimize encrypted data**: Only encrypt what's necessary
   - Payment data (PCI DSS requirement)
   - PII (NDPR compliance)
   - Sensitive user information

4. **Log carefully**: Never log decrypted sensitive data

5. **Handle errors securely**: Don't expose encryption errors to users

## Algorithm Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes) - randomly generated per encryption
- **Auth Tag Size**: 128 bits (16 bytes) - for authenticated encryption
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations

## Compliance

This encryption implementation helps meet:

- **PCI DSS**: Payment Card Industry Data Security Standard
- **NDPR**: Nigeria Data Protection Regulation
- **GDPR**: General Data Protection Regulation (for EU users)

## Key Rotation Strategy

When rotating encryption keys:

1. Generate new encryption key and salt
2. Keep old keys accessible for decryption
3. Decrypt data with old key
4. Re-encrypt data with new key
5. Update environment variables
6. Remove old keys after migration is complete

Example migration script:

```typescript
import { decrypt as oldDecrypt } from './old-encryption.service.js';
import { encrypt as newEncrypt } from './encryption.service.js';

async function rotateKeys() {
  // Get all encrypted records
  const records = await prisma.payment.findMany();
  
  for (const record of records) {
    // Decrypt with old key
    const decrypted = oldDecrypt(record.encryptedData);
    
    // Encrypt with new key
    const encrypted = newEncrypt(decrypted);
    
    // Update record
    await prisma.payment.update({
      where: { id: record.id },
      data: { encryptedData: encrypted },
    });
  }
}
```

## Troubleshooting

### "ENCRYPTION_KEY environment variable is not set"

Ensure you have set the `ENCRYPTION_KEY` in your `.env` file or environment variables.

### "Failed to decrypt data"

This can happen if:
- The encryption key has changed
- The data was corrupted
- The data was encrypted with a different key

### Performance Considerations

- Encryption/decryption adds ~1-2ms per operation
- Consider caching decrypted data in memory for frequently accessed records
- Use database indexes on encrypted fields carefully (they won't work for range queries)

## Testing

The encryption service includes comprehensive property-based tests:

```bash
npm test -- encryption.service.test.ts
```

Tests verify:
- Round-trip encryption/decryption
- Data integrity with authentication tags
- Key derivation consistency
- Hash verification

## Support

For questions or issues with encryption setup, contact the development team or refer to the main documentation.

