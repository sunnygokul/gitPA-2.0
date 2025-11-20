import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRepoFiles } from './utils/github-api';
import { validateGitHubUrl, validateRequiredFields } from './utils/validation';
import type { SecurityScanRequestBody } from './types';

interface SecurityIssue {
  file: string;
  line?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  description: string;
  recommendation: string;
}

interface SecurityPattern {
  pattern: RegExp;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendation: string;
}

const SECURITY_PATTERNS: SecurityPattern[] = [
  {
    pattern: /eval\s*\(/gi,
    type: 'Code Injection',
    severity: 'CRITICAL',
    description: 'Using eval() can execute arbitrary code',
    recommendation: 'Replace eval() with safer alternatives like JSON.parse() or Function constructor with validation'
  },
  {
    pattern: /password\s*=\s*["'][^"']+["']/gi,
    type: 'Hardcoded Credentials',
    severity: 'CRITICAL',
    description: 'Hardcoded password found in source code',
    recommendation: 'Move credentials to environment variables or secure vault'
  },
  {
    pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi,
    type: 'Hardcoded API Key',
    severity: 'CRITICAL',
    description: 'Hardcoded API key exposed in code',
    recommendation: 'Use environment variables and secret management'
  },
  {
    pattern: /\.innerHTML\s*=/gi,
    type: 'XSS Vulnerability',
    severity: 'HIGH',
    description: 'Potential XSS vulnerability using innerHTML',
    recommendation: 'Use textContent or sanitize HTML input with DOMPurify'
  },
  {
    pattern: /document\.write\(/gi,
    type: 'XSS Vulnerability',
    severity: 'HIGH',
    description: 'document.write() can be exploited for XSS attacks',
    recommendation: 'Use safer DOM manipulation methods'
  },
  {
    pattern: /SELECT\s+.*FROM.*WHERE.*\+/gi,
    type: 'SQL Injection',
    severity: 'CRITICAL',
    description: 'Potential SQL injection vulnerability',
    recommendation: 'Use parameterized queries or prepared statements'
  },
  {
    pattern: /exec\s*\(/gi,
    type: 'Command Injection',
    severity: 'CRITICAL',
    description: 'Using exec() can lead to command injection',
    recommendation: 'Validate and sanitize all inputs, use execFile() with argument array'
  },
  {
    pattern: /http:\/\//gi,
    type: 'Insecure Protocol',
    severity: 'MEDIUM',
    description: 'Using insecure HTTP instead of HTTPS',
    recommendation: 'Always use HTTPS for external connections'
  },
  {
    pattern: /Math\.random\(\)/gi,
    type: 'Weak Randomness',
    severity: 'MEDIUM',
    description: 'Math.random() is not cryptographically secure',
    recommendation: 'Use crypto.randomBytes() for security-sensitive operations'
  },
  {
    pattern: /require\s*\(\s*[^)]*\+/gi,
    type: 'Dynamic Require',
    severity: 'HIGH',
    description: 'Dynamic require() with user input can load arbitrary modules',
    recommendation: 'Use static imports or whitelist allowed modules'
  },
  {
    pattern: /console\.log\s*\(/gi,
    type: 'Information Disclosure',
    severity: 'LOW',
    description: 'Console logs may expose sensitive information in production',
    recommendation: 'Remove console.log statements or use proper logging framework'
  },
  {
    pattern: /localStorage\.setItem.*password/gi,
    type: 'Insecure Storage',
    severity: 'HIGH',
    description: 'Storing passwords in localStorage is insecure',
    recommendation: 'Never store passwords in browser storage; use secure session management'
  },
  {
    pattern: /fs\.chmod.*777/gi,
    type: 'Insecure Permissions',
    severity: 'HIGH',
    description: 'Setting file permissions to 777 is insecure',
    recommendation: 'Use restrictive permissions (e.g., 644 for files, 755 for directories)'
  },
  {
    pattern: /TODO|FIXME|HACK|XXX/gi,
    type: 'Technical Debt',
    severity: 'LOW',
    description: 'Code contains technical debt markers',
    recommendation: 'Address TODOs and FIXMEs before production deployment'
  }
];

function scanFile(file: { path: string; content: string; name: string }): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = file.content.split('\n');

  for (const pattern of SECURITY_PATTERNS) {
    const matches = file.content.matchAll(pattern.pattern);
    for (const match of matches) {
      // Find line number
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    // Validate request body
    const bodyValidation = validateRequiredFields(req.body, ['repoUrl']);
    if (!bodyValidation.valid) {
      res.status(400).json({ status: 'error', message: bodyValidation.error });
      return;
    }

    const { repoUrl } = req.body as SecurityScanRequestBody;

    // Validate GitHub URL
    const urlValidation = validateGitHubUrl(repoUrl);
    if (!urlValidation.valid) {
      res.status(400).json({ status: 'error', message: urlValidation.error });
      return;
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      res.status(400).json({ status: 'error', message: 'Invalid GitHub URL format' });
      return;
    }

    const [, owner, repo] = match;

    const files = await fetchRepoFiles(owner, repo, {
      maxDepth: 8,
      maxFiles: 75,
      maxFileSize: 100000,
      fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go']
    });

    // Run basic pattern-based scan
    const allIssues: SecurityIssue[] = [];
    for (const file of files) {
      const fileIssues = scanFile(file);
      allIssues.push(...fileIssues);
    }

    // Calculate security score
    const criticalCount = allIssues.filter(i => i.severity === 'CRITICAL').length;
    const highCount = allIssues.filter(i => i.severity === 'HIGH').length;
    const securityScore = Math.max(0, 100 - (criticalCount * 20) - (highCount * 10));

    // Filter: Only show CRITICAL and HIGH severity issues (ignore noise)
    const filteredIssues = allIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    const summary = categorizeIssues(filteredIssues);

    res.json({
      status: 'success',
      repoName: `${owner}/${repo}`,
      securityScore,
      summary,
      issues: filteredIssues.sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      filesScanned: files.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    const err = error as any;
    console.error('Security scan error:', err);
    const safeMessage = err?.response?.data?.message || err?.message || 'Security scan failed';
    res.status(500).json({ status: 'error', message: String(safeMessage) });
  }
}
