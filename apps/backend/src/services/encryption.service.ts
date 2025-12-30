import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment or generate one
 */
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  // Derive key from the provided key using PBKDF2
  const salt = process.env.ENCRYPTION_SALT || 'tikit-default-salt';
  return crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');
};

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export const encrypt = (plaintext: string): string => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex'),
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export const decrypt = (ciphertext: string): string => {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(ciphertext, 'base64');
    
    // Extract IV, authTag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash sensitive data (one-way, for comparison purposes)
 */
export const hash = (data: string): string => {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    
    // Combine salt + hash
    const combined = Buffer.concat([salt, hash]);
    return combined.toString('base64');
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
};

/**
 * Verify hashed data
 */
export const verifyHash = (data: string, hashedData: string): boolean => {
  try {
    const combined = Buffer.from(hashedData, 'base64');
    
    // Extract salt and hash
    const salt = combined.subarray(0, SALT_LENGTH);
    const originalHash = combined.subarray(SALT_LENGTH);
    
    // Hash the input data with the same salt
    const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    
    // Compare hashes using timing-safe comparison
    return crypto.timingSafeEqual(hash, originalHash);
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
};

/**
 * Encrypt payment information
 */
export const encryptPaymentInfo = (paymentInfo: {
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  accountNumber?: string;
  bankCode?: string;
}): {
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  accountNumber?: string;
  bankCode?: string;
} => {
  const encrypted: any = { ...paymentInfo };
  
  if (paymentInfo.cardNumber) {
    encrypted.cardNumber = encrypt(paymentInfo.cardNumber);
  }
  if (paymentInfo.cvv) {
    encrypted.cvv = encrypt(paymentInfo.cvv);
  }
  if (paymentInfo.expiryDate) {
    encrypted.expiryDate = encrypt(paymentInfo.expiryDate);
  }
  if (paymentInfo.accountNumber) {
    encrypted.accountNumber = encrypt(paymentInfo.accountNumber);
  }
  if (paymentInfo.bankCode) {
    encrypted.bankCode = encrypt(paymentInfo.bankCode);
  }
  
  return encrypted;
};

/**
 * Decrypt payment information
 */
export const decryptPaymentInfo = (encryptedPaymentInfo: {
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  accountNumber?: string;
  bankCode?: string;
}): {
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  accountNumber?: string;
  bankCode?: string;
} => {
  const decrypted: any = { ...encryptedPaymentInfo };
  
  if (encryptedPaymentInfo.cardNumber) {
    decrypted.cardNumber = decrypt(encryptedPaymentInfo.cardNumber);
  }
  if (encryptedPaymentInfo.cvv) {
    decrypted.cvv = decrypt(encryptedPaymentInfo.cvv);
  }
  if (encryptedPaymentInfo.expiryDate) {
    decrypted.expiryDate = decrypt(encryptedPaymentInfo.expiryDate);
  }
  if (encryptedPaymentInfo.accountNumber) {
    decrypted.accountNumber = decrypt(encryptedPaymentInfo.accountNumber);
  }
  if (encryptedPaymentInfo.bankCode) {
    decrypted.bankCode = decrypt(encryptedPaymentInfo.bankCode);
  }
  
  return decrypted;
};

/**
 * Encrypt PII (Personally Identifiable Information)
 */
export const encryptPII = (pii: {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  nin?: string;
  bvn?: string;
}): {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  nin?: string;
  bvn?: string;
} => {
  const encrypted: any = { ...pii };
  
  if (pii.email) {
    encrypted.email = encrypt(pii.email);
  }
  if (pii.phoneNumber) {
    encrypted.phoneNumber = encrypt(pii.phoneNumber);
  }
  if (pii.firstName) {
    encrypted.firstName = encrypt(pii.firstName);
  }
  if (pii.lastName) {
    encrypted.lastName = encrypt(pii.lastName);
  }
  if (pii.address) {
    encrypted.address = encrypt(pii.address);
  }
  if (pii.nin) {
    encrypted.nin = encrypt(pii.nin);
  }
  if (pii.bvn) {
    encrypted.bvn = encrypt(pii.bvn);
  }
  
  return encrypted;
};

/**
 * Decrypt PII (Personally Identifiable Information)
 */
export const decryptPII = (encryptedPII: {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  nin?: string;
  bvn?: string;
}): {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  nin?: string;
  bvn?: string;
} => {
  const decrypted: any = { ...encryptedPII };
  
  if (encryptedPII.email) {
    decrypted.email = decrypt(encryptedPII.email);
  }
  if (encryptedPII.phoneNumber) {
    decrypted.phoneNumber = decrypt(encryptedPII.phoneNumber);
  }
  if (encryptedPII.firstName) {
    decrypted.firstName = decrypt(encryptedPII.firstName);
  }
  if (encryptedPII.lastName) {
    decrypted.lastName = decrypt(encryptedPII.lastName);
  }
  if (encryptedPII.address) {
    decrypted.address = decrypt(encryptedPII.address);
  }
  if (encryptedPII.nin) {
    decrypted.nin = decrypt(encryptedPII.nin);
  }
  if (encryptedPII.bvn) {
    decrypted.bvn = decrypt(encryptedPII.bvn);
  }
  
  return decrypted;
};

/**
 * Generate a secure random encryption key
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
};

/**
 * Generate a secure random salt
 */
export const generateSalt = (): string => {
  return crypto.randomBytes(SALT_LENGTH).toString('base64');
};

