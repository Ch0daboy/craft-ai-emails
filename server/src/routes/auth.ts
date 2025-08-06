import { Router } from 'express';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  res.status(501).json({
    message: 'Registration endpoint - Coming soon',
    endpoint: 'POST /api/auth/register',
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.status(501).json({
    message: 'Login endpoint - Coming soon',
    endpoint: 'POST /api/auth/login',
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.status(501).json({
    message: 'Logout endpoint - Coming soon',
    endpoint: 'POST /api/auth/logout',
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  res.status(501).json({
    message: 'Token refresh endpoint - Coming soon',
    endpoint: 'POST /api/auth/refresh',
  });
});

export default router;