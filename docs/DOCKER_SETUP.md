# Hospital Queue Management System - Docker Setup Guide

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

- **Docker** (v20.10 or higher)
- **Docker Compose** (v1.29 or higher)
- **Git**

### Installation Links:
- Docker Desktop: https://www.docker.com/products/docker-desktop
- Docker Compose: https://docs.docker.com/compose/install/

---

## 🚀 Quick Start with Docker

### Option 1: Using Docker Compose (Recommended)

**Step 1:** Clone the repository
```bash
git clone https://github.com/your-username/hospital-queue-system.git
cd hospital-queue-system
```

**Step 2:** Build and start all services
```bash
docker-compose up --build
```

**Step 3:** Access the application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **MongoDB:** localhost:27017
- **Redis:** localhost:6379

### Option 2: Manual Docker Build

**Build Backend Image:**
```bash
docker build -f Dockerfile.backend -t hospital-backend:latest .
```

**Build Frontend Image:**
```bash
docker build -f Dockerfile.frontend -t hospital-frontend:latest .
```

**Run Backend Container:**
```bash
docker run -d -p 5000:5000 --name hospital-backend hospital-backend:latest
```

**Run Frontend Container:**
```bash
docker run -d -p 3000:3000 --name hospital-frontend hospital-frontend:latest
```

---

## 🛑 Stopping Services

```bash
docker-compose down
```

To remove volumes (database data):
```bash
docker-compose down -v
```

---

## 📊 Docker Compose Services

| Service | Port | Purpose |
|---------|------|---------|
| **Backend** | 5000 | Node.js Express API |
| **Frontend** | 3000 | React Web Application |
| **MongoDB** | 27017 | Database |
| **Redis** | 6379 | Queue Management |

---

## 🔍 Useful Commands

**View running containers:**
```bash
docker-compose ps
```

**View logs from all services:**
```bash
docker-compose logs -f
```

**View logs from specific service:**
```bash
docker-compose logs -f backend
```

**Stop specific service:**
```bash
docker-compose stop backend
```

**Restart a service:**
```bash
docker-compose restart frontend
```

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Container exits immediately
```bash
# Check logs
docker-compose logs backend
```

### Network connectivity issues
```bash
# Inspect network
docker network inspect hospital-network
```

---

## 📝 Environment Variables

Edit `.env` file in the `server` directory:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/hospital-queue
JWT_SECRET=your_secret_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
NODE_ENV=development
```

---

## ✅ Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps
```

The `STATUS` column will show `healthy` when services are ready.

---

## 📚 Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose Reference: https://docs.docker.com/compose/compose-file/
- Node.js Best Practices: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/

---
