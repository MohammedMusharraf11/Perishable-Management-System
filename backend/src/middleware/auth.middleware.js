import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';

/**
 * Authentication middleware - verifies JWT token
 * PMS-T-105: Authentication bypass testing
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Invalid token format' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Fetch user from database to ensure they still exist and are active
    const { data: user, error } = await supabase
      .from('pms_users')
      .select('id, email, name, role, approval_status')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'User not found' 
      });
    }

    // Check if user is approved (for managers)
    if (user.role === 'Manager' && user.approval_status !== 'approved') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Account pending approval' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Token expired' 
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication failed' 
    });
  }
};

/**
 * Authorization middleware - checks user role
 * PMS-T-105: Authorization/RBAC testing
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware to prevent brute force attacks
 * PMS-T-105: Security hardening
 */
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export const rateLimitLogin = (req, res, next) => {
  const identifier = req.body.email || req.ip;
  const now = Date.now();
  
  if (!loginAttempts.has(identifier)) {
    loginAttempts.set(identifier, { count: 0, firstAttempt: now, lockedUntil: null });
  }
  
  const attempts = loginAttempts.get(identifier);
  
  // Check if account is locked
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
    return res.status(429).json({ 
      error: 'Too many attempts',
      message: `Account temporarily locked. Try again in ${remainingTime} minutes.`
    });
  }
  
  // Reset if lockout period has passed
  if (attempts.lockedUntil && now >= attempts.lockedUntil) {
    attempts.count = 0;
    attempts.firstAttempt = now;
    attempts.lockedUntil = null;
  }
  
  // Reset counter if more than 15 minutes since first attempt
  if (now - attempts.firstAttempt > LOCKOUT_TIME) {
    attempts.count = 0;
    attempts.firstAttempt = now;
  }
  
  // Increment attempt counter
  attempts.count++;
  
  // Lock account if max attempts reached
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_TIME;
    return res.status(429).json({ 
      error: 'Too many attempts',
      message: `Too many failed login attempts. Account locked for ${LOCKOUT_TIME / 1000 / 60} minutes.`
    });
  }
  
  next();
};

/**
 * Input validation middleware
 * PMS-T-105: SQL injection and XSS prevention
 */
export const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};
