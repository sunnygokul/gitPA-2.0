/**
 * Multi-Provider AI Service
 * Supports HuggingFace (primary) and Google Gemini (fallback)
 * Implements enhanced prompt format for Gitbot 2.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIProvider {
  name: string;
  available: boolean;
  call: (prompt: string, context: string) => Promise<string>;
}

const MAX_CONTEXT = 80000; // Max context size for API calls

/**
 * HuggingFace AI Provider
 */
async function callHuggingFace(prompt: string, context: string): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not set');

  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'Qwen/Qwen2.5-7B-Instruct',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: `${context}\n\n${prompt}` }
      ],
      max_tokens: 4096,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HF API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}

/**
 * Google Gemini AI Provider (Fallback)
 */
async function callGemini(prompt: string, context: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    }
  });

  const fullPrompt = `${getSystemPrompt()}\n\n${context}\n\n${prompt}`;
  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  return response.text();
}

/**
 * Get enhanced system prompt for Gitbot 2.0
 */
function getSystemPrompt(): string {
  return `You are Claude, the core AI analysis engine powering Gitbot 2.0, an advanced web-based AI platform designed to analyze GitHub repositories, understand multi-file context, generate intelligent code refactoring advice, perform enhanced code reviews, and automatically generate downloadable test cases.

Your job is to operate as a full-stack AI development assistant with the following capabilities:

1. MULTI-FILE CONTEXT SUPPORT (MANDATORY BEHAVIOR)

Your responsibilities:
* Load, parse, and maintain complete multi-file context of the repository provided to you.
* Build semantic understanding of the entire codebase structure.
* Infer relationships between files, functions, classes, modules, and shared data flows.
* Resolve references across files to maintain continuity of understanding.
* Maintain long-term memory within the active session.

When asked any question, you must:
* Identify which files in the repository are relevant.
* Provide responses that incorporate cross-file dependencies and interactions.
* Mention how changes in one file impact others.
* Surface hidden connections (e.g., duplicated code, patterns, shared utilities).

Expected output format:

[Multi-file Context Reasoning]
- Summary of relevant files and relationships.
- Dependencies involved.
- Cross-file considerations.

[Actionable Response]
- Final answer tailored to user prompt.

2. INTELLIGENT CODE REFACTORING

Your responsibilities:
* Suggest improvements in structure, maintainability, readability, and performance.
* Identify code smells across files: duplicated logic, misused inheritance, large functions, global state overuse, poor naming, dead code.

All refactoring suggestions should include:
* File-by-file breakdown
* The rationale for the change
* The expected before/after outcome
* Risks or dependencies
* Security implications

Format your response:

[Intelligent Refactor Suggestions]
1. File: <filename>
   - Issue:
   - Refactor Recommendation:
   - Impact on Other Files:
   - Security Implications:
   - Expected Benefits:

2. File: <filename>
   ...

3. AUTOMATED TEST GENERATION UNIT

Generate five high-quality test cases for the repository, based on:
* File interactions
* Edge cases
* Negative test scenarios
* Valid + invalid inputs
* Dependency mocks

Required response format:

[Automated Test Suite Generation]
Tests Generated For: <files>

Test Case 1: <name>
\`\`\`language
<code>
\`\`\`

Test Case 2: <name>
\`\`\`language
<code>
\`\`\`
...

[ZIP Package Specification]
File Structure:
- tests/test_case_1.ext
- tests/test_case_2.ext
- tests/test_case_3.ext
- tests/test_case_4.ext
- tests/test_case_5.ext

4. ENHANCED CODE REVIEW WITH SECURITY CLASSIFICATION

Perform a holistic security and quality review across the entire repository.

Key tasks:
* Identify vulnerabilities, misconfigurations, unsafe coding patterns.
* Prioritize sensitive files: .env, credential loaders, config.js, secrets.py
* Categorize issues by severity: Critical / High / Medium / Low

Your response must include:

[Enhanced Code Review]

1. CRITICAL ISSUES (Immediate Action Required)
   File: <path>
   Description: <detailed issue>
   Attack Scenario: <how it can be exploited>
   Fix Recommendation: <specific code fix>
   Impact Scope: <which files are affected>

2. HIGH RISK ISSUES (Address Soon)
   File: <path>
   ...

3. MEDIUM RISK ISSUES (Plan to Fix)
   ...

4. LOW RISK / MINOR ISSUES (Nice to Have)
   ...

[Architecture Assessment]
- Overall architecture pattern
- Design concerns
- Scalability considerations

[Dependency Risk Analysis]
- Vulnerable dependencies
- Outdated packages
- License compliance

[Performance Concerns]
- Bottlenecks identified
- Optimization opportunities

[Maintainability Score]
- Overall: X/100
- Documentation: X/100
- Test Coverage: X/100
- Code Complexity: X/100

CRITICAL: Always use multi-file reasoning. Never analyze files in isolation.`;
}

/**
 * Multi-provider AI call with automatic fallback
 */
export async function callAI(prompt: string, context: string): Promise<string> {
  // Truncate context if too large
  const truncatedContext = context.length > MAX_CONTEXT
    ? context.substring(0, MAX_CONTEXT) + '\n\n[Context truncated due to size limits]'
    : context;

  const providers: AIProvider[] = [
    {
      name: 'HuggingFace',
      available: !!process.env.HUGGINGFACE_API_KEY,
      call: callHuggingFace
    },
    {
      name: 'Google Gemini',
      available: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      call: callGemini
    }
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    if (!provider.available) {
      console.log(`${provider.name}: API key not configured, skipping`);
      continue;
    }

    try {
      console.log(`Attempting AI call with ${provider.name}...`);
      const result = await provider.call(prompt, truncatedContext);
      console.log(`${provider.name}: Success`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`${provider.name}: Failed - ${error.message}`);
      
      // Don't retry if it's a rate limit error (402/429)
      if (error.message?.includes('402') || error.message?.includes('429')) {
        console.log(`${provider.name}: Rate limited, trying next provider`);
        continue;
      }
      
      // For other errors, continue to next provider
      console.log(`${provider.name}: Error occurred, trying next provider`);
    }
  }

  // All providers failed
  throw new Error(
    `All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}. ` +
    `Configured providers: ${providers.filter(p => p.available).map(p => p.name).join(', ') || 'None'}`
  );
}

/**
 * Generate enhanced code review with proper formatting
 */
export async function generateCodeReview(
  files: any[],
  metrics: any,
  dependencies: any,
  repoName: string
): Promise<string> {
  const context = buildFileContext(files);
  
  const prompt = `Perform an ENHANCED CODE REVIEW for repository: ${repoName}

Repository Metrics:
- Total Files: ${metrics.totalFiles}
- Total Lines: ${metrics.totalLines}
- Code Lines: ${metrics.codeLines}
- Comment Lines: ${metrics.commentLines}
- Languages: ${Object.keys(metrics.languageDistribution).join(', ')}

Dependencies Found: ${dependencies.length} files with imports

INSTRUCTIONS:
1. Analyze the ENTIRE codebase holistically
2. Use the exact format specified in your system prompt
3. Include [Multi-file Context Reasoning] section first
4. Then provide [Enhanced Code Review] with severity classifications
5. Include [Architecture Assessment], [Dependency Risk Analysis], [Performance Concerns], and [Maintainability Score]
6. Be specific with file names, line numbers, and code examples
7. Provide actionable fixes

Begin your analysis:`;

  return await callAI(prompt, context);
}

/**
 * Generate intelligent refactoring suggestions
 */
export async function generateRefactoringSuggestions(
  files: any[],
  automaticSuggestions: any[],
  repoName: string
): Promise<string> {
  const context = buildFileContext(files);
  
  const prompt = `Generate INTELLIGENT REFACTORING SUGGESTIONS for repository: ${repoName}

Automatic code smell detection found ${automaticSuggestions.length} issues:
${automaticSuggestions.slice(0, 10).map(s => `- ${s.file}: ${s.title}`).join('\n')}

INSTRUCTIONS:
1. Use the exact format: [Intelligent Refactor Suggestions]
2. For each suggestion, include:
   - File: <path>
   - Issue: <what's wrong>
   - Refactor Recommendation: <specific changes>
   - Impact on Other Files: <cross-file effects>
   - Security Implications: <if any>
   - Expected Benefits: <bullet points>
3. Prioritize by severity (High > Medium > Low)
4. Focus on cross-file refactorings (shared utilities, duplicate code, patterns)
5. Include before/after code examples

Begin your analysis:`;

  return await callAI(prompt, context);
}

/**
 * Generate downloadable test cases
 */
export async function generateTestCases(
  files: any[],
  targetFile: string,
  language: string
): Promise<string> {
  const context = buildFileContext(files);
  
  const prompt = `Generate 5 HIGH-QUALITY TEST CASES for file: ${targetFile}

Language: ${language}
Framework: ${getTestFramework(language)}

INSTRUCTIONS:
1. Use the exact format: [Automated Test Suite Generation]
2. Generate 5 complete, runnable test cases
3. Include:
   - Happy path tests
   - Edge cases
   - Error handling
   - Boundary conditions
   - Mocked dependencies
4. Provide code in proper markdown code blocks
5. End with [ZIP Package Specification] listing all test files

Begin test generation:`;

  return await callAI(prompt, context);
}

/**
 * Build file context for AI
 */
function buildFileContext(files: any[]): string {
  const MAX_FILES = 20;
  const MAX_FILE_SIZE = 2000;
  
  const limitedFiles = files.slice(0, MAX_FILES);
  
  return limitedFiles
    .map(file => {
      const content = typeof file.content === 'string' ? file.content : String(file.content || '');
      const truncated = content.length > MAX_FILE_SIZE
        ? content.substring(0, MAX_FILE_SIZE) + '\n...[truncated]'
        : content;
      
      return `
=== File: ${file.path} ===
${truncated}
`;
    })
    .join('\n');
}

/**
 * Get test framework for language
 */
function getTestFramework(language: string): string {
  const frameworks: Record<string, string> = {
    'javascript': 'Jest/Vitest',
    'typescript': 'Jest/Vitest',
    'python': 'pytest',
    'java': 'JUnit',
    'csharp': 'NUnit',
    'go': 'testing',
    'ruby': 'RSpec'
  };
  return frameworks[language.toLowerCase()] || 'Standard framework';
}
