import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import taskRoutes from './routes/task.js';
dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      'https://user-system-frontend.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://user-task-management-system-frontend.onrender.com/',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Handle preflight requests
app.options('*', cors());

// Root route (no DB required)
app.get('/', (req, res) => {
  res.json({
    message: 'MERN User System API',
    status: 'Server is running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tasks: '/api/tasks',
    },
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
      3: 'disconnecting',
    };
    res.json({
      database: states[dbState] || 'unknown',
      mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({ database: 'error', error: error.message });
  }
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API routes are working' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV,
    mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
  });
});

// Inline auth routes for testing
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check database connection
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState !== 1) {
      console.log('Database not connected, attempting to connect...');
      await connectDB();
    }

    // Import User model dynamically
    const { default: User } = await import('./models/user.js');
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');

    console.log('Finding user...');
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'User does not exist' });
    }

    console.log('Comparing password...');
    const isMatch = await bcrypt.default.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Generating tokens...');
    const accessToken = jwt.default.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.default.sign(
      { id: user._id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('Login successful');
    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message,
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check database connection
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState !== 1) {
      console.log('Database not connected, attempting to connect...');
      await connectDB();
    }

    // Import User model dynamically
    const { default: User } = await import('./models/user.js');
    const bcrypt = await import('bcryptjs');

    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    console.log('Creating user...');
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    console.log('Saving user...');
    await user.save();
    console.log('User saved successfully');

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: error.message,
      details: error.name,
    });
  }
});

app.post('/api/auth/refresh', (req, res) => {
  res.json({ message: 'Refresh endpoint working' });
});

// Original routes (commented out for testing)
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/tasks', taskRoutes);

console.log('Inline auth routes loaded');

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export for Vercel (if needed)
export default app;
