const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (your HTML, CSS, JS)
app.use(express.static('.'));

// Your Netlify functions converted to Express routes
let comments = [];
let submissions = [];
let users = [
    { username: 'admin', password: 'password', team: 'Administrator', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'dev', password: 'password', team: 'Full-Stack', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'designer', password: 'password', team: 'UI/UX', isOnline: false, lastLogin: null, lastLogout: null }
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

// Serve your main HTML file for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`DigiHive server running on port ${PORT}`);
});