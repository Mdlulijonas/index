const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Data storage (in-memory for demo - replace with database in production)
let comments = [
    {
        id: 1,
        username: 'Jonasmdluli',
        team: 'Full-Stack',
        text: 'If any of the team member is facing challenges on their weekly task, they can post their comments here with the challenge and when their submission is due',
        timestamp: new Date('2025-11-17T14:05:25').toISOString()
    }
];

let submissions = [];

let tasks = [
    { id: 1, subject: "Full-stack Week 1 Server Infrastructure", startDate: "2026-01-13T09:00:00.000Z", endDate: "2026-01-13T11:00:00.000Z", description: "Set up cloud server environment. Configure database architecture. Implement basic security protocols. Create deployment pipeline.", team: "Full-Stack", status: "pending" },
    { id: 2, subject: "Full-stack Week 1 Database Setup", startDate: "2026-01-14T09:00:00.000Z", endDate: "2026-01-14T11:00:00.000Z", description: "Design database schemas. Set up user tables and relationships. Implement data migration scripts. Create backup systems.", team: "Full-Stack", status: "pending" },
    // ... keep your existing tasks data
];

let users = [
    { username: 'admin', password: 'password', team: 'Administrator', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'dev', password: 'password', team: 'Full-Stack', isOnline: false, lastLogin: null, lastLogout: null },
    // ... keep your existing users data
];

const ADMIN_CODE = '212259497';

// API Routes (keep all your existing API endpoints exactly as they were)
app.get('/api/comments', (req, res) => {
    res.json(comments);
});

app.post('/api/comments', (req, res) => {
    const newComment = {
        id: Date.now(),
        ...req.body,
        timestamp: new Date().toISOString()
    };
    comments.unshift(newComment);
    res.status(201).json(newComment);
});

app.get('/api/submissions', (req, res) => {
    res.json(submissions);
});

app.post('/api/submissions', (req, res) => {
    const newSubmission = {
        id: Date.now(),
        ...req.body,
        timestamp: new Date().toISOString()
    };
    submissions.unshift(newSubmission);
    res.status(201).json(newSubmission);
});

app.delete('/api/submissions', (req, res) => {
    const { submissionId, adminCode } = req.body;
    
    if (adminCode !== ADMIN_CODE) {
        return res.status(401).json({ error: 'Invalid admin code' });
    }
    
    const submissionIndex = submissions.findIndex(s => s.id == submissionId);
    if (submissionIndex === -1) {
        return res.status(404).json({ error: 'Submission not found' });
    }
    
    submissions.splice(submissionIndex, 1);
    res.json({ message: 'Submission deleted successfully' });
});

app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

app.get('/api/users', (req, res) => {
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const { username, updates, action, userData, adminCode } = req.body;
    
    if (action === 'update') {
        const userIndex = users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            return res.json(users[userIndex]);
        }
        return res.status(404).json({ error: 'User not found' });
    }

    if (action === 'login') {
        const user = users.find(u => u.username === username && u.password === updates.password);
        if (user) {
            return res.json(user);
        }
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (action === 'register') {
        if (adminCode !== ADMIN_CODE) {
            return res.status(401).json({ error: 'Invalid admin code' });
        }
        
        if (users.find(u => u.username === userData.username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const newUser = {
            ...userData,
            isOnline: false,
            lastLogin: null,
            lastLogout: null
        };
        users.push(newUser);
        return res.status(201).json(newUser);
    }

    res.status(400).json({ error: 'Invalid action' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        data: {
            comments: comments.length,
            submissions: submissions.length,
            tasks: tasks.length,
            users: users.length
        }
    });
});

// Serve the main HTML file for all other routes - FIXED
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get port from environment variable (Render provides this)
const PORT = process.env.PORT || 10000;

// Listen on 0.0.0.0 to accept external connections
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DigiHive server running on port ${PORT}`);
    console.log(`📊 API endpoints available at /api/comments, /api/submissions, /api/tasks, /api/users`);
    console.log(`🌐 Frontend served from: http://0.0.0.0:${PORT}`);
    console.log(`💬 Comments update frequency: Hourly (stable)`);
    console.log(`✅ Static files serving from: ${__dirname}`);
});
