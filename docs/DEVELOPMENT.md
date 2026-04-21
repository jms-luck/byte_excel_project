# Development Setup Guide

## 🖥️ Local Development (Without Docker)

### Prerequisites
- Node.js v18 or higher
- MongoDB
- Redis
- npm or yarn

---

## Backend Setup

### 1. Navigate to server directory
```bash
cd server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```bash
# server/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hospital-queue
JWT_SECRET=your_secret_key_here
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
NODE_ENV=development
```

### 4. Start MongoDB
```bash
# Using MongoDB locally
mongod
```

### 5. Start Redis
```bash
# Using Redis locally
redis-server
```

### 6. Start backend server
```bash
npm start
```

Backend will run on: **http://localhost:5000**

---

## Frontend Setup

### 1. Navigate to client directory
```bash
cd client
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm start
```

Frontend will run on: **http://localhost:3000**

---

## Available Scripts

### Backend
- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-reload)

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

---

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### Queue Management
```
POST /api/queue/token
GET /api/queue/status
POST /api/queue/next
```

### Doctor Dashboard
```
GET /api/doctor/dashboard
```

---

## Database Setup

### MongoDB
```bash
# Install MongoDB Community Edition
# macOS: brew install mongodb-community
# Windows: Download from https://www.mongodb.com/try/download/community
# Ubuntu: sudo apt-get install -y mongodb

# Start MongoDB
mongod
```

### Redis
```bash
# Install Redis
# macOS: brew install redis
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Ubuntu: sudo apt-get install -y redis-server

# Start Redis
redis-server
```

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

### Redis Connection Error
- Ensure Redis is running: `redis-server`
- Verify port 6379 is accessible

### Port Already in Use
- Backend (5000): `lsof -i :5000` then `kill -9 <PID>`
- Frontend (3000): `lsof -i :3000` then `kill -9 <PID>`

---
