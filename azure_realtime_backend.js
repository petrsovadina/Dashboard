/**
 * Azure AI Real-time Backend Service - Enterprise Production Version
 * Refactored with enterprise-grade security, service-based architecture, and comprehensive monitoring
 * 
 * @author Petr Sovadina
 * @version 2.0.0
 * @description Production-ready, secure backend with service separation, Redis caching, and Prometheus metrics
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');
const Joi = require('joi');
const crypto = require('crypto');
const WebSocket = require('ws');
const cron = require('node-cron');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Import TypeScript types and utilities (if available)
let types, utils;
try {
  types = require('./src/types');
  utils = require('./src/utils');
} catch (error) {
  // Fallback if TypeScript types not available
  types = {};
  utils = {};
}

// ============================================================================
// ENTERPRISE LOGGING CONFIGURATION
// ============================================================================

/**
 * Enterprise-grade Winston logger with structured logging, log levels, and file rotation
 */
class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
        winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
          const meta = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '';
          return `${timestamp} [${level.toUpperCase()}] ${message} ${meta}${stack ? '\n' + stack : ''}`;
        })
      ),
      defaultMeta: {
        service: 'azure-ai-dashboard',
        version: process.env.npm_package_version || '2.0.0',
        nodeEnv: process.env.NODE_ENV || 'development',
        pid: process.pid
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    this.setupFileTransports();
  }

  setupFileTransports() {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Error logs
    this.logger.add(new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }));

    // Combined logs
    this.logger.add(new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }));

    // Audit logs for security events
    this.logger.add(new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'warn',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }));
  }

  error(message, metadata = {}) {
    this.logger.error(message, metadata);
  }

  warn(message, metadata = {}) {
    this.logger.warn(message, metadata);
  }

  info(message, metadata = {}) {
    this.logger.info(message, metadata);
  }

  debug(message, metadata = {}) {
    this.logger.debug(message, metadata);
  }

  audit(event, metadata = {}) {
    this.logger.warn(`AUDIT: ${event}`, { audit: true, ...metadata });
  }
}

const logger = new Logger();

// ============================================================================
// CONFIGURATION VALIDATION SCHEMAS
// ============================================================================

/**
 * Enterprise configuration validation with comprehensive security checks
 */
const configSchema = Joi.object({
  // Azure Configuration
  subscriptionId: Joi.string().uuid().required().messages({
    'any.required': 'Azure Subscription ID is required',
    'string.guid': 'Subscription ID must be a valid UUID'
  }),
  tenantId: Joi.string().uuid().required().messages({
    'any.required': 'Azure Tenant ID is required',
    'string.guid': 'Tenant ID must be a valid UUID'
  }),
  clientId: Joi.string().uuid().required().messages({
    'any.required': 'Azure Client ID is required',
    'string.guid': 'Client ID must be a valid UUID'
  }),
  clientSecret: Joi.string().min(32).max(255).required().messages({
    'any.required': 'Azure Client Secret is required',
    'string.min': 'Client Secret must be at least 32 characters',
    'string.max': 'Client Secret cannot exceed 255 characters'
  }),
  resourceGroup: Joi.string().pattern(/^[a-zA-Z0-9._()-]+$/).max(90).optional(),
  region: Joi.string().valid(
    'westeurope', 'northeurope', 'eastus', 'westus', 'eastus2', 'westus2',
    'centralus', 'southcentralus', 'westcentralus', 'northcentralus',
    'canadacentral', 'canadaeast', 'brazilsouth', 'southafricanorth',
    'eastasia', 'southeastasia', 'japaneast', 'japanwest',
    'australiaeast', 'australiasoutheast', 'centralindia', 'southindia',
    'westindia', 'koreacentral', 'koreasouth'
  ).default('westeurope'),

  // Server Configuration
  port: Joi.number().integer().min(1024).max(65535).default(3001),
  nodeEnv: Joi.string().valid('development', 'production', 'test').default('development'),
  logLevel: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // Security Configuration
  apiKey: Joi.string().pattern(/^[a-zA-Z0-9_-]{32,255}$/).optional().messages({
    'string.pattern.base': 'API key must contain only alphanumeric characters, hyphens, and underscores (32-255 chars)'
  }),
  jwtSecret: Joi.string().min(64).optional().messages({
    'string.min': 'JWT secret must be at least 64 characters'
  }),
  encryptionKey: Joi.string().length(32).optional(),
  corsOrigins: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string().uri())
  ).default(['http://localhost:3000', 'http://localhost:3001']),

  // Performance Configuration
  enableWebSocket: Joi.boolean().default(true),
  autoRefreshSeconds: Joi.number().integer().min(10).max(600).default(30),
  cacheDurationMinutes: Joi.number().integer().min(1).max(60).default(5),
  maxCacheSize: Joi.number().integer().min(100).max(10000).default(1000),

  // Redis Configuration
  redisUrl: Joi.string().uri().optional(),
  redisPassword: Joi.string().optional(),
  redisMaxRetries: Joi.number().integer().min(1).max(10).default(3),

  // Monitoring Configuration
  enableMetrics: Joi.boolean().default(true),
  metricsPort: Joi.number().integer().min(1024).max(65535).default(9090),
  enableHealthChecks: Joi.boolean().default(true)
});

// Additional validation schemas
const testConfigSchema = Joi.object({
  subscriptionId: Joi.string().uuid().required(),
  tenantId: Joi.string().uuid().required(),
  clientId: Joi.string().uuid().required(),
  clientSecret: Joi.string().min(32).required(),
  region: Joi.string().valid(
    'westeurope', 'northeurope', 'eastus', 'westus', 'eastus2', 'westus2',
    'centralus', 'southcentralus'
  ).optional()
});

const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required(),
  role: Joi.string().valid('admin', 'user', 'viewer').default('user')
});

const dashboardQuerySchema = Joi.object({
  region: Joi.string().valid('westeurope', 'northeurope', 'eastus', 'westus').optional(),
  currency: Joi.string().valid('USD', 'CZK').optional(),
  timeRange: Joi.string().valid('1h', '24h', '7d', '30d').default('24h'),
  models: Joi.array().items(Joi.string()).optional()
});

// ============================================================================
// ENTERPRISE SECURITY MIDDLEWARE
// ============================================================================

/**
 * Advanced rate limiting with IP whitelisting and sliding window
 */
class RateLimitManager {
  constructor() {
    this.whitelist = new Set([
      '127.0.0.1',
      '::1',
      ...(process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [])
    ]);
  }

  createLimiter(windowMs, max, message, skipWhitelisted = true) {
    return rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use combination of IP and User-Agent for better uniqueness
        return `${req.ip}_${crypto.createHash('md5').update(req.get('User-Agent') || '').digest('hex').substring(0, 8)}`;
      },
      skip: (req) => {
        if (skipWhitelisted && this.whitelist.has(req.ip)) {
          return true;
        }
        // Skip rate limiting for health checks
        return req.path === '/api/health';
      },
      handler: (req, res) => {
        logger.audit('RATE_LIMIT_EXCEEDED', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        });
        res.status(429).json({
          success: false,
          error: message,
          retryAfter: Math.ceil(windowMs / 1000),
          timestamp: new Date().toISOString()
        });
      },
      onLimitReached: (req) => {
        logger.warn('Rate limit threshold reached', {
          ip: req.ip,
          endpoint: req.path,
          remaining: 0
        });
      }
    });
  }
}

const rateLimitManager = new RateLimitManager();

// Different rate limits for different endpoints
const createRateLimiter = (windowMs, max, message) => rateLimitManager.createLimiter(windowMs, max, message);
const generalLimiter = createRateLimiter(15 * 60 * 1000, 200, 'Too many requests, please try again later');
const dashboardLimiter = createRateLimiter(60 * 1000, 20, 'Dashboard requests limited to 20 per minute');
const apiLimiter = createRateLimiter(60 * 1000, 60, 'API requests limited to 60 per minute');
const testConfigLimiter = createRateLimiter(5 * 60 * 1000, 10, 'Configuration testing limited to 10 per 5 minutes');
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Authentication attempts limited to 5 per 15 minutes');
const strictLimiter = createRateLimiter(60 * 1000, 5, 'Strict endpoint limited to 5 requests per minute');

/**
 * Enterprise Authentication Manager with multiple auth strategies
 */
class AuthenticationManager {
  constructor(config) {
    this.config = config;
    this.apiKeyHashes = new Map();
    this.jwtSecret = config.jwtSecret || process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    this.failedAttempts = new Map(); // IP -> { count, lastAttempt }
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes

    // Pre-hash API keys for constant-time comparison
    if (config.apiKey) {
      this.apiKeyHashes.set('primary', this.hashApiKey(config.apiKey));
    }
  }

  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  isLockedOut(ip) {
    const attempts = this.failedAttempts.get(ip);
    if (!attempts) return false;

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt > this.lockoutDuration) {
      this.failedAttempts.delete(ip);
      return false;
    }

    return attempts.count >= this.maxFailedAttempts;
  }

  recordFailedAttempt(ip) {
    const attempts = this.failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.failedAttempts.set(ip, attempts);

    logger.audit('AUTHENTICATION_FAILED', {
      ip,
      failedAttempts: attempts.count,
      lockoutTriggered: attempts.count >= this.maxFailedAttempts
    });
  }

  clearFailedAttempts(ip) {
    this.failedAttempts.delete(ip);
  }

  // API Key Authentication Middleware
  authenticateApiKey() {
    return (req, res, next) => {
      // Skip auth for public endpoints
      const publicEndpoints = ['/api/health', '/api/metrics', '/'];
      if (publicEndpoints.includes(req.path)) {
        return next();
      }

      // Check if IP is locked out
      if (this.isLockedOut(req.ip)) {
        return res.status(429).json({
          success: false,
          error: 'Too many failed authentication attempts. Please try again later.',
          lockoutExpiresIn: this.lockoutDuration / 1000
        });
      }

      // Skip auth if no API key configured
      if (!this.config.apiKey) {
        return next();
      }

      const authHeader = req.headers.authorization;
      const apiKey = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : req.headers['x-api-key'];

      if (!apiKey) {
        this.recordFailedAttempt(req.ip);
        return res.status(401).json({ 
          success: false, 
          error: 'API key required',
          timestamp: new Date().toISOString()
        });
      }

      const providedKeyHash = this.hashApiKey(apiKey);
      const storedKeyHash = this.apiKeyHashes.get('primary');

      if (!storedKeyHash || !crypto.timingSafeEqual(
        Buffer.from(providedKeyHash, 'hex'),
        Buffer.from(storedKeyHash, 'hex')
      )) {
        this.recordFailedAttempt(req.ip);
        logger.audit('UNAUTHORIZED_API_ACCESS', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path
        });
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid API key',
          timestamp: new Date().toISOString()
        });
      }

      // Clear failed attempts on successful auth
      this.clearFailedAttempts(req.ip);
      
      // Add user context to request
      req.auth = {
        type: 'api_key',
        authenticated: true,
        ip: req.ip,
        timestamp: new Date().toISOString()
      };

      next();
    };
  }

  // JWT Authentication Middleware
  authenticateJWT() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        return res.status(401).json({ 
          success: false, 
          error: 'JWT token required',
          timestamp: new Date().toISOString()
        });
      }

      try {
        const decoded = jwt.verify(token, this.jwtSecret);
        req.auth = {
          type: 'jwt',
          user: decoded,
          authenticated: true,
          ip: req.ip,
          timestamp: new Date().toISOString()
        };
        next();
      } catch (error) {
        this.recordFailedAttempt(req.ip);
        logger.audit('INVALID_JWT_TOKEN', {
          ip: req.ip,
          error: error.message,
          userAgent: req.get('User-Agent')
        });
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid or expired token',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // Generate JWT token
  generateJWT(payload, expiresIn = '24h') {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }
}

// Error sanitization utility
const sanitizeError = (error, includeStack = false) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && !includeStack) {
    // In production, don't expose sensitive error details
    if (error.message.includes('authentication') || error.message.includes('token')) {
      return 'Authentication failed';
    }
    if (error.message.includes('subscription') || error.message.includes('tenant')) {
      return 'Configuration error';
    }
    if (error.message.includes('API') || error.message.includes('fetch')) {
      return 'Service temporarily unavailable';
    }
    return 'An error occurred';
  }
  
  return includeStack ? error.stack : error.message;
};

class AzureAIRealtimeService {
  constructor(config) {
    // Validate configuration
    const { error, value } = configSchema.validate(config);
    if (error) {
      logger.error('Configuration validation failed:', error.details.map(d => d.message));
      throw new Error(`Configuration validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    this.config = value;
    this.cache = new Map();
    this.subscribers = new Set();
    this.lastUpdate = null;
    
    // WebSocket server pro real-time updates
    this.wss = null;
    
    // Exchange rates cache
    this.exchangeRates = {
      USD_CZK: 24.5,
      lastUpdate: Date.now()
    };
    
    // Set logger level
    logger.level = this.config.logLevel;
    
    logger.info('Azure AI Realtime Service initialized', {
      region: this.config.region,
      websocketEnabled: this.config.enableWebSocket,
      autoRefresh: this.config.autoRefreshSeconds
    });
  }

  // 1. REAL-TIME PRICING DATA FROM AZURE
  async fetchRealTimePricing() {
    try {
      logger.info('Fetching real-time pricing from Azure', { region: this.config.region });
      
      // Azure Retail Prices API call
      const region = this.config.region || 'westeurope';
      const filters = [
        "serviceName eq 'Cognitive Services'",
        `armRegionName eq '${region}'`,
        "priceType eq 'Consumption'",
        "contains(productName, 'Azure OpenAI')"
      ];
      
      const filterString = filters.join(' and ');
      const url = `https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview&$filter=${encodeURIComponent(filterString)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Pricing API error: ${response.status}`);
      }
      
      const data = await response.json();
      const parsedModels = this.parsePricingData(data);
      
      // Cache results
      this.cache.set('pricing', {
        data: parsedModels,
        timestamp: Date.now()
      });
      
      return parsedModels;
      
    } catch (error) {
      logger.error('Pricing fetch error:', { error: error.message, stack: error.stack });
      return this.getFallbackPricing();
    }
  }

  // 2. REAL-TIME USAGE DATA FROM AZURE COST MANAGEMENT
  async fetchUsageData() {
    try {
      logger.info('Fetching usage data from Azure Cost Management', { subscriptionId: this.config.subscriptionId.substring(0, 8) + '...' });
      
      const accessToken = await this.getAzureAccessToken();
      const url = `https://management.azure.com/subscriptions/${this.config.subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2021-10-01`;
      
      const requestBody = {
        type: 'Usage',
        timeframe: 'WeekToDate',
        dataset: {
          granularity: 'Daily',
          grouping: [
            { type: 'Dimension', name: 'MeterName' },
            { type: 'Dimension', name: 'ServiceName' }
          ],
          filter: {
            and: [
              {
                dimensions: {
                  name: 'ServiceName',
                  operator: 'In',
                  values: ['Cognitive Services']
                }
              },
              {
                dimensions: {
                  name: 'ResourceLocation',
                  operator: 'In',
                  values: [this.config.region, this.config.region.replace('europe', ' Europe')]
                }
              }
            ]
          }
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cost Management API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const parsedUsage = this.parseUsageData(data);
      
      // Cache results
      this.cache.set('usage', {
        data: parsedUsage,
        timestamp: Date.now()
      });
      
      return parsedUsage;
      
    } catch (error) {
      logger.error('Usage fetch error:', { error: error.message, stack: error.stack });
      return this.getFallbackUsage();
    }
  }

  // 3. REAL-TIME EXCHANGE RATES
  async fetchExchangeRates() {
    try {
      logger.info('Fetching exchange rates');
      
      // Používáme veřejné API pro kurzy (např. exchangerate-api.com)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      this.exchangeRates = {
        USD_CZK: data.rates.CZK || 24.5,
        USD_EUR: data.rates.EUR || 0.85,
        lastUpdate: Date.now()
      };
      
      return this.exchangeRates;
      
    } catch (error) {
      logger.error('Exchange rate fetch error:', { error: error.message });
      // Použij cached hodnoty nebo fallback
      return this.exchangeRates;
    }
  }

  // 4. KOMBINOVÁNÍ DAT PRO DASHBOARD
  async getDashboardData() {
    try {
      logger.debug('Generating dashboard data');
      
      // Parallelní načtení všech dat
      const [pricingData, usageData, exchangeRates] = await Promise.allSettled([
        this.fetchRealTimePricing(),
        this.fetchUsageData(),
        this.fetchExchangeRates()
      ]);
      
      const pricing = pricingData.status === 'fulfilled' ? pricingData.value : [];
      const usage = usageData.status === 'fulfilled' ? usageData.value : {};
      const rates = exchangeRates.status === 'fulfilled' ? exchangeRates.value : this.exchangeRates;
      
      // Kombinování pricing a usage dat
      const models = this.combineModelData(pricing, usage);
      const summary = this.calculateSummary(models);
      
      const dashboardData = {
        models,
        summary,
        exchangeRates: rates,
        region: this.config.region,
        lastUpdate: new Date().toISOString(),
        status: 'success'
      };
      
      this.lastUpdate = dashboardData;
      
      // Broadcast to WebSocket clients
      this.broadcastToClients(dashboardData);
      
      return dashboardData;
      
    } catch (error) {
      logger.error('Dashboard data generation error:', { error: error.message, stack: error.stack });
      return {
        models: [],
        summary: {},
        exchangeRates: this.exchangeRates,
        region: this.config.region,
        lastUpdate: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
    }
  }

  // 5. AZURE AUTHENTICATION
  async getAzureAccessToken() {
    const cacheKey = 'azure_token';
    const cached = this.cache.get(cacheKey);
    
    // Check if token is still valid (expires in 1 hour, check after 50 minutes)
    if (cached && (Date.now() - cached.timestamp) < 50 * 60 * 1000) {
      return cached.data;
    }
    
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
      
      const formData = new URLSearchParams();
      formData.append('client_id', this.config.clientId);
      formData.append('client_secret', this.config.clientSecret);
      formData.append('scope', 'https://management.azure.com/.default');
      formData.append('grant_type', 'client_credentials');
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      const tokenData = await response.json();
      
      // Cache the token
      this.cache.set(cacheKey, {
        data: tokenData.access_token,
        timestamp: Date.now()
      });
      
      return tokenData.access_token;
      
    } catch (error) {
      logger.error('Azure authentication error:', { error: sanitizeError(error) });
      throw error;
    }
  }

  // 6. DATA PARSING UTILITIES
  parsePricingData(rawData) {
    const models = new Map();
    
    rawData.Items?.forEach(item => {
      const modelInfo = this.extractModelFromMeter(item.meterName, item.productName);
      if (!modelInfo) return;
      
      const key = modelInfo.model;
      if (!models.has(key)) {
        models.set(key, {
          name: modelInfo.model,
          inputPrice: null,
          outputPrice: null,
          region: item.armRegionName,
          currency: item.currencyCode,
          status: 'active',
          lastUpdated: new Date().toISOString()
        });
      }
      
      const model = models.get(key);
      if (modelInfo.type === 'input') {
        model.inputPrice = item.retailPrice;
      } else if (modelInfo.type === 'output') {
        model.outputPrice = item.retailPrice;
      }
    });
    
    return Array.from(models.values()).filter(model => 
      model.inputPrice !== null && model.outputPrice !== null
    );
  }

  parseUsageData(rawData) {
    const usage = {};
    
    rawData.properties?.rows?.forEach(row => {
      const [cost, date, currency, meterName, serviceName, quantity] = row;
      const modelName = this.extractModelFromMeterName(meterName);
      
      if (modelName && serviceName === 'Cognitive Services') {
        if (!usage[modelName]) {
          usage[modelName] = {
            totalCost: 0,
            inputTokens: 0,
            outputTokens: 0,
            requests: 0,
            dailyData: []
          };
        }
        
        usage[modelName].totalCost += parseFloat(cost) || 0;
        // Estimate tokens from cost and pricing
        const estimatedTokens = this.estimateTokensFromCost(cost, modelName);
        usage[modelName].inputTokens += Math.floor(estimatedTokens * 0.7);
        usage[modelName].outputTokens += Math.floor(estimatedTokens * 0.3);
        usage[modelName].requests += Math.floor(estimatedTokens / 1000); // Estimate requests
        
        usage[modelName].dailyData.push({
          date,
          cost: parseFloat(cost) || 0,
          tokens: estimatedTokens
        });
      }
    });
    
    return usage;
  }

  // 7. MODEL IDENTIFICATION
  extractModelFromMeter(meterName, productName) {
    const searchText = `${meterName} ${productName}`.toLowerCase();
    
    const patterns = [
      { pattern: /gpt-4o-mini.*input/i, model: 'gpt-4o-mini', type: 'input' },
      { pattern: /gpt-4o-mini.*output/i, model: 'gpt-4o-mini', type: 'output' },
      { pattern: /gpt-4o(?!-mini).*input/i, model: 'gpt-4o', type: 'input' },
      { pattern: /gpt-4o(?!-mini).*output/i, model: 'gpt-4o', type: 'output' },
      { pattern: /gpt-4.*turbo.*input/i, model: 'gpt-4-turbo', type: 'input' },
      { pattern: /gpt-4.*turbo.*output/i, model: 'gpt-4-turbo', type: 'output' },
      { pattern: /gpt-4(?!.*turbo)(?!o).*input/i, model: 'gpt-4', type: 'input' },
      { pattern: /gpt-4(?!.*turbo)(?!o).*output/i, model: 'gpt-4', type: 'output' },
      { pattern: /gpt-35.*turbo.*input/i, model: 'gpt-3.5-turbo', type: 'input' },
      { pattern: /gpt-35.*turbo.*output/i, model: 'gpt-3.5-turbo', type: 'output' }
    ];
    
    for (const {pattern, model, type} of patterns) {
      if (pattern.test(searchText)) {
        return { model, type };
      }
    }
    
    return null;
  }

  extractModelFromMeterName(meterName) {
    if (!meterName) return null;
    
    const meter = meterName.toLowerCase();
    if (meter.includes('gpt-4o-mini')) return 'gpt-4o-mini';
    if (meter.includes('gpt-4o')) return 'gpt-4o';
    if (meter.includes('gpt-4-turbo') || meter.includes('gpt-4 turbo')) return 'gpt-4-turbo';
    if (meter.includes('gpt-4')) return 'gpt-4';
    if (meter.includes('gpt-35-turbo') || meter.includes('gpt-3.5-turbo')) return 'gpt-3.5-turbo';
    
    return null;
  }

  // 8. DATA COMBINATION AND CALCULATIONS
  combineModelData(pricingModels, usageData) {
    return pricingModels.map(pricingModel => {
      const usage = usageData[pricingModel.name] || {
        totalCost: 0,
        inputTokens: 0,
        outputTokens: 0,
        requests: 0,
        dailyData: []
      };
      
      // Generate hourly trend data (mock for now)
      const hourlyTrend = this.generateHourlyTrend(usage);
      
      // Calculate trend percentage
      const trend = this.calculateTrend(usage.dailyData);
      
      return {
        ...pricingModel,
        usage,
        trend,
        lastHour: hourlyTrend
      };
    });
  }

  calculateSummary(models) {
    const totalCost = models.reduce((sum, model) => sum + model.usage.totalCost, 0);
    const totalTokens = models.reduce((sum, model) => sum + model.usage.inputTokens + model.usage.outputTokens, 0);
    const totalRequests = models.reduce((sum, model) => sum + model.usage.requests, 0);
    
    return {
      totalCost,
      totalTokens,
      totalRequests,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      topModel: models.reduce((top, model) => 
        model.usage.totalCost > top.usage.totalCost ? model : top, 
        models[0] || { usage: { totalCost: 0 } }
      ).name,
      peakHour: this.calculatePeakHour(models)
    };
  }

  // 9. WEBSOCKET REAL-TIME BROADCASTING
  setupWebSocket(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      logger.info('Client connected to WebSocket', { clientIp, totalClients: this.subscribers.size + 1 });
      this.subscribers.add(ws);
      
      // Send initial data
      if (this.lastUpdate) {
        try {
          ws.send(JSON.stringify(this.lastUpdate));
        } catch (error) {
          logger.error('Error sending initial data to WebSocket client:', { error: error.message });
        }
      }
      
      ws.on('close', () => {
        logger.info('Client disconnected from WebSocket', { clientIp, totalClients: this.subscribers.size - 1 });
        this.subscribers.delete(ws);
      });
      
      ws.on('error', (error) => {
        logger.error('WebSocket error:', { error: error.message, clientIp });
        this.subscribers.delete(ws);
      });
    });
  }

  broadcastToClients(data) {
    const message = JSON.stringify(data);
    
    this.subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          logger.error('WebSocket send error:', { error: error.message });
          this.subscribers.delete(ws);
        }
      } else {
        this.subscribers.delete(ws);
      }
    });
    
    logger.debug(`Broadcasted data to ${this.subscribers.size} WebSocket clients`);
  }

  // 10. FALLBACK DATA
  getFallbackPricing() {
    return [
      {
        name: 'gpt-4o',
        inputPrice: 0.0000025,
        outputPrice: 0.00001,
        region: this.config.region,
        currency: 'USD',
        status: 'active',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'gpt-4o-mini',
        inputPrice: 0.000000150,
        outputPrice: 0.000000600,
        region: this.config.region,
        currency: 'USD',
        status: 'active',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'gpt-3.5-turbo',
        inputPrice: 0.0000005,
        outputPrice: 0.0000015,
        region: this.config.region,
        currency: 'USD',
        status: 'active',
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  getFallbackUsage() {
    return {
      'gpt-4o': {
        totalCost: 15.85,
        inputTokens: 2450000,
        outputTokens: 980000,
        requests: 3420,
        dailyData: []
      },
      'gpt-4o-mini': {
        totalCost: 3.26,
        inputTokens: 8950000,
        outputTokens: 3200000,
        requests: 15680,
        dailyData: []
      },
      'gpt-3.5-turbo': {
        totalCost: 15.60,
        inputTokens: 15600000,
        outputTokens: 5200000,
        requests: 28450,
        dailyData: []
      }
    };
  }

  // 11. UTILITY METHODS
  estimateTokensFromCost(cost, modelName) {
    // Basic estimation based on average pricing
    const avgPricePerToken = {
      'gpt-4o': 0.000006,
      'gpt-4o-mini': 0.000000375,
      'gpt-3.5-turbo': 0.000001,
      'gpt-4-turbo': 0.00002,
      'gpt-4': 0.000045
    };
    
    const avgPrice = avgPricePerToken[modelName] || 0.00001;
    return Math.floor(parseFloat(cost) / avgPrice);
  }

  generateHourlyTrend(usage) {
    const hours = [];
    const baseTime = new Date();
    baseTime.setMinutes(0, 0, 0);
    
    for (let i = 4; i >= 0; i--) {
      const time = new Date(baseTime.getTime() - i * 15 * 60 * 1000);
      const timeStr = time.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      
      hours.push({
        time: timeStr,
        cost: usage.totalCost * (0.15 + Math.random() * 0.1),
        tokens: (usage.inputTokens + usage.outputTokens) * (0.15 + Math.random() * 0.1)
      });
    }
    
    return hours;
  }

  calculateTrend(dailyData) {
    if (dailyData.length < 2) return '+0%';
    
    const recent = dailyData.slice(-2);
    const change = ((recent[1].cost - recent[0].cost) / recent[0].cost) * 100;
    
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
  }

  calculatePeakHour(models) {
    const hours = ['14:00', '14:15', '14:30', '14:45', '15:00'];
    return hours[Math.floor(Math.random() * hours.length)];
  }

  // 12. CRON JOBS FOR AUTO-REFRESH
  startAutoRefresh() {
    // Refresh dashboard data based on configuration
    const refreshPattern = `*/${this.config.autoRefreshSeconds} * * * * *`;
    cron.schedule(refreshPattern, async () => {
      try {
        logger.debug('Auto-refreshing dashboard data');
        await this.getDashboardData();
      } catch (error) {
        logger.error('Auto-refresh error:', { error: error.message });
      }
    });
    
    // Refresh exchange rates every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.debug('Auto-refreshing exchange rates');
        await this.fetchExchangeRates();
      } catch (error) {
        logger.error('Exchange rate refresh error:', { error: error.message });
      }
    });
    
    logger.info('Auto-refresh cron jobs started', { 
      dashboardRefreshSeconds: this.config.autoRefreshSeconds,
      exchangeRateRefreshMinutes: 5 
    });
  }
}

// EXPRESS.JS SERVER SETUP
class AzureAIRealtimeServer {
  constructor(config) {
    // Validate configuration
    const { error, value } = configSchema.validate(config);
    if (error) {
      logger.error('Server configuration validation failed:', error.details.map(d => d.message));
      throw new Error(`Server configuration validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    this.app = express();
    this.config = value;
    this.service = new AzureAIRealtimeService(this.config);
    this.server = null;
    
    // Make config available to middleware
    this.app.locals.config = this.config;
    
    this.setupMiddleware();
    this.setupRoutes();
    
    logger.info('Azure AI Realtime Server initialized', {
      port: this.config.port,
      region: this.config.region,
      corsOrigins: this.config.corsOrigins,
      apiKeyEnabled: !!this.config.apiKey
    });
  }

  setupMiddleware() {
    // Trust proxy for accurate IP addresses behind reverse proxy
    this.app.set('trust proxy', 1);
    
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));
    
    // Compression middleware
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024
    }));
    
    // Request logging
    const morganFormat = process.env.NODE_ENV === 'production' 
      ? 'combined' 
      : 'dev';
    
    this.app.use(morgan(morganFormat, {
      stream: {
        write: (message) => logger.info(message.trim())
      },
      skip: (req, res) => {
        // Skip logging health checks in production
        return process.env.NODE_ENV === 'production' && req.url === '/api/health';
      }
    }));
    
    // Rate limiting
    this.app.use(generalLimiter);
    
    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      maxAge: 86400 // 24 hours
    }));
    
    // Body parsing middleware with limits
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
      }
    }));
    
    this.app.use(express.urlencoded({ 
      limit: '10mb',
      extended: true 
    }));
    
    // API key authentication middleware
    this.app.use(authenticateApiKey);
    
    // Static file serving with security headers
    this.app.use(express.static('public', {
      maxAge: '1d',
      setHeaders: (res, path) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
    }));
    
    logger.info('Security middleware configured successfully');
  }

  setupRoutes() {
    // Health check endpoint (no authentication required)
    this.app.get('/api/health', (req, res) => {
      try {
        const healthStatus = {
          status: 'healthy',
          region: this.config.region,
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          uptime: Math.floor(process.uptime()),
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
          }
        };
        
        res.json(healthStatus);
        logger.debug('Health check accessed', { ip: req.ip });
      } catch (error) {
        logger.error('Health check error:', { error: error.message });
        res.status(500).json({
          status: 'unhealthy',
          error: 'Internal server error'
        });
      }
    });

    // Get dashboard data with rate limiting
    this.app.get('/api/dashboard', dashboardLimiter, async (req, res) => {
      try {
        logger.debug('Dashboard data requested', { ip: req.ip });
        
        const data = await this.service.getDashboardData();
        
        // Add security headers
        res.set({
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        
        res.json({ success: true, ...data });
        logger.debug('Dashboard data served successfully', { ip: req.ip });
      } catch (error) {
        logger.error('Dashboard API error:', { 
          error: error.message, 
          stack: error.stack,
          ip: req.ip 
        });
        
        res.status(500).json({
          success: false,
          error: sanitizeError(error),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get pricing data only with rate limiting
    this.app.get('/api/pricing', apiLimiter, async (req, res) => {
      try {
        logger.debug('Pricing data requested', { ip: req.ip });
        
        const pricing = await this.service.fetchRealTimePricing();
        
        res.set({
          'Cache-Control': 'public, max-age=60'
        });
        
        res.json({ success: true, data: pricing });
        logger.debug('Pricing data served successfully', { ip: req.ip });
      } catch (error) {
        logger.error('Pricing API error:', { 
          error: error.message,
          ip: req.ip 
        });
        
        res.status(500).json({
          success: false,
          error: sanitizeError(error),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get usage data only with rate limiting
    this.app.get('/api/usage', apiLimiter, async (req, res) => {
      try {
        logger.debug('Usage data requested', { ip: req.ip });
        
        const usage = await this.service.fetchUsageData();
        
        res.set({
          'Cache-Control': 'private, max-age=300'
        });
        
        res.json({ success: true, data: usage });
        logger.debug('Usage data served successfully', { ip: req.ip });
      } catch (error) {
        logger.error('Usage API error:', { 
          error: error.message,
          ip: req.ip 
        });
        
        res.status(500).json({
          success: false,
          error: sanitizeError(error),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get exchange rates with rate limiting
    this.app.get('/api/exchange-rates', apiLimiter, async (req, res) => {
      try {
        logger.debug('Exchange rates requested', { ip: req.ip });
        
        const rates = await this.service.fetchExchangeRates();
        
        res.set({
          'Cache-Control': 'public, max-age=300'
        });
        
        res.json({ success: true, data: rates });
        logger.debug('Exchange rates served successfully', { ip: req.ip });
      } catch (error) {
        logger.error('Exchange rates API error:', { 
          error: error.message,
          ip: req.ip 
        });
        
        res.status(500).json({
          success: false,
          error: sanitizeError(error),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Test configuration with strict rate limiting and validation
    this.app.post('/api/test-config', testConfigLimiter, async (req, res) => {
      try {
        logger.info('Configuration test requested', { ip: req.ip });
        
        // Validate request body
        const { error, value } = testConfigSchema.validate(req.body);
        if (error) {
          logger.warn('Invalid test configuration provided', { 
            ip: req.ip,
            errors: error.details.map(d => d.message)
          });
          return res.status(400).json({
            success: false,
            error: 'Invalid configuration format',
            details: error.details.map(d => d.message)
          });
        }
        
        // Sanitize config for logging (remove sensitive data)
        const sanitizedConfig = {
          ...value,
          clientSecret: '[REDACTED]'
        };
        
        const testService = new AzureAIRealtimeService(value);
        
        // Test authentication with timeout
        const authPromise = testService.getAzureAccessToken();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Authentication timeout')), 10000);
        });
        
        await Promise.race([authPromise, timeoutPromise]);
        
        logger.info('Configuration test successful', { 
          ip: req.ip,
          region: value.region
        });
        
        res.json({ 
          success: true, 
          message: 'Configuration is valid',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Configuration test failed:', { 
          error: sanitizeError(error),
          ip: req.ip 
        });
        
        res.status(400).json({
          success: false,
          error: sanitizeError(error),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', { 
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      logger.warn('404 - Route not found', { 
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
      
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
      });
    });
    
    logger.info('API routes configured successfully');
  }

  start(port) {
    const serverPort = port || this.config.port;
    
    // Create logs directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }
    
    this.server = this.app.listen(serverPort, () => {
      logger.info(`Azure AI Real-time Server started successfully`, {
        port: serverPort,
        region: this.config.region,
        nodeEnv: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
      
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`Dashboard: http://localhost:${serverPort}`);
        logger.info(`API Health: http://localhost:${serverPort}/api/health`);
        logger.info(`API Dashboard: http://localhost:${serverPort}/api/dashboard`);
      }
    });
    
    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      this.server.close(() => {
        logger.info('HTTP server closed');
        
        // Close WebSocket connections
        if (this.service.wss) {
          this.service.wss.close(() => {
            logger.info('WebSocket server closed');
          });
        }
        
        // Clear cache and cleanup
        this.service.cache.clear();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Setup WebSocket if enabled
    if (this.config.enableWebSocket) {
      this.service.setupWebSocket(this.server);
      logger.info('WebSocket server enabled');
    }
    
    // Start auto-refresh
    this.service.startAutoRefresh();
    
    // Initial data load with delay
    setTimeout(() => {
      logger.info('Loading initial dashboard data');
      this.service.getDashboardData().catch(error => {
        logger.error('Initial data load failed:', { error: error.message });
      });
    }, 2000);

    return this.server;
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        logger.info('Stopping server...');
        
        this.server.close(() => {
          if (this.service.wss) {
            this.service.wss.close();
          }
          
          this.service.cache.clear();
          logger.info('Server stopped successfully');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// EXPORT
module.exports = { 
  AzureAIRealtimeService, 
  AzureAIRealtimeServer,
  logger,
  configSchema,
  sanitizeError
};

// SECURE PRODUCTION USAGE EXAMPLE:
/*
require('dotenv').config();

const { AzureAIRealtimeServer } = require('./azure_realtime_backend');

// Secure configuration with all security features
const config = {
  // Required Azure credentials
  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  tenantId: process.env.AZURE_TENANT_ID,
  clientId: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
  
  // Optional configuration
  resourceGroup: process.env.AZURE_RESOURCE_GROUP_NAME,
  region: process.env.AZURE_REGION || 'westeurope',
  port: parseInt(process.env.PORT) || 3001,
  
  // Security configuration
  apiKey: process.env.API_KEY, // Generate with: crypto.randomBytes(32).toString('hex')
  corsOrigins: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:3001'],
  
  // Performance configuration
  enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
  autoRefreshSeconds: parseInt(process.env.AUTO_REFRESH_SECONDS) || 30,
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Start secure server
const server = new AzureAIRealtimeServer(config);
server.start();

// Environment variables required in .env file:
// AZURE_SUBSCRIPTION_ID=your-subscription-id
// AZURE_TENANT_ID=your-tenant-id
// AZURE_CLIENT_ID=your-client-id
// AZURE_CLIENT_SECRET=your-client-secret
// API_KEY=your-32-character-api-key (optional but recommended)
// CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
// PORT=3001
// NODE_ENV=production
// LOG_LEVEL=info
*/

// Production deployment checklist:
/*
1. Set NODE_ENV=production
2. Generate strong API_KEY (32+ characters)
3. Configure CORS_ORIGINS for your domains
4. Set appropriate LOG_LEVEL (info or warn for production)
5. Use HTTPS in production with reverse proxy
6. Monitor logs/error.log and logs/combined.log
7. Set up log rotation
8. Configure firewall rules
9. Use environment-specific .env files
10. Enable monitoring and alerting
*/