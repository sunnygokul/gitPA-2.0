import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRepoFiles } from './utils/github-api.js';
import type { RefactorRequestBody } from './types.js';

interface RefactoringSuggestion {
  file: string;
  type: 'Extract Function' | 'Rename' | 'Remove Duplication' | 'Simplify Logic' | 'Performance' | 'Security' | 'Modernize';
  severity: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  before: string;
  after: string;
  benefits: string[];
}

function detectCodeSmells(files: any[]): RefactoringSuggestion[] {
  const suggestions: RefactoringSuggestion[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');

    // Long functions (>50 lines)
    let functionStart = -1;
    let functionName = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const funcMatch = line.match(/function\s+(\w+)|const\s+(\w+)\s*=.*=>|def\s+(\w+)/);
      
      if (funcMatch) {
        if (functionStart !== -1 && i - functionStart > 50) {
          suggestions.push({
            file: file.path,
            type: 'Extract Function',
            severity: 'High',
            title: `Function ${functionName} is too long (${i - functionStart} lines)`,
            description: 'Long functions are hard to understand, test, and maintain',
            before: lines.slice(functionStart, functionStart + 10).join('\n') + '\n...',
            after: 'Split into smaller, focused functions with clear responsibilities',
            benefits: ['Improved readability', 'Easier testing', 'Better reusability']
          });
        }
        functionStart = i;
        functionName = funcMatch[1] || funcMatch[2] || funcMatch[3];
      }
    }

    // Nested conditionals (>3 levels)
    for (let i = 0; i < lines.length; i++) {
      const indentLevel = (lines[i].match(/^\s*/)?.[0].length || 0) / 2;
      if (indentLevel > 4 && lines[i].trim().startsWith('if')) {
        suggestions.push({
          file: file.path,
          type: 'Simplify Logic',
          severity: 'Medium',
          title: `Deep nesting detected at line ${i + 1}`,
          description: 'Deeply nested conditionals reduce code readability',
          before: lines.slice(Math.max(0, i - 2), i + 3).join('\n'),
          after: 'Use early returns or extract conditions into named functions',
          benefits: ['Flatter structure', 'Easier to follow', 'Reduced cognitive load']
        });
      }
    }

    // Magic numbers
    const magicNumberMatches = file.content.matchAll(/(?<![a-zA-Z_])\d{2,}(?![a-zA-Z_])/g);
    for (const match of magicNumberMatches) {
      const num = match[0];
      if (num !== '100' && num !== '1000' && !num.startsWith('0')) {
        const position = match.index || 0;
        const lineNum = file.content.substring(0, position).split('\n').length;
        suggestions.push({
          file: file.path,
          type: 'Rename',
          severity: 'Low',
          title: `Magic number ${num} at line ${lineNum}`,
          description: 'Replace magic numbers with named constants',
          before: file.content.split('\n')[lineNum - 1] || '',
          after: `const MEANINGFUL_NAME = ${num}; // Use descriptive constant`,
          benefits: ['Self-documenting code', 'Easier maintenance', 'Centralized values']
        });
        break; // Only show one per file
      }
    }

    // Duplicate code patterns
    const functionBodies = file.content.match(/function\s+\w+[^{]*\{([^}]{50,})\}/g);
    if (functionBodies && functionBodies.length > 1) {
      for (let i = 0; i < functionBodies.length - 1; i++) {
        for (let j = i + 1; j < functionBodies.length; j++) {
          const similarity = calculateSimilarity(functionBodies[i], functionBodies[j]);
          if (similarity > 0.7) {
            suggestions.push({
              file: file.path,
              type: 'Remove Duplication',
              severity: 'High',
              title: 'Duplicate code detected between functions',
              description: 'Similar code patterns should be extracted into shared utility',
              before: functionBodies[i].substring(0, 200) + '...',
              after: 'Extract common logic into reusable function',
              benefits: ['DRY principle', 'Single source of truth', 'Easier bug fixes']
            });
            break;
          }
        }
      }
    }
  }

  return suggestions;
}

function calculateSimilarity(str1: string, str2: string): number {
  const tokens1 = str1.replace(/\s+/g, ' ').split(' ');
  const tokens2 = str2.replace(/\s+/g, ' ').split(' ');
  const commonTokens = tokens1.filter(t => tokens2.includes(t)).length;
  return (2 * commonTokens) / (tokens1.length + tokens2.length);
}

async function getAIRefactoringSuggestions(files: any[], repoName: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY || '';

  const codeContext = files
    .slice(0, 6)
    .map(f => `File: ${f.path}\n\`\`\`\n${f.content.substring(0, 5000)}\n\`\`\``)
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
            content: 'You are an expert code refactoring specialist with deep knowledge of design patterns, SOLID principles, and architecture optimization.'
          },
          {
            role: 'user',
            content: `Refactor ${repoName}:\n\n${codeContext}\n\nProvide 5-10 suggestions with: Type, Severity, Location, Problem, Solution, Benefits. Focus on: duplication, complexity, performance, security.`
          }
        ],
        max_tokens: 2048,
        temperature: 0.3,
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
    const { repoUrl } = req.body as RefactorRequestBody;

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

    const files = await fetchRepoFiles(owner, repo, {
      maxDepth: 8,
      maxFiles: 50,
      maxFileSize: 150000,
      fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.cs', '.php', '.rb', '.go']
    });

    const automaticSuggestions = detectCodeSmells(files);

    const aiSuggestions = await getAIRefactoringSuggestions(files, repoName);

    const stats = {
      highPriority: automaticSuggestions.filter(s => s.severity === 'High').length,
      mediumPriority: automaticSuggestions.filter(s => s.severity === 'Medium').length,
      lowPriority: automaticSuggestions.filter(s => s.severity === 'Low').length,
      total: automaticSuggestions.length
    };

    res.json({
      status: 'success',
      repoName,
      stats,
      suggestions: automaticSuggestions.sort((a, b) => {
        const severityOrder = { High: 0, Medium: 1, Low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      aiAnalysis: aiSuggestions,
      filesAnalyzed: files.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    const err = error as any;
    console.error('Refactoring analysis error:', err);
    const safeMessage = err?.response?.data?.message || err?.message || 'Refactoring analysis failed';
    res.status(500).json({ status: 'error', message: String(safeMessage) });
  }
}
