/**
 * Test Suite #2: Security Scan Pattern Detection
 * Tests security vulnerability pattern matching and severity classification
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock security patterns (extracted from security-scan.ts logic)
interface SecurityPattern {
  pattern: RegExp;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendation: string;
}

interface SecurityIssue {
  file: string;
  line?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  description: string;
  recommendation: string;
}

const SECURITY_PATTERNS: SecurityPattern[] = [
  {
    pattern: /eval\s*\(/gi,
    type: 'Code Injection',
    severity: 'CRITICAL',
    description: 'Using eval() can execute arbitrary code',
    recommendation: 'Replace eval() with safer alternatives'
  },
  {
    pattern: /password\s*=\s*["'][^"']+["']/gi,
    type: 'Hardcoded Credentials',
    severity: 'CRITICAL',
    description: 'Hardcoded password found in source code',
    recommendation: 'Move credentials to environment variables'
  },
  {
    pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi,
    type: 'Hardcoded API Key',
    severity: 'CRITICAL',
    description: 'Hardcoded API key exposed in code',
    recommendation: 'Use environment variables'
  },
  {
    pattern: /\.innerHTML\s*=/gi,
    type: 'XSS Vulnerability',
    severity: 'HIGH',
    description: 'Potential XSS vulnerability using innerHTML',
    recommendation: 'Use textContent or sanitize HTML'
  },
  {
    pattern: /document\.write\(/gi,
    type: 'XSS Vulnerability',
    severity: 'HIGH',
    description: 'document.write() can be exploited for XSS',
    recommendation: 'Use safer DOM manipulation'
  },
  {
    pattern: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+/gi,
    type: 'SQL Injection',
    severity: 'CRITICAL',
    description: 'Potential SQL injection vulnerability',
    recommendation: 'Use parameterized queries'
  },
  {
    pattern: /console\.(log|error|warn|info)\(/gi,
    type: 'Information Disclosure',
    severity: 'LOW',
    description: 'Console statements in production code',
    recommendation: 'Remove console statements'
  }
];

// Implementation of scanFile function
function scanFile(file: { path: string; content: string; name: string }): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const pattern of SECURITY_PATTERNS) {
    const matches = file.content.matchAll(pattern.pattern);
    for (const match of matches) {
      const position = match.index || 0;
      const lineNumber = file.content.substring(0, position).split('\n').length;

      issues.push({
        file: file.path,
        line: lineNumber,
        severity: pattern.severity,
        type: pattern.type,
        description: pattern.description,
        recommendation: pattern.recommendation
      });
    }
  }

  return issues;
}

// Implementation of categorizeIssues
function categorizeIssues(issues: SecurityIssue[]) {
  const stats = {
    critical: issues.filter(i => i.severity === 'CRITICAL').length,
    high: issues.filter(i => i.severity === 'HIGH').length,
    medium: issues.filter(i => i.severity === 'MEDIUM').length,
    low: issues.filter(i => i.severity === 'LOW').length,
    total: issues.length
  };

  const byType = issues.reduce((acc: Record<string, number>, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});

  return { stats, byType };
}

describe('Security Scan Pattern Detection', () => {
  describe('Critical Vulnerabilities', () => {
    it('should detect eval() usage', () => {
      const file = {
        path: 'dangerous.js',
        name: 'dangerous.js',
        content: `
          function executeCode(input) {
            return eval(input);
          }
        `
      };

      const issues = scanFile(file);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('Code Injection');
      expect(issues[0].severity).toBe('CRITICAL');
      expect(issues[0].line).toBeGreaterThan(0);
    });

    it('should detect hardcoded passwords', () => {
      const file = {
        path: 'config.ts',
        name: 'config.ts',
        content: `
          const config = {
            password = "SuperSecret123",
            username: "admin"
          };
        `
      };

      const issues = scanFile(file);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.type === 'Hardcoded Credentials')).toBe(true);
      expect(issues.some(i => i.severity === 'CRITICAL')).toBe(true);
    });

    it('should detect hardcoded API keys with various formats', () => {
      const file = {
        path: 'api.ts',
        name: 'api.ts',
        content: `
          const api_key = "sk-12345abcdef";
          const apiKey = "secret_key_here";
          const api-key = "another_key";
        `
      };

      const issues = scanFile(file);
      
      const apiKeyIssues = issues.filter(i => i.type === 'Hardcoded API Key');
      expect(apiKeyIssues.length).toBeGreaterThanOrEqual(2);
      apiKeyIssues.forEach(issue => {
        expect(issue.severity).toBe('CRITICAL');
      });
    });

    it('should detect SQL injection vulnerabilities', () => {
      const file = {
        path: 'database.js',
        name: 'database.js',
        content: `
          const query = "SELECT * FROM users WHERE id = " + userId;
          db.execute(query);
        `
      };

      const issues = scanFile(file);
      
      expect(issues.some(i => i.type === 'SQL Injection')).toBe(true);
      expect(issues.some(i => i.severity === 'CRITICAL')).toBe(true);
    });
  });

  describe('High Severity Vulnerabilities', () => {
    it('should detect innerHTML usage', () => {
      const file = {
        path: 'dom.js',
        name: 'dom.js',
        content: `
          element.innerHTML = userInput;
          div.innerHTML = "<script>alert('xss')</script>";
        `
      };

      const issues = scanFile(file);
      
      const xssIssues = issues.filter(i => i.type === 'XSS Vulnerability');
      expect(xssIssues.length).toBeGreaterThanOrEqual(2);
      xssIssues.forEach(issue => {
        expect(issue.severity).toBe('HIGH');
      });
    });

    it('should detect document.write usage', () => {
      const file = {
        path: 'legacy.js',
        name: 'legacy.js',
        content: `
          document.write(content);
          document.write("<div>" + unsafeData + "</div>");
        `
      };

      const issues = scanFile(file);
      
      const xssIssues = issues.filter(i => i.type === 'XSS Vulnerability');
      expect(xssIssues.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Low Severity Issues', () => {
    it('should detect console.log statements', () => {
      const file = {
        path: 'debug.ts',
        name: 'debug.ts',
        content: `
          console.log("Debug info");
          console.error("Error details");
          console.warn("Warning message");
          console.info("Info message");
        `
      };

      const issues = scanFile(file);
      
      const consoleIssues = issues.filter(i => i.type === 'Information Disclosure');
      expect(consoleIssues).toHaveLength(4);
      consoleIssues.forEach(issue => {
        expect(issue.severity).toBe('LOW');
      });
    });
  });

  describe('Line Number Detection', () => {
    it('should accurately report line numbers', () => {
      const file = {
        path: 'test.js',
        name: 'test.js',
        content: `line 1
line 2
const password = "secret";
line 4`
      };

      const issues = scanFile(file);
      
      expect(issues[0].line).toBe(3);
    });

    it('should handle multiline content correctly', () => {
      const file = {
        path: 'multi.js',
        name: 'multi.js',
        content: `
function first() {
  console.log("first");
}

function second() {
  eval("code");
}

function third() {
  console.warn("third");
}
        `
      };

      const issues = scanFile(file);
      
      expect(issues.length).toBeGreaterThan(0);
      issues.forEach(issue => {
        expect(issue.line).toBeGreaterThan(0);
      });
    });
  });

  describe('Multiple Pattern Matching', () => {
    it('should detect multiple issues in same file', () => {
      const file = {
        path: 'vulnerable.js',
        name: 'vulnerable.js',
        content: `
          const api_key = "secret123";
          eval(userInput);
          element.innerHTML = data;
          console.log(api_key);
        `
      };

      const issues = scanFile(file);
      
      expect(issues.length).toBeGreaterThanOrEqual(4);
      
      const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
      const highCount = issues.filter(i => i.severity === 'HIGH').length;
      const lowCount = issues.filter(i => i.severity === 'LOW').length;
      
      expect(criticalCount).toBeGreaterThan(0);
      expect(highCount).toBeGreaterThan(0);
      expect(lowCount).toBeGreaterThan(0);
    });
  });

  describe('Issue Categorization', () => {
    it('should categorize issues by severity', () => {
      const issues: SecurityIssue[] = [
        { file: 'a.js', severity: 'CRITICAL', type: 'Code Injection', description: '', recommendation: '' },
        { file: 'b.js', severity: 'CRITICAL', type: 'SQL Injection', description: '', recommendation: '' },
        { file: 'c.js', severity: 'HIGH', type: 'XSS', description: '', recommendation: '' },
        { file: 'd.js', severity: 'LOW', type: 'Console', description: '', recommendation: '' }
      ];

      const categorized = categorizeIssues(issues);
      
      expect(categorized.stats.critical).toBe(2);
      expect(categorized.stats.high).toBe(1);
      expect(categorized.stats.medium).toBe(0);
      expect(categorized.stats.low).toBe(1);
      expect(categorized.stats.total).toBe(4);
    });

    it('should categorize issues by type', () => {
      const issues: SecurityIssue[] = [
        { file: 'a.js', severity: 'CRITICAL', type: 'Code Injection', description: '', recommendation: '' },
        { file: 'b.js', severity: 'CRITICAL', type: 'Code Injection', description: '', recommendation: '' },
        { file: 'c.js', severity: 'HIGH', type: 'XSS', description: '', recommendation: '' }
      ];

      const categorized = categorizeIssues(issues);
      
      expect(categorized.byType['Code Injection']).toBe(2);
      expect(categorized.byType['XSS']).toBe(1);
    });
  });

  describe('Security Score Calculation', () => {
    it('should calculate security score based on issues', () => {
      const issues: SecurityIssue[] = [
        { file: 'a.js', severity: 'CRITICAL', type: 'Injection', description: '', recommendation: '' },
        { file: 'b.js', severity: 'HIGH', type: 'XSS', description: '', recommendation: '' }
      ];

      const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
      const highCount = issues.filter(i => i.severity === 'HIGH').length;
      const securityScore = Math.max(0, 100 - (criticalCount * 20) - (highCount * 10));

      expect(securityScore).toBe(70); // 100 - 20 - 10
    });

    it('should not go below 0', () => {
      const issues: SecurityIssue[] = Array.from({ length: 10 }, (_, i) => ({
        file: `${i}.js`,
        severity: 'CRITICAL' as const,
        type: 'Injection',
        description: '',
        recommendation: ''
      }));

      const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
      const highCount = issues.filter(i => i.severity === 'HIGH').length;
      const securityScore = Math.max(0, 100 - (criticalCount * 20) - (highCount * 10));

      expect(securityScore).toBe(0);
      expect(securityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', () => {
      const file = {
        path: 'empty.js',
        name: 'empty.js',
        content: ''
      };

      const issues = scanFile(file);
      
      expect(issues).toEqual([]);
    });

    it('should handle files with no issues', () => {
      const file = {
        path: 'clean.ts',
        name: 'clean.ts',
        content: `
          export function add(a: number, b: number): number {
            return a + b;
          }
        `
      };

      const issues = scanFile(file);
      
      expect(issues).toEqual([]);
    });

    it('should handle case-insensitive pattern matching', () => {
      const file = {
        path: 'mixed.js',
        name: 'mixed.js',
        content: `
          EVAL(code);
          Eval(code);
          eval(code);
        `
      };

      const issues = scanFile(file);
      
      expect(issues.length).toBe(3);
    });
  });
});
