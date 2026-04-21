# Concurrent Execution Guide - Hospital Queue System

## 🚀 Overview

The Hospital Queue Management System now supports concurrent execution with multiple approaches:

1. **PQueue-based Concurrency** - Task queue with configurable concurrency
2. **Worker Threads** - Multi-threaded processing for CPU-bound operations
3. **Concurrently Runner** - Run multiple services simultaneously

---

## 📦 Installation

### Step 1: Install root dependencies
```bash
cd c:\Users\meena\Desktop\dockers\byteexcel
npm install
```

### Step 2: Install project dependencies
```bash
npm run install-all
```

---

## 🏃 Running Concurrently

### Option 1: Run Backend + Frontend Concurrently (Recommended)
```bash
npm start:concurrent
```

This will:
- ✅ Start backend with concurrent queue processor on port 5000
- ✅ Start frontend on port 3000
- ✅ Show logs from both services with color-coded prefixes

### Option 2: Development Mode with Hot Reload
```bash
npm run start:dev
```

This uses nodemon for automatic backend restarts on file changes.

### Option 3: Run Only Server with Concurrent Processing
```bash
cd server
npm run start:concurrent
```

Backend will output:
```
🚀 Server running on port 5000
⚙️  Concurrent queue processor initialized with concurrency level: 5
📊 Max concurrent operations: 10
```

### Option 4: Run Only Frontend
```bash
cd client
npm start
```

---

## 🔧 Concurrent Architecture

### 1. PQueue-Based Task Processing (`server-concurrent.js`)

**Features:**
- Concurrency level: 5 operations per interval
- Automatic throttling to prevent overload
- Priority queue support

**Example:**
```javascript
const queueProcessor = new PQueue({ 
  concurrency: 5,        // 5 concurrent operations
  interval: 1000,        // Per 1 second
  intervalCap: 10        // Maximum 10 tasks per interval
});

// Add task to queue
queueProcessor.add(() => processPatientToken());
```

**Concurrent Operations:**
- 📋 Process patient tokens
- 📊 Update queue status
- 🔔 Notify patients
- 🔐 Handle authentication
- 👤 Join queue requests

### 2. Worker Threads (`concurrent-processor.js` + `queue-worker.js`)

**Features:**
- Multi-threaded execution
- Configurable worker pool (default: 4 workers)
- Task queue management
- Statistics tracking

**Example:**
```javascript
const processor = new ConcurrentQueueProcessor(4); // 4 workers

await processor.addTask({
  id: '1',
  type: 'processToken',
  data: { patientId: '123' }
});

console.log(processor.getStats());
```

**Worker Tasks:**
- 🎟️ Process token generation
- 📊 Update queue status
- 📱 Notify patients
- 👨‍⚕️ Assign doctors

---

## 📊 API Endpoints for Concurrent Operations

### Health Check with Concurrent Info
```bash
GET http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "Server is running",
  "timestamp": "2024-04-21T10:30:00.000Z",
  "concurrentOperations": 3,
  "maxConcurrent": 10,
  "queueSize": 5
}
```

### Queue Statistics
```bash
GET http://localhost:5000/api/queue/stats
```

**Response:**
```json
{
  "concurrentOperations": 3,
  "maxConcurrent": 10,
  "queueSize": 5,
  "isPaused": false,
  "timestamp": "2024-04-21T10:30:00.000Z"
}
```

---

## 🔄 How Concurrent Processing Works

### Request Flow
```
Client Request
     ↓
Express Route Handler
     ↓
Add to PQueue
     ↓
Check Concurrency Limit
     ↓
Execute (if under limit) or Queue (if at limit)
     ↓
Process Concurrently
     ↓
Emit Socket.IO Event
     ↓
Send Response
```

### Example: Concurrent Token Generation
```javascript
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
```

---

## 📈 Performance Monitoring

### Queue Statistics
```javascript
GET /api/queue/stats
```

Tracks:
- Active concurrent operations
- Queue size
- Pause status
- Maximum concurrency limit

### Example Output
```
✅ Concurrent operations completed: 3 tasks
  📋 Processing token at 10:30:45 AM
  📊 Updating queue status at 10:30:45 AM
  🔔 Notifying patients at 10:30:45 AM
```

---

## 🎯 Benefits of Concurrent Execution

1. **Higher Throughput** - Process multiple requests simultaneously
2. **Better Resource Utilization** - Use all available CPU cores
3. **Improved Responsiveness** - No blocking operations
4. **Automatic Throttling** - Prevents system overload
5. **Scalability** - Handle more concurrent patients

---

## ⚙️ Configuration

### Adjust Concurrency Level
Edit `server/server-concurrent.js`:

```javascript
const queueProcessor = new PQueue({ 
  concurrency: 5,      // Change this value
  interval: 1000,      // Time window (ms)
  intervalCap: 10      // Tasks per interval
});

const MAX_CONCURRENT = 10;  // Change this value
```

### Worker Pool Size
Edit `server/server.js` or `server-concurrent.js`:

```javascript
const processor = new ConcurrentQueueProcessor(4); // Change 4 to desired number
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Windows PowerShell
Get-Process | Where-Object { $_.ProcessName -eq 'node' } | Stop-Process

# Unix/Mac
lsof -ti :5000 | xargs kill -9
lsof -ti :3000 | xargs kill -9
```

### Concurrently Not Found
```bash
npm install -g concurrently
# or run: npm install
```

### Queue Processing Paused
Check if max concurrent operations reached:
```bash
curl http://localhost:5000/api/queue/stats
```

---

## 📚 Example Usage in Frontend

### Real-time Updates via Socket.IO
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Listen for token generation
socket.on('tokenGenerated', (data) => {
  console.log('New token:', data.token);
});

// Listen for next patient
socket.on('nextPatient', (data) => {
  console.log('Next patient token:', data.token);
});

// Emit join queue
socket.emit('joinQueue', { patientId: '123' });
```

---

## 📝 Available Scripts

```bash
# Install all dependencies
npm run install-all

# Run everything concurrently (recommended)
npm start

# Run backend + frontend concurrently
npm start:concurrent

# Run in development mode (with hot reload)
npm run start:dev

# Docker commands
npm run docker:up
npm run docker:down
npm run docker:logs

# Individual services
npm run server:start
npm run server:dev
npm run server:concurrent
npm run client:start
npm run client:build
```

---

## ✅ Next Steps

1. **Test Concurrent Operations:**
   ```bash
   npm start:concurrent
   ```

2. **Monitor Concurrent Activity:**
   Open browser to http://localhost:5000/api/queue/stats

3. **Send Multiple Requests:**
   ```bash
   # Create multiple tokens simultaneously
   for i in {1..10}; do
     curl -X POST http://localhost:5000/api/queue/token
   done
   ```

4. **Check Frontend:**
   Open http://localhost:3000 in browser

---

## 🎓 Advanced Topics

### Adding Custom Concurrent Tasks
Edit `server/server-concurrent.js`:
```javascript
const customTask = async () => {
  // Your async operation
  return result;
};

queueProcessor.add(() => customTask());
```

### Worker Thread Custom Operations
Edit `server/queue-worker.js`:
```javascript
case 'customOperation':
  result = await customOperation(data);
  break;
```

---

**Status: ✅ Concurrent execution fully configured and ready to use!**
