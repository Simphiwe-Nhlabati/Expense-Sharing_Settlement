import { describe, it, expect } from 'vitest';
import { createGroupSchema, createExpenseSchema } from '@/lib/schemas';

describe('lib/schemas', () => {
  describe('createGroupSchema', () => {
    it('should validate valid group input', () => {
      const result = createGroupSchema.safeParse({
        name: 'Test Group',
        description: 'A test group',
        currency: 'ZAR',
      });

      expect(result.success).toBe(true);
    });

    it('should validate with optional description', () => {
      const result = createGroupSchema.safeParse({
        name: 'Test Group',
        currency: 'ZAR',
      });

      expect(result.success).toBe(true);
    });

    it('should fail with empty name', () => {
      const result = createGroupSchema.safeParse({
        name: '',
        currency: 'ZAR',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should fail with name less than 2 characters', () => {
      const result = createGroupSchema.safeParse({
        name: 'A',
        currency: 'ZAR',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should default currency to ZAR', () => {
      const result = createGroupSchema.safeParse({
        name: 'Test Group',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('ZAR');
      }
    });

    it('should accept USD currency', () => {
      const result = createGroupSchema.safeParse({
        name: 'Test Group',
        currency: 'USD',
      });

      expect(result.success).toBe(true);
    });

    it('should accept EUR currency', () => {
      const result = createGroupSchema.safeParse({
        name: 'Test Group',
        currency: 'EUR',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid currency', () => {
      const result = createGroupSchema.safeParse({
        name: 'Test Group',
        currency: 'GBP',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('createExpenseSchema', () => {
    it('should validate valid expense input', () => {
      const result = createExpenseSchema.safeParse({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Dinner at restaurant',
        amount: 150.50,
        paidBy: 'user-123',
        date: new Date(),
      });

      expect(result.success).toBe(true);
    });

    it('should fail without groupId', () => {
      const result = createExpenseSchema.safeParse({
        description: 'Lunch',
        amount: 100.50,
        paidBy: 'user-123',
        date: new Date(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('groupId');
      }
    });

    it('should fail with negative amount', () => {
      const result = createExpenseSchema.safeParse({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Dinner',
        amount: -50,
        paidBy: 'user-123',
        date: new Date(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than 0');
      }
    });

    it('should fail with zero amount', () => {
      const result = createExpenseSchema.safeParse({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Dinner',
        amount: 0,
        paidBy: 'user-123',
        date: new Date(),
      });

      expect(result.success).toBe(false);
    });

    it('should fail with empty description', () => {
      const result = createExpenseSchema.safeParse({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: '',
        amount: 100,
        paidBy: 'user-123',
        date: new Date(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });

    it('should fail with description less than 2 characters', () => {
      const result = createExpenseSchema.safeParse({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'A',
        amount: 100,
        paidBy: 'user-123',
        date: new Date(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should fail without paidBy', () => {
      const result = createExpenseSchema.safeParse({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Dinner',
        amount: 100,
        paidBy: '',
        date: new Date(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should use default date when not provided', () => {
      const result = createExpenseSchema.safeParse({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Dinner',
        amount: 100,
        paidBy: 'user-123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBeInstanceOf(Date);
      }
    });

    it('should accept decimal amounts', () => {
      const result = createExpenseSchema.safeParse({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Coffee',
        amount: 45.99,
        paidBy: 'user-123',
        date: new Date(),
      });

      expect(result.success).toBe(true);
    });
  });
});
