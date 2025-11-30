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

// Serve the frontend HTML directly
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
            
            /* Team Colors - Honeycomb inspired */
            --dev: #FFB300;
            --design: #FF8F00;
            --marketing: #4CAF50;
            --support: #009688;
            --content: #FF7043;
            --admin: #D84315;
            
            /* Bee Colors */
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
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(255, 193, 7, 0.05) 0%, transparent 20%),
                radial-gradient(circle at 90% 80%, rgba(255, 193, 7, 0.05) 0%, transparent 20%);
        }
        
        /* Honeycomb Pattern Background */
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
        
        /* Login Styles */
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
        
        .login-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: 
                radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 2%, transparent 2.5%),
                radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.2) 1%, transparent 1.5%);
            background-size: 100px 100px;
            animation: float 20s infinite linear;
        }
        
        @keyframes float {
            0% { transform: translate(0, 0) rotate(0deg); }
            100% { transform: translate(-50px, -50px) rotate(360deg); }
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
            position: relative;
            border: 3px solid var(--bee-black);
            box-shadow: 0 4px 15px rgba(93, 64, 55, 0.3);
        }
        
        .login-logo-icon::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border: 2px solid var(--bee-black);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .login-logo-text {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 2px 2px 4px rgba(93, 64, 55, 0.1);
        }
        
        .motivation-card {
            background: linear-gradient(135deg, var(--bee-yellow), var(--bee-orange));
            color: var(--bee-black);
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            text-align: left;
            border: 2px solid var(--bee-black);
            position: relative;
            overflow: hidden;
        }
        
        .motivation-card::before {
            content: '🐝';
            position: absolute;
            top: -10px;
            right: 10px;
            font-size: 2rem;
            opacity: 0.3;
        }
        
        .motivation-text {
            font-size: 1.1rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            font-style: italic;
        }
        
        .motivation-author {
            font-size: 0.9rem;
            opacity: 0.9;
            font-weight: 600;
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
            transition: border-color 0.3s ease;
        }
        
        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: var(--bee-orange);
            box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1);
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
            font-size: 0.9rem;
        }
        
        .btn-primary {
            background: var(--bee-yellow);
            color: var(--bee-black);
            border-color: var(--bee-orange);
        }
        
        .btn-primary:hover {
            background: var(--bee-orange);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 143, 0, 0.3);
        }
        
        .btn-outline {
            background: transparent;
            border-color: var(--bee-yellow);
            color: var(--dark);
        }
        
        .btn-outline:hover {
            background: var(--bee-yellow);
            color: var(--bee-black);
        }
        
        /* Dashboard Styles */
        .dashboard {
            display: none;
            min-height: 100vh;
        }
        
        .sidebar {
            background: linear-gradient(135deg, var(--sidebar-bg), var(--bee-brown));
            padding: 2rem 1.5rem;
            width: 280px;
            height: 100vh;
            overflow-y: auto;
            box-shadow: 2px 0 15px rgba(93, 64, 55, 0.2);
            position: fixed;
            z-index: 100;
            transition: transform 0.3s ease;
            border-right: 3px solid var(--bee-yellow);
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 3rem;
            padding: 0 0.5rem;
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
            font-size: 1.3rem;
            border: 2px solid var(--bee-black);
        }
        
        .logo-text {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--bee-yellow);
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
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
            opacity: 0.8;
            border: 1px solid transparent;
        }
        
        .nav-links a:hover {
            background: rgba(255, 193, 7, 0.2);
            opacity: 1;
            border-color: var(--bee-yellow);
            transform: translateX(5px);
        }
        
        .nav-links a.active {
            background: var(--bee-yellow);
            color: var(--bee-black);
            opacity: 1;
            box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
            font-weight: 600;
        }
        
        .main-content {
            flex: 1;
            padding: 2.5rem 3rem;
            margin-left: 280px;
            width: calc(100% - 280px);
            transition: all 0.3s ease;
            background: var(--background);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2.5rem;
            padding: 1rem 0;
            border-bottom: 2px solid var(--bee-yellow);
        }
        
        .welcome-message h1 {
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--dark);
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
            box-shadow: 0 4px 12px rgba(93, 64, 55, 0.1);
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
            font-size: 0.85rem;
            border: 2px solid;
        }
        
        .member-avatar.dev { 
            background: var(--dev);
            border-color: #E65100;
        }
        .member-avatar.design { 
            background: var(--design);
            border-color: #EF6C00;
        }
        .member-avatar.marketing { 
            background: var(--marketing);
            border-color: #388E3C;
        }
        .member-avatar.support { 
            background: var(--support);
            border-color: #00695C;
        }
        .member-avatar.content { 
            background: var(--content);
            border-color: #D84315;
        }
        .member-avatar.admin { 
            background: var(--admin);
            border-color: #BF360C;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 1.5rem;
        }
        
        .stats-container {
            grid-column: span 12;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .stat-card {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 1.75rem;
            box-shadow: 0 8px 25px rgba(93, 64, 55, 0.1);
            display: flex;
            flex-direction: column;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 2px solid var(--bee-yellow);
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--bee-yellow), var(--bee-orange));
        }
        
        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            color: var(--bee-black);
            border: 2px solid;
        }
        
        .stat-icon.overview { 
            background: var(--bee-yellow);
            border-color: var(--bee-orange);
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
            color: var(--dark);
        }
        
        .stat-label {
            font-size: 0.95rem;
            color: var(--gray-dark);
            font-weight: 500;
        }
        
        .dashboard-section {
            display: none;
        }
        
        .dashboard-section.active {
            display: block;
        }
        
        .task-overview {
            grid-column: span 8;
            background: var(--card-bg);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 8px 25px rgba(93, 64, 55, 0.1);
            border: 2px solid var(--bee-yellow);
            position: relative;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .section-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--dark);
            position: relative;
            padding-left: 1rem;
        }
        
        .section-title::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 24px;
            background: var(--bee-yellow);
            border-radius: 2px;
        }
        
        .task-display {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
            max-height: 600px;
            overflow-y: auto;
            padding-right: 0.5rem;
        }
        
        .task-item {
            background: var(--background);
            border-radius: 12px;
            padding: 1.5rem;
            border-left: 6px solid;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            border: 1px solid var(--gray-light);
            position: relative;
        }
        
        .task-item.dev { 
            border-left-color: var(--dev);
            background: linear-gradient(135deg, #FFFDE7, #FFECB3);
        }
        
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .task-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
            color: var(--dark);
            font-size: 1.2rem;
        }
        
        .task-priority {
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-weight: 500;
            border: 1px solid;
        }
        
        .priority-high {
            background: rgba(255, 152, 0, 0.15);
            color: var(--warning);
            border-color: rgba(255, 152, 0, 0.3);
        }
        
        .priority-medium {
            background: rgba(76, 175, 80, 0.15);
            color: var(--success);
            border-color: rgba(76, 175, 80, 0.3);
        }
        
        .task-description {
            color: var(--gray-dark);
            font-size: 0.95rem;
            line-height: 1.5;
        }
        
        .task-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        
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
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px rgba(93, 64, 55, 0.3);
            border: 3px solid var(--bee-yellow);
            position: relative;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .modal-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--dark);
        }
        
        .close-modal {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--gray);
            transition: color 0.3s ease;
        }
        
        .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid var(--bee-yellow);
            border-radius: 8px;
            font-size: 1rem;
            background: var(--background);
            transition: border-color 0.3s ease;
            resize: vertical;
            min-height: 100px;
        }
        
        .mobile-menu-btn {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1000;
            background: var(--bee-yellow);
            color: var(--bee-black);
            border: 2px solid var(--bee-black);
            border-radius: 8px;
            padding: 0.75rem;
            font-size: 1.2rem;
            box-shadow: 0 4px 12px rgba(93, 64, 55, 0.15);
        }
        
        @media (max-width: 1024px) {
            .sidebar {
                transform: translateX(-100%);
                width: 280px;
            }
            
            .sidebar.active {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 0;
                width: 100%;
                padding: 1.5rem;
            }
            
            .mobile-menu-btn {
                display: block;
            }
        }
        
        @media (max-width: 768px) {
            .stats-container {
                grid-template-columns: 1fr;
            }
            
            .header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .user-info {
                width: 100%;
                justify-content: space-between;
            }
        }
    </style>
</head>
<body>
    <!-- Honeycomb Background -->
    <div class="honeycomb-bg"></div>
    
    <!-- Login Screen -->
    <div id="loginScreen" class="login-container">
        <div class="login-card">
            <div class="login-logo">
                <div class="login-logo-icon">DH</div>
                <div class="login-logo-text">DigiHive</div>
            </div>
            
            <div class="motivation-card">
                <div class="motivation-text" id="loginMotivation">
                    "Collaboration is the foundation of great achievements"
                </div>
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
                
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem; padding: 0.75rem;">
                    <i class="fas fa-sign-in-alt"></i> Login to Dashboard
                </button>
                
                <button type="button" class="btn btn-outline" style="width: 100%; padding: 0.75rem;" onclick="showRegisterModal()">
                    <i class="fas fa-user-plus"></i> Register New Member
                </button>
            </form>
        </div>
    </div>

    <!-- Main Dashboard -->
    <div id="dashboard" class="dashboard">
        <!-- Mobile Menu Button -->
        <button class="mobile-menu-btn" onclick="toggleSidebar()">
            <i class="fas fa-bars"></i>
        </button>
        
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="logo">
                <div class="logo-icon">DH</div>
                <div class="logo-text">DigiHive</div>
            </div>
            
            <ul class="nav-links">
                <li><a href="#" class="active" onclick="showSection('dashboard')"><i class="fas fa-home"></i> Dashboard</a></li>
                <li><a href="#" onclick="showSection('tasks')"><i class="fas fa-tasks"></i> Tasks</a></li>
                <li><a href="#" onclick="showSection('team')"><i class="fas fa-users"></i> Team</a></li>
                <li><a href="#" onclick="showSection('analytics')"><i class="fas fa-chart-bar"></i> Analytics</a></li>
                <li><a href="#" onclick="showSection('admin')"><i class="fas fa-tools"></i> Admin Tools</a></li>
            </ul>
        </div>
        
        <!-- Main Content -->
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
            
            <!-- Dashboard Section -->
            <div id="dashboardSection" class="dashboard-section active">
                <div class="dashboard-grid">
                    <!-- Stats Cards -->
                    <div class="stats-container">
                        <div class="stat-card">
                            <div class="stat-header">
                                <div>
                                    <div class="stat-value" id="totalTasks">0</div>
                                    <div class="stat-label">Active Tasks</div>
                                </div>
                                <div class="stat-icon overview">
                                    <i class="fas fa-tasks"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-header">
                                <div>
                                    <div class="stat-value" id="completedTasks">0</div>
                                    <div class="stat-label">Completed</div>
                                </div>
                                <div class="stat-icon overview">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-header">
                                <div>
                                    <div class="stat-value" id="teamMembers">0</div>
                                    <div class="stat-label">Team Members</div>
                                </div>
                                <div class="stat-icon overview">
                                    <i class="fas fa-users"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-header">
                                <div>
                                    <div class="stat-value" id="overallProgress">0%</div>
                                    <div class="stat-label">Overall Progress</div>
                                </div>
                                <div class="stat-icon overview">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Task Overview -->
                    <div class="task-overview">
                        <div class="section-header">
                            <div class="section-title">Recent Tasks</div>
                            <button class="btn btn-primary" onclick="showTaskModal()">
                                <i class="fas fa-plus"></i> Add Task
                            </button>
                        </div>
                        
                        <div class="task-display" id="taskDisplay">
                            <!-- Tasks will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tasks Section -->
            <div id="tasksSection" class="dashboard-section">
                <div class="task-overview" style="grid-column: span 12;">
                    <div class="section-header">
                        <div class="section-title">All Tasks</div>
                        <button class="btn btn-primary" onclick="showTaskModal()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                    
                    <div class="task-display" id="allTasksDisplay">
                        <!-- All tasks will be populated here -->
                    </div>
                </div>
            </div>
            
            <!-- Team Section -->
            <div id="teamSection" class="dashboard-section">
                <div class="task-overview" style="grid-column: span 12;">
                    <div class="section-header">
                        <div class="section-title">Team Members</div>
                        <button class="btn btn-primary" onclick="showRegisterModal()">
                            <i class="fas fa-user-plus"></i> Add Member
                        </button>
                    </div>
                    
                    <div class="task-display" id="teamList">
                        <!-- Team members will be populated here -->
                    </div>
                </div>
            </div>
            
            <!-- Analytics Section -->
            <div id="analyticsSection" class="dashboard-section">
                <div class="task-overview" style="grid-column: span 12;">
                    <div class="section-header">
                        <div class="section-title">Analytics Dashboard</div>
                    </div>
                    <div style="text-align: center; padding: 3rem;">
                        <i class="fas fa-chart-bar" style="font-size: 4rem; color: var(--bee-yellow); margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--dark); margin-bottom: 0.5rem;">Analytics Coming Soon</h3>
                        <p style="color: var(--gray);">Advanced analytics features are under development.</p>
                    </div>
                </div>
            </div>
            
            <!-- Admin Tools Section -->
            <div id="adminSection" class="dashboard-section">
                <div class="task-overview" style="grid-column: span 12;">
                    <div class="section-header">
                        <div class="section-title">Admin Tools</div>
                    </div>
                    
                    <div class="stats-container">
                        <div class="stat-card">
                            <div class="stat-header">
                                <div>
                                    <div class="stat-value" id="adminUsersCount">0</div>
                                    <div class="stat-label">Total Users</div>
                                </div>
                                <div class="stat-icon overview">
                                    <i class="fas fa-users"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-header">
                                <div>
                                    <div class="stat-value" id="adminTasksCount">0</div>
                                    <div class="stat-label">Total Tasks</div>
                                </div>
                                <div class="stat-icon overview">
                                    <i class="fas fa-tasks"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Register Modal -->
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

    <!-- Task Modal -->
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
                    <textarea class="form-textarea" name="description" required></textarea>
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
        // Application State
        let currentUser = null;
        let authToken = null;

        // API Base URL - Fixed for Railway deployment
        const API_BASE_URL = '/api';

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DigiHive Frontend Initialized');
            console.log('API Base URL:', API_BASE_URL);
            
            // Check if user is already logged in
            const savedToken = localStorage.getItem('digihive_token');
            const savedUser = localStorage.getItem('digihive_user');
            
            if (savedToken && savedUser) {
                authToken = savedToken;
                currentUser = JSON.parse(savedUser);
                showDashboard();
                loadDashboardData();
            } else {
                showLogin();
            }
            
            // Set up form event listeners
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('registerForm').addEventListener('submit', handleRegister);
            document.getElementById('taskForm').addEventListener('submit', handleTaskCreate);
            
            // Test server connection
            testServerConnection();
        });

        // Test server connection
        async function testServerConnection() {
            try {
                const response = await fetch(\`\${API_BASE_URL}/health\`);
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}\`);
                }
                const data = await response.json();
                console.log('Server connection test:', data);
                showNotification('Connected to server successfully!', 'success');
            } catch (error) {
                console.error('Server connection failed:', error);
                showNotification('Cannot connect to server. Please check if the backend is running.', 'error');
            }
        }

        // API Helper Functions
        async function apiRequest(endpoint, options = {}) {
            const url = \`\${API_BASE_URL}\${endpoint}\`;
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };
            
            if (authToken) {
                config.headers.Authorization = \`Bearer \${authToken}\`;
            }
            
            if (config.body && typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }
            
            console.log(\`API Request: \${options.method || 'GET'} \${url}\`, config);
            
            try {
                const response = await fetch(url, config);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || \`HTTP \${response.status}\`);
                }
                
                return data;
            } catch (error) {
                console.error('API request failed:', error);
                showNotification(error.message, 'error');
                throw error;
            }
        }

        // Authentication Functions
        async function handleLogin(e) {
            e.preventDefault();
            
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
                const data = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: { username, password }
                });
                
                authToken = data.token;
                currentUser = data.user;
                
                // Save to localStorage
                localStorage.setItem('digihive_token', authToken);
                localStorage.setItem('digihive_user', JSON.stringify(currentUser));
                
                showDashboard();
                loadDashboardData();
                showNotification('Login successful! Welcome back!', 'success');
                
            } catch (error) {
                console.error('Login failed:', error);
                // Don't show notification here as apiRequest already shows it
            } finally {
                loginBtn.innerHTML = originalText;
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
            const originalText = registerBtn.innerHTML;
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
            registerBtn.disabled = true;
            
            try {
                await apiRequest('/auth/register', {
                    method: 'POST',
                    body: userData
                });
                
                showNotification('User registered successfully! You can now login.', 'success');
                closeRegisterModal();
                e.target.reset();
                
            } catch (error) {
                console.error('Registration failed:', error);
                // Don't show notification here as apiRequest already shows it
            } finally {
                registerBtn.innerHTML = originalText;
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
                
                // Reload tasks data
                loadTasksData();
                loadDashboardData();
                
            } catch (error) {
                console.error('Failed to create task:', error);
                // Don't show notification here as apiRequest already shows it
            }
        }

        // Data Loading Functions
        async function loadDashboardData() {
            try {
                // Load stats
                const stats = await apiRequest('/stats');
                updateStats(stats);
                
                // Load recent tasks
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

        // UI Rendering Functions
        function renderTasks(tasks, containerId) {
            const container = document.getElementById(containerId);
            
            if (!tasks || tasks.length === 0) {
                container.innerHTML = \`
                    <div style="text-align: center; padding: 3rem; color: var(--gray);">
                        <i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>No tasks yet</h3>
                        <p>Create your first task to get started!</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = '';
            
            tasks.forEach(task => {
                const taskElement = createTaskElement(task);
                container.appendChild(taskElement);
            });
        }

        function createTaskElement(task) {
            const taskElement = document.createElement('div');
            taskElement.className = \`task-item \${getTeamClass(task.team)}\`;
            
            const priorityClass = task.priority === 'High' ? 'priority-high' : 'priority-medium';
            
            taskElement.innerHTML = \`
                <div class="task-header">
                    <div>
                        <div class="task-title">\${task.title}</div>
                        <div style="font-size: 0.9rem; color: var(--gray-dark);">
                            <i class="fas fa-users"></i> \${task.team} Team
                            <span style="margin-left: 1rem;">
                                <i class="fas fa-user"></i> \${task.createdBy}
                            </span>
                        </div>
                    </div>
                    <div class="task-priority \${priorityClass}">\${task.priority}</div>
                </div>
                <div class="task-description">\${task.description}</div>
                <div class="task-actions">
                    <button class="btn btn-outline" onclick="viewTaskDetails('\${task.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-primary" onclick="startTask('\${task.id}')">
                        <i class="fas fa-play"></i> Start Task
                    </button>
                </div>
            \`;
            
            return taskElement;
        }

        function renderTeam(users) {
            const container = document.getElementById('teamList');
            
            if (!users || users.length === 0) {
                container.innerHTML = \`
                    <div style="text-align: center; padding: 3rem; color: var(--gray);">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>No team members</h3>
                        <p>Register team members to get started!</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = '';
            
            users.forEach(user => {
                const userElement = document.createElement('div');
                userElement.className = 'task-item';
                
                userElement.innerHTML = \`
                    <div class="task-header">
                        <div>
                            <div class="task-title">\${user.username}</div>
                            <div style="font-size: 0.9rem; color: var(--gray-dark);">
                                <i class="fas fa-shield-alt"></i> \${user.team}
                            </div>
                        </div>
                        <div class="member-avatar \${getTeamClass(user.team)}">
                            \${user.username.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: var(--gray-dark);">
                        <div><i class="fas fa-calendar"></i> Joined: \${new Date(user.createdAt).toLocaleDateString()}</div>
                        <div>
                            <i class="fas fa-circle" style="color: \${user.isOnline ? '#4CAF50' : '#9E9E9E'}"></i> 
                            \${user.isOnline ? 'Online' : 'Offline'}
                        </div>
                    </div>
                \`;
                
                container.appendChild(userElement);
            });
        }

        function updateStats(stats) {
            document.getElementById('totalTasks').textContent = stats.totalTasks || 0;
            document.getElementById('completedTasks').textContent = stats.completedTasks || 0;
            document.getElementById('teamMembers').textContent = stats.totalUsers || 0;
            document.getElementById('overallProgress').textContent = stats.overallProgress || '0%';
        }

        // UI Helper Functions
        function getTeamClass(team) {
            const teamMap = {
                'Development': 'dev',
                'Design': 'design',
                'Marketing': 'marketing',
                'Support': 'support',
                'Administrator': 'admin',
                'Content': 'content'
            };
            return teamMap[team] || 'dev';
        }

        function showNotification(message, type = 'info') {
            // Remove existing notifications
            const existingNotifications = document.querySelectorAll('.notification-toast');
            existingNotifications.forEach(notification => notification.remove());
            
            const toast = document.createElement('div');
            toast.className = \`notification-toast \${type}\`;
            toast.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: \${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 300px;
                word-wrap: break-word;
                animation: slideIn 0.3s ease;
            \`;
            
            const icon = type === 'success' ? 'fa-check-circle' : 
                         type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
            
            toast.innerHTML = \`
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas \${icon}"></i>
                    <span>\${message}</span>
                </div>
            \`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Add CSS animations for notifications
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        \`;
        document.head.appendChild(style);

        function showLogin() {
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
        }

        function showDashboard() {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            
            if (currentUser) {
                document.getElementById('welcomeTitle').textContent = \`Welcome back, \${currentUser.username}!\`;
                document.getElementById('welcomeSubtitle').textContent = \`You are logged in as \${currentUser.team}\`;
                document.getElementById('userName').textContent = currentUser.username;
                document.getElementById('userAvatar').textContent = currentUser.username.substring(0, 2).toUpperCase();
                document.getElementById('userAvatar').className = \`member-avatar \${getTeamClass(currentUser.team)}\`;
            }
        }

        function showSection(section) {
            // Hide all sections
            document.querySelectorAll('.dashboard-section').forEach(sec => {
                sec.style.display = 'none';
            });
            
            // Show selected section
            document.getElementById(section + 'Section').style.display = 'block';
            
            // Update navigation
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Load section-specific data
            switch(section) {
                case 'tasks':
                    loadTasksData();
                    break;
                case 'team':
                    loadTeamData();
                    break;
                case 'dashboard':
                    loadDashboardData();
                    break;
            }
            
            // Close sidebar on mobile
            if (window.innerWidth <= 1024) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        }

        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('active');
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

        function viewTaskDetails(taskId) {
            showNotification('Task details feature coming soon!', 'info');
        }

        function startTask(taskId) {
            showNotification('Starting task timer...', 'info');
        }

        function logout() {
            // Clear local storage
            localStorage.removeItem('digihive_token');
            localStorage.removeItem('digihive_user');
            
            // Reset state
            authToken = null;
            currentUser = null;
            
            // Show login screen
            showLogin();
            
            // Clear login form
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
  // ... keep all your existing API routes exactly as they are
});

app.post('/api/auth/login', async (req, res) => {
  // ... your existing login route
});

app.get('/api/users', authenticateToken, (req, res) => {
  // ... your existing users route
});

app.get('/api/tasks', authenticateToken, (req, res) => {
  // ... your existing tasks route
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  // ... your existing tasks creation route
});

app.get('/api/stats', authenticateToken, (req, res) => {
  // ... your existing stats route
});

app.get('/api/health', (req, res) => {
  // ... your existing health route
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ DigiHive Server running on port \${PORT}\`);
  console.log(\`🌐 Environment: \${NODE_ENV}\`);
  console.log(\`👤 Default admin: username "admin", password "admin123"\`);
  console.log(\`🔑 Admin code: \${ADMIN_CODE}\`);
  console.log(\`🚀 Ready to accept requests!\`);
});
