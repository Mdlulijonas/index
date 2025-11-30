require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration for Railway
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins in production for Railway
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      // Railway domains
      '.railway.app',
      '.up.railway.app'
    ];
    
    if (!origin || allowedOrigins.some(allowed => origin.includes(allowed))) {
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

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables with Railway-safe defaults
const ADMIN_CODE = process.env.ADMIN_CODE || '212259497';
const JWT_SECRET = process.env.JWT_SECRET || 'railway-production-secret-' + Math.random().toString(36);
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('🚀 Starting DigiHive Server on Railway...');
console.log('📊 Environment:', NODE_ENV);
console.log('🔑 Admin Code:', ADMIN_CODE);

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
    title: 'Welcome to DigiHive on Railway!',
    description: 'Your team collaboration platform is now live on Railway! Create tasks, manage your team, and track progress.',
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

// Serve basic HTML frontend directly
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DigiHive Team Workstation</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #FFC107, #FF8F00);
            color: #5D4037;
            text-align: center;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.95);
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 25px 50px rgba(93, 64, 55, 0.2);
        }
        h1 { font-size: 2.5em; margin-bottom: 20px; color: #5D4037; }
        .status { 
            background: rgba(76, 175, 80, 0.2); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
        }
        .btn {
            padding: 12px 24px;
            background: #FFC107;
            color: #5D4037;
            border: 2px solid #FF8F00;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            margin: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 DigiHive Team Workstation</h1>
        <p>Your production-ready team collaboration platform is running successfully on Railway!</p>
        
        <div class="status">
            <h3>✅ Server Status: Online</h3>
            <p>Environment: <strong>Production</strong></p>
            <p>Port: <strong>${PORT}</strong></p>
        </div>

        <div style="text-align: left; background: #FFFDE7; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>📚 API Endpoints:</h3>
            <p><strong>GET /api/health</strong> - Server health check</p>
            <p><strong>POST /api/auth/register</strong> - Register new user</p>
            <p><strong>POST /api/auth/login</strong> - User login</p>
            <p><strong>GET /api/users</strong> - Get all users</p>
            <p><strong>GET /api/tasks</strong> - Get all tasks</p>
            <p><strong>POST /api/tasks</strong> - Create new task</p>
            <p><strong>GET /api/stats</strong> - Get statistics</p>
        </div>

        <div style="margin-top: 30px;">
            <p><strong>Default Admin Account:</strong></p>
            <p>Username: <strong>admin</strong></p>
            <p>Password: <strong>admin123</strong></p>
            <div style="margin-top: 20px;">
                <button class="btn" onclick="window.location.href='/api/health'">Test API Health</button>
                <button class="btn" onclick="alert('Use Postman or curl to test API endpoints')">Test API Endpoints</button>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

// API Routes
app.post('/api/auth/register', async (req, res) => {
  try {
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
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
      overallProgress: overallProgress + '%'
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
    message: 'DigiHive API is running successfully on Railway!'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ DigiHive Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${NODE_ENV}`);
  console.log(`👤 Default admin: username "admin", password "admin123"`);
  console.log(`🔑 Admin code: ${ADMIN_CODE}`);
  console.log(`🚀 Ready to accept requests!`);
});
