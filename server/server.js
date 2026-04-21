require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Redis Connection
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('error', err => {
  console.error('❌ Redis connection error:', err.message);
});

// Simple Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Auth Routes (Placeholder)
app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'User registration endpoint (Firebase client auth)' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'User login endpoint (Firebase client auth)' });
});

// Queue Routes (Placeholder)
app.post('/api/queue/token', (req, res) => {
  res.json({ message: 'Token generation endpoint' });
});

app.get('/api/queue/status', (req, res) => {
  res.json({ message: 'Queue status endpoint' });
});

app.post('/api/queue/next', (req, res) => {
  res.json({ message: 'Next patient endpoint' });
});

// Doctor Routes (Placeholder)
app.get('/api/doctor/dashboard', (req, res) => {
  res.json({ message: 'Doctor dashboard endpoint' });
});

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
