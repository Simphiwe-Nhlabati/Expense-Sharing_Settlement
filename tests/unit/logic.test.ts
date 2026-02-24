import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatCurrency } from '@/lib/utils';

// Logic to test (extracted from our implementation pattern)
function calculateSplits(amount: number, splitCount: number) {
    const amountPerPerson = Math.floor(amount / splitCount);
    let remainder = amount % splitCount;
    
    const splits = [];
    for (let i = 0; i < splitCount; i++) {
        let share = amountPerPerson;
        if (remainder > 0) {
            share += 1;
            remainder -= 1;
        }
        splits.push(share);
    }
    return splits;
}

describe('South African Fintech Logic (ZAR Cents)', () => {
    it('should split R100 (10000 cents) between 3 people correctly (Penny Gap)', () => {
        const splits = calculateSplits(10000, 3);
        
        // Sum should be exactly 10000
        const total = splits.reduce((a, b) => a + b, 0);
        expect(total).toBe(10000);
        
        // 10000 / 3 = 3333.333...
        // So two people get 3333 and one person gets 3334 (or vice versa depending on remainder logic)
        expect(splits).toContain(3333);
        expect(splits).toContain(3334);
        expect(splits.filter(s => s === 3334).length).toBe(1);
    });

    it('should split R0.01 between 2 people (Penny Gap)', () => {
        const splits = calculateSplits(1, 2);
        expect(splits.reduce((a, b) => a + b, 0)).toBe(1);
        expect(splits).toEqual([1, 0]);
    });

    it('should always maintain the total amount (Property-based test)', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 1000000 }), fc.integer({ min: 1, max: 50 }), (amount, count) => {
                const splits = calculateSplits(amount, count);
                const total = splits.reduce((a, b) => a + b, 0);
                return total === amount;
            })
        );
    });

    it('should format ZAR currency correctly (en-ZA)', () => {
        // We use a regex check because Intl format might include non-breaking spaces or different currency symbol chars
        const result = formatCurrency(15050); // R150.50
        expect(result).toMatch(/R\s?150.50/);
    });
});
