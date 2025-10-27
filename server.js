import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser'; 
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import taskRoutes from './routes/task.js';
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        'https://user-system-frontend.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Root route (no DB required)
app.get('/', (req, res) => {
  res.json({ 
    message: 'MERN User System API', 
    status: 'Server is running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users', 
      tasks: '/api/tasks'
    }
  });
});

// Initialize database connection
try {
  connectDB();
} catch (error) {
  console.error('Database connection failed:', error);
}

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Database status route
app.get('/db-status', async (req, res) => {
  try {
    const mongoose = await import('mongoose');
    const dbState = mongoose.default.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    res.json({ 
      database: states[dbState] || 'unknown',
      mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ database: 'error', error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export for Vercel
export default app;