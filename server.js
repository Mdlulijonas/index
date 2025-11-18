const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Data storage
let comments = [];
let submissions = [];
let tasks = [
    { id: 1, subject: "Full-stack Week 1 Server Infrastructure", startDate: "2026-01-13T09:00:00.000Z", endDate: "2026-01-13T11:00:00.000Z", description: "Set up cloud server environment.", team: "Full-Stack", status: "pending" },
    // ... your other tasks
];
let users = [
    { username: 'admin', password: 'password', team: 'Administrator', isOnline: false, lastLogin: null, lastLogout: null },
    // ... your other users
];

// Comments API
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

// Submissions API  
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

// Tasks API
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// Users API
app.get('/api/users', (req, res) => {
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const { username, updates, action } = req.body;
    
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

    res.status(400).json({ error: 'Invalid action' });
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
