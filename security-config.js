/**
 * Security Configuration for Vajangu Orders
 * Centralized security settings and utilities
 */

const crypto = require('crypto');

// Security configuration
const securityConfig = {
  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
  
  // Session security
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // per IP per window
    adminMaxRequests: 20, // for admin endpoints
  },
  
  // Input validation
  validation: {
    maxStringLength: 1000,
    maxEmailLength: 254,
    maxPhoneLength: 20,
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.pdf'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  
  // Database security
  database: {
    connectionTimeout: 30000,
    queryTimeout: 10000,
    maxConnections: 10,
    sslRequired: process.env.NODE_ENV === 'production',
  },
  
  // Backup security
  backup: {
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production',
    retentionDays: 30,
    compressionLevel: 6,
  }
};

// Security utilities
const securityUtils = {
  // Generate secure random string
  generateSecureString: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },
  
  // Hash password (simple implementation - use bcrypt in production)
  hashPassword: (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  },
  
  // Verify password
  verifyPassword: (password, hashedPassword) => {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  },
  
  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= securityConfig.validation.maxEmailLength;
  },
  
  // Validate phone format
  validatePhone: (phone) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
    return phoneRegex.test(phone) && phone.length <= securityConfig.validation.maxPhoneLength;
  },
  
  // Sanitize input
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .trim()
      .slice(0, securityConfig.validation.maxStringLength)
      .replace(/[<>]/g, ''); // Basic XSS prevention
  },
  
  // Check password strength
  checkPasswordStrength: (password) => {
    const errors = [];
    
    if (password.length < securityConfig.password.minLength) {
      errors.push(`Password must be at least ${securityConfig.password.minLength} characters long`);
    }
    
    if (securityConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (securityConfig.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (securityConfig.password.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (securityConfig.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  // Generate CSRF token
  generateCSRFToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },
  
  // Validate CSRF token
  validateCSRFToken: (token, sessionToken) => {
    return token && sessionToken && token === sessionToken;
  }
};

// Security middleware factory
const createSecurityMiddleware = () => {
  const attemptCounts = new Map();
  const lockouts = new Map();
  
  return {
    // Rate limiting middleware
    rateLimit: (maxRequests = securityConfig.rateLimit.maxRequests) => {
      return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowMs = securityConfig.rateLimit.windowMs;
        
        if (!attemptCounts.has(ip)) {
          attemptCounts.set(ip, { count: 0, resetTime: now + windowMs });
        }
        
        const ipData = attemptCounts.get(ip);
        
        if (now > ipData.resetTime) {
          ipData.count = 0;
          ipData.resetTime = now + windowMs;
        }
        
        if (ipData.count >= maxRequests) {
          return res.status(429).json({ 
            error: 'Too many requests', 
            retryAfter: Math.ceil((ipData.resetTime - now) / 1000) 
          });
        }
        
        ipData.count++;
        next();
      };
    },
    
    // Login attempt limiting
    loginLimit: () => {
      return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (lockouts.has(ip) && now < lockouts.get(ip)) {
          const remaining = Math.ceil((lockouts.get(ip) - now) / 1000);
          return res.status(429).json({ 
            error: 'Too many login attempts', 
            retryAfter: remaining 
          });
        }
        
        next();
      };
    },
    
    // Record failed login attempt
    recordFailedLogin: (ip) => {
      const now = Date.now();
      const attempts = attemptCounts.get(ip)?.count || 0;
      
      if (attempts >= securityConfig.password.maxAttempts) {
        lockouts.set(ip, now + securityConfig.password.lockoutDuration);
        attemptCounts.delete(ip);
      }
    },
    
    // Clear failed attempts on successful login
    clearFailedAttempts: (ip) => {
      attemptCounts.delete(ip);
      lockouts.delete(ip);
    }
  };
};

module.exports = {
  securityConfig,
  securityUtils,
  createSecurityMiddleware
};
