# Contributing to MTT Poker Solver

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/sperry-entelech/mtt-solver.git
   cd mtt-solver
   ```
3. **Set up upstream remote:**
   ```bash
   git remote add upstream https://github.com/sperry-entelech/mtt-solver.git
   ```
4. **Follow the installation guide:** See [INSTALLATION.md](./INSTALLATION.md)

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run linting
npm run lint
```

### 4. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add new GTO solver endpoint"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Build process, dependencies

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types
- Use explicit return types for public methods
- Follow ESLint rules

### Backend

- Use async/await
- Validate all inputs with Joi
- Use Winston for logging
- Handle errors properly

### Frontend

- Use functional components with hooks
- Use TypeScript for all components
- Follow React best practices
- Use Tailwind CSS for styling

## Testing Guidelines

### Backend Tests

- Write unit tests for services
- Write integration tests for routes
- Aim for >80% code coverage
- Test edge cases and error conditions

### Frontend Tests

- Test component rendering
- Test user interactions
- Test API integration
- Use React Testing Library

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** (if applicable)
5. **Create descriptive PR** with:
   - What changed
   - Why it changed
   - How to test

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No console errors/warnings
- [ ] Code is properly commented

## Reporting Issues

### Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version, etc.)
- Screenshots (if applicable)

### Feature Requests

Include:
- Description of the feature
- Use case/justification
- Proposed implementation (if you have ideas)

## Questions?

- Open an issue for discussion
- Check existing documentation
- Review code examples in the codebase

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn

Thank you for contributing! 🎉

