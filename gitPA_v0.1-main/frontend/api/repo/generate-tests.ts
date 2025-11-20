import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRepoFiles } from './utils/github-api';
import type { TestGenerationRequestBody } from './types';

function getLanguage(filename: string): string {
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.java')) return 'java';
  if (filename.endsWith('.cs')) return 'csharp';
  return 'unknown';
}

function getTestFramework(language: string): string {
  const frameworks: Record<string, string> = {
    javascript: 'Jest',
    typescript: 'Jest',
    python: 'pytest',
    java: 'JUnit',
    csharp: 'NUnit'
  };
  return frameworks[language] || 'appropriate testing framework';
}

async function generateTestsWithAI(file: any, repoName: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY || '';
  const framework = getTestFramework(file.language);

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
            content: 'You are an expert test engineer.'
          },
          {
            role: 'user',
            content: `Generate ${framework} tests for:\n\nFILE: ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\nInclude: happy path, edge cases, error handling. Generate ONLY test code with imports.`
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
    const { repoUrl, filePath } = req.body as TestGenerationRequestBody;

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
      maxDepth: 10,
      maxFiles: 50,
      maxFileSize: 100000,
      fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs'],
      excludeTests: true
    });
    
    // Add language to each file with type
    interface FileWithLanguage {
      path: string;
      name: string;
      content: string;
      size?: number;
      language: string;
    }
    
    const filesWithLanguage = files.map(f => ({
      ...f,
      language: getLanguage(f.name)
    })) as FileWithLanguage[];

    let targetFiles = filesWithLanguage;
    if (filePath) {
      targetFiles = filesWithLanguage.filter(f => f.path === filePath);
      if (targetFiles.length === 0) {
        res.status(404).json({ status: 'error', message: `File ${filePath} not found` });
        return;
      }
    } else {
      // Generate for top 5 most complex files (by line count as proxy)
      targetFiles = filesWithLanguage
        .sort((a, b) => b.content.split('\n').length - a.content.split('\n').length)
        .slice(0, 5);
    }

    const testResults = [];
    for (const file of targetFiles) {
      try {
        const testCode = await generateTestsWithAI(file, repoName);
        const testFileName = generateTestFileName(file.name, file.language);
        
        testResults.push({
          originalFile: file.path,
          testFile: testFileName,
          testCode,
          language: file.language,
          framework: getTestFramework(file.language)
        });
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`Failed to generate tests for ${file.path}:`, error.message);
        testResults.push({
          originalFile: file.path,
          error: error.message
        });
      }
    }

    const successCount = testResults.filter(r => !r.error).length;

    res.json({
      status: 'success',
      repoName,
      testsGenerated: successCount,
      totalFiles: targetFiles.length,
      tests: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    const err = error as any;
    console.error('Test generation error:', err);
    const safeMessage = err?.response?.data?.message || err?.message || 'Test generation failed';
    res.status(500).json({ status: 'error', message: String(safeMessage) });
  }
}

function generateTestFileName(originalName: string, language: string): string {
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, '');
  
  if (language === 'python') {
    return `test_${nameWithoutExt}.py`;
  } else if (language === 'java') {
    return `${nameWithoutExt}Test.java`;
  } else {
    return `${nameWithoutExt}.test${originalName.substring(originalName.lastIndexOf('.'))}`;
  }
}
