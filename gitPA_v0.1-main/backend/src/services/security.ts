import { FileAnalysis } from './ast';

export interface SecurityIssue {
  file: string;
  line?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  description: string;
  recommendation: string;
}

const PATTERNS = [
  { re: /eval\s*\(/g, type: 'Code Injection', severity: 'CRITICAL', rec: 'Avoid eval(); use safe parsing/whitelists.' },
  { re: /new\s+Function\s*\(/g, type: 'Code Injection', severity: 'CRITICAL', rec: 'Avoid dynamic Function(); use safe alternatives.' },
  { re: /innerHTML\s*=/g, type: 'XSS', severity: 'HIGH', rec: 'Use textContent or sanitize HTML.' },
  { re: /document\.write\(/g, type: 'XSS', severity: 'HIGH', rec: 'Avoid document.write().' },
  { re: /api[-_ ]?key\s*[:=]\s*['"][^'"\n]+['"]/gi, type: 'Secret Leak', severity: 'CRITICAL', rec: 'Remove secrets from source; use env vars.' },
  { re: /password\s*[:=]\s*['"][^'"\n]+['"]/gi, type: 'Secret Leak', severity: 'CRITICAL', rec: 'Never hardcode passwords.' },
  { re: /http:\/\//g, type: 'Insecure Protocol', severity: 'MEDIUM', rec: 'Use HTTPS.' },
];

export function scanFileContent(path: string, content: string): SecurityIssue[] {
  const lines = content.split('\n');
  const issues: SecurityIssue[] = [];
  for (const p of PATTERNS) {
    let m: RegExpExecArray | null;
    const re = new RegExp(p.re);
    while ((m = re.exec(content)) !== null) {
      const idx = m.index || 0;
      const line = content.substring(0, idx).split('\n').length;
      issues.push({ file: path, line, severity: p.severity as any, type: p.type, description: `${p.type} pattern detected`, recommendation: p.rec });
    }
  }
  return issues;
}

export function crossFileTaintAnalysis(analyses: FileAnalysis[], files: { path: string; content: string }[]): SecurityIssue[] {
  // Very light taint heuristic: track variables named from common request objects flowing into eval/Function/child_process
  const suspiciousSinks = ['eval', 'Function', 'exec', 'execSync'];
  const issues: SecurityIssue[] = [];
  for (const a of analyses) {
    const content = files.find(f => f.path === a.path)?.content || '';
    const hasReq = /(req\.|request\.|process\.env\[|location\.search|window\.name)/.test(content);
    const sinkUsed = a.calls.some(c => suspiciousSinks.includes(c));
    if (hasReq && sinkUsed) {
      issues.push({
        file: a.path,
        severity: 'HIGH',
        type: 'Taint Flow',
        description: 'Potential flow from user-controlled input to dangerous sink',
        recommendation: 'Validate/sanitize inputs; avoid passing user input into dangerous functions.'
      });
    }
  }
  return issues;
}
