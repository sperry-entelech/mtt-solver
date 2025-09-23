# MTT Poker Solver

A comprehensive Multi-Table Tournament poker solver with ICM calculations, hand evaluation, and optimal strategy generation.

## Features

### Core Functionality
- **ICM Calculator**: Real-time Independent Chip Model calculations with bubble factor analysis
- **Hand Evaluation Engine**: Fast 7-card hand evaluation with equity calculations
- **Range Analysis**: Hand range parsing, manipulation, and equity calculations
- **Nash Equilibrium Solver**: Optimal push/fold scenarios for tournament play
- **Push/Fold Charts**: Generate optimal ranges based on stack sizes and ICM
- **Hand Analyzer**: Comprehensive hand analysis with position-aware recommendations

### Frontend Features
- **Interactive Dashboard**: Real-time ICM calculations with visual charts
- **Visual Card Selector**: Intuitive card selection interface
- **Range Visualization**: Heat maps and interactive range grids
- **Scenario Builder**: Custom tournament situation analysis
- **Hand History Analyzer**: Upload and analyze tournament hands
- **Responsive Design**: Works on desktop and mobile devices

### Technical Features
- **Real-time Calculations**: Sub-second response times for complex scenarios
- **Caching Layer**: Redis-powered caching for performance optimization
- **RESTful API**: Comprehensive API for all solver functions
- **TypeScript**: Full type safety across frontend and backend
- **Docker Deployment**: Production-ready containerized deployment

## Quick Start

### Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mtt-poker-solver
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api

### Development Setup

#### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

### Core Endpoints

#### Solver API
- `POST /api/solve` - Solve tournament scenarios
- `POST /api/solve/push-fold` - Calculate push/fold decisions
- `POST /api/solve/multi-way` - Analyze multi-way scenarios

#### ICM API
- `POST /api/icm/calculate` - Calculate ICM equity
- `POST /api/icm/bubble-factor` - Calculate bubble factors
- `POST /api/icm/push-fold-ev` - Calculate push/fold expected value

#### Range API
- `GET /api/ranges/:position` - Get positional ranges
- `POST /api/ranges/parse` - Parse range strings
- `POST /api/ranges/equity` - Calculate range vs range equity

#### Hand API
- `POST /api/hands/analyze` - Analyze specific hands
- `POST /api/hands/evaluate` - Evaluate hand strength
- `POST /api/hands/equity` - Calculate hand vs hand equity

#### Charts API
- `GET /api/charts/push-fold` - Generate push/fold charts
- `POST /api/charts/custom` - Generate custom strategy charts

## Database Schema

```sql
-- Core tables
tournaments (id, name, structure, payouts)
scenarios (id, tournament_id, players, stacks, blinds, position)
hands (id, scenario_id, hole_cards, action, result)
ranges (id, position, range_string, description)
results (id, scenario_id, optimal_action, equity, ev)
```

## Performance Metrics

- **Hand Evaluations**: <1ms per calculation
- **ICM Calculations**: <100ms for complex scenarios
- **Range vs Range Equity**: <500ms for 1000 iterations
- **Concurrent Users**: Supports 100+ simultaneous calculations

## Architecture

### Backend Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware stack
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for performance optimization
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston with structured logging

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS with custom poker themes
- **State Management**: React Query for server state
- **Animations**: Framer Motion for smooth interactions
- **Routing**: React Router for SPA navigation

### Deployment
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for development
- **Load Balancing**: Nginx for production scaling
- **Health Checks**: Comprehensive service monitoring

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
# Build all services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Or build individually
cd backend && npm run build
cd frontend && npm run build
```

### Code Quality
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style
- **Type Safety**: Strict TypeScript configuration
- **Error Handling**: Comprehensive error boundaries

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:
- Open an issue on GitHub
- Check the API documentation at `/api`
- Review the comprehensive test suite for usage examples

## Roadmap

- [ ] Advanced range visualization with drag-select
- [ ] Multi-table tournament simulation
- [ ] Hand history import from major poker sites
- [ ] Mobile app with React Native
- [ ] Real-time multiplayer scenarios
- [ ] Machine learning for opponent modeling
- [ ] Advanced ICM calculation methods
- [ ] Tournament tracking and statistics

---

**Built with ❤️ for the poker community**