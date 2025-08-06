import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

// Password hashing configuration
const SALT_ROUNDS = 12;

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Password hashing failed:', error);
    throw new Error('Password hashing failed');
  }
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Password comparison failed:', error);
    return false;
  }
};

// JWT utilities
export interface JWTPayload {
  userId: string;
  email: string;
  subscriptionTier: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'emailcraft-ai',
      audience: 'emailcraft-users',
    });
  } catch (error) {
    logger.error('Token generation failed:', error);
    throw new Error('Token generation failed');
  }
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'emailcraft-ai',
      audience: 'emailcraft-users',
    }) as JWTPayload;
    
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      logger.error('Token verification failed:', error);
      throw new Error('Token verification failed');
    }
  }
};

export const generateRefreshToken = (userId: string): string => {
  try {
    return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
      expiresIn: '30d',
      issuer: 'emailcraft-ai',
      audience: 'emailcraft-refresh',
    });
  } catch (error) {
    logger.error('Refresh token generation failed:', error);
    throw new Error('Refresh token generation failed');
  }
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'emailcraft-ai',
      audience: 'emailcraft-refresh',
    }) as { userId: string; type: string };
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return { userId: payload.userId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      logger.error('Refresh token verification failed:', error);
      throw new Error('Refresh token verification failed');
    }
  }
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', 'Password', 'PASSWORD', '12345678', 'password123',
    'admin', 'user', 'guest', 'test', 'demo', 'welcome', 'login'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more secure password');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Generate secure random token for password reset, etc.
export const generateSecureToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
};