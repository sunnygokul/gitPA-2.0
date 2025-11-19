// @ts-nocheck
import axios from 'axios';
import { HfInference } from '@huggingface/inference';

async function fetchRepoFiles(owner: string, repo: string, path = '', files = [], depth = 0) {
  if (depth > 10 || files.length >= 50) return files;

  const githubToken = process.env.GITHUB_TOKEN || '';
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github.v3+json' } }
  );

  const items = Array.isArray(response.data) ? response.data : [response.data];

  for (const item of items) {
    if (item.type === 'file' && item.size < 100000) {
      const testExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs'];
      const isTestFile = item.name.includes('.test.') || item.name.includes('.spec.') || item.name.includes('_test');
      
      if (!isTestFile && testExtensions.some(ext => item.name.endsWith(ext))) {
        try {
          const contentResponse = await axios.get(item.download_url);
          files.push({ 
            path: item.path, 
            content: contentResponse.data, 
            name: item.name,
            language: getLanguage(item.name)
          });
        } catch (err) {
          console.error(`Failed to fetch ${item.path}:`, err.message);
        }
      }
    } else if (item.type === 'dir' && !item.name.includes('node_modules') && !item.name.includes('.git')) {
      await fetchRepoFiles(owner, repo, item.path, files, depth + 1);
    }
  }

  return files;
}

function getLanguage(filename: string): string {
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.java')) return 'java';
  if (filename.endsWith('.cs')) return 'csharp';
  return 'unknown';
}

function getTestFramework(language: string): string {
  const frameworks = {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { repoUrl, filePath } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ status: 'error', message: 'repoUrl is required' });
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });
    }

    const [, owner, repo] = match;
    const repoName = `${owner}/${repo}`;
    console.log(`Generating tests for ${repoName}...`);

    const files = await fetchRepoFiles(owner, repo);
    console.log(`Found ${files.length} testable files`);

    let targetFiles = files;
    if (filePath) {
      targetFiles = files.filter(f => f.path === filePath);
      if (targetFiles.length === 0) {
        return res.status(404).json({ status: 'error', message: `File ${filePath} not found` });
      }
    } else {
      // Generate for top 5 most complex files (by line count as proxy)
      targetFiles = files
        .sort((a, b) => b.content.split('\n').length - a.content.split('\n').length)
        .slice(0, 5);
    }

    console.log(`Generating tests for ${targetFiles.length} files...`);

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
      } catch (err) {
        console.error(`Failed to generate tests for ${file.path}:`, err.message);
        testResults.push({
          originalFile: file.path,
          error: err.message
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

  } catch (error) {
    console.error('Test generation error:', error);
    const safeMessage = error?.response?.data?.message || error?.message || 'Test generation failed';
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
