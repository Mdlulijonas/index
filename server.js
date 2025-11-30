require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// CORS configuration for production
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      // Add your production domain here
      process.env.PRODUCTION_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables with defaults
const ADMIN_CODE = process.env.ADMIN_CODE || '212259497';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production-' + Date.now();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize users with pre-hashed password for 'admin'
const initialUsers = [
  {
    id: '1',
    username: 'admin',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/eoGM3X7d3Z4d8B4Vu', // password: admin123
    team: 'Administrator',
    isOnline: false,
    lastLogin: null,
    createdAt: new Date().toISOString()
  }
];

let users = [...initialUsers];
let tasks = [
  {
    id: '1',
    title: 'Welcome to DigiHive',
    description: 'Get started with your team collaboration platform. Create tasks, manage your team, and track progress.',
    team: 'Development',
    priority: 'Medium',
    status: 'in-progress',
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Setup Your Team',
    description: 'Add your team members and assign them to different departments',
    team: 'Administrator',
    priority: 'High',
    status: 'todo',
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
let timeEntries = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Serve static files in production
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Serve frontend for all other routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
} else {
  // Development route
  app.get('/', (req, res) => {
    res.json({ 
      message: 'DigiHive API Server',
      version: '1.0.0',
      environment: NODE_ENV,
      endpoints: {
        auth: '/api/auth',
        tasks: '/api/tasks',
        users: '/api/users',
        health: '/api/health'
      },
      documentation: 'See /api/health for more info'
    });
  });
}

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { ...req.body, password: '***' });
    
    const { username, password, team, adminCode } = req.body;

    // Validation
    if (!username || !password || !team) {
      return res.status(400).json({ error: 'Username, password, and team are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify admin code for administrator registration
    if (team === 'Administrator') {
      if (!adminCode || adminCode !== ADMIN_CODE) {
        return res.status(403).json({ error: 'Valid admin code required for administrator registration' });
      }
    }

    // Check if user exists
    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      team,
      isOnline: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    users.push(user);
    console.log('User registered successfully:', username);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        team: user.team 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', { ...req.body, password: '***' });
    
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update user status
    user.isOnline = true;
    user.lastLogin = new Date().toISOString();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        team: user.team 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    console.log('Login successful for user:', username);

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User routes
app.get('/api/users', authenticateToken, (req, res) => {
  try {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Task routes
app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { limit, team } = req.query;
    let filteredTasks = tasks;

    if (team) {
      filteredTasks = filteredTasks.filter(task => task.team === team);
    }

    if (limit) {
      filteredTasks = filteredTasks.slice(0, parseInt(limit));
    }

    res.json(filteredTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, team, priority } = req.body;

    if (!title || !description || !team) {
      return res.status(400).json({ error: 'Title, description, and team are required' });
    }

    const task = {
      id: uuidv4(),
      title,
      description,
      team,
      priority: priority || 'Medium',
      status: 'todo',
      createdBy: req.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.push(task);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stats routes
app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const stats = {
      totalTasks,
      completedTasks,
      totalUsers: users.length,
      onlineUsers: users.filter(u => u.isOnline).length,
      overallProgress: `${overallProgress}%`
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV,
    totalUsers: users.length,
    totalTasks: tasks.length,
    endpoints: {
      'POST /api/auth/register': 'Register new user',
      'POST /api/auth/login': 'User login',
      'GET /api/tasks': 'Get tasks (requires auth)',
      'POST /api/tasks': 'Create task (requires auth)',
      'GET /api/users': 'Get users (requires auth)',
      'GET /api/stats': 'Get statistics (requires auth)'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DigiHive server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`👤 Default admin credentials: username: "admin", password: "admin123"`);
  console.log(`🔑 Admin code: ${ADMIN_CODE}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏠 Frontend: http://localhost:${PORT}/`);
});
