const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    // Sanitize filename and add timestamp
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + originalName)
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow specific file types
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.zip'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and ZIP files are allowed.'));
    }
  }
});

// Data storage (in-memory for demo)
let comments = [
  {
    id: 1,
    username: 'System Admin',
    team: 'Administrator',
    text: 'Welcome to DigiHive! Team members can post comments about their tasks and challenges here.',
    timestamp: new Date().toISOString()
  }
];

let submissions = [];

let tasks = [
  { 
    id: 1, 
    subject: "Server Infrastructure Setup", 
    startDate: "2026-01-13T09:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Set up cloud server environment. Configure database architecture. Implement basic security protocols. Create deployment pipeline.", 
    team: "Full-Stack", 
    status: "pending",
    priority: "High"
  },
  { 
    id: 2, 
    subject: "Database Design & Implementation", 
    startDate: "2026-01-14T09:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Design database schemas. Set up user tables and relationships. Implement data migration scripts. Create backup systems.", 
    team: "Full-Stack", 
    status: "pending",
    priority: "High"
  },
  { 
    id: 3, 
    subject: "Design System Creation", 
    startDate: "2026-01-13T11:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Create brand color palette. Design typography system. Build component library. Establish design principles.", 
    team: "UI/UX", 
    status: "pending",
    priority: "High"
  },
  { 
    id: 4, 
    subject: "Wireframes & Prototypes", 
    startDate: "2026-01-14T11:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Create homepage wireframes. Design user onboarding flow. Map seller dashboard layout. Prototype product listing pages.", 
    team: "UI/UX", 
    status: "pending",
    priority: "High"
  },
  { 
    id: 5, 
    subject: "Competitor Analysis", 
    startDate: "2026-01-13T14:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Research 5 competitor platforms. Analyze their pricing strategies. Study user acquisition methods. Identify market gaps.", 
    team: "Marketing", 
    status: "pending",
    priority: "Medium"
  },
  { 
    id: 6, 
    subject: "Target Audience Research", 
    startDate: "2026-01-14T14:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Define primary user personas. Research creator demographics. Identify buyer pain points. Create audience segmentation.", 
    team: "Marketing", 
    status: "pending",
    priority: "Medium"
  },
  { 
    id: 7, 
    subject: "Helpdesk System Setup", 
    startDate: "2026-01-13T16:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Choose helpdesk software. Set up ticketing system. Create support categories. Configure automation rules.", 
    team: "Support", 
    status: "planned",
    priority: "Medium"
  },
  { 
    id: 8, 
    subject: "Documentation Creation", 
    startDate: "2026-01-14T16:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Create documentation structure. Write getting started guides. Develop FAQ templates. Set up knowledge base.", 
    team: "Support", 
    status: "planned",
    priority: "Medium"
  },
  { 
    id: 9, 
    subject: "Content Calendar Planning", 
    startDate: "2026-01-13T13:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Plan 3-month content calendar. Research trending topics. Schedule blog post topics. Plan social media content.", 
    team: "Content", 
    status: "in-progress",
    priority: "Medium"
  },
  { 
    id: 10, 
    subject: "Platform Setup & Configuration", 
    startDate: "2026-01-14T13:00:00.000Z", 
    endDate: "2026-01-16T17:00:00.000Z", 
    description: "Set up blog platform. Create social media accounts. Configure email newsletter. Set up analytics tracking.", 
    team: "Content", 
    status: "in-progress",
    priority: "Medium"
  },
];

let users = [
  { username: 'admin', password: 'password', team: 'Administrator', isOnline: false, lastLogin: null, lastLogout: null, role: 'System Administrator' },
  { username: 'developer', password: 'password', team: 'Full-Stack', isOnline: false, lastLogin: null, lastLogout: null, role: 'Full-Stack Developer' },
  { username: 'designer', password: 'password', team: 'UI/UX', isOnline: false, lastLogin: null, lastLogout: null, role: 'UI/UX Designer' },
  { username: 'marketer', password: 'password', team: 'Marketing', isOnline: false, lastLogin: null, lastLogout: null, role: 'Marketing Specialist' },
  { username: 'support', password: 'password', team: 'Support', isOnline: false, lastLogin: null, lastLogout: null, role: 'Support Specialist' },
  { username: 'content', password: 'password', team: 'Content', isOnline: false, lastLogin: null, lastLogout: null, role: 'Content Creator' }
];

const ADMIN_CODE = '212259497';

// Comments API
app.get('/api/comments', (req, res) => {
  try {
    // Return comments sorted by timestamp (newest first)
    const sortedComments = comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(sortedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/comments', (req, res) => {
  try {
    const newComment = {
      id: Date.now(),
      ...req.body,
      timestamp: new Date().toISOString()
    };
    comments.unshift(newComment);
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.delete('/api/comments', (req, res) => {
  try {
    const { commentId, adminCode } = req.body;
    
    if (adminCode !== ADMIN_CODE) {
      return res.status(401).json({ error: 'Invalid admin code' });
    }
    
    const commentIndex = comments.findIndex(c => c.id == commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    comments.splice(commentIndex, 1);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Submissions API
app.get('/api/submissions', (req, res) => {
  try {
    // Return submissions sorted by timestamp (newest first)
    const sortedSubmissions = submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(sortedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

app.post('/api/submissions', upload.single('attachment'), (req, res) => {
  try {
    const newSubmission = {
      id: Date.now(),
      name: req.body.name,
      member: req.body.member,
      team: req.body.team,
      progress: req.body.progress,
      plan: req.body.plan,
      fileType: req.body.fileType,
      attachment: req.file ? req.file.filename : null,
      originalFileName: req.file ? req.file.originalname : null,
      timestamp: new Date().toISOString()
    };
    submissions.unshift(newSubmission);
    res.status(201).json(newSubmission);
  } catch (error) {
    console.error('Error adding submission:', error);
    res.status(500).json({ error: 'Failed to add submission' });
  }
});

app.get('/api/submissions/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

app.delete('/api/submissions', (req, res) => {
  try {
    const { submissionId, adminCode } = req.body;
    
    if (adminCode !== ADMIN_CODE) {
      return res.status(401).json({ error: 'Invalid admin code' });
    }
    
    const submissionIndex = submissions.findIndex(s => s.id == submissionId);
    if (submissionIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Remove file from uploads directory if it exists
    const submission = submissions[submissionIndex];
    if (submission.attachment) {
      const filePath = path.join(uploadsDir, submission.attachment);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    submissions.splice(submissionIndex, 1);
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// Tasks API
app.get('/api/tasks', (req, res) => {
  try {
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Users API
app.get('/api/users', (req, res) => {
  try {
    // Return users without passwords for security
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { username, updates, action, userData, adminCode, password } = req.body;
    
    console.log('Received user action:', action, 'username:', username);
    
    if (action === 'update') {
      const userIndex = users.findIndex(u => u.username === username);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }
      users[userIndex] = { ...users[userIndex], ...updates };
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = users[userIndex];
      return res.json(userWithoutPassword);
    }

    if (action === 'login') {
      console.log('Login attempt for:', username);
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        // Update user status
        user.isOnline = true;
        user.lastLogin = new Date().toISOString();
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      } else {
        console.log('Login failed for:', username);
        return res.status(401).json({ error: 'Invalid username or password' });
      }
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
        lastLogout: null,
        role: `${userData.team} Member`
      };
      users.push(newUser);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Error in users API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
    }
  }
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Get port from environment variable (Render provides this)
const PORT = process.env.PORT || 10000;

// Listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DigiHive server running on port ${PORT}`);
  console.log(`📊 API endpoints available at /api/comments, /api/submissions, /api/tasks, /api/users`);
  console.log(`🌐 Frontend served from: http://0.0.0.0:${PORT}`);
  console.log(`💾 Uploads directory: ${uploadsDir}`);
  console.log(`✅ Server ready and accepting connections`);
});
