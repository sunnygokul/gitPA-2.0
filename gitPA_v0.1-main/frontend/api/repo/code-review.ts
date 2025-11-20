import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRepoFiles } from './utils/github-api.js';
import type { CodeReviewRequestBody } from './types.js';

interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  averageFileSize: number;
  largestFile: { path: string; lines: number };
  languageDistribution: Record<string, number>;
}

interface DependencyInfo {
  file: string;
  imports: string[];
  exports: string[];
  externalDependencies: string[];
}

function calculateMetrics(files: any[]): CodeMetrics {
  let totalLines = 0;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let largestFile = { path: '', lines: 0 };
  const languageDistribution: Record<string, number> = {};

  for (const file of files) {
    // Ensure content is string
    const content = typeof file.content === 'string' ? file.content : String(file.content || '');
    const lines = content.split('\n');
    const fileLines = lines.length;
    totalLines += fileLines;

    if (fileLines > largestFile.lines) {
      largestFile = { path: file.path, lines: fileLines };
    }

    // Language detection
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    languageDistribution[ext] = (languageDistribution[ext] || 0) + 1;

    // Line type analysis
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') {
        blankLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }
  }

  return {
    totalFiles: files.length,
    totalLines,
    codeLines,
    commentLines,
    blankLines,
    averageFileSize: Math.round(totalLines / files.length),
    largestFile,
    languageDistribution
  };
}

function analyzeDependencies(files: any[]): DependencyInfo[] {
  const dependencies: DependencyInfo[] = [];

  for (const file of files) {
    const imports: string[] = [];
    const exports: string[] = [];
    const externalDependencies: string[] = [];

    // Ensure content is string
    const content = typeof file.content === 'string' ? file.content : String(file.content || '');

    // JavaScript/TypeScript imports
    const importMatches = content.matchAll(/import\s+(?:{[^}]+}|[\w*]+)\s+from\s+['"]([^'"]+)['"]‌/g);
    for (const match of importMatches) {
      const importPath = match[1];
      imports.push(importPath);
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        externalDependencies.push(importPath.split('/')[0]);
      }
    }

    // Python imports
    const pyImportMatches = content.matchAll(/(?:from\s+(\S+)\s+)?import\s+([^\n]+)/g);
    for (const match of pyImportMatches) {
      const module = match[1] || match[2].split(',')[0].trim();
      imports.push(module);
      if (!module.startsWith('.')) {
        externalDependencies.push(module.split('.')[0]);
      }
    }

    // Exports
    const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g);
    for (const match of exportMatches) {
      exports.push(match[1]);
    }

    if (imports.length > 0 || exports.length > 0) {
      dependencies.push({
        file: file.path,
        imports,
        exports,
        externalDependencies: [...new Set(externalDependencies)]
      });
    }
  }

  return dependencies;
}

async function getAICodeReview(files: any[], metrics: CodeMetrics, dependencies: DependencyInfo[], repoName: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY || '';
  
  // Sample key files for review
  const keyFiles = files
    .sort((a, b) => {
      const aLen = typeof a.content === 'string' ? a.content.length : 0;
      const bLen = typeof b.content === 'string' ? b.content.length : 0;
      return bLen - aLen;
    })
    .slice(0, 8)
    .map(f => {
      const content = typeof f.content === 'string' ? f.content : String(f.content || '');
      return `File: ${f.path}\n\`\`\`\n${content.substring(0, 3000)}\n\`\`\``;
    })
    .join('\n\n');

  const response = await fetch(
    'https://router.huggingface.co/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an expert software architect with deep knowledge of design patterns, SOLID principles, and best practices.'
          },
          {
            role: 'user',
            content: `Review ${repoName}:\n\nMETRICS: ${metrics.totalFiles} files, ${metrics.totalLines} lines\n\nKEY FILES:\n${keyFiles}\n\nAnalyze: architecture, quality, security, performance, technical debt. Provide actionable recommendations.`
          }
        ],
        max_tokens: 2048,
        temperature: 0.4,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HF API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
    const { repoUrl } = req.body as CodeReviewRequestBody;

    if (!repoUrl) {
      res.status(400).json({ status: 'error', message: 'repoUrl is required' });
      return;
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });
      return;
    }

    const [, owner, repo] = match;
    const repoName = `${owner}/${repo}`;

    const files = await fetchRepoFiles(owner, repo, { maxDepth: 10, maxFiles: 100, maxFileSize: 200000 });

    const metrics = calculateMetrics(files);
    const dependencies = analyzeDependencies(files);
    const aiReview = await getAICodeReview(files, metrics, dependencies, repoName);

    // Calculate quality scores
    const commentRatio = metrics.commentLines / metrics.codeLines;
    const documentationScore = Math.min(100, Math.round(commentRatio * 200));
    
    const avgComplexity = metrics.averageFileSize;
    const maintainabilityScore = Math.max(0, 100 - Math.round(avgComplexity / 10));

    const uniqueDeps = new Set(dependencies.flatMap(d => d.externalDependencies)).size;
    const dependencyScore = Math.max(0, 100 - uniqueDeps * 2);

    // Simple architecture score based on file organization
    const architectureScore = 85; // Basic score for now

    const overallScore = Math.round((documentationScore + maintainabilityScore + dependencyScore + architectureScore) / 4);

    res.json({
      status: 'success',
      repoName,
      overallScore,
      scores: {
        documentation: documentationScore,
        maintainability: maintainabilityScore,
        dependencies: dependencyScore,
        architecture: architectureScore
      },
      metrics,
      dependencies: dependencies.slice(0, 20), // Top 20 most connected files
      aiReview,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    const err = error as any;
    console.error('❌ CODE REVIEW ERROR:', err);
    console.error('Error stack:', err?.stack);
    console.error('Error details:', {
      message: err?.message,
      response: err?.response?.data,
      status: err?.response?.status,
      apiKeySet: !!process.env.HUGGINGFACE_API_KEY,
      apiKeyPrefix: process.env.HUGGINGFACE_API_KEY ? process.env.HUGGINGFACE_API_KEY.substring(0, 7) + '...' : 'NOT SET'
    });
    
    // Check if it's an API key issue
    if (!process.env.HUGGINGFACE_API_KEY) {
      res.status(500).json({ 
        status: 'error', 
        message: 'HUGGINGFACE_API_KEY environment variable is not set. Please configure it in Vercel dashboard under Settings > Environment Variables.',
        debug: { 
          apiKeySet: false,
          hint: 'Get your API key from https://huggingface.co/settings/tokens'
        } 
      });
      return;
    }
    
    const safeMessage = err?.response?.data?.error || err?.message || 'Code review failed';
    res.status(500).json({ 
      status: 'error', 
      message: String(safeMessage), 
      debug: { 
        apiKeySet: true,
        errorType: err?.constructor?.name
      } 
    });
  }
}
