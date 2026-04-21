# Contributing to Hospital Queue Management System

## 📋 Before You Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/hospital-queue-system.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`

---

## 🔧 Development Workflow

### 1. Set Up Development Environment
```bash
# Install dependencies for both backend and frontend
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Start Services

**Option A: Using Docker**
```bash
docker-compose up --build
```

**Option B: Manual Setup**
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm start

# Terminal 3: MongoDB (if not running)
mongod

# Terminal 4: Redis (if not running)
redis-server
```

---

## 📝 Code Style Guidelines

### Backend (Node.js)
- Use ES6+ syntax
- Follow ESLint rules
- Use async/await instead of callbacks
- Add comments for complex logic

### Frontend (React)
- Use functional components with hooks
- Follow React best practices
- Use meaningful component names
- Keep components small and reusable

---

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
```

### Run Frontend Tests
```bash
cd client
npm test
```

---

## 📦 Commit Guidelines

**Format:** `<type>(<scope>): <subject>`

Examples:
- `feat(auth): add JWT validation`
- `fix(queue): resolve Redis connection issue`
- `docs(readme): update installation steps`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Tests

---

## 🔄 Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure all tests pass: `npm test`
4. Create descriptive PR title and description
5. Link related issues
6. Request review from maintainers

---

## 📚 Project Structure

```
hospital-queue-system/
├── server/              # Backend API
│   ├── models/         # MongoDB schemas
│   ├── routes/         # Express routes
│   ├── middleware/     # Custom middleware
│   └── server.js       # Entry point
├── client/              # Frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   └── App.js      # Main component
├── docs/                # Documentation
└── docker-compose.yml  # Docker configuration
```

---

## 🤝 Getting Help

- Open an issue for bugs
- Use discussions for questions
- Check existing issues before creating new ones

---

## ✅ Checklist Before Submitting PR

- [ ] Code follows style guidelines
- [ ] Changes are documented
- [ ] Tests added/updated
- [ ] No console errors or warnings
- [ ] Commits are descriptive
- [ ] Branch is up-to-date with main

---
