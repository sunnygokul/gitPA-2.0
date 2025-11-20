/**
 * AI Response Parser
 * Parses structured AI responses into displayable sections
 */

export interface MultiFileContext {
  summary: string[];
  dependencies: string[];
  crossFile: string[];
}

export interface SecurityIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  file: string;
  line?: string;
  description: string;
  attackScenario?: string;
  fixRecommendation?: string;
  impactScope?: string;
}

export interface RefactorSuggestion {
  file: string;
  issue: string;
  recommendation: string;
  impactOnOtherFiles?: string;
  securityImplications?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TestCase {
  name: string;
  code: string;
  description?: string;
}

export interface ZipSpecification {
  structure: string;
  files: string[];
}

export interface MaintainabilityScore {
  overall: number;
  documentation?: number;
  testCoverage?: number;
  codeComplexity?: number;
  breakdown?: string;
}

export interface ParsedAIResponse {
  hasStructuredContent: boolean;
  rawContent: string;
  
  // Structured sections
  multiFileContext?: MultiFileContext;
  securityIssues?: SecurityIssue[];
  refactorSuggestions?: RefactorSuggestion[];
  testCases?: TestCase[];
  zipSpecification?: ZipSpecification;
  architectureAssessment?: string;
  dependencyRiskAnalysis?: string;
  performanceConcerns?: string;
  maintainabilityScore?: MaintainabilityScore;
  
  // Remaining unstructured content
  additionalContent?: string;
}

/**
 * Parse Multi-file Context Reasoning section
 */
function parseMultiFileContext(content: string): MultiFileContext | undefined {
  const match = content.match(/\[Multi-file Context Reasoning\]([\s\S]*?)(?=\[|$)/i);
  if (!match) return undefined;

  const section = match[1].trim();
  const lines = section.split('\n').filter(line => line.trim());

  return {
    summary: lines.filter(l => l.includes('Summary') || l.match(/^-\s/)).map(l => l.replace(/^-\s*/, '')),
    dependencies: lines.filter(l => l.toLowerCase().includes('dependenc')).map(l => l.replace(/^-\s*/, '')),
    crossFile: lines.filter(l => l.toLowerCase().includes('cross-file')).map(l => l.replace(/^-\s*/, ''))
  };
}

/**
 * Parse Enhanced Code Review section with security classifications
 */
function parseSecurityIssues(content: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  
  // Match sections like "1. CRITICAL ISSUES", "2. HIGH ISSUES", etc.
  const sections = content.match(/\d+\.\s+(CRITICAL|HIGH|MEDIUM|LOW)\s+(?:RISK\s+)?ISSUES[\s\S]*?(?=\d+\.\s+(?:CRITICAL|HIGH|MEDIUM|LOW)|$)/gi);
  
  if (!sections) return issues;

  sections.forEach(section => {
    const severityMatch = section.match(/(CRITICAL|HIGH|MEDIUM|LOW)/i);
    if (!severityMatch) return;
    
    const severity = severityMatch[1].toUpperCase() as SecurityIssue['severity'];
    
    // Extract individual issues
    const issueBlocks = section.split(/(?=File:)/i);
    
    issueBlocks.forEach(block => {
      const fileMatch = block.match(/File:\s*(.+?)(?:\n|$)/i);
      const lineMatch = block.match(/Line:\s*(\d+)/i);
      const descMatch = block.match(/Description:\s*(.+?)(?:\n|$)/i);
      const attackMatch = block.match(/Attack Scenario:\s*(.+?)(?:\n|Fix|Impact|$)/is);
      const fixMatch = block.match(/Fix Recommendation:\s*(.+?)(?:\n|Impact|$)/is);
      const impactMatch = block.match(/Impact Scope:\s*(.+?)(?:\n|$)/is);
      
      if (fileMatch && descMatch) {
        issues.push({
          severity,
          file: fileMatch[1].trim(),
          line: lineMatch?.[1],
          description: descMatch[1].trim(),
          attackScenario: attackMatch?.[1].trim(),
          fixRecommendation: fixMatch?.[1].trim(),
          impactScope: impactMatch?.[1].trim()
        });
      }
    });
  });

  return issues;
}

/**
 * Parse Intelligent Refactor Suggestions
 */
function parseRefactorSuggestions(content: string): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];
  
  const match = content.match(/\[Intelligent Refactor Suggestions\]([\s\S]*?)(?=\[|$)/i);
  if (!match) return suggestions;

  const section = match[1];
  const blocks = section.split(/(?=File:)/i);

  blocks.forEach(block => {
    const fileMatch = block.match(/File:\s*(.+?)(?:\n|$)/i);
    const issueMatch = block.match(/Issue:\s*(.+?)(?:\n|$)/i);
    const recoMatch = block.match(/(?:Refactor\s+)?Recommendation:\s*(.+?)(?:\n|Impact|Security|Priority|$)/is);
    const impactMatch = block.match(/Impact on Other Files:\s*(.+?)(?:\n|Security|Priority|$)/is);
    const secMatch = block.match(/Security Implications:\s*(.+?)(?:\n|Priority|$)/is);
    const prioMatch = block.match(/Priority:\s*(HIGH|MEDIUM|LOW)/i);

    if (fileMatch && issueMatch && recoMatch) {
      suggestions.push({
        file: fileMatch[1].trim(),
        issue: issueMatch[1].trim(),
        recommendation: recoMatch[1].trim(),
        impactOnOtherFiles: impactMatch?.[1].trim(),
        securityImplications: secMatch?.[1].trim(),
        priority: prioMatch?.[1].toUpperCase() as any
      });
    }
  });

  return suggestions;
}

/**
 * Parse Test Cases
 */
function parseTestCases(content: string): TestCase[] {
  const tests: TestCase[] = [];
  
  const match = content.match(/\[Automated Test Suite Generation\]([\s\S]*?)(?=\[ZIP Package Specification\]|$)/i);
  if (!match) return tests;

  const section = match[1];
  const testBlocks = section.split(/Test\s+(?:Case\s+)?\d+:/i).filter(b => b.trim());

  testBlocks.forEach(block => {
    const lines = block.trim().split('\n');
    const name = lines[0].trim();
    const code = block.match(/```[\s\S]*?```/)?.[0] || '';
    
    if (name) {
      tests.push({
        name,
        code: code.replace(/```\w*\n?|\n?```/g, '').trim(),
        description: lines.slice(1).find(l => !l.includes('```'))?.trim()
      });
    }
  });

  return tests;
}

/**
 * Parse ZIP Package Specification
 */
function parseZipSpecification(content: string): ZipSpecification | undefined {
  const match = content.match(/\[ZIP Package Specification\]([\s\S]*?)(?=\[|$)/i);
  if (!match) return undefined;

  const section = match[1].trim();
  const files = section.match(/[-│├└]\s+\S+/g)?.map(f => f.replace(/[-│├└]\s+/, '')) || [];

  return {
    structure: section,
    files
  };
}

/**
 * Parse Maintainability Score
 */
function parseMaintainabilityScore(content: string): MaintainabilityScore | undefined {
  const match = content.match(/\[Maintainability Score\]([\s\S]*?)(?=\[|$)/i);
  if (!match) return undefined;

  const section = match[1];
  const overallMatch = section.match(/Overall:\s*(\d+)/i);
  const docMatch = section.match(/Documentation:\s*(\d+)/i);
  const testMatch = section.match(/Test\s+Coverage:\s*(\d+)/i);
  const complexMatch = section.match(/Code\s+Complexity:\s*(\d+)/i);

  return {
    overall: overallMatch ? parseInt(overallMatch[1]) : 0,
    documentation: docMatch ? parseInt(docMatch[1]) : undefined,
    testCoverage: testMatch ? parseInt(testMatch[1]) : undefined,
    codeComplexity: complexMatch ? parseInt(complexMatch[1]) : undefined,
    breakdown: section
  };
}

/**
 * Extract simple text sections
 */
function extractTextSection(content: string, sectionName: string): string | undefined {
  const regex = new RegExp(`\\[${sectionName}\\]([\\s\\S]*?)(?=\\[|$)`, 'i');
  const match = content.match(regex);
  return match?.[1].trim();
}

/**
 * Main parser function
 */
export function parseAIResponse(content: string): ParsedAIResponse {
  if (!content) {
    return {
      hasStructuredContent: false,
      rawContent: ''
    };
  }

  // Check if content has structured sections
  const hasStructuredContent = /\[Multi-file Context Reasoning\]|\[Enhanced Code Review\]|\[Intelligent Refactor Suggestions\]|\[Automated Test Suite Generation\]/i.test(content);

  if (!hasStructuredContent) {
    return {
      hasStructuredContent: false,
      rawContent: content
    };
  }

  // Parse all sections
  const parsed: ParsedAIResponse = {
    hasStructuredContent: true,
    rawContent: content,
    multiFileContext: parseMultiFileContext(content),
    securityIssues: parseSecurityIssues(content),
    refactorSuggestions: parseRefactorSuggestions(content),
    testCases: parseTestCases(content),
    zipSpecification: parseZipSpecification(content),
    architectureAssessment: extractTextSection(content, 'Architecture Assessment'),
    dependencyRiskAnalysis: extractTextSection(content, 'Dependency Risk Analysis'),
    performanceConcerns: extractTextSection(content, 'Performance Concerns'),
    maintainabilityScore: parseMaintainabilityScore(content)
  };

  // Extract any remaining content that wasn't parsed
  let remainingContent = content;
  const sectionsToRemove = [
    'Multi-file Context Reasoning',
    'Enhanced Code Review',
    'Intelligent Refactor Suggestions',
    'Automated Test Suite Generation',
    'ZIP Package Specification',
    'Architecture Assessment',
    'Dependency Risk Analysis',
    'Performance Concerns',
    'Maintainability Score'
  ];

  sectionsToRemove.forEach(section => {
    const regex = new RegExp(`\\[${section}\\][\\s\\S]*?(?=\\[|$)`, 'gi');
    remainingContent = remainingContent.replace(regex, '');
  });

  parsed.additionalContent = remainingContent.trim() || undefined;

  return parsed;
}
