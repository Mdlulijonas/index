require('dotenv').config();
const express = require('express');
const axios = require('axios');
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
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables
const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const ADMIN_CODE = process.env.ADMIN_CODE || '212259497';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-change-in-production';
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// In-memory storage (replace with database in production)
let users = [
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

let tasks = [
  {
    id: '1',
    title: 'Welcome to DigiHive',
    description: 'Get started with your team collaboration platform',
    team: 'Development',
    priority: 'Medium',
    status: 'in-progress',
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

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.team !== 'Administrator') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Monday.com API service
class MondayService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.monday.com/v2';
    this.headers = {
      'Authorization': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  async makeGraphQLQuery(query, variables = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Monday.com API key not configured');
      }

      const response = await axios.post(this.baseURL, {
        query,
        variables
      }, { 
        headers: this.headers,
        timeout: 10000
      });

      if (response.data.errors) {
        console.error('Monday.com API errors:', response.data.errors);
        throw new Error(response.data.errors[0]?.message || 'Monday.com API error');
      }

      return response.data.data;
    } catch (error) {
      console.error('Monday.com API error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw new Error(`Monday API error: ${error.message}`);
    }
  }

  async getBoards() {
    const query = `
      query {
        boards(limit: 10) {
          id
          name
          description
          board_kind
          updated_at
          items {
            id
            name
          }
        }
      }
    `;
    return await this.makeGraphQLQuery(query);
  }

  async createItem(boardId, itemName, columnValues = {}) {
    const columnValuesJSON = JSON.stringify(columnValues);
    
    const mutation = `
      mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
          id
          name
        }
      }
    `;

    const variables = {
      boardId: parseInt(boardId),
      itemName,
      columnValues: columnValuesJSON
    };

    return await this.makeGraphQLQuery(mutation, variables);
  }

  async getBoardItems(boardId) {
    const query = `
      query ($boardId: ID!) {
        boards(ids: [$boardId]) {
          id
          name
          items {
            id
            name
            column_values {
              id
              title
              value
              text
            }
            updated_at
            created_at
          }
        }
      }
    `;

    const variables = { boardId: parseInt(boardId) };
    return await this.makeGraphQLQuery(query, variables);
  }
}

const mondayService = new MondayService(MONDAY_API_KEY);

// Authentication routes
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

    // Filter by team if specified
    if (team) {
      filteredTasks = filteredTasks.filter(task => task.team === team);
    }

    // Apply limit if specified
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
    const { title, description, team, priority, mondayBoardId } = req.body;

    // Validation
    if (!title || !description || !team) {
      return res.status(400).json({ error: 'Title, description, and team are required' });
    }

    if (title.length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters long' });
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
      updatedAt: new Date().toISOString(),
      mondayBoardId: mondayBoardId || null
    };

    tasks.push(task);

    // Sync to Monday.com if board ID provided and API key is available
    if (mondayBoardId && MONDAY_API_KEY) {
      try {
        const columnValues = {
          status: task.status,
          priority: task.priority,
          team: task.team
        };

        await mondayService.createItem(mondayBoardId, title, columnValues);
      } catch (mondayError) {
        console.error('Monday.com sync failed:', mondayError);
        // Continue with task creation even if Monday.com sync fails
      }
    }

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Monday.com Integration Routes
app.get('/api/monday/boards', authenticateToken, async (req, res) => {
  try {
    if (!MONDAY_API_KEY) {
      return res.status(501).json({ error: 'Monday.com integration not configured' });
    }

    const boardsData = await mondayService.getBoards();
    res.json(boardsData);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/monday/items', authenticateToken, async (req, res) => {
  try {
    if (!MONDAY_API_KEY) {
      return res.status(501).json({ error: 'Monday.com integration not configured' });
    }

    const { boardId, itemName, columnValues } = req.body;

    if (!boardId || !itemName) {
      return res.status(400).json({ error: 'Board ID and item name are required' });
    }

    const result = await mondayService.createItem(boardId, itemName, columnValues);
    res.json(result);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/monday/boards/:boardId/items', authenticateToken, async (req, res) => {
  try {
    if (!MONDAY_API_KEY) {
      return res.status(501).json({ error: 'Monday.com integration not configured' });
    }

    const { boardId } = req.params;
    const itemsData = await mondayService.getBoardItems(boardId);
    res.json(itemsData);
  } catch (error) {
    console.error('Error fetching board items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Time tracking routes
app.post('/api/time-entries', authenticateToken, (req, res) => {
  try {
    const { taskId, duration, description } = req.body;

    if (!taskId || !duration) {
      return res.status(400).json({ error: 'Task ID and duration are required' });
    }

    const timeEntry = {
      id: uuidv4(),
      taskId,
      userId: req.user.userId,
      duration: parseInt(duration),
      description: description || '',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    timeEntries.push(timeEntry);

    res.status(201).json({
      message: 'Time entry created successfully',
      timeEntry
    });
  } catch (error) {
    console.error('Time entry creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/time-entries', authenticateToken, (req, res) => {
  try {
    const userTimeEntries = timeEntries.filter(entry => entry.userId === req.user.userId);
    res.json(userTimeEntries.slice(-10).reverse()); // Return last 10 entries
  } catch (error) {
    console.error('Get time entries error:', error);
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

// Admin routes
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stats = {
      totalUsers: users.length,
      onlineUsers: users.filter(u => u.isOnline).length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      totalTimeEntries: timeEntries.length,
      mondayIntegration: !!MONDAY_API_KEY
    };

    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
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
    mondayIntegration: !!MONDAY_API_KEY
  });
});

// Serve static files in production
if (NODE_ENV === 'production') {
  app.use(express.static('public'));
  
  // Serve frontend for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 DigiHive server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 Monday.com integration: ${MONDAY_API_KEY ? 'Enabled' : 'Disabled'}`);
  console.log(`👤 Default admin credentials: admin / admin123`);
  console.log(`🔑 Admin code: ${ADMIN_CODE}`);
});
