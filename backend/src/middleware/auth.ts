import { Request, Response, NextFunction } from 'express';
import supabase from '../lib/supabaseClient';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    user_metadata?: any;
  };
}

/**
 * Middleware to verify Supabase JWT token
 * Expects Authorization header with Bearer token
 */
export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      user_metadata: user.user_metadata
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication failed' 
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for routes that work for both authenticated and unauthenticated users
 */
/**
 * JWT auth OR pending signup (email confirmation: user exists but no session yet).
 * Body: `email` + `supabaseUserId` when not using Bearer; verified with admin API.
 */
export const authenticateUserOrPendingSignup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          user_metadata: user.user_metadata,
        };
        return next();
      }
    }

    const body = req.body as { email?: string; supabaseUserId?: string };
    const email = body.email?.trim();
    const supabaseUserId = body.supabaseUserId?.trim();

    if (email && supabaseUserId) {
      const { data, error: adminError } = await supabase.auth.admin.getUserById(supabaseUserId);

      if (adminError || !data.user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid signup session",
        });
      }

      if (data.user.email?.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Email does not match this account",
        });
      }

      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        user_metadata: data.user.user_metadata,
      };
      return next();
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid authorization",
    });
  } catch (error) {
    console.error("authenticateUserOrPendingSignup error:", error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed",
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          user_metadata: user.user_metadata
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};




