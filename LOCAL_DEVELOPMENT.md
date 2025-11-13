# Local Development Guide

This guide is for developers who want to contribute to or modify the MTT Poker Solver codebase.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Database Management](#database-management)
- [Debugging](#debugging)

## Prerequisites

- Node.js 18+ with npm
- Docker Desktop (for databases)
- Git
- Code editor (VS Code recommended)

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sperry-entelech/mtt-solver.git
cd mtt-solver
```

### 2. Install Dependencies

```bash
# Install all dependencies
.\install-all.bat

# Or manually:
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Start Development Environment

#### Option A: Full Docker Setup

```bash
# Start all services (backend, frontend, databases)
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migration:migrate

# View logs
docker-compose logs -f
```

#### Option B: Hybrid Setup (Recommended for Development)

```bash
# Start only databases with Docker
docker-compose up -d postgres redis

# Start backend in development mode (separate terminal)
cd backend
npm run dev

# Start frontend in development mode (separate terminal)
cd frontend
npm run dev
```

### 4. Configure Environment Variables

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mtt_poker_solver
DB_USER=postgres
DB_PASSWORD=poker_password_2024
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_2024
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev-secret-key-change-in-production
ENABLE_METRICS=false
RUN_MIGRATIONS=true
```

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

## Project Structure

```
mtt-solver/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   ├── database.ts   # Database connection
│   │   │   └── migrations.ts # Migration manager
│   │   ├── middleware/       # Express middleware
│   │   │   ├── errorHandler.ts
│   │   │   └── monitoring.ts
│   │   ├── routes/           # API routes
│   │   │   ├── solver.ts
│   │   │   ├── icm.ts
│   │   │   ├── hands.ts
│   │   │   ├── ranges.ts
│   │   │   ├── charts.ts
│   │   │   └── gto.ts
│   │   ├── services/          # Business logic
│   │   │   ├── icmCalculator.ts
│   │   │   ├── handEvaluator.ts
│   │   │   ├── rangeAnalyzer.ts
│   │   │   ├── gtoSolver.ts
│   │   │   └── solutionDatabase.ts
│   │   ├── websocket/         # WebSocket handlers
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── tests/                 # Test files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   └── types/             # TypeScript types
│   └── package.json
└── docker-compose.yml
```

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Test your changes:**
   ```bash
   # Backend tests
   cd backend
   npm test

   # Frontend tests
   cd frontend
   npm test
   ```

4. **Check code style:**
   ```bash
   # Backend linting
   cd backend
   npm run lint

   # Frontend linting
   cd frontend
   npm run lint
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

### Hot Reload

Both backend and frontend support hot reload:

- **Backend**: Uses `ts-node` with watch mode - changes are automatically reloaded
- **Frontend**: Uses Vite HMR - changes are instantly reflected in the browser

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
cd backend
npm test

# Run frontend tests only
cd frontend
npm test

# Run tests in watch mode
cd backend
npm test -- --watch
```

### Writing Tests

#### Backend Tests (Jest)

```typescript
// backend/src/services/__tests__/icmCalculator.test.ts
import { ICMCalculator } from '../icmCalculator';

describe('ICMCalculator', () => {
  it('should calculate ICM equity correctly', () => {
    const stacks = [100, 80, 60, 40];
    const payouts = [50, 30, 20];
    const result = ICMCalculator.calculateICM(stacks, payouts, 0);
    expect(result.equity).toBeGreaterThan(0);
  });
});
```

#### Frontend Tests (Vitest)

```typescript
// frontend/src/components/__tests__/Card.test.tsx
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders card correctly', () => {
    render(<Card rank="A" suit="s" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for public methods
- Follow ESLint rules

### Backend Code Style

- Use async/await instead of promises
- Use Joi for validation
- Use Winston for logging
- Follow Express.js best practices

### Frontend Code Style

- Use functional components with hooks
- Use TypeScript for all components
- Follow React best practices
- Use Tailwind CSS for styling

## API Development

### Adding a New Endpoint

1. **Create route file** (if needed) in `backend/src/routes/`

2. **Add route handler:**
   ```typescript
   import express from 'express';
   import { asyncHandler, validateBody } from '../middleware/errorHandler';
   
   const router = express.Router();
   
   router.post('/your-endpoint', 
     validateBody(yourSchema),
     asyncHandler(async (req, res) => {
       // Your logic here
       res.json({ success: true, data: result });
     })
   );
   
   export default router;
   ```

3. **Register route** in `backend/src/index.ts`:
   ```typescript
   import yourRoutes from './routes/your-routes';
   app.use('/api/your-prefix', yourRoutes);
   ```

### Adding Validation

```typescript
import Joi from 'joi';

const yourSchema = Joi.object({
  field1: Joi.string().required(),
  field2: Joi.number().min(0).required(),
});

router.post('/endpoint', validateBody(yourSchema), ...);
```

## Frontend Development

### Adding a New Page

1. **Create page component** in `frontend/src/pages/YourPage.tsx`:
   ```typescript
   import React from 'react';
   
   const YourPage: React.FC = () => {
     return (
       <div>
         <h1>Your Page</h1>
       </div>
     );
   };
   
   export default YourPage;
   ```

2. **Add route** in `frontend/src/App.tsx`:
   ```typescript
   import YourPage from './pages/YourPage';
   
   <Route path="/your-page" element={<YourPage />} />
   ```

### Using WebSocket

```typescript
import { useWebSocket } from '../hooks/useWebSocket';

const MyComponent: React.FC = () => {
  const { isConnected, requestSolver, subscribe } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe('solver:response', (data) => {
      console.log('Received:', data);
    });
    return unsubscribe;
  }, [subscribe]);
  
  const handleSolve = async () => {
    const result = await requestSolver({
      type: 'scenario',
      data: { /* your data */ }
    });
  };
};
```

## Database Management

### Creating Migrations

```bash
cd backend
npm run migration:create your-migration-name
```

This creates a new file in `backend/src/migrations/` with up and down SQL.

### Running Migrations

```bash
# Run all pending migrations
npm run migration:migrate

# Rollback last migration
npm run migration:rollback

# Rollback to specific version
npm run migration:rollback <version>
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d mtt_poker_solver

# Connect to Redis
docker-compose exec redis redis-cli -a redis_password_2024
```

## Debugging

### Backend Debugging

1. **Use VS Code debugger:**
   - Create `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "name": "Debug Backend",
         "runtimeExecutable": "npm",
         "runtimeArgs": ["run", "dev"],
         "cwd": "${workspaceFolder}/backend",
         "console": "integratedTerminal"
       }
     ]
   }
   ```

2. **Use console.log or logger:**
   ```typescript
   import { logger } from '../utils/logger';
   logger.info('Debug message', { data });
   ```

### Frontend Debugging

1. **Use React DevTools** browser extension
2. **Use browser console**
3. **Use VS Code debugger** with Chrome debugger

### Database Debugging

```bash
# View PostgreSQL logs
docker-compose logs postgres

# View Redis logs
docker-compose logs redis

# Check database connections
docker-compose exec backend npm run migration:migrate
```

## Common Development Tasks

### Adding a New Service

1. Create file in `backend/src/services/YourService.ts`
2. Export class or functions
3. Import and use in routes

### Adding a New Component

1. Create file in `frontend/src/components/YourComponent.tsx`
2. Export component
3. Import and use in pages

### Updating Dependencies

```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd frontend
npm update
npm audit fix
```

## Performance Optimization

### Backend

- Use Redis caching for expensive calculations
- Implement database query optimization
- Use connection pooling
- Monitor with `/metrics` endpoint

### Frontend

- Use React.memo for expensive components
- Implement code splitting
- Use lazy loading for routes
- Optimize bundle size

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Module Not Found

```bash
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Database Connection Issues

```bash
# Restart database
docker-compose restart postgres

# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres
```

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

Happy Coding! 🚀

