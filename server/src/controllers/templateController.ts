import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import { aiService } from '../services/aiService';
import { validateAwsCredentials } from '../config/aws';

// Generate AI email template
export const generateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    // Check if AWS credentials are configured
    if (!validateAwsCredentials()) {
      throw createError(503, 'AI service is temporarily unavailable. Please try again later.');
    }

    const {
      prompt,
      emailType,
      industry,
      brandColors,
      fromName,
      fromEmail,
      model,
      creativity,
      includeImages,
      responsive,
    } = req.body;

    // Check token limits
    const tokensNeeded = 50; // Estimated tokens for a generation
    const tokensRemaining = req.user.tokenLimit - req.user.tokensUsed;
    
    if (tokensRemaining < tokensNeeded) {
      throw createError(429, `Insufficient tokens. You need ${tokensNeeded} tokens but have ${tokensRemaining} remaining.`);
    }

    // Get user preferences to provide defaults
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user.id },
    });

    // Prepare AI generation options
    const aiOptions = {
      prompt,
      emailType: emailType || userPreferences?.defaultEmailType || 'newsletter',
      industry,
      brandColors,
      fromName: fromName || userPreferences?.defaultFromName,
      fromEmail: fromEmail || userPreferences?.defaultFromEmail,
      model,
      creativity: creativity !== undefined ? creativity : userPreferences?.creativity || 0.7,
      includeImages: includeImages !== undefined ? includeImages : true,
      responsive: responsive !== undefined ? responsive : true,
    };

    logger.info('Starting AI template generation', {
      userId: req.user.id,
      email: req.user.email,
      emailType: aiOptions.emailType,
      promptLength: prompt.length,
      model: model || 'default',
    });

    // Generate template using AI service
    const generatedTemplate = await aiService.generateEmailTemplate(aiOptions);

    // Update user token usage
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        tokensUsed: {
          increment: generatedTemplate.tokensUsed.total,
        },
      },
    });

    logger.info('AI template generated successfully', {
      userId: req.user.id,
      tokensUsed: generatedTemplate.tokensUsed.total,
      generationTime: generatedTemplate.generationTime,
      cost: generatedTemplate.cost,
    });

    // Return generated template (without saving to database yet)
    res.json({
      success: true,
      message: 'Template generated successfully',
      data: {
        template: {
          htmlContent: generatedTemplate.html,
          subject: generatedTemplate.subject,
          previewText: generatedTemplate.previewText,
          prompt,
          templateType: aiOptions.emailType,
          industry,
        },
        generation: {
          tokensUsed: generatedTemplate.tokensUsed,
          model: generatedTemplate.model,
          generationTime: generatedTemplate.generationTime,
          cost: generatedTemplate.cost,
        },
        user: {
          tokensRemaining: tokensRemaining - generatedTemplate.tokensUsed.total,
          tokensUsed: req.user.tokensUsed + generatedTemplate.tokensUsed.total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Save template to database
export const saveTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const {
      title,
      description,
      htmlContent,
      subject,
      previewText,
      templateType,
      industry,
      tags,
      prompt,
      aiModel,
      tokensUsed,
    } = req.body;

    // Create template record
    const template = await prisma.template.create({
      data: {
        userId: req.user.id,
        title,
        description,
        htmlContent,
        subject,
        previewText,
        templateType: templateType || 'newsletter',
        industry,
        prompt: prompt || '',
        aiModel: aiModel || 'claude',
        tokensUsed: tokensUsed || 0,
        isResponsive: true,
        compatibilityScore: 0.95, // Default high score, can be calculated later
      },
    });

    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagRecords = tags.map((tagName: string) => ({
        templateId: template.id,
        tagName: tagName.trim().toLowerCase(),
      }));

      await prisma.templateTags.createMany({
        data: tagRecords,
        skipDuplicates: true,
      });
    }

    // Create initial template version
    await prisma.templateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        htmlContent,
        subject,
        previewText,
        changeLog: 'Initial version',
        isActive: true,
      },
    });

    logger.info('Template saved successfully', {
      templateId: template.id,
      userId: req.user.id,
      title,
      templateType,
    });

    // Return saved template with tags
    const savedTemplate = await prisma.template.findUnique({
      where: { id: template.id },
      include: {
        tags: {
          select: { tagName: true },
        },
        versions: {
          where: { isActive: true },
          select: { version: true, createdAt: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Template saved successfully',
      data: { template: savedTemplate },
    });
  } catch (error) {
    next(error);
  }
};

// Get user templates
export const getUserTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const {
      page = 1,
      limit = 10,
      templateType,
      industry,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      userId: req.user.id,
      isArchived: false,
    };

    if (templateType) {
      where.templateType = templateType;
    }

    if (industry) {
      where.industry = industry;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get templates with pagination
    const [templates, totalCount] = await Promise.all([
      prisma.template.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          subject: true,
          previewText: true,
          templateType: true,
          industry: true,
          isPublic: true,
          isFavorite: true,
          usageCount: true,
          compatibilityScore: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            select: { tagName: true },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip: offset,
        take: limitNum,
      }),
      prisma.template.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get template by ID
export const getTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.user.id, // Ensure user owns the template
      },
      include: {
        tags: {
          select: { tagName: true },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5, // Get last 5 versions
        },
        exports: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Get last 10 exports
        },
      },
    });

    if (!template) {
      throw createError(404, 'Template not found');
    }

    // Update usage count
    await prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    res.json({
      success: true,
      data: { template },
    });
  } catch (error) {
    next(error);
  }
};

// Update template
export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const { id } = req.params;
    const {
      title,
      description,
      htmlContent,
      subject,
      previewText,
      templateType,
      industry,
      isFavorite,
      tags,
      changeLog,
    } = req.body;

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        versions: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!existingTemplate) {
      throw createError(404, 'Template not found');
    }

    // Update template
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        title,
        description,
        htmlContent,
        subject,
        previewText,
        templateType,
        industry,
        isFavorite,
        updatedAt: new Date(),
      },
    });

    // Create new version if HTML content changed
    if (htmlContent && htmlContent !== existingTemplate.htmlContent) {
      const currentVersion = existingTemplate.versions[0]?.version || 0;
      
      // Mark current version as inactive
      if (existingTemplate.versions[0]) {
        await prisma.templateVersion.update({
          where: { id: existingTemplate.versions[0].id },
          data: { isActive: false },
        });
      }

      // Create new version
      await prisma.templateVersion.create({
        data: {
          templateId: id as string,
          version: currentVersion + 1,
          htmlContent: htmlContent as string,
          subject: subject as string,
          previewText: previewText as string,
          changeLog: changeLog || `Version ${currentVersion + 1}`,
          isActive: true,
        },
      });
    }

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Delete existing tags
      await prisma.templateTags.deleteMany({
        where: { templateId: id },
      });

      // Add new tags
      if (tags.length > 0) {
        const tagRecords = tags.map((tagName: string) => ({
          templateId: id as string,
          tagName: tagName.trim().toLowerCase(),
        }));

        await prisma.templateTags.createMany({
          data: tagRecords,
        });
      }
    }

    logger.info('Template updated successfully', {
      templateId: id,
      userId: req.user.id,
      title,
    });

    // Return updated template with tags
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        tags: {
          select: { tagName: true },
        },
        versions: {
          where: { isActive: true },
          select: { version: true, createdAt: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: { template },
    });
  } catch (error) {
    next(error);
  }
};

// Delete template
export const deleteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const { id } = req.params;

    // Check if template exists and belongs to user
    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!template) {
      throw createError(404, 'Template not found');
    }

    // Soft delete - mark as archived instead of actual deletion
    await prisma.template.update({
      where: { id },
      data: {
        isArchived: true,
        updatedAt: new Date(),
      },
    });

    logger.info('Template deleted (archived)', {
      templateId: id,
      userId: req.user.id,
      title: template.title,
    });

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Toggle favorite status
export const toggleFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError(401, 'Authentication required');
    }

    const { id } = req.params;

    // Check if template exists and belongs to user
    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!template) {
      throw createError(404, 'Template not found');
    }

    // Toggle favorite status
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        isFavorite: !template.isFavorite,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        isFavorite: true,
      },
    });

    res.json({
      success: true,
      message: `Template ${updatedTemplate.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: { template: updatedTemplate },
    });
  } catch (error) {
    next(error);
  }
};