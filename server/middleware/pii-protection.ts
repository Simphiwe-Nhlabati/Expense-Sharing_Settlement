import { createHash } from "node:crypto";
import { z } from "zod";

/**
 * POPIA Compliance: PII Protection Utilities
 * For handling South African personal information securely
 */

/**
 * Hash sensitive PII data using SHA-256
 * Use this for storing ID numbers, phone numbers when not needed in plain text
 */
export function hashPII(data: string): string {
  if (!data) return "";
  return createHash("sha256").update(data.trim()).digest("hex");
}

/**
 * Validate South African ID Number format
 * Format: 12 digits (YYMMDDSSSSCAZ)
 * - YYMMDD: Date of birth
 * - SSSS: Serial number (gender indicator)
 * - C: Citizenship (0=SA, 1=Permanent Resident)
 * - A: Race classifier (deprecated, usually 8 or 9)
 * - Z: Check digit (Luhn algorithm)
 */
export function isValidSAIdNumber(idNumber: string): boolean {
  if (!/^\d{13}$/.test(idNumber)) return false;

  // Validate check digit using Luhn algorithm
  const digits = idNumber.split("").map(Number);
  const checkDigit = digits[12];
  const sum = digits
    .slice(0, 12)
    .map((d, i) => (i % 2 === 0 ? d : d * 2))
    .map((d) => (d > 9 ? d - 9 : d))
    .reduce((a, b) => a + b, 0);

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
}

/**
 * Validate South African Phone Number format
 * Accepts: +27XXXXXXXXX or 0XXXXXXXXX (9 digits after country/area code)
 */
export function isValidSAPhoneNumber(phone: string): boolean {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // +27 format (international)
  if (/^\+27\d{9}$/.test(cleaned)) return true;

  // 0 format (local)
  if (/^0\d{9}$/.test(cleaned)) return true;

  return false;
}

/**
 * Normalize South African phone number to international format
 * Converts 0XXXXXXXXX to +27XXXXXXXXX
 */
export function normalizeSAPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (cleaned.startsWith("+27")) return cleaned;
  if (cleaned.startsWith("27")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+27${cleaned.slice(1)}`;

  // Assume it's already in correct format if no prefix
  return `+27${cleaned}`;
}

/**
 * Extract date of birth from SA ID number
 * Returns null if invalid
 */
export function getDOBFromSAId(idNumber: string): Date | null {
  if (!isValidSAIdNumber(idNumber)) return null;

  const year = parseInt(idNumber.slice(0, 2), 10);
  const month = parseInt(idNumber.slice(2, 4), 10);
  const day = parseInt(idNumber.slice(4, 6), 10);

  // Determine century (simple heuristic: < 20 = 2000s, else 1900s)
  const currentYear = new Date().getFullYear() % 100;
  const century = year <= currentYear ? 2000 : 1900;

  return new Date(century + year, month - 1, day);
}

/**
 * Get gender from SA ID number (based on serial number)
 * 0-4 = Female, 5-9 = Male
 */
export function getGenderFromSAId(idNumber: string): "male" | "female" | null {
  if (!isValidSAIdNumber(idNumber)) return null;

  const genderIndicator = parseInt(idNumber.slice(6, 7), 10);
  return genderIndicator >= 5 ? "male" : "female";
}

/**
 * Get citizenship status from SA ID number
 * 0 = South African Citizen, 1 = Permanent Resident
 */
export function getCitizenshipFromSAId(idNumber: string): "citizen" | "permanent_resident" | null {
  if (!isValidSAIdNumber(idNumber)) return null;

  const citizenshipIndicator = parseInt(idNumber.slice(10, 11), 10);
  return citizenshipIndicator === 0 ? "citizen" : "permanent_resident";
}

// Zod schemas for validation
export const saIdNumberSchema = z
  .string()
  .refine(isValidSAIdNumber, {
    message: "Invalid South African ID number format",
  })
  .describe("13-digit South African ID number");

export const saPhoneNumberSchema = z
  .string()
  .refine(isValidSAPhoneNumber, {
    message: "Invalid South African phone number format",
  })
  .describe("South African phone number (+27XXXXXXXXX or 0XXXXXXXXX)");

/**
 * Middleware helper to validate PII in request body
 */
export function validatePII(data: { saIdNumber?: string; phoneNumber?: string }): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (data.saIdNumber && !isValidSAIdNumber(data.saIdNumber)) {
    errors.push("Invalid South African ID number format");
  }

  if (data.phoneNumber && !isValidSAPhoneNumber(data.phoneNumber)) {
    errors.push("Invalid South African phone number format");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
