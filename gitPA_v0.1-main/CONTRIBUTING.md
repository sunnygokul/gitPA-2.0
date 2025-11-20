# Contributing to gitPA 2.0

Thank you for your interest in contributing to gitPA! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow project guidelines

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.x or 10.x
- GitHub Personal Access Token (required)
- Google Gemini API Key (recommended - 1,500 requests/day FREE)
- Groq API Key (recommended - 14,400 requests/day FREE)
- HuggingFace API Key (optional fallback)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sunnygokul/gitPA-2.0.git
   cd gitPA-2.0/frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create `.env` file in `frontend/` directory:
   ```env
   VITE_GITHUB_TOKEN=your_github_token
   VITE_HUGGINGFACE_API_KEY=your_huggingface_key
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

## 🔄 Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Example: `feature/add-code-metrics`, `fix/security-scan-bug`

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]
[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(security): add XSS vulnerability detection
fix(scan): resolve ESM import error on Vercel
docs(readme): update deployment instructions
test(code-review): add edge case tests
```

## 📝 Code Standards

### TypeScript

- **Strict mode enabled** - No `@ts-nocheck` or `any` types
- **Explicit types** - Always type function parameters and returns
- **ESM imports** - Use `.js` extensions for local imports

```typescript
// ✅ Good
import { fetchRepoFiles } from './utils/github-api.js';
export function processData(input: string): Result { ... }

// ❌ Bad
import { fetchRepoFiles } from './utils/github-api';
export function processData(input) { ... }
```

### Vue Components

- **Composition API** - Use `<script setup>` syntax
- **TypeScript** - Add types to props and emits
- **Single Responsibility** - One component, one purpose

```vue
<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  repoUrl: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  scan: [url: string];
}>();
</script>
```

### File Organization

```
frontend/
├── api/                    # Serverless functions
│   └── repo/
│       ├── *.ts           # Endpoint handlers
│       └── utils/         # Shared utilities
├── src/
│   ├── components/        # Vue components
│   ├── stores/           # Pinia stores
│   └── utils/            # Frontend utilities
└── tests/                # Test suites
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test:ui

# Run once (CI mode)
pnpm test:run

# Generate coverage
pnpm test:coverage
```

### Writing Tests

- **Comprehensive coverage** - Test happy paths, edge cases, and errors
- **Descriptive names** - Use `describe` and `it` clearly
- **Mock external dependencies** - axios, environment variables

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('fetchRepoFiles', () => {
  it('should fetch files successfully', async () => {
    // Arrange
    vi.mock('axios');
    
    // Act
    const result = await fetchRepoFiles('owner', 'repo');
    
    // Assert
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('path');
  });

  it('should handle API errors gracefully', async () => {
    // Test error handling
  });
});
```

### Test Coverage Goals

- **Unit tests**: 90%+ coverage
- **Integration tests**: Key user flows
- **E2E tests**: Critical paths (future)

## 🔒 Security

### Input Validation

All user inputs MUST be validated:

```typescript
// Validate GitHub URLs
if (!url || typeof url !== 'string') {
  throw new Error('Invalid URL');
}

// Check for path traversal
if (filePath.includes('..')) {
  throw new Error('Path traversal detected');
}
```

### Secrets Management

- **Never commit** `.env` files
- **Use environment variables** for all secrets
- **Mask sensitive data** in logs

```typescript
// ✅ Good
console.log('Has token:', !!process.env.GITHUB_TOKEN);

// ❌ Bad
console.log('Token:', process.env.GITHUB_TOKEN);
```

## 📦 Pull Request Process

### Before Submitting

1. **Run tests** - `pnpm test:run`
2. **Check types** - `pnpm type-check`
3. **Lint code** - Fix any ESLint warnings
4. **Update docs** - If adding features
5. **Test locally** - Verify functionality

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated checks** - Tests, types, linting
2. **Code review** - Maintainer review
3. **Testing** - Manual verification
4. **Merge** - Squash and merge to main

## 🎯 Areas for Contribution

### High Priority

- [ ] Add more test coverage (current: 109 tests)
- [ ] Improve error handling in API endpoints
- [ ] Add rate limiting protection
- [ ] Implement caching strategies

### Medium Priority

- [ ] Add more security vulnerability patterns
- [ ] Improve AI prompt engineering
- [ ] Add code complexity metrics
- [ ] Create E2E tests

### Low Priority

- [ ] UI/UX improvements
- [ ] Performance optimizations
- [ ] Add more language support
- [ ] Documentation enhancements

## 📚 Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Guide](https://vitest.dev/guide/)
- [Vercel Functions](https://vercel.com/docs/functions)

## 💬 Questions?

- Open a [GitHub Issue](https://github.com/sunnygokul/gitPA-2.0/issues)
- Join discussions in Issues/PRs
- Check existing documentation

## 🙏 Recognition

Contributors are recognized in:
- GitHub Contributors page
- Release notes
- Project documentation

Thank you for contributing to gitPA! 🚀
