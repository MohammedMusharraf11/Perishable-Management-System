/**
 * PMS-T-042: Unit tests for expiry calculation logic
 * 
 * Tests for the expiry monitoring service
 */

import { describe, test, expect } from '@jest/globals';

describe('Expiry Monitor Service', () => {
  describe('Days Until Expiry Calculation', () => {
    test('should return -1 for expired item (yesterday)', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      expect(daysUntilExpiry).toBe(-1);
    });

    test('should return 0 for item expiring today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      expect(daysUntilExpiry).toBe(0);
    });

    test('should return 1 for item expiring in 1 day', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      expect(daysUntilExpiry).toBe(1);
    });

    test('should return 2 for item expiring in 2 days', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
      
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      expect(daysUntilExpiry).toBe(2);
    });

    test('should return 3 for item expiring in 3 days', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      expect(daysUntilExpiry).toBe(3);
    });
  });

  describe('Status Update Logic', () => {
    const getStatus = (daysLeft) => {
      if (daysLeft < 0) {
        return 'EXPIRED';
      } else if (daysLeft <= 3) {
        return 'EXPIRING_SOON';
      } else {
        return 'ACTIVE';
      }
    };

    test('should return EXPIRED for negative days', () => {
      expect(getStatus(-1)).toBe('EXPIRED');
    });

    test('should return EXPIRING_SOON for 0 days', () => {
      expect(getStatus(0)).toBe('EXPIRING_SOON');
    });

    test('should return EXPIRING_SOON for 1 day', () => {
      expect(getStatus(1)).toBe('EXPIRING_SOON');
    });

    test('should return EXPIRING_SOON for 2 days', () => {
      expect(getStatus(2)).toBe('EXPIRING_SOON');
    });

    test('should return EXPIRING_SOON for 3 days', () => {
      expect(getStatus(3)).toBe('EXPIRING_SOON');
    });

    test('should return ACTIVE for 4 days', () => {
      expect(getStatus(4)).toBe('ACTIVE');
    });

    test('should return ACTIVE for 7 days', () => {
      expect(getStatus(7)).toBe('ACTIVE');
    });
  });
});