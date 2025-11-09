/**
 * PMS-T-075: Write unit tests for pricing algorithm
 * 
 * Test Cases:
 * - TC-PRICE-01: Discount tier calculation
 * - TC-PRICE-02: Revenue and profit margin calculations
 */

import { describe, test, expect } from '@jest/globals';
import { calculateDiscountTier } from '../pricingAlgorithm.service.js';

describe('Pricing Algorithm Service', () => {
  describe('TC-PRICE-01: Discount Tier Calculation', () => {
    test('should return 0% discount for expired items (negative days)', () => {
      expect(calculateDiscountTier(-1)).toBe(0);
      expect(calculateDiscountTier(-5)).toBe(0);
    });

    test('should return 40% discount for same day expiry (0 days)', () => {
      expect(calculateDiscountTier(0)).toBe(40);
    });

    test('should return 25% discount for 1 day until expiry', () => {
      expect(calculateDiscountTier(1)).toBe(25);
    });

    test('should return 10% discount for 2 days until expiry', () => {
      expect(calculateDiscountTier(2)).toBe(10);
    });

    test('should return 0% discount for 3+ days until expiry', () => {
      expect(calculateDiscountTier(3)).toBe(0);
      expect(calculateDiscountTier(4)).toBe(0);
      expect(calculateDiscountTier(7)).toBe(0);
      expect(calculateDiscountTier(30)).toBe(0);
    });
  });

  describe('TC-PRICE-02: Revenue and Profit Calculations', () => {
    const calculateEstimatedRevenue = (quantity, basePrice, discountPercentage) => {
      const discountedPrice = basePrice * (1 - discountPercentage / 100);
      return quantity * discountedPrice;
    };

    const calculateProfitMargin = (basePrice, discountPercentage) => {
      const costPrice = basePrice * 0.6; // Assuming 40% markup
      const sellingPrice = basePrice * (1 - discountPercentage / 100);
      const profit = sellingPrice - costPrice;
      return (profit / sellingPrice) * 100;
    };

    describe('Revenue Calculation', () => {
      test('should calculate correct revenue with 0% discount', () => {
        const revenue = calculateEstimatedRevenue(10, 100, 0);
        expect(revenue).toBe(1000); // 10 * 100 * 1.0
      });

      test('should calculate correct revenue with 10% discount', () => {
        const revenue = calculateEstimatedRevenue(10, 100, 10);
        expect(revenue).toBe(900); // 10 * 100 * 0.9
      });

      test('should calculate correct revenue with 25% discount', () => {
        const revenue = calculateEstimatedRevenue(10, 100, 25);
        expect(revenue).toBe(750); // 10 * 100 * 0.75
      });

      test('should calculate correct revenue with 40% discount', () => {
        const revenue = calculateEstimatedRevenue(10, 100, 40);
        expect(revenue).toBe(600); // 10 * 100 * 0.6
      });

      test('should handle decimal quantities', () => {
        const revenue = calculateEstimatedRevenue(5.5, 120, 10);
        expect(revenue).toBe(594); // 5.5 * 120 * 0.9
      });

      test('should handle decimal prices', () => {
        const revenue = calculateEstimatedRevenue(10, 45.50, 25);
        expect(revenue).toBeCloseTo(341.25, 2); // 10 * 45.50 * 0.75
      });
    });

    describe('Profit Margin Calculation', () => {
      test('should calculate profit margin with no discount', () => {
        const margin = calculateProfitMargin(100, 0);
        expect(margin).toBe(40); // (100 - 60) / 100 * 100 = 40%
      });

      test('should calculate profit margin with 10% discount', () => {
        const margin = calculateProfitMargin(100, 10);
        // Selling: 90, Cost: 60, Profit: 30
        // Margin: 30/90 * 100 = 33.33%
        expect(margin).toBeCloseTo(33.33, 2);
      });

      test('should calculate profit margin with 25% discount', () => {
        const margin = calculateProfitMargin(100, 25);
        // Selling: 75, Cost: 60, Profit: 15
        // Margin: 15/75 * 100 = 20%
        expect(margin).toBe(20);
      });

      test('should calculate profit margin with 40% discount', () => {
        const margin = calculateProfitMargin(100, 40);
        // Selling: 60, Cost: 60, Profit: 0
        // Margin: 0/60 * 100 = 0%
        expect(margin).toBe(0);
      });

      test('should handle different base prices', () => {
        const margin = calculateProfitMargin(50, 10);
        // Selling: 45, Cost: 30, Profit: 15
        // Margin: 15/45 * 100 = 33.33%
        expect(margin).toBeCloseTo(33.33, 2);
      });
    });

    describe('Business Logic Validation', () => {
      test('40% discount should result in break-even (0% profit margin)', () => {
        const margin = calculateProfitMargin(100, 40);
        expect(margin).toBe(0);
      });

      test('discount should not exceed profit margin threshold', () => {
        // With 40% markup, max discount should be 40% to break even
        const margin40 = calculateProfitMargin(100, 40);
        expect(margin40).toBeGreaterThanOrEqual(0);
        
        // Any discount > 40% would result in loss
        const margin50 = calculateProfitMargin(100, 50);
        expect(margin50).toBeLessThan(0);
      });

      test('revenue should decrease as discount increases', () => {
        const revenue0 = calculateEstimatedRevenue(10, 100, 0);
        const revenue10 = calculateEstimatedRevenue(10, 100, 10);
        const revenue25 = calculateEstimatedRevenue(10, 100, 25);
        const revenue40 = calculateEstimatedRevenue(10, 100, 40);

        expect(revenue0).toBeGreaterThan(revenue10);
        expect(revenue10).toBeGreaterThan(revenue25);
        expect(revenue25).toBeGreaterThan(revenue40);
      });
    });
  });

  describe('Discount Tier Business Rules', () => {
    test('should prioritize selling over waste for items expiring soon', () => {
      // Items expiring in 0-2 days should get discounts
      expect(calculateDiscountTier(0)).toBeGreaterThan(0);
      expect(calculateDiscountTier(1)).toBeGreaterThan(0);
      expect(calculateDiscountTier(2)).toBeGreaterThan(0);
    });

    test('should not discount items with sufficient shelf life', () => {
      // Items with 3+ days should not be discounted
      expect(calculateDiscountTier(3)).toBe(0);
      expect(calculateDiscountTier(7)).toBe(0);
    });

    test('should increase discount urgency as expiry approaches', () => {
      const discount2Days = calculateDiscountTier(2);
      const discount1Day = calculateDiscountTier(1);
      const discount0Days = calculateDiscountTier(0);

      expect(discount1Day).toBeGreaterThan(discount2Days);
      expect(discount0Days).toBeGreaterThan(discount1Day);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero quantity', () => {
      const revenue = calculateEstimatedRevenue(0, 100, 10);
      expect(revenue).toBe(0);
    });

    test('should handle zero base price', () => {
      const revenue = calculateEstimatedRevenue(10, 0, 10);
      expect(revenue).toBe(0);
    });

    test('should handle 100% discount', () => {
      const revenue = calculateEstimatedRevenue(10, 100, 100);
      expect(revenue).toBe(0);
    });

    test('should handle very large quantities', () => {
      const revenue = calculateEstimatedRevenue(10000, 100, 10);
      expect(revenue).toBe(900000);
    });

    test('should handle very small prices', () => {
      const revenue = calculateEstimatedRevenue(10, 0.50, 10);
      expect(revenue).toBeCloseTo(4.5, 2);
    });
  });

  describe('Integration Scenarios', () => {
    const scenarios = [
      {
        name: 'Tomatoes expiring today',
        quantity: 50,
        basePrice: 40,
        daysUntilExpiry: 0,
        expectedDiscount: 40,
        expectedRevenue: 1200 // 50 * 40 * 0.6
      },
      {
        name: 'Milk expiring in 1 day',
        quantity: 20,
        basePrice: 60,
        daysUntilExpiry: 1,
        expectedDiscount: 25,
        expectedRevenue: 900 // 20 * 60 * 0.75
      },
      {
        name: 'Apples expiring in 2 days',
        quantity: 30,
        basePrice: 120,
        daysUntilExpiry: 2,
        expectedDiscount: 10,
        expectedRevenue: 3240 // 30 * 120 * 0.9
      },
      {
        name: 'Bananas with 5 days shelf life',
        quantity: 40,
        basePrice: 50,
        daysUntilExpiry: 5,
        expectedDiscount: 0,
        expectedRevenue: 2000 // 40 * 50 * 1.0
      }
    ];

    scenarios.forEach(scenario => {
      test(`should handle scenario: ${scenario.name}`, () => {
        const discount = calculateDiscountTier(scenario.daysUntilExpiry);
        expect(discount).toBe(scenario.expectedDiscount);

        const revenue = calculateEstimatedRevenue(
          scenario.quantity,
          scenario.basePrice,
          discount
        );
        expect(revenue).toBe(scenario.expectedRevenue);
      });
    });
  });
});

function calculateEstimatedRevenue(quantity, basePrice, discountPercentage) {
  const discountedPrice = basePrice * (1 - discountPercentage / 100);
  return quantity * discountedPrice;
}
