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
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --primary: #FFC107;
            --primary-light: #FFD54F;
            --primary-dark: #FF8F00;
            --secondary: #795548;
            --accent: #FF5722;
            --success: #4CAF50;
            --warning: #FF9800;
            --error: #D32F2F;
            --dark: #5D4037;
            --gray-dark: #8D6E63;
            --gray: #A1887F;
            --gray-light: #EFEBE9;
            --background: #FFFDE7;
            --white: #FFFFFF;
            --card-bg: #FFFDF7;
            --sidebar-bg: #5D4037;
            --sidebar-text: #FFECB3;
            
            --dev: #FFB300;
            --design: #FF8F00;
            --marketing: #4CAF50;
            --support: #009688;
            --content: #FF7043;
            --admin: #D84315;
            
            --bee-yellow: #FFC107;
            --bee-black: #5D4037;
            --bee-orange: #FF8F00;
            --bee-brown: #795548;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        body {
            background: var(--background);
            color: var(--dark);
            line-height: 1.6;
            overflow-x: hidden;
        }
        
        .honeycomb-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.03;
            background-image: 
                radial-gradient(circle at 25% 25%, var(--bee-yellow) 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, var(--bee-orange) 2px, transparent 2px);
            background-size: 100px 100px;
            z-index: -1;
        }
        
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange));
            padding: 2rem;
            position: relative;
            overflow: hidden;
        }
        
        .login-card {
            background: white;
            border-radius: 20px;
            padding: 3rem;
            box-shadow: 0 25px 50px rgba(93, 64, 55, 0.2);
            width: 100%;
            max-width: 450px;
            text-align: center;
            position: relative;
            z-index: 1;
            border: 3px solid var(--bee-yellow);
        }
        
        .login-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .login-logo-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--bee-black);
            font-weight: bold;
            font-size: 2rem;
            border: 3px solid var(--bee-black);
        }
        
        .login-logo-text {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .motivation-card {
            background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange));
            color: var(--bee-black);
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            text-align: left;
            border: 2px solid var(--bee-black);
        }
        
        .form-group {
            margin-bottom: 1rem;
            text-align: left;
        }
        
        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--dark);
        }
        
        .form-input, .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid var(--bee-yellow);
            border-radius: 8px;
            font-size: 1rem;
            background: var(--background);
        }
        
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: 2px solid;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn-primary {
            background: var(--bee-yellow);
            color: var(--bee-black);
            border-color: var(--bee-orange);
        }
        
        .btn-outline {
            background: transparent;
            border-color: var(--bee-yellow);
            color: var(--dark);
        }
        
        .dashboard {
            display: none;
            min-height: 100vh;
        }
        
        .sidebar {
            background: linear-gradient(135deg, var(--sidebar-bg), var(--bee-brown));
            padding: 2rem 1.5rem;
            width: 280px;
            height: 100vh;
            position: fixed;
            border-right: 3px solid var(--bee-yellow);
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 3rem;
        }
        
        .logo-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--bee-black);
            font-weight: bold;
            border: 2px solid var(--bee-black);
        }
        
        .logo-text {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--bee-yellow);
        }
        
        .nav-links {
            list-style: none;
            margin-bottom: 3rem;
        }
        
        .nav-links li {
            margin-bottom: 0.5rem;
        }
        
        .nav-links a {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.85rem 1rem;
            color: var(--sidebar-text);
            text-decoration: none;
            border-radius: 10px;
            transition: all 0.3s ease;
        }
        
        .nav-links a.active {
            background: var(--bee-yellow);
            color: var(--bee-black);
        }
        
        .main-content {
            flex: 1;
            padding: 2.5rem 3rem;
            margin-left: 280px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--bee-yellow);
        }
        
        .welcome-message h1 {
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }
        
        .user-avatar {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: var(--white);
            padding: 0.5rem 1rem;
            border-radius: 12px;
            border: 2px solid var(--bee-yellow);
        }
        
        .member-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            border: 2px solid;
        }
        
        .member-avatar.dev { background: var(--dev); }
        .member-avatar.design { background: var(--design); }
        .member-avatar.marketing { background: var(--marketing); }
        .member-avatar.support { background: var(--support); }
        .member-avatar.admin { background: var(--admin); }
        
        .stats-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .stat-card {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 1.75rem;
            border: 2px solid var(--bee-yellow);
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
        }
        
        .dashboard-section {
            display: none;
        }
        
        .dashboard-section.active {
            display: block;
        }
        
        .task-overview {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 2rem;
            border: 2px solid var(--bee-yellow);
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .task-display {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .task-item {
            background: var(--background);
            border-radius: 12px;
            padding: 1.5rem;
            border-left: 6px solid;
        }
        
        .task-item.dev { border-left-color: var(--dev); }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(93, 64, 55, 0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            border: 3px solid var(--bee-yellow);
        }
        
        .notification-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: #4CAF50;
            color: white;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
        }
    </style>
</head>
<body>
    <div class="honeycomb-bg"></div>
    
    <div id="loginScreen" class="login-container">
        <div class="login-card">
            <div class="login-logo">
                <div class="login-logo-icon">DH</div>
                <div class="login-logo-text">DigiHive</div>
            </div>
            
            <div class="motivation-card">
                <div class="motivation-text">"Collaboration is the foundation of great achievements"</div>
                <div class="motivation-author">- Team DigiHive</div>
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
        <div class="sidebar">
            <div class="logo">
                <div class="logo-icon">DH</div>
                <div class="logo-text">DigiHive</div>
            </div>
            
            <ul class="nav-links">
                <li><a href="#" class="active" onclick="showSection('dashboard')"><i class="fas fa-home"></i> Dashboard</a></li>
                <li><a href="#" onclick="showSection('tasks')"><i class="fas fa-tasks"></i> Tasks</a></li>
                <li><a href="#" onclick="showSection('team')"><i class="fas fa-users"></i> Team</a></li>
                <li><a href="#" onclick="showSection('admin')"><i class="fas fa-tools"></i> Admin Tools</a></li>
            </ul>
        </div>
        
        <div class="main-content">
            <div class="header">
                <div class="welcome-message">
                    <h1 id="welcomeTitle">Welcome to DigiHive Workstation</h1>
                    <p id="welcomeSubtitle">Track progress, submit work, and collaborate with your team</p>
                </div>
                <div class="user-info">
                    <div class="user-avatar">
                        <div class="member-avatar" id="userAvatar">US</div>
                        <span id="userName">User</span>
                    </div>
                    <button class="btn btn-outline" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
            
            <div id="dashboardSection" class="dashboard-section active">
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-value" id="totalTasks">0</div>
                        <div class="stat-label">Active Tasks</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="completedTasks">0</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="teamMembers">0</div>
                        <div class="stat-label">Team Members</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="overallProgress">0%</div>
                        <div class="stat-label">Overall Progress</div>
                    </div>
                </div>
                
                <div class="task-overview">
                    <div class="section-header">
                        <div class="section-title">Recent Tasks</div>
                        <button class="btn btn-primary" onclick="showTaskModal()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                    
                    <div class="task-display" id="taskDisplay"></div>
                </div>
            </div>
            
            <div id="tasksSection" class="dashboard-section">
                <div class="task-overview">
                    <div class="section-header">
                        <div class="section-title">All Tasks</div>
                        <button class="btn btn-primary" onclick="showTaskModal()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                    <div class="task-display" id="allTasksDisplay"></div>
                </div>
            </div>
            
            <div id="teamSection" class="dashboard-section">
                <div class="task-overview">
                    <div class="section-header">
                        <div class="section-title">Team Members</div>
                        <button class="btn btn-primary" onclick="showRegisterModal()">
                            <i class="fas fa-user-plus"></i> Add Member
                        </button>
                    </div>
                    <div class="task-display" id="teamList"></div>
                </div>
            </div>
            
            <div id="adminSection" class="dashboard-section">
                <div class="task-overview">
                    <div class="section-header">
                        <div class="section-title">Admin Tools</div>
                    </div>
                    <div class="stats-container">
                        <div class="stat-card">
                            <div class="stat-value" id="adminUsersCount">0</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="adminTasksCount">0</div>
                            <div class="stat-label">Total Tasks</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="registerModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Register New Team Member</h2>
                <button class="close-modal" onclick="closeRegisterModal()">&times;</button>
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
                        <option value="Administrator">Administrator</option>
                        <option value="Development">Development</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Support">Support</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Admin Code (for admin registration)</label>
                    <input type="password" class="form-input" name="adminCode">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-user-plus"></i> Register Member
                </button>
            </form>
        </div>
    </div>

    <div class="modal" id="taskModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Create New Task</h2>
                <button class="close-modal" onclick="closeTaskModal()">&times;</button>
            </div>
            <form id="taskForm">
                <div class="form-group">
                    <label class="form-label">Task Title</label>
                    <input type="text" class="form-input" name="title" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input" name="description" required style="height: 100px;"></textarea>
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
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select class="form-select" name="priority" required>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-plus"></i> Create Task
                </button>
            </form>
        </div>
    </div>

    <script>
        let currentUser = null;
        let authToken = null;
        const API_BASE_URL = '/api';

        document.addEventListener('DOMContentLoaded', function() {
            const savedToken = localStorage.getItem('digihive_token');
            const savedUser = localStorage.getItem('digihive_user');
            
            if (savedToken && savedUser) {
                authToken = savedToken;
                currentUser = JSON.parse(savedUser);
                showDashboard();
                loadDashboardData();
            }
            
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('registerForm').addEventListener('submit', handleRegister);
            document.getElementById('taskForm').addEventListener('submit', handleTaskCreate);
        });

        async function apiRequest(endpoint, options = {}) {
            const url = API_BASE_URL + endpoint;
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
                
                if (!response.ok) {
                    throw new Error(data.error || 'HTTP ' + response.status);
                }
                
                return data;
            } catch (error) {
                showNotification(error.message, 'error');
                throw error;
            }
        }

        async function handleLogin(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!username || !password) {
                showNotification('Please enter both username and password', 'error');
                return;
            }
            
            const loginBtn = e.target.querySelector('button[type="submit"]');
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            loginBtn.disabled = true;
            
            try {
                const data = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: { username, password }
                });
                
                authToken = data.token;
                currentUser = data.user;
                localStorage.setItem('digihive_token', authToken);
                localStorage.setItem('digihive_user', JSON.stringify(currentUser));
                showDashboard();
                loadDashboardData();
                showNotification('Login successful!', 'success');
                
            } catch (error) {
                console.error('Login failed:', error);
            } finally {
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
                loginBtn.disabled = false;
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const userData = {
                username: formData.get('username'),
                password: formData.get('password'),
                team: formData.get('team'),
                adminCode: formData.get('adminCode') || undefined
            };
            
            const registerBtn = e.target.querySelector('button[type="submit"]');
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
            registerBtn.disabled = true;
            
            try {
                await apiRequest('/auth/register', {
                    method: 'POST',
                    body: userData
                });
                
                showNotification('User registered successfully!', 'success');
                closeRegisterModal();
                e.target.reset();
                
            } catch (error) {
                console.error('Registration failed:', error);
            } finally {
                registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register Member';
                registerBtn.disabled = false;
            }
        }

        async function handleTaskCreate(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const taskData = {
                title: formData.get('title'),
                description: formData.get('description'),
                team: formData.get('team'),
                priority: formData.get('priority')
            };
            
            try {
                await apiRequest('/tasks', {
                    method: 'POST',
                    body: taskData
                });
                
                showNotification('Task created successfully!', 'success');
                closeTaskModal();
                e.target.reset();
                loadTasksData();
                loadDashboardData();
                
            } catch (error) {
                console.error('Failed to create task:', error);
            }
        }

        async function loadDashboardData() {
            try {
                const stats = await apiRequest('/stats');
                document.getElementById('totalTasks').textContent = stats.totalTasks || 0;
                document.getElementById('completedTasks').textContent = stats.completedTasks || 0;
                document.getElementById('teamMembers').textContent = stats.totalUsers || 0;
                document.getElementById('overallProgress').textContent = stats.overallProgress || '0%';
                
                const tasks = await apiRequest('/tasks?limit=5');
                renderTasks(tasks, 'taskDisplay');
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            }
        }

        async function loadTasksData() {
            try {
                const tasks = await apiRequest('/tasks');
                renderTasks(tasks, 'allTasksDisplay');
            } catch (error) {
                console.error('Failed to load tasks:', error);
            }
        }

        async function loadTeamData() {
            try {
                const users = await apiRequest('/users');
                renderTeam(users);
            } catch (error) {
                console.error('Failed to load team data:', error);
            }
        }

        function renderTasks(tasks, containerId) {
            const container = document.getElementById(containerId);
            if (!tasks || tasks.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--gray);">No tasks yet</div>';
                return;
            }
            
            container.innerHTML = '';
            tasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'task-item ' + getTeamClass(task.team);
                taskElement.innerHTML = \`
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">\${task.title}</div>
                            <div style="font-size: 0.9rem; color: var(--gray-dark);">
                                <i class="fas fa-users"></i> \${task.team} Team
                            </div>
                        </div>
                        <div style="padding: 0.25rem 0.75rem; border-radius: 20px; background: rgba(76, 175, 80, 0.15); color: var(--success);">
                            \${task.priority}
                        </div>
                    </div>
                    <div style="color: var(--gray-dark); margin: 1rem 0;">\${task.description}</div>
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                        <button class="btn btn-outline" onclick="startTask('\${task.id}')">
                            <i class="fas fa-play"></i> Start Task
                        </button>
                    </div>
                \`;
                container.appendChild(taskElement);
            });
        }

        function renderTeam(users) {
            const container = document.getElementById('teamList');
            if (!users || users.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--gray);">No team members</div>';
                return;
            }
            
            container.innerHTML = '';
            users.forEach(user => {
                const userElement = document.createElement('div');
                userElement.className = 'task-item';
                userElement.innerHTML = \`
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600;">\${user.username}</div>
                            <div style="font-size: 0.9rem; color: var(--gray-dark);">
                                <i class="fas fa-shield-alt"></i> \${user.team}
                            </div>
                        </div>
                        <div class="member-avatar \${getTeamClass(user.team)}">
                            \${user.username.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                \`;
                container.appendChild(userElement);
            });
        }

        function getTeamClass(team) {
            const teamMap = {
                'Development': 'dev',
                'Design': 'design', 
                'Marketing': 'marketing',
                'Support': 'support',
                'Administrator': 'admin'
            };
            return teamMap[team] || 'dev';
        }

        function showNotification(message, type = 'info') {
            const existing = document.querySelectorAll('.notification-toast');
            existing.forEach(n => n.remove());
            
            const toast = document.createElement('div');
            toast.className = 'notification-toast';
            toast.style.background = type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3';
            toast.innerHTML = \`
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas \${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                    <span>\${message}</span>
                </div>
            \`;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.remove(), 3000);
        }

        function showLogin() {
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
        }

        function showDashboard() {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            
            if (currentUser) {
                document.getElementById('welcomeTitle').textContent = 'Welcome back, ' + currentUser.username + '!';
                document.getElementById('welcomeSubtitle').textContent = 'You are logged in as ' + currentUser.team;
                document.getElementById('userName').textContent = currentUser.username;
                document.getElementById('userAvatar').textContent = currentUser.username.substring(0, 2).toUpperCase();
                document.getElementById('userAvatar').className = 'member-avatar ' + getTeamClass(currentUser.team);
            }
        }

        function showSection(section) {
            document.querySelectorAll('.dashboard-section').forEach(sec => {
                sec.style.display = 'none';
            });
            document.getElementById(section + 'Section').style.display = 'block';
            
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.remove('active');
            });
            event.target.classList.add('active');
            
            if (section === 'tasks') loadTasksData();
            if (section === 'team') loadTeamData();
            if (section === 'dashboard') loadDashboardData();
        }

        function showRegisterModal() {
            document.getElementById('registerModal').classList.add('active');
        }

        function closeRegisterModal() {
            document.getElementById('registerModal').classList.remove('active');
        }

        function showTaskModal() {
            document.getElementById('taskModal').classList.add('active');
        }

        function closeTaskModal() {
            document.getElementById('taskModal').classList.remove('active');
        }

        function startTask(taskId) {
            showNotification('Starting task timer...', 'info');
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
    </script>
</body>
</html>
  `);
});

// Your existing API routes continue here...
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, team, adminCode } = req.body;

    if (!username || !password || !team) {
      return res.status(400).json({ error: 'Username, password, and team are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (team === 'Administrator') {
      if (!adminCode || adminCode !== ADMIN_CODE) {
        return res.status(403).json({ error: 'Valid admin code required for administrator registration' });
      }
    }

    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

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

    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        team: user.team 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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

    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.isOnline = true;
    user.lastLogin = new Date().toISOString();

    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        team: user.team 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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

app.get('/api/users', authenticateToken, (req, res) => {
  try {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
