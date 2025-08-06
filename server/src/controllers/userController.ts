import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import { validatePasswordStrength, hashPassword, comparePassword } from '../utils/auth';

// Update user profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const { firstName, lastName } = req.body;
    const userId = req.user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        tokensUsed: true,
        tokenLimit: true,
        updatedAt: true,
      },
    });

    logger.info('User profile updated', {
      userId,
      email: req.user.email,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// Get user preferences
export const getPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user.id },
      select: {
        theme: true,
        defaultEmailType: true,
        autoSave: true,
        preferredModel: true,
        creativity: true,
        defaultFromName: true,
        defaultFromEmail: true,
        defaultSubject: true,
        updatedAt: true,
      },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      const newPreferences = await prisma.userPreferences.create({
        data: {
          userId: req.user.id,
          theme: 'light',
          defaultEmailType: 'newsletter',
          autoSave: true,
          preferredModel: 'claude',
          creativity: 0.7,
        },
        select: {
          theme: true,
          defaultEmailType: true,
          autoSave: true,
          preferredModel: true,
          creativity: true,
          defaultFromName: true,
          defaultFromEmail: true,
          defaultSubject: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: { preferences: newPreferences },
      });
      return;
    }

    res.json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    next(error);
  }
};

// Update user preferences
export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const {
      theme,
      defaultEmailType,
      autoSave,
      preferredModel,
      creativity,
      defaultFromName,
      defaultFromEmail,
      defaultSubject,
    } = req.body;

    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId: req.user.id },
      update: {
        theme,
        defaultEmailType,
        autoSave,
        preferredModel,
        creativity,
        defaultFromName,
        defaultFromEmail,
        defaultSubject,
        updatedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        theme: theme || 'light',
        defaultEmailType: defaultEmailType || 'newsletter',
        autoSave: autoSave !== undefined ? autoSave : true,
        preferredModel: preferredModel || 'claude',
        creativity: creativity !== undefined ? creativity : 0.7,
        defaultFromName,
        defaultFromEmail,
        defaultSubject,
      },
      select: {
        theme: true,
        defaultEmailType: true,
        autoSave: true,
        preferredModel: true,
        creativity: true,
        defaultFromName: true,
        defaultFromEmail: true,
        defaultSubject: true,
        updatedAt: true,
      },
    });

    logger.info('User preferences updated', {
      userId: req.user.id,
      email: req.user.email,
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: updatedPreferences },
    });
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createError(400, 'Current password and new password are required');
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      throw createError(404, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw createError(400, 'Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw createError(400, passwordValidation.errors.join('; '));
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    logger.info('User password changed', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    // Get user template statistics
    const templateStats = await prisma.template.groupBy({
      by: ['templateType'],
      where: { userId: req.user.id },
      _count: { id: true },
    });

    const totalTemplates = await prisma.template.count({
      where: { userId: req.user.id },
    });

    const favoriteTemplates = await prisma.template.count({
      where: {
        userId: req.user.id,
        isFavorite: true,
      },
    });

    const recentTemplates = await prisma.template.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        title: true,
        templateType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Calculate tokens remaining
    const tokensRemaining = req.user.tokenLimit - req.user.tokensUsed;

    const stats = {
      totalTemplates,
      favoriteTemplates,
      tokensUsed: req.user.tokensUsed,
      tokensRemaining,
      tokenLimit: req.user.tokenLimit,
      subscriptionTier: req.user.subscriptionTier,
      templatesByType: templateStats.reduce((acc, stat) => {
        acc[stat.templateType] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentTemplates,
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user account
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const { password } = req.body;

    if (!password) {
      throw createError(400, 'Password confirmation is required to delete account');
    }

    // Get user with password for verification
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      throw createError(404, 'User not found');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw createError(400, 'Password is incorrect');
    }

    // Soft delete by marking user as inactive
    // In production, you might want to actually delete data or anonymize it
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`, // Ensure email uniqueness
        firstName: null,
        lastName: null,
        updatedAt: new Date(),
      },
    });

    logger.warn('User account deleted', {
      userId: user.id,
      email: user.email,
      deletedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};