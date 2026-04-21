# ⚡ Quick Start - Concurrent Execution

## 🚀 Fastest Way to Get Started (30 seconds)

### Step 1: Install Dependencies
```bash
cd c:\Users\meena\Desktop\dockers\byteexcel
npm install
npm run install-all
```

### Step 2: Run Everything Concurrently
```bash
npm start:concurrent
```

That's it! Your application will:
- ✅ Start backend on http://localhost:5000
- ✅ Start frontend on http://localhost:3000
- ✅ Process requests concurrently
- ✅ Handle real-time updates via Socket.IO

---

## 📊 What You'll See

When running `npm start:concurrent`, you'll see:

```
[BACKEND] 🚀 Initializing concurrent services...
[FRONTEND] Starting the development server...

[BACKEND] ✅ MongoDB connected
[BACKEND] ✅ Redis connected
[BACKEND] ✅ All concurrent services initialized

[BACKEND] 🚀 Server running on port 5000
[BACKEND] ⚙️  Concurrent queue processor initialized with concurrency level: 5
[BACKEND] 📊 Max concurrent operations: 10

[FRONTEND] On Your Network: http://localhost:3000
```

---

## 🧪 Test Concurrent Operations

### Open Terminal and Run:
```bash
# Generate multiple tokens concurrently (Windows PowerShell)
1..5 | ForEach-Object { Invoke-WebRequest -Uri http://localhost:5000/api/queue/token -Method POST }

# Or using curl (bash/PowerShell)
for i in {1..5}; do curl -X POST http://localhost:5000/api/queue/token; done
```

### Check Queue Statistics:
```bash
curl http://localhost:5000/api/queue/stats | ConvertFrom-Json | Format-Table
```

### View in Browser:
- Frontend: http://localhost:3000
- API Health: http://localhost:5000/api/health
- Queue Stats: http://localhost:5000/api/queue/stats

---

## 🔄 Run Concurrent Examples

See concurrent operations in action:

```bash
cd server
npm run examples
```

This will run 5 different concurrent scenarios:
1. **PQueue Operations** - Task queue with concurrency control
2. **Worker Threads** - Multi-threaded processing
3. **Mixed Operations** - Hospital workflow simulation
4. **Concurrent I/O** - API call batching
5. **Error Handling** - Fault tolerance in concurrent tasks

---

## 🛠️ Other Commands

### Development Mode (Auto-reload)
```bash
npm run start:dev
```

### Backend Only
```bash
cd server
npm run start:concurrent
```

### Frontend Only
```bash
cd client
npm start
```

### Run with Docker
```bash
npm run docker:up
```

### View Docker Logs
```bash
npm run docker:logs
```

---

## ✨ Key Features

- ✅ **5-concurrent operations** by default (configurable)
- ✅ **Automatic throttling** to prevent overload
- ✅ **Real-time Socket.IO updates**
- ✅ **Queue statistics tracking**
- ✅ **Worker thread pool** for CPU-intensive tasks
- ✅ **Error handling** and graceful shutdown
- ✅ **Health monitoring endpoints**

---

## 📈 Monitor Performance

Check real-time concurrent operations:

```bash
# In a new terminal, run every 2 seconds
while($true) { 
  curl http://localhost:5000/api/queue/stats; 
  Start-Sleep -Seconds 2 
}
```

Example output:
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

## 🎯 Common Workflows

### Testing Patient Token Generation
```bash
# Generate 10 tokens concurrently
1..10 | % { Invoke-WebRequest -Uri http://localhost:5000/api/queue/token -Method POST -UseBasicParsing } | Select-Object StatusCode
```

### Test Doctor Dashboard
```bash
curl http://localhost:5000/api/doctor/dashboard | ConvertFrom-Json | Format-Table
```

### Monitor Queue Status
```bash
curl http://localhost:5000/api/queue/status | ConvertFrom-Json | Format-Table
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill Node processes
Get-Process | Where-Object { $_.ProcessName -eq 'node' } | Stop-Process -Force

# Or change port in server/.env
# PORT=5001
```

### Can't Find 'concurrently'
```bash
npm install -g concurrently
# Then retry: npm start:concurrent
```

### Dependencies Not Installed
```bash
npm run install-all
```

---

## 📚 Documentation

For detailed information, see:
- [CONCURRENT_EXECUTION.md](./docs/CONCURRENT_EXECUTION.md) - Complete guide
- [DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Local setup
- [DOCKER_SETUP.md](./docs/DOCKER_SETUP.md) - Docker guide

---

**Status: ✅ Ready to use! Run `npm start:concurrent` now!**
