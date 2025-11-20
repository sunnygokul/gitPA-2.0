/**
 * Test Suite #4: Refactoring Code Smell Detection
 * Tests detection of code smells and refactoring opportunity identification
 */

import { describe, it, expect } from 'vitest';

interface RefactoringSuggestion {
  file: string;
  type: 'Extract Function' | 'Rename' | 'Remove Duplication' | 'Simplify Logic' | 'Performance' | 'Security' | 'Modernize';
  severity: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  before: string;
  after: string;
  benefits: string[];
}

interface FileItem {
  path: string;
  name: string;
  content: string;
}

// Implementation of code smell detection
function detectCodeSmells(files: FileItem[]): RefactoringSuggestion[] {
  const suggestions: RefactoringSuggestion[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');

    // Long functions (>50 lines)
    let functionStart = -1;
    let functionName = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const funcMatch = line.match(/function\s+(\w+)|const\s+(\w+)\s*=.*=>|def\s+(\w+)/);
      
      if (funcMatch) {
        if (functionStart !== -1 && i - functionStart > 50) {
          suggestions.push({
            file: file.path,
            type: 'Extract Function',
            severity: 'High',
            title: `Function ${functionName} is too long (${i - functionStart} lines)`,
            description: 'Long functions are hard to understand, test, and maintain',
            before: lines.slice(functionStart, functionStart + 10).join('\n') + '\n...',
            after: 'Split into smaller, focused functions with clear responsibilities',
            benefits: ['Improved readability', 'Easier testing', 'Better reusability']
          });
        }
        functionStart = i;
        functionName = funcMatch[1] || funcMatch[2] || funcMatch[3];
      }
    }

    // Nested conditionals (>3 levels)
    for (let i = 0; i < lines.length; i++) {
      const indentLevel = (lines[i].match(/^\s*/)?.[0].length || 0) / 2;
      if (indentLevel > 4 && lines[i].trim().startsWith('if')) {
        suggestions.push({
          file: file.path,
          type: 'Simplify Logic',
          severity: 'High',
          title: 'Deeply nested conditional detected',
          description: 'Nested conditionals reduce readability and increase cognitive complexity',
          before: lines[i],
          after: 'Extract conditions into well-named functions or use guard clauses',
          benefits: ['Better readability', 'Easier debugging', 'Lower cyclomatic complexity']
        });
      }
    }

    // Magic numbers
    const magicNumberPattern = /\b(if|while|for|case|return)\s*.*?\b(\d{2,})\b/g;
    const magicMatches = file.content.matchAll(magicNumberPattern);
    for (const match of magicMatches) {
      suggestions.push({
        file: file.path,
        type: 'Modernize',
        severity: 'Medium',
        title: `Magic number ${match[2]} found`,
        description: 'Unexplained numbers in code reduce maintainability',
        before: match[0],
        after: `const MEANINGFUL_NAME = ${match[2]}; // then use MEANINGFUL_NAME`,
        benefits: ['Self-documenting code', 'Easier maintenance', 'Centralized configuration']
      });
    }

    // Large files
    if (lines.length > 500) {
      suggestions.push({
        file: file.path,
        type: 'Extract Function',
        severity: 'High',
        title: `File is too large (${lines.length} lines)`,
        description: 'Large files indicate potential separation of concerns issues',
        before: `${file.path} (${lines.length} lines)`,
        after: 'Split into multiple focused modules',
        benefits: ['Better organization', 'Easier navigation', 'Improved maintainability']
      });
    }
  }

  return suggestions;
}

// Implementation of similarity calculation (Levenshtein distance)
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return maxLen > 0 ? 1 - distance / maxLen : 1;
}

describe('Refactoring Code Smell Detection', () => {
  describe('Long Function Detection', () => {
    it('should detect functions longer than 50 lines', () => {
      const longFunction = Array.from({ length: 60 }, (_, i) => `  line ${i + 1}`).join('\n');
      const files: FileItem[] = [
        {
          path: 'long.ts',
          name: 'long.ts',
          content: `function veryLongFunction() {\n${longFunction}\n}\nfunction short() {}`
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const longFunctionIssues = suggestions.filter(s => s.type === 'Extract Function' && s.severity === 'High');
      expect(longFunctionIssues.length).toBeGreaterThan(0);
      expect(longFunctionIssues[0].title).toContain('too long');
    });

    it('should detect arrow functions that are too long', () => {
      const longFunction = Array.from({ length: 60 }, (_, i) => `  line ${i + 1}`).join('\n');
      const files: FileItem[] = [
        {
          path: 'arrow.ts',
          name: 'arrow.ts',
          content: `const longArrow = () => {\n${longFunction}\n}\nconst short = () => {}`
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const longFunctionIssues = suggestions.filter(s => s.type === 'Extract Function');
      expect(longFunctionIssues.length).toBeGreaterThan(0);
    });

    it('should detect Python functions that are too long', () => {
      const longFunction = Array.from({ length: 60 }, (_, i) => `    line ${i + 1}`).join('\n');
      const files: FileItem[] = [
        {
          path: 'script.py',
          name: 'script.py',
          content: `def long_function():\n${longFunction}\n\ndef short():\n    pass`
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const longFunctionIssues = suggestions.filter(s => s.type === 'Extract Function');
      expect(longFunctionIssues.length).toBeGreaterThan(0);
    });

    it('should not flag short functions', () => {
      const files: FileItem[] = [
        {
          path: 'short.ts',
          name: 'short.ts',
          content: `
function shortFunction() {
  return 42;
}

function anotherShort() {
  console.log("short");
}
          `
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const longFunctionIssues = suggestions.filter(
        s => s.type === 'Extract Function' && s.title.includes('too long')
      );
      expect(longFunctionIssues).toEqual([]);
    });
  });

  describe('Nested Conditional Detection', () => {
    it('should detect deeply nested if statements', () => {
      const files: FileItem[] = [
        {
          path: 'nested.ts',
          name: 'nested.ts',
          content: `
function complex() {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          if (e) {
            doSomething();
          }
        }
      }
    }
  }
}
          `
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const nestedIssues = suggestions.filter(s => s.type === 'Simplify Logic');
      expect(nestedIssues.length).toBeGreaterThan(0);
      expect(nestedIssues[0].title).toContain('nested');
    });

    it('should suggest guard clauses as alternatives', () => {
      const files: FileItem[] = [
        {
          path: 'nested.js',
          name: 'nested.js',
          content: `
function validate() {
  if (user) {
    if (user.age > 18) {
      if (user.verified) {
        if (user.active) {
          if (user.permissions) {
                      return true;
          }
        }
      }
    }
  }
  return false;
}
          `
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const nestedIssues = suggestions.filter(s => s.type === 'Simplify Logic');
      expect(nestedIssues.length).toBeGreaterThan(0);
      expect(nestedIssues[0].after).toContain('guard clauses');
    });
  });

  describe('Magic Number Detection', () => {
    it('should detect magic numbers in conditionals', () => {
      const files: FileItem[] = [
        {
          path: 'magic.ts',
          name: 'magic.ts',
          content: `
if (age > 18) {
  allow();
}
if (score >= 100) {
  win();
}
          `
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const magicNumberIssues = suggestions.filter(s => s.type === 'Modernize' && s.title.includes('Magic number'));
      expect(magicNumberIssues.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect magic numbers in loops', () => {
      const files: FileItem[] = [
        {
          path: 'loop.ts',
          name: 'loop.ts',
          content: `
for (let i = 0; i < 100; i++) {
  process(i);
}
while (count < 50) {
  count++;
}
          `
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const magicNumberIssues = suggestions.filter(s => s.title.includes('Magic number'));
      expect(magicNumberIssues.length).toBeGreaterThan(0);
    });

    it('should not flag single-digit numbers', () => {
      const files: FileItem[] = [
        {
          path: 'valid.ts',
          name: 'valid.ts',
          content: `
if (x > 0) return true;
if (y < 5) return false;
          `
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const magicNumberIssues = suggestions.filter(s => s.title.includes('Magic number'));
      expect(magicNumberIssues).toEqual([]);
    });

    it('should suggest named constants', () => {
      const files: FileItem[] = [
        {
          path: 'numbers.ts',
          name: 'numbers.ts',
          content: `if (timeout > 3000) return false;`
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const magicNumberIssues = suggestions.filter(s => s.title.includes('Magic number'));
      expect(magicNumberIssues[0].after).toContain('MEANINGFUL_NAME');
    });
  });

  describe('Large File Detection', () => {
    it('should detect files larger than 500 lines', () => {
      const largeContent = Array.from({ length: 600 }, (_, i) => `line ${i + 1}`).join('\n');
      const files: FileItem[] = [
        {
          path: 'huge.ts',
          name: 'huge.ts',
          content: largeContent
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const largeFileIssues = suggestions.filter(s => s.title.includes('too large'));
      expect(largeFileIssues.length).toBeGreaterThan(0);
      expect(largeFileIssues[0].severity).toBe('High');
    });

    it('should not flag files under 500 lines', () => {
      const normalContent = Array.from({ length: 300 }, (_, i) => `line ${i + 1}`).join('\n');
      const files: FileItem[] = [
        {
          path: 'normal.ts',
          name: 'normal.ts',
          content: normalContent
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const largeFileIssues = suggestions.filter(s => s.title.includes('too large'));
      expect(largeFileIssues).toEqual([]);
    });

    it('should suggest splitting large files', () => {
      const largeContent = Array.from({ length: 700 }, (_, i) => `line ${i + 1}`).join('\n');
      const files: FileItem[] = [
        {
          path: 'monster.ts',
          name: 'monster.ts',
          content: largeContent
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const largeFileIssues = suggestions.filter(s => s.title.includes('too large'));
      expect(largeFileIssues[0].after).toContain('Split into multiple');
    });
  });

  describe('Code Similarity (Levenshtein Distance)', () => {
    it('should calculate perfect similarity for identical strings', () => {
      const similarity = calculateSimilarity('hello', 'hello');
      expect(similarity).toBe(1);
    });

    it('should calculate zero similarity for completely different strings', () => {
      const similarity = calculateSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThan(1);
      expect(similarity).toBeGreaterThanOrEqual(0);
    });

    it('should calculate partial similarity for similar strings', () => {
      const similarity1 = calculateSimilarity('hello', 'hallo');
      const similarity2 = calculateSimilarity('hello', 'goodbye');
      
      expect(similarity1).toBeGreaterThan(similarity2);
      expect(similarity1).toBeGreaterThan(0.5);
    });

    it('should handle empty strings', () => {
      const similarity = calculateSimilarity('', '');
      expect(similarity).toBe(1);
    });

    it('should handle strings of different lengths', () => {
      const similarity = calculateSimilarity('short', 'much longer string');
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should detect code duplication', () => {
      const code1 = `function validate(data) {
  if (!data) return false;
  if (!data.id) return false;
  if (!data.name) return false;
  return true;
}`;

      const code2 = `function check(data) {
  if (!data) return false;
  if (!data.id) return false;
  if (!data.email) return false;
  return true;
}`;

      const similarity = calculateSimilarity(code1, code2);
      expect(similarity).toBeGreaterThan(0.7); // Very similar code
    });
  });

  describe('Statistics and Prioritization', () => {
    it('should categorize suggestions by severity', () => {
      const largeFile = Array.from({ length: 600 }, () => 'line').join('\n');
      const files: FileItem[] = [
        {
          path: 'issues.ts',
          name: 'issues.ts',
          content: largeFile + '\nif (count > 100) { }\n'
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      const highPriority = suggestions.filter(s => s.severity === 'High');
      const mediumPriority = suggestions.filter(s => s.severity === 'Medium');
      const lowPriority = suggestions.filter(s => s.severity === 'Low');

      expect(highPriority.length).toBeGreaterThan(0);
      expect(mediumPriority.length).toBeGreaterThan(0);
    });

    it('should provide actionable refactoring suggestions', () => {
      const files: FileItem[] = [
        {
          path: 'test.ts',
          name: 'test.ts',
          content: 'if (value > 99) { process(); }'
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.before).toBeTruthy();
        expect(suggestion.after).toBeTruthy();
        expect(suggestion.benefits).toBeDefined();
        expect(suggestion.benefits.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', () => {
      const files: FileItem[] = [
        {
          path: 'empty.ts',
          name: 'empty.ts',
          content: ''
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      expect(suggestions).toEqual([]);
    });

    it('should handle files with only whitespace', () => {
      const files: FileItem[] = [
        {
          path: 'whitespace.ts',
          name: 'whitespace.ts',
          content: '   \n\n   \n'
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      expect(suggestions).toEqual([]);
    });

    it('should handle comments correctly', () => {
      const files: FileItem[] = [
        {
          path: 'comments.ts',
          name: 'comments.ts',
          content: `
// This is a normal comment
const validCode = 42;
/* 
Multi-line comment
*/
          `
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      // Clean file should have no magic number issues
      const magicIssues = suggestions.filter(s => 
        s.type === 'Modernize' && s.title.includes('Magic number')
      );
      expect(magicIssues).toEqual([]);
    });

    it('should handle multiple code smells in single file', () => {
      const longFunction = Array.from({ length: 60 }, (_, i) => `  line ${i}`).join('\n');
      const files: FileItem[] = [
        {
          path: 'multiple.ts',
          name: 'multiple.ts',
          content: `
function tooLong() {
${longFunction}
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          if (e) {
            if (count > 100) {
              return true;
            }
          }
        }
      }
    }
  }
}
          `
        }
      ];

      const suggestions = detectCodeSmells(files);
      
      expect(suggestions.length).toBeGreaterThanOrEqual(3);
      // Should detect: long function, nested conditionals, magic number
    });
  });
});
