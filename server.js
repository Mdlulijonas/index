const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Import your data modules
const comments = require('./comments.js');
const users = require('./users.js');
const tasks = require('./tasks.js');
const submissions = require('./submissions.js');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// API Routes
app.get('/api/comments', (req, res) => {
    res.json(comments.getComments());
});

app.post('/api/comments', (req, res) => {
    try {
        const newComment = comments.addComment(req.body);
        res.status(201).json(newComment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/submissions', (req, res) => {
    res.json(submissions.getSubmissions());
});

app.post('/api/submissions', (req, res) => {
    try {
        const newSubmission = submissions.addSubmission(req.body);
        res.status(201).json(newSubmission);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/submissions', (req, res) => {
    const { submissionId, adminCode } = req.body;
    
    if (adminCode !== '212259497') {
        return res.status(401).json({ error: 'Invalid admin code' });
    }
    
    try {
        submissions.deleteSubmission(submissionId);
        res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.get('/api/tasks', (req, res) => {
    res.json(tasks.getTasks());
});

app.get('/api/users', (req, res) => {
    res.json(users.getUsers());
});

app.post('/api/users', (req, res) => {
    const { username, updates, action, userData, adminCode } = req.body;
    
    if (action === 'update') {
        try {
            const updatedUser = users.updateUser(username, updates);
            res.json(updatedUser);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    } else if (action === 'login') {
        try {
            const user = users.loginUser(username, updates.password);
            res.json(user);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    } else if (action === 'register') {
        try {
            const newUser = users.registerUser(userData, adminCode);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    } else {
        res.status(400).json({ error: 'Invalid action' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        data: {
            comments: comments.getComments().length,
            submissions: submissions.getSubmissions().length,
            tasks: tasks.getTasks().length,
            users: users.getUsers().length
        }
    });
});

// Serve the main HTML file for all other routes
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
    console.log(`✅ All modules loaded successfully`);
});
