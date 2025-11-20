# Test Suite Documentation

## Overview

This directory contains comprehensive automated tests for the GitPA application's core functionality. The test suite uses **Vitest** as the testing framework with **Happy-DOM** for DOM emulation.

## Test Coverage

### 📊 Statistics
- **Total Test Files**: 5
- **Total Test Cases**: 109
- **Test Coverage**: Core business logic and utility functions

### 🧪 Test Suites

#### 1. `github-api.test.ts` (17 tests)
Tests the shared GitHub API utilities that power all repository operations.

**Coverage:**
- ✅ URL parsing (`parseGitHubUrl`)
- ✅ Repository file fetching (`fetchRepoFiles`)
- ✅ Repository content tree structure (`fetchRepoContents`)
- ✅ File filtering (extensions, test files, size limits)
- ✅ Recursive directory traversal with depth limits
- ✅ Error handling and edge cases

**Key Test Areas:**
- Valid/invalid GitHub URL formats
- maxFiles, maxDepth, maxFileSize options
- File extension filtering
- Test file exclusion
- Buffer content handling
- API error resilience

#### 2. `security-scan.test.ts` (17 tests)
Tests security vulnerability pattern detection and severity classification.

**Coverage:**
- ✅ Critical vulnerabilities (eval, hardcoded credentials, SQL injection)
- ✅ High severity issues (XSS via innerHTML/document.write)
- ✅ Low severity issues (console statements)
- ✅ Line number accuracy
- ✅ Issue categorization by severity and type
- ✅ Security score calculation

**Key Test Areas:**
- Pattern matching for 14 vulnerability types
- Case-insensitive detection
- Multiple issues in single file
- Line number reporting
- Security score: `100 - (critical * 20) - (high * 10)`

#### 3. `code-review.test.ts` (24 tests)
Tests code metrics calculation and dependency analysis.

**Coverage:**
- ✅ Line counting (code, comments, blank lines)
- ✅ File size analysis (largest file, average size)
- ✅ Language distribution by file extension
- ✅ Import/export extraction
- ✅ External dependency detection
- ✅ Quality score calculation

**Key Test Areas:**
- Comment ratio: `commentLines / codeLines`
- Documentation score: `min(100, commentRatio * 200)`
- Maintainability score: `max(0, 100 - avgFileSize / 10)`
- Dependency score: `max(0, 100 - uniqueDeps * 2)`
- Overall score: average of all 4 scores

#### 4. `refactor.test.ts` (25 tests)
Tests code smell detection and refactoring opportunity identification.

**Coverage:**
- ✅ Long function detection (>50 lines)
- ✅ Nested conditional detection (>4 levels)
- ✅ Magic number detection (2+ digit numbers)
- ✅ Large file detection (>500 lines)
- ✅ Code similarity calculation (Levenshtein distance)
- ✅ Severity classification (High/Medium/Low)

**Key Test Areas:**
- JavaScript, TypeScript, Python function detection
- Arrow functions and traditional functions
- Deeply nested if statements
- Magic numbers in conditionals and loops
- Code duplication detection
- Actionable refactoring suggestions

#### 5. `assist.test.ts` (26 tests)
Tests intelligent file selection and context building for AI assistance.

**Coverage:**
- ✅ Relevance scoring algorithm
- ✅ Path and content matching
- ✅ Priority boosting (README, index, main, app files)
- ✅ Multi-word query handling
- ✅ Context size limiting (80K chars)
- ✅ Query term filtering

**Key Test Areas:**
- Scoring: path match (+10), term match (+5), content occurrences (+1 each)
- Priority boosts: README (+3), index (+2), main (+2), app (+2)
- MAX_FILES_IN_CONTEXT: 10 files
- MAX_TOTAL_CONTEXT_SIZE: 80,000 characters
- Case-insensitive matching
- Unicode and special character handling

## Running Tests

### Run All Tests
```bash
pnpm test
```

### Run Tests Once (CI Mode)
```bash
pnpm test:run
```

### Run Tests with UI
```bash
pnpm test:ui
```

### Run Tests with Coverage
```bash
pnpm test:coverage
```

### Watch Mode (Development)
```bash
pnpm test
```
Tests will re-run automatically when files change.

## Test Architecture

### Mocking Strategy
- **axios**: Fully mocked using Vitest's `vi.mock()` for GitHub API calls
- **Environment Variables**: Mocked `process.env.GITHUB_TOKEN` in test setup
- **No Network Calls**: All tests run offline with mocked responses

### Test Structure
Each test file follows this pattern:
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup mocks and state
  });

  describe('Sub-feature', () => {
    it('should do something specific', () => {
      // Arrange, Act, Assert
    });
  });
});
```

### Edge Cases Covered
- ✅ Empty inputs (files, queries, content)
- ✅ Null/undefined handling
- ✅ Buffer vs String content
- ✅ Unicode characters
- ✅ Very large files/content
- ✅ API errors and failures
- ✅ Mixed line endings (LF/CRLF)
- ✅ Special characters in paths

## Coverage Goals

| Area | Current | Goal |
|------|---------|------|
| GitHub API Utils | 100% | ✅ |
| Security Patterns | 100% | ✅ |
| Code Metrics | 100% | ✅ |
| Code Smells | 95% | ✅ |
| File Relevance | 100% | ✅ |

## Configuration

### `vitest.config.ts`
```typescript
{
  environment: 'happy-dom',
  globals: true,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html']
  }
}
```

## Adding New Tests

### 1. Create Test File
```typescript
import { describe, it, expect } from 'vitest';

describe('New Feature', () => {
  it('should work correctly', () => {
    // Your test here
  });
});
```

### 2. Mock External Dependencies
```typescript
import { vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

beforeEach(() => {
  vi.clearAllMocks();
});
```

### 3. Test Edge Cases
- Empty inputs
- Null/undefined
- Errors and exceptions
- Boundary conditions

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:
```bash
# In CI environment
pnpm test:run --reporter=json --outputFile=test-results.json
```

## Performance

- **Total Duration**: ~1.2 seconds
- **Transform Time**: ~480ms
- **Test Execution**: ~73ms
- **Environment Setup**: ~3s

All tests run in parallel for maximum speed.

## Troubleshooting

### Tests Failing
1. Clear node_modules: `rm -rf node_modules && pnpm install`
2. Clear Vitest cache: `pnpm test:run --no-cache`
3. Check TypeScript: `pnpm exec vue-tsc -b --noEmit`

### Mock Issues
- Ensure `vi.clearAllMocks()` in `beforeEach()`
- Verify mock setup before test execution
- Check mock return values match expected types

### Coverage Issues
Run with coverage to identify gaps:
```bash
pnpm test:coverage
```
Open `coverage/index.html` to view detailed report.

## Future Enhancements

- [ ] Add integration tests for full API endpoints
- [ ] Add E2E tests with Playwright
- [ ] Add performance benchmarks
- [ ] Add mutation testing
- [ ] Increase coverage to 100%

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure all tests pass: `pnpm test:run`
3. Check coverage: `pnpm test:coverage`
4. Update this README with new test descriptions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Happy-DOM](https://github.com/capricorn86/happy-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
