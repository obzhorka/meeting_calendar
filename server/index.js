const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importowanie routerów
const authRoutes = require('./routes/auth');
const friendsRoutes = require('./routes/friends');
const availabilityRoutes = require('./routes/availability');
const groupsRoutes = require('./routes/groups');
const eventsRoutes = require('./routes/events');
const chatRoutes = require('./routes/chat');
const notificationsRoutes = require('./routes/notifications');

// Socket.io handler
const socketHandler = require('./socket/socketHandler');
socketHandler(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Meeting Scheduler API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Wewnętrzny błąd serwera'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nie znaleziony' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serwer uruchomiony na porcie ${PORT}`);
  console.log(`📡 API dostępne pod: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket aktywny na: ws://localhost:${PORT}`);
});

module.exports = { app, server, io };

