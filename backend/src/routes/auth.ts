import express from 'express';
import { supabase } from '../lib/supabaseClient';
import { SignupRequest, LoginRequest, AuthResponse } from '../types/auth';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name }: SignupRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      } as AuthResponse);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || ''
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      } as AuthResponse);
    }

    if (data.user) {
      return res.status(201).json({
        success: true,
        message: 'User created successfully. Please check your email to confirm your account.',
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name
        }
      } as AuthResponse);
    }

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as AuthResponse);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      } as AuthResponse);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      } as AuthResponse);
    }

    if (data.user && data.session) {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name
        },
        token: data.session.access_token
      } as AuthResponse);
    }

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as AuthResponse);
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      } as AuthResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    } as AuthResponse);

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as AuthResponse);
  }
});

export default router;