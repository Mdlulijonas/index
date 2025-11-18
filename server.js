const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
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
    { id: 3, subject: "UI/UX Week 1 Design System", startDate: "2026-01-13T11:00:00.000Z", endDate: "2026-01-13T13:00:00.000Z", description: "Create brand color palette. Design typography system. Build component library. Establish design principles.", team: "UI/UX", status: "pending" },
    { id: 4, subject: "UI/UX Week 1 Wireframes", startDate: "2026-01-14T11:00:00.000Z", endDate: "2026-01-14T13:00:00.000Z", description: "Create homepage wireframes. Design user onboarding flow. Map seller dashboard layout. Prototype product listing pages.", team: "UI/UX", status: "pending" },
    { id: 5, subject: "Marketing Week 1 Competitor Analysis", startDate: "2026-01-13T14:00:00.000Z", endDate: "2026-01-13T16:00:00.000Z", description: "Research 5 competitor platforms. Analyze their pricing strategies. Study user acquisition methods. Identify market gaps.", team: "Marketing", status: "pending" },
    { id: 6, subject: "Marketing Week 1 Target Audience", startDate: "2026-01-14T14:00:00.000Z", endDate: "2026-01-14T16:00:00.000Z", description: "Define primary user personas. Research creator demographics. Identify buyer pain points. Create audience segmentation.", team: "Marketing", status: "pending" },
    { id: 7, subject: "Support Week 1 Helpdesk Setup", startDate: "2026-01-13T16:00:00.000Z", endDate: "2026-01-13T17:30:00.000Z", description: "Choose helpdesk software. Set up ticketing system. Create support categories. Configure automation rules.", team: "Support", status: "planned" },
    { id: 8, subject: "Support Week 1 Documentation", startDate: "2026-01-14T16:00:00.000Z", endDate: "2026-01-14T17:30:00.000Z", description: "Create documentation structure. Write getting started guides. Develop FAQ templates. Set up knowledge base.", team: "Support", status: "planned" },
    { id: 9, subject: "Content Week 1 Content Calendar", startDate: "2026-01-13T13:00:00.000Z", endDate: "2026-01-13T15:00:00.000Z", description: "Plan 3-month content calendar. Research trending topics. Schedule blog post topics. Plan social media content.", team: "Content", status: "in-progress" },
    { id: 10, subject: "Content Week 1 Platform Setup", startDate: "2026-01-14T13:00:00.000Z", endDate: "2026-01-14T15:00:00.000Z", description: "Set up blog platform. Create social media accounts. Configure email newsletter. Set up analytics tracking.", team: "Content", status: "in-progress" },
];

let users = [
    { username: 'admin', password: 'password', team: 'Administrator', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'dev', password: 'password', team: 'Full-Stack', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'designer', password: 'password', team: 'UI/UX', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'marketer', password: 'password', team: 'Marketing', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'support', password: 'password', team: 'Support', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'writer', password: 'password', team: 'Content', isOnline: false, lastLogin: null, lastLogout: null }
];

const ADMIN_CODE = '212259497';

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

// Tasks API
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// Users API
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
            // Update login status
            user.isOnline = true;
            user.lastLogin = new Date().toISOString();
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
    console.log(`✅ Server ready and accepting connections`);
});
