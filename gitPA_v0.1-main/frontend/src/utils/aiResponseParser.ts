/**
 * AI Response Parser - FIXED VERSION
 * Parses both markdown-style and bracket-style structured AI responses
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
  issue?: string;
  recommendation?: string;
  impactOnOtherFiles?: string;
  securityImplications?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  // Additional fields from API response
  severity?: 'High' | 'Medium' | 'Low';
  title?: string;
  description?: string;
  before?: string;
  after?: string;
  benefits?: string;
  type?: string;
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
 * Parse Multi-file Context section (both markdown and bracket formats)
 */
function parseMultiFileContext(content: string): MultiFileContext | undefined {
  // Try bracket format first: [Multi-file Context Reasoning]
  let match = content.match(/\[Multi-file Context Reasoning\]([\s\S]*?)(?=\[|$)/i);
  
  // Try markdown heading format: ## Multi-file Context Reasoning or just Multi-file Context Reasoning
  if (!match) {
    match = content.match(/(?:^|\n)#{0,3}\s*Multi-file Context Reasoning[\s\S]*?(?=\n#{1,3}\s|\n\[|$)/i);
  }
  
  if (!match) return undefined;

  const section = match[0] || match[1] || '';
  const lines = section.split('\n').filter(line => line.trim() && !line.match(/^#{1,6}\s/));

  // Extract subsections
  const summaryLines: string[] = [];
  const dependencyLines: string[] = [];
  const crossFileLines: string[] = [];
  
  let currentSection = 'summary';
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Detect section changes
    if (trimmed.toLowerCase().includes('dependencies involved') || trimmed.includes('🔗')) {
      currentSection = 'dependencies';
      return;
    }
    if (trimmed.toLowerCase().includes('cross-file') || trimmed.includes('⚡')) {
      currentSection = 'crossFile';
      return;
    }
    if (trimmed.toLowerCase().includes('relevant files') || trimmed.includes('📁')) {
      currentSection = 'summary';
      return;
    }
    
    // Skip emoji-only lines or section headers
    if (trimmed.match(/^[🔗⚡📁]+$/)) return;
    
    // Add to appropriate section
    const cleanedLine = trimmed.replace(/^[*\-•]\s*/, '').replace(/^\*\*(.+?)\*\*:?/, '$1:');
    if (cleanedLine.length > 3) {
      if (currentSection === 'summary') summaryLines.push(cleanedLine);
      else if (currentSection === 'dependencies') dependencyLines.push(cleanedLine);
      else if (currentSection === 'crossFile') crossFileLines.push(cleanedLine);
    }
  });

  if (summaryLines.length === 0 && dependencyLines.length === 0 && crossFileLines.length === 0) {
    return undefined;
  }

  return {
    summary: summaryLines,
    dependencies: dependencyLines,
    crossFile: crossFileLines
  };
}

/**
 * Parse Security Issues from Enhanced Code Review section
 */
function parseSecurityIssues(content: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  
  // Look for patterns like "🔴 CRITICAL", "🟠 HIGH", "🟡 MEDIUM", "🟢 LOW"
  // or "CRITICAL ISSUES", "HIGH RISK ISSUES", etc.
  const issuePattern = /(?:🔴|🟠|🟡|🟢)?\s*(CRITICAL|HIGH|MEDIUM|LOW)(?:\s+RISK)?\s+ISSUES?[\s\S]*?(?=(?:🔴|🟠|🟡|🟢)?\s*(?:CRITICAL|HIGH|MEDIUM|LOW)|$)/gi;
  
  const matches = content.matchAll(issuePattern);
  
  for (const match of matches) {
    const severity = match[1].toUpperCase() as SecurityIssue['severity'];
    const sectionText = match[0];
    
    // Extract individual issues (look for "File:" markers)
    const filePattern = /File:\s*`?([^`\n]+)`?(?:[\s\S]*?Line:\s*(\d+))?[\s\S]*?Description:\s*([^\n]+(?:\n(?!File:|Attack|Fix|Impact)[^\n]+)*)/gi;
    
    const fileMatches = sectionText.matchAll(filePattern);
    
    for (const fileMatch of fileMatches) {
      const file = fileMatch[1].trim();
      const line = fileMatch[2];
      const description = fileMatch[3].trim();
      
      // Try to find attack scenario, fix, and impact
      const fileContext = sectionText.substring(sectionText.indexOf(file));
      const attackMatch = fileContext.match(/Attack Scenario:\s*([^\n]+(?:\n(?!Fix|Impact|File:)[^\n]+)*)/i);
      const fixMatch = fileContext.match(/Fix Recommendation:\s*([^\n]+(?:\n(?!Impact|File:)[^\n]+)*)/i);
      const impactMatch = fileContext.match(/Impact Scope:\s*([^\n]+)/i);
      
      issues.push({
        severity,
        file,
        line,
        description,
        attackScenario: attackMatch?.[1].trim(),
        fixRecommendation: fixMatch?.[1].trim(),
        impactScope: impactMatch?.[1].trim()
      });
    }
  }
  
  return issues;
}

/**
 * Parse Refactoring Suggestions
 */
function parseRefactorSuggestions(content: string): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];
  
  // Look for [Intelligent Refactor Suggestions] section
  const match = content.match(/\[Intelligent Refactor Suggestions\]([\s\S]*?)(?=\[|$)/i);
  if (!match) return suggestions;
  
  const section = match[1];
  
  // Parse individual suggestions (numbered format)
  const suggestionPattern = /\d+\.\s*File:\s*`?([^`\n]+)`?[\s\S]*?(?=\d+\.\s*File:|$)/gi;
  const suggestionMatches = section.matchAll(suggestionPattern);
  
  for (const suggMatch of suggestionMatches) {
    const suggText = suggMatch[0];
    const file = suggMatch[1].trim();
    
    const issueMatch = suggText.match(/(?:-\s*)?Issue:\s*([^\n]+(?:\n(?!-\s*(?:Refactor|Impact|Security|Expected))[^\n]+)*)/i);
    const recommendationMatch = suggText.match(/(?:-\s*)?Refactor Recommendation:\s*([^\n]+(?:\n(?!-\s*(?:Impact|Security|Expected))[^\n]+)*)/i);
    const impactMatch = suggText.match(/(?:-\s*)?Impact on Other Files:\s*([^\n]+(?:\n(?!-\s*(?:Security|Expected))[^\n]+)*)/i);
    const securityMatch = suggText.match(/(?:-\s*)?Security Implications:\s*([^\n]+(?:\n(?!-\s*Expected)[^\n]+)*)/i);
    const priorityMatch = suggText.match(/Priority:\s*(HIGH|MEDIUM|LOW)/i);
    
    if (issueMatch && recommendationMatch) {
      suggestions.push({
        file,
        issue: issueMatch[1].trim(),
        recommendation: recommendationMatch[1].trim(),
        impactOnOtherFiles: impactMatch?.[1].trim(),
        securityImplications: securityMatch?.[1].trim(),
        priority: priorityMatch?.[1].toUpperCase() as RefactorSuggestion['priority']
      });
    }
  }
  
  return suggestions;
}

/**
 * Parse Test Cases
 */
function parseTestCases(content: string): TestCase[] {
  const testCases: TestCase[] = [];
  
  // Look for test cases in code blocks with Test Case markers
  const testPattern = /Test Case \d+:\s*([^\n]+)[\s\S]*?```(\w+)?\n([\s\S]*?)```/gi;
  const matches = content.matchAll(testPattern);
  
  for (const match of matches) {
    testCases.push({
      name: match[1].trim(),
      code: match[3].trim(),
      description: ''
    });
  }
  
  return testCases;
}

/**
 * Parse ZIP Specification
 */
function parseZipSpecification(content: string): ZipSpecification | undefined {
  const match = content.match(/\[?ZIP Package Specification\]?[\s\S]*?File Structure:([\s\S]*?)(?=\[|$)/i);
  if (!match) return undefined;
  
  const structureText = match[1].trim();
  const files = structureText
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim());
  
  return {
    structure: structureText,
    files
  };
}

/**
 * Parse Maintainability Score
 */
function parseMaintainabilityScore(content: string): MaintainabilityScore | undefined {
  // Look for score patterns
  const overallMatch = content.match(/(?:Overall|Maintainability)\s*Score[:\s]*(\d+)(?:\/100)?/i);
  const docMatch = content.match(/Documentation[:\s]*(\d+)(?:\/100)?/i);
  const testMatch = content.match(/Test\s*Coverage[:\s]*(\d+)(?:\/100)?/i);
  const complexityMatch = content.match(/(?:Code\s*)?Complexity[:\s]*(\d+)(?:\/100)?/i);
  
  if (!overallMatch) return undefined;
  
  return {
    overall: parseInt(overallMatch[1]),
    documentation: docMatch ? parseInt(docMatch[1]) : undefined,
    testCoverage: testMatch ? parseInt(testMatch[1]) : undefined,
    codeComplexity: complexityMatch ? parseInt(complexityMatch[1]) : undefined
  };
}

/**
 * Extract text section by name
 */
function extractTextSection(content: string, sectionName: string): string | undefined {
  // Try bracket format: [Section Name]
  let match = content.match(new RegExp(`\\[${sectionName}\\]([\\s\\S]*?)(?=\\[|$)`, 'i'));
  
  // Try heading format: ## Section Name
  if (!match) {
    match = content.match(new RegExp(`#{1,3}\\s*${sectionName}([\\s\\S]*?)(?=\\n#{1,3}\\s|\\[|$)`, 'i'));
  }
  
  return match?.[1].trim();
}

/**
 * Main parser function
 */
export function parseAIResponse(content: string): ParsedAIResponse {
  // Check if this looks like a structured response
  const hasStructuredMarkers = 
    content.includes('[Multi-file Context') ||
    content.includes('[Enhanced Code Review]') ||
    content.includes('[Intelligent Refactor') ||
    content.includes('[Automated Test Suite') ||
    content.includes('Multi-file Context Reasoning') ||
    content.includes('CRITICAL ISSUES') ||
    content.includes('HIGH RISK ISSUES') ||
    content.includes('Test Case 1:');

  if (!hasStructuredMarkers) {
    return {
      hasStructuredContent: false,
      rawContent: content,
      additionalContent: content
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

  // Check if we actually parsed anything
  const hasParsedContent = 
    parsed.multiFileContext ||
    (parsed.securityIssues && parsed.securityIssues.length > 0) ||
    (parsed.refactorSuggestions && parsed.refactorSuggestions.length > 0) ||
    (parsed.testCases && parsed.testCases.length > 0) ||
    parsed.zipSpecification ||
    parsed.architectureAssessment ||
    parsed.dependencyRiskAnalysis ||
    parsed.performanceConcerns ||
    parsed.maintainabilityScore;

  if (!hasParsedContent) {
    // Parsing failed, return as unstructured
    return {
      hasStructuredContent: false,
      rawContent: content,
      additionalContent: content
    };
  }

  // Create clean content by removing parsed sections
  let cleanContent = content;
  
  // Helper to remove section by header
  const removeSection = (header: string) => {
    const regex = new RegExp(`\\[${header}\\][\\s\\S]*?(?=\\[|$)`, 'i');
    cleanContent = cleanContent.replace(regex, '');
    // Also try markdown header format
    const mdRegex = new RegExp(`#{1,3}\\s*${header}[\\s\\S]*?(?=\\n#{1,3}\\s|\\[|$)`, 'i');
    cleanContent = cleanContent.replace(mdRegex, '');
  };

  if (parsed.multiFileContext) removeSection('Multi-file Context Reasoning');
  if (parsed.securityIssues) removeSection('Enhanced Code Review');
  if (parsed.refactorSuggestions) removeSection('Intelligent Refactor Suggestions');
  if (parsed.testCases) removeSection('Automated Test Suite Generation');
  if (parsed.zipSpecification) removeSection('ZIP Package Specification');
  if (parsed.architectureAssessment) removeSection('Architecture Assessment');
  if (parsed.dependencyRiskAnalysis) removeSection('Dependency Risk Analysis');
  if (parsed.performanceConcerns) removeSection('Performance Concerns');
  if (parsed.maintainabilityScore) removeSection('Maintainability Score');
  
  // Also remove [Actionable Response] header if present, but keep the content
  removeSection('Actionable Response');

  // Clean up extra newlines
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();

  return {
    ...parsed,
    additionalContent: cleanContent
  };
}
