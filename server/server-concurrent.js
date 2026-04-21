require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
const PQueue = require('p-queue').default;

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

// Initialize Priority Queue for concurrent operations
const queueProcessor = new PQueue({ concurrency: 5, interval: 1000, intervalCap: 10 });

// Concurrent operation counter
let concurrentOperations = 0;
const MAX_CONCURRENT = 10;

// MongoDB Connection (async)
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
};

// Redis Connection (async)
const connectRedis = async () => {
  return new Promise((resolve, reject) => {
    const redisClient = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      resolve(redisClient);
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
      reject(err);
    });
  });
};

// Concurrent Queue Processing
let redisClient;
let tokenQueue = [];

const processQueueConcurrently = async () => {
  if (concurrentOperations >= MAX_CONCURRENT) {
    console.log(`⏳ Queue processing paused - max concurrent operations (${MAX_CONCURRENT}) reached`);
    return;
  }

  concurrentOperations++;
  
  try {
    // Simulate concurrent queue processing
    const results = await Promise.all([
      queueProcessor.add(() => processPatientToken()),
      queueProcessor.add(() => updateQueueStatus()),
      queueProcessor.add(() => notifyPatients()),
    ]);
    
    console.log(`✅ Concurrent operations completed: ${results.length} tasks`);
  } catch (err) {
    console.error('❌ Error in concurrent processing:', err.message);
  } finally {
    concurrentOperations--;
  }
};

// Simulate processing patient token (concurrent)
const processPatientToken = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`  📋 Processing token at ${new Date().toLocaleTimeString()}`);
      resolve('Token processed');
    }, Math.random() * 500);
  });
};

// Simulate updating queue status (concurrent)
const updateQueueStatus = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`  📊 Updating queue status at ${new Date().toLocaleTimeString()}`);
      resolve('Queue updated');
    }, Math.random() * 500);
  });
};

// Simulate notifying patients (concurrent)
const notifyPatients = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`  🔔 Notifying patients at ${new Date().toLocaleTimeString()}`);
      resolve('Notifications sent');
    }, Math.random() * 500);
  });
};

// Initialize concurrent services
const initializeConcurrentServices = async () => {
  try {
    console.log('🚀 Initializing concurrent services...\n');
    
    // Connect to databases concurrently
    await Promise.all([
      connectMongoDB(),
      connectRedis().then(client => { redisClient = client; })
    ]);

    // Start concurrent queue processing interval
    setInterval(() => {
      processQueueConcurrently();
    }, 2000);

    console.log('✅ All concurrent services initialized\n');
  } catch (err) {
    console.error('❌ Error initializing services:', err.message);
  }
};

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date(),
    concurrentOperations: concurrentOperations,
    maxConcurrent: MAX_CONCURRENT,
    queueSize: queueProcessor.size
  });
});

// Get queue statistics
app.get('/api/queue/stats', (req, res) => {
  res.json({
    concurrentOperations,
    maxConcurrent: MAX_CONCURRENT,
    queueSize: queueProcessor.size,
    isPaused: queueProcessor.isPaused,
    timestamp: new Date()
  });
});

// Auth Routes (Placeholder)
app.post('/api/auth/register', async (req, res) => {
  // Add to concurrent queue
  queueProcessor.add(async () => {
    console.log('📝 Processing registration...');
    return new Promise(resolve => {
      setTimeout(() => resolve(), 300);
    });
  });
  res.json({ message: 'User registration queued for processing (Firebase client auth)' });
});

app.post('/api/auth/login', async (req, res) => {
  // Add to concurrent queue
  queueProcessor.add(async () => {
    console.log('🔐 Processing login...');
    return new Promise(resolve => {
      setTimeout(() => resolve(), 300);
    });
  });
  res.json({ message: 'User login queued for processing (Firebase client auth)' });
});

// Queue Routes with concurrent processing
app.post('/api/queue/token', async (req, res) => {
  queueProcessor.add(async () => {
    console.log('🎟️  Generating token concurrently...');
    return new Promise(resolve => {
      setTimeout(() => {
        const token = Math.floor(Math.random() * 9000) + 1000;
        tokenQueue.push(token);
        io.emit('tokenGenerated', { token, timestamp: new Date() });
        resolve();
      }, 200);
    });
  });
  res.json({ message: 'Token generation queued' });
});

app.get('/api/queue/status', (req, res) => {
  res.json({ 
    queueLength: tokenQueue.length,
    concurrentOps: concurrentOperations,
    processingQueueSize: queueProcessor.size,
    message: 'Queue status endpoint' 
  });
});

app.post('/api/queue/next', async (req, res) => {
  queueProcessor.add(async () => {
    console.log('➡️  Processing next patient...');
    return new Promise(resolve => {
      setTimeout(() => {
        if (tokenQueue.length > 0) {
          const nextToken = tokenQueue.shift();
          io.emit('nextPatient', { token: nextToken, timestamp: new Date() });
          resolve();
        }
        resolve();
      }, 200);
    });
  });
  res.json({ message: 'Next patient processing queued' });
});

// Doctor Routes (Placeholder)
app.get('/api/doctor/dashboard', (req, res) => {
  res.json({ 
    message: 'Doctor dashboard endpoint',
    concurrentOperations,
    queueSize: queueProcessor.size
  });
});

// Socket.IO Events with concurrent handling
io.on('connection', (socket) => {
  console.log('📱 New client connected:', socket.id);
  
  // Concurrent socket operations
  socket.on('joinQueue', async (data) => {
    queueProcessor.add(async () => {
      console.log(`  👤 Processing queue join for ${socket.id}`);
      io.emit('userJoined', { clientId: socket.id, timestamp: new Date() });
    });
  });

  socket.on('queueUpdate', async (data) => {
    queueProcessor.add(async () => {
      console.log(`  🔄 Processing queue update from ${socket.id}`);
      io.emit('queueUpdated', { clientId: socket.id, data });
    });
  });

  socket.on('disconnect', () => {
    console.log('📱 Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
const startServer = async () => {
  await initializeConcurrentServices();
  
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`⚙️  Concurrent queue processor initialized with concurrency level: 5`);
    console.log(`📊 Max concurrent operations: ${MAX_CONCURRENT}\n`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await queueProcessor.onIdle();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
