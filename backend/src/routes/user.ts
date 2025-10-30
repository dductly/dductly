import express from 'express';
import supabase, { supabaseAdmin } from '../lib/supabaseClient';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All user routes require authentication
router.use(authenticateUser);

/**
 * GET /api/user/profile
 * Get the current user's profile
 */
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User ID not found' 
      });
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    // Get user from Supabase auth (for email and other auth info)
    let authUser = null;
    if (supabaseAdmin) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!authError && user) {
        authUser = user;
      }
    }

    // If no profile and no auth user, user doesn't exist
    if (!profile && !authUser) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'User not found' 
      });
    }

    res.json({
      user: {
        id: userId,
        email: profile?.email || authUser?.email || req.user?.email,
        first_name: profile?.first_name || authUser?.user_metadata?.first_name || '',
        last_name: profile?.last_name || authUser?.user_metadata?.last_name || '',
        created_at: profile?.created_at || authUser?.created_at,
        updated_at: profile?.updated_at || authUser?.updated_at
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch user profile' 
    });
  }
});

/**
 * PUT /api/user/profile
 * Update the current user's profile
 */
router.put('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User ID not found' 
      });
    }

    // Update profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      return res.status(400).json({ 
        error: 'Update Failed',
        message: profileError.message 
      });
    }

    // Also update user_metadata in auth (for consistency)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    });

    if (authError) {
      console.warn('Auth metadata update warning:', authError.message);
      // Don't fail the request if metadata update fails
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: profileData.id,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        updated_at: profileData.updated_at
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update profile' 
    });
  }
});

/**
 * POST /api/user/change-password
 * Change the current user's password
 */
router.post('/change-password', async (req: AuthRequest, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'New password is required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Password must be at least 6 characters' 
      });
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ 
        error: 'Update Failed',
        message: error.message 
      });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to change password' 
    });
  }
});

/**
 * DELETE /api/user/account
 * Delete the current user's account
 */
router.delete('/account', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User ID not found' 
      });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: 'Configuration Error',
        message: 'Admin operations not available. Please set SUPABASE_SERVICE_ROLE_KEY in your .env file.' 
      });
    }

    // Delete profile first (cascade will handle this, but explicit is clearer)
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // Delete user from auth (requires admin privileges)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return res.status(400).json({ 
        error: 'Delete Failed',
        message: error.message 
      });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete account' 
    });
  }
});

export default router;



