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
  origin: '*', // Allow all origins for now to debug
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

// Serve the complete frontend HTML directly
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DigiHive Team Workstation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* Your CSS styles here - shortened for brevity */
        :root {
            --primary: #FFC107; --primary-light: #FFD54F; --primary-dark: #FF8F00;
            --secondary: #795548; --accent: #FF5722; --success: #4CAF50;
            --warning: #FF9800; --error: #D32F2F; --dark: #5D4037;
            --gray-dark: #8D6E63; --gray: #A1887F; --gray-light: #EFEBE9;
            --background: #FFFDE7; --white: #FFFFFF; --card-bg: #FFFDF7;
            --sidebar-bg: #5D4037; --sidebar-text: #FFECB3;
            --dev: #FFB300; --design: #FF8F00; --marketing: #4CAF50;
            --support: #009688; --content: #FF7043; --admin: #D84315;
            --bee-yellow: #FFC107; --bee-black: #5D4037;
            --bee-orange: #FF8F00; --bee-brown: #795548;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { background: var(--background); color: var(--dark); }
        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange)); padding: 2rem; }
        .login-card { background: white; border-radius: 20px; padding: 3rem; box-shadow: 0 25px 50px rgba(93, 64, 55, 0.2); max-width: 450px; width: 100%; text-align: center; border: 3px solid var(--bee-yellow); }
        .login-logo { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 2rem; }
        .login-logo-icon { width: 80px; height: 80px; background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange)); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--bee-black); font-weight: bold; font-size: 2rem; border: 3px solid var(--bee-black); }
        .login-logo-text { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .form-group { margin-bottom: 1rem; text-align: left; }
        .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        .form-input, .form-select { width: 100%; padding: 0.75rem; border: 2px solid var(--bee-yellow); border-radius: 8px; font-size: 1rem; background: var(--background); }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; border: 2px solid; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn-primary { background: var(--bee-yellow); color: var(--bee-black); border-color: var(--bee-orange); }
        .btn-outline { background: transparent; border-color: var(--bee-yellow); color: var(--dark); }
        .dashboard { display: none; min-height: 100vh; }
        .notification { position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; background: #4CAF50; color: white; border-radius: 8px; z-index: 10000; }
    </style>
</head>
<body>
    <div id="loginScreen" class="login-container">
        <div class="login-card">
            <div class="login-logo">
                <div class="login-logo-icon">DH</div>
                <div class="login-logo-text">DigiHive</div>
            </div>
            
            <div style="background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange)); color: var(--bee-black); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; text-align: left; border: 2px solid var(--bee-black);">
                <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 0.5rem; font-style: italic;">"Collaboration is the foundation of great achievements"</div>
                <div style="font-size: 0.9rem; opacity: 0.9; font-weight: 600;">- Team DigiHive</div>
            </div>
            
            <form id="loginForm">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" id="loginUsername" placeholder="Enter your username" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" id="loginPassword" placeholder="Enter your password" required>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">
                    <i class="fas fa-sign-in-alt"></i> Login to Dashboard
                </button>
                
                <button type="button" class="btn btn-outline" style="width: 100%;" onclick="showRegisterModal()">
                    <i class="fas fa-user-plus"></i> Register New Member
                </button>
            </form>
        </div>
    </div>

    <div id="dashboard" class="dashboard">
        <div style="padding: 2rem;">
            <h1>Welcome to DigiHive Dashboard</h1>
            <p>Logged in successfully!</p>
            <button class="btn btn-outline" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
    </div>

    <div id="registerModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 16px; padding: 2rem; max-width: 500px; width: 90%; border: 3px solid var(--bee-yellow);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.5rem; font-weight: 600;">Register New Team Member</h2>
                <button onclick="closeRegisterModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <form id="registerForm">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" name="username" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" name="password" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Team</label>
                    <select class="form-select" name="team" required>
                        <option value="">Select Team</option>
                        <option value="Development">Development</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Support">Support</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-user-plus"></i> Register Member
                </button>
            </form>
        </div>
    </div>

    <script>
        let currentUser = null;
        let authToken = null;
        const API_BASE_URL = window.location.origin + '/api';

        console.log('Frontend loaded, API Base URL:', API_BASE_URL);

        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, setting up event listeners');
            
            const savedToken = localStorage.getItem('digihive_token');
            const savedUser = localStorage.getItem('digihive_user');
            
            if (savedToken && savedUser) {
                console.log('Found saved user data');
                authToken = savedToken;
                currentUser = JSON.parse(savedUser);
                showDashboard();
            } else {
                console.log('No saved user data, showing login');
                showLogin();
            }
            
            // Set up form event listeners
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('registerForm').addEventListener('submit', handleRegister);
            
            // Test API connection
            testAPI();
        });

        async function testAPI() {
            try {
                console.log('Testing API connection to:', API_BASE_URL + '/health');
                const response = await fetch(API_BASE_URL + '/health');
                const data = await response.json();
                console.log('API test successful:', data);
                showNotification('Connected to server!', 'success');
            } catch (error) {
                console.error('API test failed:', error);
                showNotification('Cannot connect to server: ' + error.message, 'error');
            }
        }

        async function apiRequest(endpoint, options = {}) {
            const url = API_BASE_URL + endpoint;
            console.log('API Request:', options.method || 'GET', url);
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };
            
            if (authToken) {
                config.headers.Authorization = 'Bearer ' + authToken;
            }
            
            if (config.body && typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }
            
            try {
                const response = await fetch(url, config);
                const data = await response.json();
                
                console.log('API Response:', data);
                
                if (!response.ok) {
                    throw new Error(data.error || 'HTTP ' + response.status);
                }
                
                return data;
            } catch (error) {
                console.error('API request failed:', error);
                showNotification(error.message, 'error');
                throw error;
            }
        }

        async function handleLogin(e) {
            e.preventDefault();
            console.log('Login attempt');
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!username || !password) {
                showNotification('Please enter both username and password', 'error');
                return;
            }
            
            const loginBtn = e.target.querySelector('button[type="submit"]');
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            loginBtn.disabled = true;
            
            try {
                console.log('Sending login request for user:', username);
                const data = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: { username, password }
                });
                
                authToken = data.token;
                currentUser = data.user;
                
                localStorage.setItem('digihive_token', authToken);
                localStorage.setItem('digihive_user', JSON.stringify(currentUser));
                
                showDashboard();
                showNotification('Login successful! Welcome back!', 'success');
                
            } catch (error) {
                console.error('Login failed:', error);
            } finally {
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            console.log('Registration attempt');
            
            const formData = new FormData(e.target);
            const userData = {
                username: formData.get('username'),
                password: formData.get('password'),
                team: formData.get('team')
            };
            
            const registerBtn = e.target.querySelector('button[type="submit"]');
            const originalText = registerBtn.innerHTML;
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
            registerBtn.disabled = true;
            
            try {
                console.log('Sending registration request:', userData);
                await apiRequest('/auth/register', {
                    method: 'POST',
                    body: userData
                });
                
                showNotification('User registered successfully! You can now login.', 'success');
                closeRegisterModal();
                e.target.reset();
                
            } catch (error) {
                console.error('Registration failed:', error);
            } finally {
                registerBtn.innerHTML = originalText;
                registerBtn.disabled = false;
            }
        }

        function showNotification(message, type) {
            // Remove existing notifications
            const existing = document.querySelectorAll('.notification');
            existing.forEach(n => n.remove());
            
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.style.background = type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3';
            notification.innerHTML = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }

        function showLogin() {
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
        }

        function showDashboard() {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
        }

        function showRegisterModal() {
            document.getElementById('registerModal').style.display = 'flex';
        }

        function closeRegisterModal() {
            document.getElementById('registerModal').style.display = 'none';
        }

        function logout() {
            localStorage.removeItem('digihive_token');
            localStorage.removeItem('digihive_user');
            authToken = null;
            currentUser = null;
            showLogin();
            document.getElementById('loginForm').reset();
            showNotification('Logged out successfully', 'info');
        }

        // Make functions globally available
        window.showRegisterModal = showRegisterModal;
        window.closeRegisterModal = closeRegisterModal;
        window.logout = logout;
    </script>
</body>
</html>
  `);
});

// API Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
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

    console.log('User registered successfully:', username);
    
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
    console.log('Login request received:', req.body);
    
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
