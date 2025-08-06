import { Request, Response, NextFunction } from 'express';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  validatePasswordStrength,
  validateEmail
} from '../utils/auth';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import prisma from '../config/database';

// User registration
export const register = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate email format
    if (!validateEmail(email)) {
      throw createError(400, 'Invalid email format');
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw createError(400, passwordValidation.errors.join('; '));
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (existingUser) {
      throw createError(409, 'User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        subscriptionTier: 'free',
        tokensUsed: 0,
        tokenLimit: 100, // Free tier limit
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        tokensUsed: true,
        tokenLimit: true,
        createdAt: true,
      },
    });
    
    // Create default user preferences
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        theme: 'light',
        defaultEmailType: 'newsletter',
        autoSave: true,
        preferredModel: 'claude',
        creativity: 0.7,
      },
    });
    
    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    });
    
    const refreshToken = generateRefreshToken(user.id);
    
    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: '7d',
      },
    });
  } catch (error) {
    next(error);
  }
};

// User login
export const login = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        tokensUsed: true,
        tokenLimit: true,
        isActive: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      throw createError(401, 'Invalid email or password');
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Failed login attempt', {
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      throw createError(401, 'Invalid email or password');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    
    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    });
    
    const refreshToken = generateRefreshToken(user.id);
    
    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: '7d',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token
export const refreshToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw createError(400, 'Refresh token is required');
    }
    
    // Verify refresh token
    const { userId } = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        isActive: true,
      },
    });
    
    if (!user) {
      throw createError(401, 'Invalid refresh token');
    }
    
    // Generate new access token
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    });
    
    logger.info('Access token refreshed', {
      userId: user.id,
      email: user.email,
    });
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        expiresIn: '7d',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout (optional - mainly for logging)
export const logout = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      logger.info('User logged out', {
        userId: req.user.id,
        email: req.user.email,
      });
    }
    
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getProfile = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        tokensUsed: true,
        tokenLimit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        userPreferences: {
          select: {
            theme: true,
            defaultEmailType: true,
            autoSave: true,
            preferredModel: true,
            creativity: true,
            defaultFromName: true,
            defaultFromEmail: true,
            defaultSubject: true,
          },
        },
      },
    });
    
    if (!user) {
      throw createError(404, 'User not found');
    }
    
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Check authentication status
export const checkAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Not authenticated');
    }
    
    res.json({
      success: true,
      data: {
        isAuthenticated: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          subscriptionTier: req.user.subscriptionTier,
          tokensUsed: req.user.tokensUsed,
          tokenLimit: req.user.tokenLimit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};