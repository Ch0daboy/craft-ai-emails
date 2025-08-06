import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  getProfile, 
  checkAuth 
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { registerSchema, loginSchema } from '../utils/validation';

const router = Router();

// POST /api/auth/register - User registration
router.post('/register', validateRequest(registerSchema), register);

// POST /api/auth/login - User login
router.post('/login', validateRequest(loginSchema), login);

// POST /api/auth/logout - User logout
router.post('/logout', authenticateToken, logout);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', refreshToken);

// GET /api/auth/profile - Get current user profile
router.get('/profile', authenticateToken, getProfile);

// GET /api/auth/check - Check authentication status
router.get('/check', authenticateToken, checkAuth);

export default router;