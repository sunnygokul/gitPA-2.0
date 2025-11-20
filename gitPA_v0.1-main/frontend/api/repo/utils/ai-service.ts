/**
 * Multi-Provider AI Service
 * Supports multiple FREE AI providers with automatic fallback:
 * 1. Google Gemini 2.5 Flash (Primary - 1M context, 1500 RPD)
 * 2. Groq Llama 3.3 70B (Fast fallback - 14.4K RPD)
 * 3. HuggingFace (Additional fallback - limited free tier)
 * 
 * Implements enhanced prompt format for Gitbot 2.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIProvider {
  name: string;
  available: boolean;
  maxContext: number;
  call: (prompt: string, context: string) => Promise<string>;
}

const MAX_CONTEXT_DEFAULT = 80000;

/**
 * Google Gemini 2.5 Flash - PRIMARY PROVIDER
 * Best for code analysis with 1M token context window
 * Rate Limits: 15 RPM, 1M TPM, 1,500 RPD (FREE)
 */
async function callGemini(prompt: string, context: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    }
  });

  const fullPrompt = `${getSystemPrompt()}\n\n${context}\n\n${prompt}`;
  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  return response.text();
}

/**
 * Groq (Llama 3.3 70B) - FAST FALLBACK
 * Lightning-fast inference with LPU architecture
 * Rate Limits: 30 RPM, 14,400 RPD (FREE)
 */
async function callGroq(prompt: string, context: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: `${context}\n\n${prompt}` }
      ],
      max_tokens: 8000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}

/**
 * HuggingFace AI Provider - ADDITIONAL FALLBACK
 * Multiple models available but limited free tier
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
 * Get enhanced system prompt for Gitbot 2.0
 * SIMPLIFIED for faster 3-5 second responses
 * MATCHES aiResponseParser.ts REGEX EXACTLY
 */
function getSystemPrompt(): string {
  return `You are Gitbot 2.0 AI. Analyze code and respond FAST in this EXACT format:

[Multi-file Context Reasoning]
📁 Relevant Files
<summary>
🔗 Dependencies Involved
<dependencies>
⚡ Cross-file Considerations
<cross-file>

[Enhanced Code Review]
🔴 CRITICAL ISSUES
File: <path>
Description: <issue>
Attack Scenario: <scenario>
Fix Recommendation: <fix>
Impact Scope: <scope>

🟠 HIGH RISK ISSUES
File: <path>
...

[Intelligent Refactor Suggestions]
1. File: <path>
   - Issue: <issue>
   - Refactor Recommendation: <fix>
   - Impact on Other Files: <impact>
   - Security Implications: <implications>
   - Priority: HIGH

[Automated Test Suite Generation]
Test Case 1: <name>
\`\`\`language
<code>
\`\`\`

[ZIP Package Specification]
File Structure:
- tests/test_1.ts

Keep responses under 2000 tokens. Be specific and actionable.`;
}

/**
 * Multi-provider AI call with automatic fallback
 * Priority: Gemini > Groq > HuggingFace
 */
export async function callAI(prompt: string, context: string): Promise<string> {
  const providers: AIProvider[] = [
    {
      name: 'Google Gemini 2.5 Flash',
      available: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      maxContext: 1000000, // 1M tokens
      call: callGemini
    },
    {
      name: 'Groq (Llama 3.3 70B)',
      available: !!process.env.GROQ_API_KEY,
      maxContext: 128000, // 128K tokens
      call: callGroq
    },
    {
      name: 'HuggingFace (Qwen)',
      available: !!process.env.HUGGINGFACE_API_KEY,
      maxContext: 32000, // 32K tokens
      call: callHuggingFace
    }
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    if (!provider.available) {
      console.log(`${provider.name}: API key not configured, skipping`);
      continue;
    }

    // Truncate context based on provider's max context
    const truncatedContext = context.length > provider.maxContext
      ? context.substring(0, provider.maxContext) + '\n\n[Context truncated due to size limits]'
      : context;

    try {
      console.log(`Attempting AI call with ${provider.name}...`);
      const result = await provider.call(prompt, truncatedContext);
      console.log(`${provider.name}: Success ✅`);
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
 * DRASTICALLY REDUCED for 3-5 second responses
 */
function buildFileContext(files: any[]): string {
  const MAX_FILES = 3; // Only 3 files for speed
  const MAX_FILE_SIZE = 500; // Very small excerpts
  
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
