import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/auth';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';
import prisma from '../config/database';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        subscriptionTier: string;
        tokensUsed: number;
        tokenLimit: number;
        isActive: boolean;
      };
    }
  }
}

// Authentication middleware
export const authenticateToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      throw createError(401, 'Access token required');
    }
    
    // Verify and decode the token
    const decoded: JWTPayload = verifyToken(token);
    
    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true, // Only active users
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        tokensUsed: true,
        tokenLimit: true,
        isActive: true,
        lastLogin: true,
      },
    });
    
    if (!user) {
      throw createError(401, 'User not found or inactive');
    }
    
    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    
    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      tokensUsed: user.tokensUsed,
      tokenLimit: user.tokenLimit,
      isActive: user.isActive,
    };
    
    logger.debug('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    });
    
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        next(createError(401, error.message));
      } else {
        logger.error('Authentication error:', error);
        next(createError(401, 'Authentication failed'));
      }
    } else {
      next(createError(500, 'Internal server error'));
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // Continue without user
    }
    
    const decoded: JWTPayload = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        tokensUsed: true,
        tokenLimit: true,
        isActive: true,
      },
    });
    
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        tokensUsed: user.tokensUsed,
        tokenLimit: user.tokenLimit,
        isActive: user.isActive,
      };
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

// Role-based authorization middleware
export const requireSubscription = (
  allowedTiers: string[]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError(401, 'Authentication required'));
      return;
    }
    
    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      next(createError(403, `This feature requires ${allowedTiers.join(' or ')} subscription`));
      return;
    }
    
    next();
  };
};

// Token usage limit middleware
export const checkTokenLimit = (
  tokensNeeded: number = 1
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError(401, 'Authentication required'));
      return;
    }
    
    const remainingTokens = req.user.tokenLimit - req.user.tokensUsed;
    
    if (remainingTokens < tokensNeeded) {
      next(createError(429, `Insufficient tokens. You need ${tokensNeeded} tokens but have ${remainingTokens} remaining.`));
      return;
    }
    
    next();
  };
};

// Admin only middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(createError(401, 'Authentication required'));
    return;
  }
  
  if (req.user.subscriptionTier !== 'admin') {
    next(createError(403, 'Admin access required'));
    return;
  }
  
  next();
};

// Rate limiting per user
export const userRateLimit = (
  maxRequests: number,
  windowMs: number = 60000 // 1 minute
) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError(401, 'Authentication required'));
      return;
    }
    
    const now = Date.now();
    const userId = req.user.id;
    const userLimit = requestCounts.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize counter
      requestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }
    
    if (userLimit.count >= maxRequests) {
      const resetIn = Math.ceil((userLimit.resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        resetIn,
      });
      return;
    }
    
    userLimit.count++;
    next();
  };
};