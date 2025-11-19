// @ts-nocheck
import axios from 'axios';

// Optional advanced features - graceful fallback if not available
let ContextAggregator, AdvancedSecurityScanner;
try {
  ContextAggregator = require('./_lib/context-aggregator').ContextAggregator;
  AdvancedSecurityScanner = require('./_lib/advanced-security').AdvancedSecurityScanner;
} catch (e) {
  console.warn('Advanced security features not available, using basic patterns only');
}

interface SecurityIssue {
  file: string;
  line?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  description: string;
  recommendation: string;
}

const SECURITY_PATTERNS = [
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

async function fetchRepoFiles(owner: string, repo: string, path = '', files = [], depth = 0) {
  if (depth > 10 || files.length >= 100) return files;

  const githubToken = process.env.GITHUB_TOKEN || '';
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github.v3+json' } }
  );

  const items = Array.isArray(response.data) ? response.data : [response.data];

  for (const item of items) {
    if (item.type === 'file' && item.size < 100000) {
      const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go'];
      if (extensions.some(ext => item.name.endsWith(ext))) {
        try {
          const contentResponse = await axios.get(item.download_url);
          files.push({ path: item.path, content: contentResponse.data, name: item.name });
        } catch (err) {
          console.error(`Failed to fetch ${item.path}:`, err.message);
        }
      }
    } else if (item.type === 'dir') {
      await fetchRepoFiles(owner, repo, item.path, files, depth + 1);
    }
  }

  return files;
}

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

  const byType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});

  return { stats, byType };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ status: 'error', message: 'repoUrl is required' });
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });
    }

    const [, owner, repo] = match;
    console.log(`Security scanning ${owner}/${repo}...`);

    const files = await fetchRepoFiles(owner, repo);
    console.log(`Scanning ${files.length} files for security issues...`);

    // Run basic pattern-based scan
    const allIssues: SecurityIssue[] = [];
    for (const file of files) {
      const fileIssues = scanFile(file);
      allIssues.push(...fileIssues);
    }

    let combinedIssues = [...allIssues];
    let securityScore = 75;
    let advancedAnalysis = {};

    // Try advanced cross-file security analysis if libraries available
    if (ContextAggregator && AdvancedSecurityScanner) {
      try {
        console.log('Running advanced security analysis...');
        const aggregator = new ContextAggregator();
        await aggregator.buildContext(files);
        
        const advancedScanner = new AdvancedSecurityScanner();
        const advancedResults = await advancedScanner.scanRepository(aggregator);
        
        // Merge results (remove duplicates)
        advancedResults.forEach(vuln => {
          const isDuplicate = allIssues.some(issue =>
            issue.file === vuln.file &&
            issue.line === vuln.line &&
            issue.type === vuln.type
          );
          if (!isDuplicate) {
            combinedIssues.push(vuln);
          }
        });

        const archInsights = aggregator.getArchitectureInsights();
        advancedAnalysis = {
          crossFileVulnerabilities: advancedResults.filter(v => v.description && v.description.includes('cross-file')).length,
          architecturePattern: archInsights.pattern
        };
        
        // Recalculate score based on all findings
        const criticalCount = combinedIssues.filter(i => i.severity === 'CRITICAL').length;
        const highCount = combinedIssues.filter(i => i.severity === 'HIGH').length;
        securityScore = Math.max(0, 100 - (criticalCount * 20) - (highCount * 10));
      } catch (advErr) {
        console.warn('Advanced security analysis failed, using basic scan:', advErr.message);
      }
    } else {
      console.log('Using basic security scan only');
      const criticalCount = allIssues.filter(i => i.severity === 'CRITICAL').length;
      const highCount = allIssues.filter(i => i.severity === 'HIGH').length;
      securityScore = Math.max(0, 100 - (criticalCount * 20) - (highCount * 10));
    }

    // Filter: Only show CRITICAL and HIGH severity issues (ignore noise)
    const filteredIssues = combinedIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
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
      timestamp: new Date().toISOString(),
      advancedAnalysis
    });

  } catch (error) {
    console.error('Security scan error:', error);
    const safeMessage = error?.response?.data?.message || error?.message || 'Security scan failed';
    res.status(500).json({ status: 'error', message: String(safeMessage) });
  }
}
