// @ts-nocheck
import type { ContextAggregator } from './context-aggregator';
import type { SymbolInfo } from './dependency-graph';

export interface SecurityVulnerability {
  file: string;
  line?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  description: string;
  recommendation: string;
  dataFlow?: string[]; // Files involved in the vulnerability chain
  cweId?: string;
}

export class AdvancedSecurityScanner {
  private contextAggregator: ContextAggregator;

  constructor(aggregator: ContextAggregator) {
    this.contextAggregator = aggregator;
  }

  async scan(): Promise<{
    vulnerabilities: SecurityVulnerability[];
    score: number;
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  }> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Run all security checks
    vulnerabilities.push(...await this.detectSQLInjection());
    vulnerabilities.push(...await this.detectXSS());
    vulnerabilities.push(...await this.detectCommandInjection());
    vulnerabilities.push(...await this.detectInsecureDeserialization());
    vulnerabilities.push(...await this.detectAuthenticationIssues());
    vulnerabilities.push(...await this.detectCryptographicIssues());
    vulnerabilities.push(...await this.detectAccessControlIssues());
    vulnerabilities.push(...await this.detectDataExposure());

    // Calculate score
    const summary = {
      critical: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      high: vulnerabilities.filter(v => v.severity === 'HIGH').length,
      medium: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      low: vulnerabilities.filter(v => v.severity === 'LOW').length
    };

    const score = Math.max(0, 100 - (summary.critical * 20 + summary.high * 10 + summary.medium * 5 + summary.low * 1));

    return { vulnerabilities, score, summary };
  }

  private async detectSQLInjection(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const context = this.contextAggregator.buildContextForQuery('sql query database', 100000);

    context.files.forEach(file => {
      const content = file.content;
      const lines = content.split('\n');

      // Pattern 1: String concatenation in SQL
      lines.forEach((line, idx) => {
        if (/(?:SELECT|INSERT|UPDATE|DELETE).*\+.*(?:req\.|request\.|params\.|query\.)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'CRITICAL',
            type: 'SQL Injection',
            description: 'SQL query built with string concatenation using user input',
            recommendation: 'Use parameterized queries or prepared statements',
            cweId: 'CWE-89'
          });
        }
      });

      // Pattern 2: Template literals in SQL
      lines.forEach((line, idx) => {
        if (/(?:SELECT|INSERT|UPDATE|DELETE).*`\$\{.*\}`/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'CRITICAL',
            type: 'SQL Injection via Template Literals',
            description: 'SQL query uses template literals with potentially unsafe interpolation',
            recommendation: 'Use parameterized queries with placeholders',
            cweId: 'CWE-89'
          });
        }
      });

      // Pattern 3: Cross-file data flow analysis
      const userInputSymbols = this.findUserInputSymbols(file);
      userInputSymbols.forEach(symbol => {
        const usages = this.contextAggregator.getCrossFileReferences(symbol);
        usages.usages.forEach(usage => {
          if (/(?:SELECT|INSERT|UPDATE|DELETE)/i.test(usage.context)) {
            vulnerabilities.push({
              file: usage.file,
              line: usage.line,
              severity: 'HIGH',
              type: 'Potential SQL Injection (Cross-file)',
              description: `User input '${symbol}' from ${file.path} may flow into SQL query`,
              recommendation: 'Validate and sanitize input, use parameterized queries',
              dataFlow: [file.path, usage.file],
              cweId: 'CWE-89'
            });
          }
        });
      });
    });

    return vulnerabilities;
  }

  private async detectXSS(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[]= [];
    const context = this.contextAggregator.buildContextForQuery('html dom render', 100000);

    context.files.forEach(file => {
      const content = file.content;
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // innerHTML with user input
        if (/\.innerHTML\s*=.*(?:req\.|request\.|params\.|query\.|props\.)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'CRITICAL',
            type: 'Cross-Site Scripting (XSS)',
            description: 'Setting innerHTML with user-controlled data',
            recommendation: 'Use textContent or sanitize HTML with DOMPurify',
            cweId: 'CWE-79'
          });
        }

        // document.write
        if (/document\.write\(.*(?:req\.|request\.|params\.|query\.)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'HIGH',
            type: 'Cross-Site Scripting (XSS)',
            description: 'document.write() with user input can execute malicious scripts',
            recommendation: 'Use safer DOM manipulation methods',
            cweId: 'CWE-79'
          });
        }

        // eval with user input
        if (/eval\(.*(?:req\.|request\.|params\.|query\.)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'CRITICAL',
            type: 'Code Injection / XSS',
            description: 'eval() executes arbitrary JavaScript code from user input',
            recommendation: 'Never use eval() with user input. Find alternative approaches',
            cweId: 'CWE-95'
          });
        }

        // dangerouslySetInnerHTML in React
        if (/dangerouslySetInnerHTML.*__html.*(?:props\.|state\.|params\.)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'HIGH',
            type: 'React XSS Vulnerability',
            description: 'dangerouslySetInnerHTML with unsanitized props/state',
            recommendation: 'Sanitize HTML content or use safe React rendering',
            cweId: 'CWE-79'
          });
        }
      });
    });

    return vulnerabilities;
  }

  private async detectCommandInjection(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const context = this.contextAggregator.buildContextForQuery('exec spawn shell command', 100000);

    context.files.forEach(file => {
      const content = file.content;
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // exec with user input
        if (/(?:exec|spawn|execSync|spawnSync)\(.*(?:req\.|request\.|params\.|query\.)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'CRITICAL',
            type: 'Command Injection',
            description: 'Shell command execution with user-controlled input',
            recommendation: 'Avoid shell execution with user input. Use safe alternatives or strict input validation',
            cweId: 'CWE-78'
          });
        }

        // Python subprocess with shell=True
        if (/subprocess\.\w+\(.*shell\s*=\s*True.*\)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'HIGH',
            type: 'Command Injection (Python)',
            description: 'subprocess with shell=True can execute arbitrary commands',
            recommendation: 'Use shell=False and pass arguments as a list',
            cweId: 'CWE-78'
          });
        }
      });
    });

    return vulnerabilities;
  }

  private async detectInsecureDeserialization(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const context = this.contextAggregator.buildContextForQuery('deserialize pickle json parse', 100000);

    context.files.forEach(file => {
      const content = file.content;
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Python pickle
        if (/pickle\.loads?\(.*(?:req\.|request\.)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'CRITICAL',
            type: 'Insecure Deserialization',
            description: 'pickle.load() with user input can execute arbitrary code',
            recommendation: 'Use JSON for data serialization or validate pickle data strictly',
            cweId: 'CWE-502'
          });
        }

        // JavaScript eval on JSON
        if (/eval\(.*JSON|JSON.*eval/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'HIGH',
            type: 'Insecure Deserialization',
            description: 'Using eval() to parse JSON can execute malicious code',
            recommendation: 'Use JSON.parse() instead of eval()',
            cweId: 'CWE-502'
          });
        }
      });
    });

    return vulnerabilities;
  }

  private async detectAuthenticationIssues(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const context = this.contextAggregator.buildContextForQuery('auth password login token jwt', 100000);

    context.files.forEach(file => {
      const content = file.content;
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Hardcoded credentials
        if (/(?:password|passwd|pwd|secret|api[_-]?key|token)\s*=\s*["'][^"']{5,}["']/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'CRITICAL',
            type: 'Hardcoded Credentials',
            description: 'Credentials hardcoded in source code',
            recommendation: 'Use environment variables or secure vault for credentials',
            cweId: 'CWE-798'
          });
        }

        // Weak password hashing
        if (/(?:md5|sha1)\(.*password/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'HIGH',
            type: 'Weak Cryptographic Hash',
            description: 'MD5/SHA1 are not suitable for password hashing',
            recommendation: 'Use bcrypt, scrypt, or Argon2 for password hashing',
            cweId: 'CWE-327'
          });
        }

        // JWT without expiration
        if (/jwt\.sign\([^)]*\)/.test(line) && !/expiresIn/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'MEDIUM',
            type: 'JWT Without Expiration',
            description: 'JWT token created without expiration time',
            recommendation: 'Always set expiresIn option for JWT tokens',
            cweId: 'CWE-613'
          });
        }
      });
    });

    return vulnerabilities;
  }

  private async detectCryptographicIssues(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const context = this.contextAggregator.buildContextForQuery('crypto encrypt hash random', 100000);

    context.files.forEach(file => {
      const content = file.content;
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Weak random
        if (/Math\.random\(\)/.test(line) && /(?:token|key|password|secret)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'HIGH',
            type: 'Weak Random Number Generator',
            description: 'Math.random() is not cryptographically secure',
            recommendation: 'Use crypto.randomBytes() or crypto.getRandomValues()',
            cweId: 'CWE-338'
          });
        }

        // Insecure HTTP
        if (/https?:\/\/(?!localhost|127\.0\.0\.1)/.test(line) && !/https:/.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'MEDIUM',
            type: 'Insecure HTTP Connection',
            description: 'Using HTTP instead of HTTPS for external communication',
            recommendation: 'Use HTTPS for all external API calls',
            cweId: 'CWE-319'
          });
        }
      });
    });

    return vulnerabilities;
  }

  private async detectAccessControlIssues(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const context = this.contextAggregator.buildContextForQuery('auth middleware role permission', 100000);

    // Detect missing authentication on routes
    context.files.forEach(file => {
      if (file.path.includes('route') || file.path.includes('/api/')) {
        const content = file.content;
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          // Routes without auth middleware
          if (/(?:router|app)\.(get|post|put|delete|patch)\(/.test(line)) {
            const nextLines = lines.slice(idx, idx + 3).join(' ');
            if (!/(?:auth|authenticate|requireAuth|isAuthenticated|protect)/i.test(nextLines)) {
              vulnerabilities.push({
                file: file.path,
                line: idx + 1,
                severity: 'MEDIUM',
                type: 'Missing Authentication',
                description: 'API endpoint without authentication middleware',
                recommendation: 'Add authentication middleware to protect sensitive endpoints',
                cweId: 'CWE-306'
              });
            }
          }
        });
      }
    });

    return vulnerabilities;
  }

  private async detectDataExposure(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const context = this.contextAggregator.buildContextForQuery('console log error response', 100000);

    context.files.forEach(file => {
      const content = file.content;
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // console.log with sensitive data
        if (/console\.log\(.*(?:password|token|secret|key|credential)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'MEDIUM',
            type: 'Sensitive Data in Logs',
            description: 'Logging potentially sensitive information',
            recommendation: 'Remove or mask sensitive data from logs',
            cweId: 'CWE-532'
          });
        }

        // Error stack traces exposed
        if (/\.send\(.*error\.stack|res\.json\(.*error\)/i.test(line)) {
          vulnerabilities.push({
            file: file.path,
            line: idx + 1,
            severity: 'LOW',
            type: 'Error Information Disclosure',
            description: 'Exposing error stack traces to clients',
            recommendation: 'Log errors server-side and send generic messages to clients',
            cweId: 'CWE-209'
          });
        }
      });
    });

    return vulnerabilities;
  }

  private findUserInputSymbols(file: any): string[] {
    const symbols: string[] = [];
    const content = file.content;

    // Find variables that receive user input
    const patterns = [
      /const\s+(\w+)\s*=\s*req\.(?:body|query|params)/g,
      /let\s+(\w+)\s*=\s*req\.(?:body|query|params)/g,
      /var\s+(\w+)\s*=\s*req\.(?:body|query|params)/g,
      /const\s+(?:\{([^}]+)\}|\[([^\]]+)\])\s*=\s*req\.(?:body|query|params)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) symbols.push(match[1]);
      }
    });

    return symbols;
  }
}
