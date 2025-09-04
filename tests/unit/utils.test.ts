// Unit tests for utility functions

import {
  formatPrice,
  formatCost,
  formatTokens,
  formatPercentage,
  formatRelativeTime,
  truncateText,
} from '../../src/utils/formatters';

import {
  isValidUUID,
  isValidEmail,
  validateAzureConfig,
  sanitizeInput,
} from '../../src/utils/validation';

describe('Formatters', () => {
  describe('formatPrice', () => {
    it('should format USD prices correctly', () => {
      expect(formatPrice(0.000005, 'USD')).toBe('5.00 $/1M tokens');
      expect(formatPrice(0.05, 'USD')).toBe('0.0500 $');
      expect(formatPrice(1.5, 'USD')).toBe('1.50 $');
    });

    it('should format CZK prices with exchange rate', () => {
      expect(formatPrice(0.000005, 'CZK', 24.5)).toBe('122.50 Kč/1M tokens');
      expect(formatPrice(1, 'CZK', 24.5)).toBe('24.50 Kč');
    });
  });

  describe('formatCost', () => {
    it('should format costs correctly', () => {
      expect(formatCost(0.005, 'USD')).toBe('<0.01 $');
      expect(formatCost(1.234, 'USD')).toBe('1.23 $');
      expect(formatCost(1.234, 'CZK', 24.5)).toBe('30.23 Kč');
    });
  });

  describe('formatTokens', () => {
    it('should format token counts with appropriate scaling', () => {
      expect(formatTokens(500)).toBe('500');
      expect(formatTokens(1500)).toBe('1.5K');
      expect(formatTokens(1500000)).toBe('1.5M');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages with proper signs', () => {
      expect(formatPercentage(12.5)).toBe('+12.5%');
      expect(formatPercentage(-5.2)).toBe('-5.2%');
      expect(formatPercentage(0)).toBe('+0.0%');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time correctly', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const oneHourAgo = new Date(now.getTime() - 3600000);
      
      expect(formatRelativeTime(new Date())).toBe('právě teď');
      expect(formatRelativeTime(oneMinuteAgo)).toBe('před 1 min');
      expect(formatRelativeTime(oneHourAgo)).toBe('před 1 h');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text correctly', () => {
      expect(truncateText('Hello world', 5)).toBe('He...');
      expect(truncateText('Hi', 5)).toBe('Hi');
      expect(truncateText('Exactly5', 8)).toBe('Exactly5');
    });
  });
});

describe('Validation', () => {
  describe('isValidUUID', () => {
    it('should validate UUIDs correctly', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate email addresses correctly', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('validateAzureConfig', () => {
    const validConfig = {
      subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
      tenantId: '550e8400-e29b-41d4-a716-446655440001',
      clientId: '550e8400-e29b-41d4-a716-446655440002',
      clientSecret: 'very-long-secret-key-with-32-characters-minimum',
      resourceGroup: 'my-resource-group',
      region: 'westeurope' as const,
    };

    it('should validate correct Azure configuration', () => {
      const result = validateAzureConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject invalid subscription ID', () => {
      const invalidConfig = { ...validConfig, subscriptionId: 'invalid' };
      const result = validateAzureConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors['subscriptionId']).toBeDefined();
    });

    it('should reject missing required fields', () => {
      const incompleteConfig = { subscriptionId: validConfig.subscriptionId };
      const result = validateAzureConfig(incompleteConfig);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize malicious input', () => {
      expect(sanitizeInput('  <script>alert("xss")</script>  ')).toBe('scriptalert(xss)/script');
      expect(sanitizeInput('normal text')).toBe('normal text');
      expect(sanitizeInput('text with "quotes" and \'apostrophes\'')).toBe('text with quotes and apostrophes');
    });
  });
});