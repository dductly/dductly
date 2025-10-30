import express from 'express';
import supabase from '../lib/supabaseClient';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Email and password are required' 
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      return res.status(400).json({ 
        error: 'Signup Failed',
        message: error.message 
      });
    }

    res.status(201).json({
      message: 'User created successfully. Please check your email for verification.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to create user account' 
    });
  }
});

/**
 * POST /api/auth/signin
 * Sign in with email and password
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Email and password are required' 
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ 
        error: 'Authentication Failed',
        message: error.message 
      });
    }

    res.json({
      message: 'Signed in successfully',
      session: data.session,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to sign in' 
    });
  }
});

/**
 * POST /api/auth/signout
 * Sign out the current user
 */
router.post('/signout', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ 
        error: 'Signout Failed',
        message: error.message 
      });
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to sign out' 
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh the session token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Refresh token is required' 
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({ 
        error: 'Refresh Failed',
        message: error.message 
      });
    }

    res.json({
      message: 'Session refreshed successfully',
      session: data.session
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to refresh session' 
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Request a password reset email
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Email is required' 
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      return res.status(400).json({ 
        error: 'Reset Failed',
        message: error.message 
      });
    }

    res.json({ 
      message: 'Password reset email sent. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to send password reset email' 
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify the current token and return user info
 */
router.get('/verify', authenticateUser, async (req: AuthRequest, res) => {
  try {
    res.json({
      message: 'Token is valid',
      user: req.user
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to verify token' 
    });
  }
});

export default router;




