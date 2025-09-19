import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.get('/profile', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    user: req.user
  });
});

export default router;