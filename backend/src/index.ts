import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import supabase from './lib/supabaseClient';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public endpoint to get user count (for subscription counter)
// This endpoint is accessible to anonymous/logged-out users
// Uses database function approach (recommended by Supabase)
app.get('/api/user-count', async (req, res) => {
  try {
    // Use database function - works with anon key, no service role key needed
    // This is the recommended Supabase approach using SECURITY DEFINER
    const { data: functionCount, error: functionError } = await supabase
      .rpc('get_user_count');

    if (functionError) {
      console.error('Error fetching user count from database:', {
        message: functionError.message,
        code: functionError.code,
        details: functionError.details,
        hint: functionError.hint
      });
      
      // If function doesn't exist, provide helpful error message
      if (functionError.code === '42883' || functionError.message?.includes('does not exist')) {
        return res.status(500).json({ 
          error: 'Database Function Missing',
          message: 'The get_user_count() database function does not exist. Please run the SQL in create-user-count-function.sql in your Supabase SQL Editor.',
          details: functionError.message
        });
      }
      
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch user count from database.',
        details: functionError.message
      });
    }

    const count = functionCount || 0;
    console.log('User count retrieved successfully:', count);
    res.json({ count });
  } catch (error: any) {
    console.error('Error in user count endpoint:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch user count',
      details: error?.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;




