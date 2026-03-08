import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format amount in cents to ZAR currency string.
 * @param amountInCents - Amount in cents (e.g., 15050 for R150.50)
 * @returns Formatted currency string (e.g., "R150.50")
 */
export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100)
}

/**
 * Alias for formatCurrency - for consistency across codebase.
 * Format amount in cents to ZAR currency string.
 * @param amountInCents - Amount in cents (e.g., 15050 for R150.50)
 * @returns Formatted currency string (e.g., "R150.50")
 */
export function formatZarAmount(amountInCents: number): string {
  return formatCurrency(amountInCents)
}

/**
 * Format a date to South African locale format.
 * @param date - Date to format
 * @returns Formatted date string (e.g., "08/03/2026")
 */
export function formatDateZA(date: Date | string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}

/**
 * Parse ZAR currency string to amount in cents.
 * @param formatted - Formatted currency string (e.g., "R150.50")
 * @returns Amount in cents (e.g., 15050)
 */
export function parseZarAmount(formatted: string): number {
  // Remove "R" prefix and any whitespace
  const numericString = formatted.replace(/R\s?/g, "").trim();
  const amount = parseFloat(numericString);
  return Math.round(amount * 100);
}
