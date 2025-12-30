/**
 * JSON Helper Functions for SQLite
 * 
 * SQLite doesn't support native JSON types, so we store JSON as strings.
 * These helpers make it easy to serialize/deserialize JSON data.
 */

/**
 * Serialize data to JSON string for storage in SQLite
 */
export function toJsonString<T>(data: T | null | undefined): string | null {
  if (data === null || data === undefined) {
    return null;
  }
  return JSON.stringify(data);
}

/**
 * Deserialize JSON string from SQLite to object
 */
export function fromJsonString<T>(jsonString: string | null | undefined): T | null {
  if (!jsonString) {
    return null;
  }
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON string:', error);
    return null;
  }
}

/**
 * Serialize array to JSON string for storage in SQLite
 */
export function toJsonArray<T>(array: T[] | null | undefined): string | null {
  if (!array || array.length === 0) {
    return null;
  }
  return JSON.stringify(array);
}

/**
 * Deserialize JSON string from SQLite to array
 */
export function fromJsonArray<T>(jsonString: string | null | undefined): T[] {
  if (!jsonString) {
    return [];
  }
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse JSON array:', error);
    return [];
  }
}

/**
 * Type-safe wrapper for Event tiers
 */
export interface EventTier {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

/**
 * Type-safe wrapper for Event cultural features
 */
export interface CulturalFeatures {
  [key: string]: any;
}

/**
 * Type-safe wrapper for Payment metadata
 */
export interface PaymentMetadata {
  [key: string]: any;
}

/**
 * Type-safe wrapper for GroupBuy participants
 */
export interface GroupBuyParticipant {
  userId: string;
  phoneNumber: string;
  paidAt?: string;
}

/**
 * Type-safe wrapper for EventOrganizer permissions
 */
export interface OrganizerPermissions {
  custom?: string[];
  [key: string]: any;
}
