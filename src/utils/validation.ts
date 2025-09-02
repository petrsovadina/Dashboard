// Validation utilities for Azure AI Dashboard

import { AzureConfig, ValidationResult, FormField } from '../types/dashboard';

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate Azure subscription ID
 */
export const isValidSubscriptionId = (subscriptionId: string): boolean => {
  return isValidUUID(subscriptionId);
};

/**
 * Validate Azure tenant ID
 */
export const isValidTenantId = (tenantId: string): boolean => {
  return isValidUUID(tenantId);
};

/**
 * Validate Azure client ID
 */
export const isValidClientId = (clientId: string): boolean => {
  return isValidUUID(clientId);
};

/**
 * Validate Azure client secret
 */
export const isValidClientSecret = (clientSecret: string): boolean => {
  // Azure client secrets are typically 32+ characters
  return clientSecret.length >= 32 && clientSecret.length <= 255;
};

/**
 * Validate resource group name
 */
export const isValidResourceGroupName = (name: string): boolean => {
  // Azure resource group naming rules
  const rgRegex = /^[a-zA-Z0-9._()-]+$/;
  return name.length >= 1 && 
         name.length <= 90 && 
         rgRegex.test(name) &&
         !name.endsWith('.');
};

/**
 * Validate Azure region
 */
export const isValidAzureRegion = (region: string): boolean => {
  const validRegions = [
    'westeurope', 'northeurope', 'eastus', 'westus', 'eastus2', 'westus2',
    'centralus', 'southcentralus', 'westcentralus', 'northcentralus',
    'canadacentral', 'canadaeast', 'brazilsouth', 'southafricanorth',
    'eastasia', 'southeastasia', 'japaneast', 'japanwest',
    'australiaeast', 'australiasoutheast', 'centralindia', 'southindia',
    'westindia', 'koreacentral', 'koreasouth'
  ];
  return validRegions.includes(region.toLowerCase());
};

/**
 * Validate complete Azure configuration
 */
export const validateAzureConfig = (config: Partial<AzureConfig>): ValidationResult => {
  const errors: Record<string, string> = {};

  // Subscription ID validation
  if (!config['subscriptionId']) {
    errors['subscriptionId'] = 'Subscription ID je povinný';
  } else if (!isValidSubscriptionId(config['subscriptionId'])) {
    errors['subscriptionId'] = 'Neplatný formát Subscription ID';
  }

  // Tenant ID validation
  if (!config['tenantId']) {
    errors['tenantId'] = 'Tenant ID je povinný';
  } else if (!isValidTenantId(config['tenantId'])) {
    errors['tenantId'] = 'Neplatný formát Tenant ID';
  }

  // Client ID validation
  if (!config['clientId']) {
    errors['clientId'] = 'Client ID je povinný';
  } else if (!isValidClientId(config['clientId'])) {
    errors['clientId'] = 'Neplatný formát Client ID';
  }

  // Client Secret validation
  if (!config['clientSecret']) {
    errors['clientSecret'] = 'Client Secret je povinný';
  } else if (!isValidClientSecret(config['clientSecret'])) {
    errors['clientSecret'] = 'Client Secret musí mít alespoň 32 znaků';
  }

  // Resource Group validation
  if (!config['resourceGroup']) {
    errors['resourceGroup'] = 'Resource Group je povinný';
  } else if (!isValidResourceGroupName(config['resourceGroup'])) {
    errors['resourceGroup'] = 'Neplatný název Resource Group';
  }

  // Region validation
  if (!config['region']) {
    errors['region'] = 'Region je povinný';
  } else if (!isValidAzureRegion(config['region'])) {
    errors['region'] = 'Nepodporovaný Azure region';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate API key format
 */
export const validateApiKey = (apiKey: string): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!apiKey) {
    errors['apiKey'] = 'API klíč je povinný';
  } else if (apiKey.length < 32) {
    errors['apiKey'] = 'API klíč musí mít alespoň 32 znaků';
  } else if (apiKey.length > 255) {
    errors['apiKey'] = 'API klíč je příliš dlouhý (max 255 znaků)';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
    errors['apiKey'] = 'API klíč smí obsahovat pouze písmena, čísla, pomlčky a podtržítka';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate port number
 */
export const validatePort = (port: number | string): ValidationResult => {
  const errors: Record<string, string> = {};
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;

  if (isNaN(portNum)) {
    errors['port'] = 'Port musí být číslo';
  } else if (portNum < 1 || portNum > 65535) {
    errors['port'] = 'Port musí být mezi 1 a 65535';
  } else if (portNum < 1024 && process.getuid && process.getuid() !== 0) {
    errors['port'] = 'Porty pod 1024 vyžadují root oprávnění';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize input string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['";]/g, ''); // Remove potential SQL injection characters
};

/**
 * Validate form field based on its configuration
 */
export const validateFormField = (field: FormField, value: any): string | null => {
  // Required field validation
  if (field.required && (!value || value.toString().trim() === '')) {
    return `${field.label} je povinný`;
  }

  // Type-specific validation
  switch (field.type) {
    case 'number':
      if (value && isNaN(Number(value))) {
        return `${field.label} musí být číslo`;
      }
      break;
    
    case 'text':
      if (value && typeof value !== 'string') {
        return `${field.label} musí být text`;
      }
      break;
  }

  // Custom validation function
  if (field.validation && value) {
    return field.validation(value);
  }

  return null;
};

/**
 * Validate entire form
 */
export const validateForm = (fields: FormField[], values: Record<string, any>): ValidationResult => {
  const errors: Record<string, string> = {};

  fields.forEach(field => {
    const value = values[field.name];
    const error = validateFormField(field, value);
    if (error) {
      errors[field.name] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Password strength validation
 */
export const validatePasswordStrength = (password: string): {
  isStrong: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Heslo musí mít alespoň 8 znaků');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Heslo musí obsahovat malé písmeno');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Heslo musí obsahovat velké písmeno');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Heslo musí obsahovat číslo');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Heslo musí obsahovat speciální znak');
  }

  return {
    isStrong: score >= 4,
    score,
    feedback
  };
};

/**
 * Validate JSON string
 */
export const validateJSON = (jsonString: string): ValidationResult => {
  const errors: Record<string, string> = {};

  try {
    JSON.parse(jsonString);
  } catch (error) {
    errors['json'] = 'Neplatný JSON formát';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};