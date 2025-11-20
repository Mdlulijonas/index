const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const socketio = require('socket.io');

const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');
const commentRoutes = require('./routes/comments');
const teamRoutes = require('./routes/teams');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET','POST']
  }
});

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/teams', teamRoutes);

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error', err));

// Socket.IO real-time: presence + comments
const onlineUsers = {}; // socketId -> { userId, name, role, connectedAt }

io.on('connection', socket => {
  // when user connects, they should immediately emit 'presence:join' with user info
  socket.on('presence:join', (user) => {
    onlineUsers[socket.id] = { ...user, connectedAt: Date.now() };
    // broadcast current online list
    io.emit('presence:update', Object.values(onlineUsers));
  });

  socket.on('comment:new', (comment) => {
    // broadcast to all clients
    io.emit('comment:new', comment);
  });

  socket.on('disconnect', () => {
    delete onlineUsers[socket.id];
    io.emit('presence:update', Object.values(onlineUsers));
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
