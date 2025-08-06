import Joi from 'joi';

// User registration validation schema
export const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(254)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email address is too long',
      'any.required': 'Email address is required',
    }),
    
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
    
  firstName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'First name must not be empty',
      'string.max': 'First name must not exceed 50 characters',
    }),
    
  lastName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'Last name must not be empty',
      'string.max': 'Last name must not exceed 50 characters',
    }),
});

// User login validation schema
export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email address is required',
    }),
    
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

// Profile update validation schema
export const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'First name must not be empty',
      'string.max': 'First name must not exceed 50 characters',
    }),
    
  lastName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'Last name must not be empty',
      'string.max': 'Last name must not exceed 50 characters',
    }),
});

// Template generation validation schema
export const generateTemplateSchema = Joi.object({
  prompt: Joi.string()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Prompt must be at least 10 characters long',
      'string.max': 'Prompt must not exceed 2000 characters',
      'any.required': 'Prompt is required',
    }),
    
  emailType: Joi.string()
    .valid('newsletter', 'promotional', 'transactional', 'announcement')
    .optional()
    .messages({
      'any.only': 'Email type must be one of: newsletter, promotional, transactional, announcement',
    }),
    
  industry: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Industry must not exceed 100 characters',
    }),
    
  brandColors: Joi.array()
    .items(Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/))
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum of 5 brand colors allowed',
      'string.pattern.base': 'Brand colors must be valid hex codes (e.g., #FF0000)',
    }),
    
  fromName: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'From name must not exceed 100 characters',
    }),
    
  fromEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .optional()
    .messages({
      'string.email': 'From email must be a valid email address',
    }),
    
  model: Joi.string()
    .valid('CLAUDE_3_5_SONNET', 'CLAUDE_3_HAIKU', 'CLAUDE_3_OPUS')
    .optional()
    .messages({
      'any.only': 'Model must be one of: CLAUDE_3_5_SONNET, CLAUDE_3_HAIKU, CLAUDE_3_OPUS',
    }),
    
  creativity: Joi.number()
    .min(0)
    .max(1)
    .optional()
    .messages({
      'number.min': 'Creativity must be between 0 and 1',
      'number.max': 'Creativity must be between 0 and 1',
    }),
    
  includeImages: Joi.boolean().optional(),
  responsive: Joi.boolean().optional(),
});

// Template save validation schema
export const saveTemplateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Template title is required',
      'string.max': 'Template title must not exceed 200 characters',
      'any.required': 'Template title is required',
    }),
    
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Template description must not exceed 1000 characters',
    }),
    
  htmlContent: Joi.string()
    .required()
    .messages({
      'any.required': 'HTML content is required',
    }),
    
  subject: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Subject must not exceed 200 characters',
    }),
    
  previewText: Joi.string()
    .max(300)
    .optional()
    .messages({
      'string.max': 'Preview text must not exceed 300 characters',
    }),
    
  templateType: Joi.string()
    .valid('newsletter', 'promotional', 'transactional', 'announcement')
    .optional()
    .messages({
      'any.only': 'Template type must be one of: newsletter, promotional, transactional, announcement',
    }),
    
  industry: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Industry must not exceed 100 characters',
    }),
    
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum of 10 tags allowed',
      'string.max': 'Each tag must not exceed 50 characters',
    }),
});

// User preferences validation schema
export const updatePreferencesSchema = Joi.object({
  theme: Joi.string()
    .valid('light', 'dark')
    .optional()
    .messages({
      'any.only': 'Theme must be either light or dark',
    }),
    
  defaultEmailType: Joi.string()
    .valid('newsletter', 'promotional', 'transactional', 'announcement')
    .optional()
    .messages({
      'any.only': 'Default email type must be one of: newsletter, promotional, transactional, announcement',
    }),
    
  autoSave: Joi.boolean().optional(),
  
  preferredModel: Joi.string()
    .valid('claude', 'gpt-4')
    .optional()
    .messages({
      'any.only': 'Preferred model must be either claude or gpt-4',
    }),
    
  creativity: Joi.number()
    .min(0)
    .max(1)
    .optional()
    .messages({
      'number.min': 'Creativity must be between 0 and 1',
      'number.max': 'Creativity must be between 0 and 1',
    }),
    
  defaultFromName: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Default from name must not exceed 100 characters',
    }),
    
  defaultFromEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .optional()
    .messages({
      'string.email': 'Default from email must be a valid email address',
    }),
    
  defaultSubject: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Default subject must not exceed 200 characters',
    }),
});

// Request validation middleware
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join('; ');
        
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessage,
        fields: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }
    
    req.body = value;
    next();
  };
};