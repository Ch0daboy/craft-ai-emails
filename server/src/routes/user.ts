import { Router } from 'express';
import {
  updateProfile,
  getPreferences,
  updatePreferences,
  changePassword,
  getUserStats,
  deleteAccount,
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { updateProfileSchema, updatePreferencesSchema } from '../utils/validation';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// PUT /api/users/profile - Update user profile
router.put('/profile', validateRequest(updateProfileSchema), updateProfile);

// GET /api/users/preferences - Get user preferences
router.get('/preferences', getPreferences);

// PUT /api/users/preferences - Update user preferences
router.put('/preferences', validateRequest(updatePreferencesSchema), updatePreferences);

// PUT /api/users/password - Change password
router.put('/password', changePassword);

// GET /api/users/stats - Get user statistics
router.get('/stats', getUserStats);

// DELETE /api/users/account - Delete user account
router.delete('/account', deleteAccount);

export default router;