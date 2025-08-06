import { Router } from 'express';
import {
  generateTemplate,
  saveTemplate,
  getUserTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  toggleFavorite,
} from '../controllers/templateController';
import { authenticateToken, checkTokenLimit, userRateLimit } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { generateTemplateSchema, saveTemplateSchema } from '../utils/validation';

const router = Router();

// All template routes require authentication
router.use(authenticateToken);

// POST /api/templates/generate - Generate AI template (rate limited)
router.post(
  '/generate',
  userRateLimit(5, 60000), // 5 requests per minute
  checkTokenLimit(50), // Require 50 tokens
  validateRequest(generateTemplateSchema),
  generateTemplate
);

// GET /api/templates - Get user templates with filtering/pagination
router.get('/', getUserTemplates);

// POST /api/templates - Save template to database
router.post('/', validateRequest(saveTemplateSchema), saveTemplate);

// GET /api/templates/:id - Get specific template
router.get('/:id', getTemplate);

// PUT /api/templates/:id - Update template
router.put('/:id', validateRequest(saveTemplateSchema), updateTemplate);

// DELETE /api/templates/:id - Delete (archive) template
router.delete('/:id', deleteTemplate);

// PUT /api/templates/:id/favorite - Toggle favorite status
router.put('/:id/favorite', toggleFavorite);

export default router;