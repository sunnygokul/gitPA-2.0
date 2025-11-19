// @ts-nocheck
import axios from 'axios';
import { HfInference } from '@huggingface/inference';

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

async function fetchRepoFiles(owner: string, repo: string, path = '', files = [], depth = 0) {
  if (depth > 10 || files.length >= 100) return files;

  const githubToken = process.env.GITHUB_TOKEN || '';
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github.v3+json' } }
  );

  const items = Array.isArray(response.data) ? response.data : [response.data];

  for (const item of items) {
    if (item.type === 'file' && item.size < 200000) {
      try {
        const contentResponse = await axios.get(item.download_url);
        files.push({ 
          path: item.path, 
          content: contentResponse.data, 
          name: item.name,
          size: item.size
        });
      } catch (err) {
        console.error(`Failed to fetch ${item.path}:`, err.message);
      }
    } else if (item.type === 'dir' && !item.name.includes('node_modules') && !item.name.includes('.git')) {
      await fetchRepoFiles(owner, repo, item.path, files, depth + 1);
    }
  }

  return files;
}

function calculateMetrics(files: any[]): CodeMetrics {
  let totalLines = 0;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let largestFile = { path: '', lines: 0 };
  const languageDistribution: Record<string, number> = {};

  for (const file of files) {
    const lines = file.content.split('\n');
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

    // JavaScript/TypeScript imports
    const importMatches = file.content.matchAll(/import\s+(?:{[^}]+}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      imports.push(importPath);
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        externalDependencies.push(importPath.split('/')[0]);
      }
    }

    // Python imports
    const pyImportMatches = file.content.matchAll(/(?:from\s+(\S+)\s+)?import\s+([^\n]+)/g);
    for (const match of pyImportMatches) {
      const module = match[1] || match[2].split(',')[0].trim();
      imports.push(module);
      if (!module.startsWith('.')) {
        externalDependencies.push(module.split('.')[0]);
      }
    }

    // Exports
    const exportMatches = file.content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g);
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
  const hf = new HfInference(apiKey);

  // Sample key files for review
  const keyFiles = files
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, 8)
    .map(f => `File: ${f.path}\n\`\`\`\n${f.content.substring(0, 3000)}\n\`\`\``)
    .join('\n\n');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct/v1/chat/completions',
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
            content: 'You are an expert software architect.'
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

async function OLD_getAICodeReview_DELETE_THIS(files: any[], metrics: CodeMetrics, dependencies: DependencyInfo[], repoName: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY || '';
  const hf = new HfInference(apiKey);

  // Sample key files for review
  const keyFiles = files
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, 10)
    .map(f => `File: ${f.path}\n\`\`\`\n${f.content.substring(0, 5000)}\n\`\`\``)
    .join('\n\n');

  const prompt = `<|im_start|>system
You are Qwen2.5-Coder, an expert software architect performing comprehensive code reviews.<|im_end|>
<|im_start|>user
Perform a detailed code review for repository: ${repoName}

REPOSITORY METRICS:
- Total Files: ${metrics.totalFiles}
- Total Lines: ${metrics.totalLines} (Code: ${metrics.codeLines}, Comments: ${metrics.commentLines}, Blank: ${metrics.blankLines})
- Average File Size: ${metrics.averageFileSize} lines
- Largest File: ${metrics.largestFile.path} (${metrics.largestFile.lines} lines)
- Languages: ${Object.keys(metrics.languageDistribution).join(', ')}

DEPENDENCY ANALYSIS:
${dependencies.slice(0, 5).map(d => `- ${d.file}: imports ${d.imports.length} modules, exports ${d.exports.length} items`).join('\n')}

KEY FILES FOR REVIEW:
${keyFiles}

ANALYSIS REQUIRED:
1. **Architecture Assessment**: Evaluate overall code structure, design patterns, and organization
2. **Code Quality**: Assess maintainability, readability, and adherence to best practices
3. **Security Concerns**: Identify potential vulnerabilities (beyond basic patterns)
4. **Performance Issues**: Spot inefficient algorithms, memory leaks, or bottlenecks
5. **Technical Debt**: Highlight areas needing refactoring or modernization
6. **Dependencies**: Evaluate external dependencies and potential risks
7. **Testing Coverage**: Assess test presence and quality
8. **Documentation**: Review code comments and documentation quality
9. **Scalability**: Evaluate if architecture can handle growth
10. **Recommendations**: Provide actionable improvement suggestions

Provide a detailed, structured review with specific examples and file references.<|im_end|>
<|im_start|>assistant
`;

  const response = await hf.textGeneration({
    model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    inputs: prompt,
    parameters: {
      max_new_tokens: 4096,
      temperature: 0.4,
      top_p: 0.9,
    }
  });

  return response.generated_text.split('<|im_start|>assistant\n')[1] || response.generated_text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ status: 'error', message: 'repoUrl is required' });
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });
    }

    const [, owner, repo] = match;
    const repoName = `${owner}/${repo}`;
    console.log(`Performing code review for ${repoName}...`);

    const files = await fetchRepoFiles(owner, repo);
    console.log(`Analyzing ${files.length} files...`);

    const metrics = calculateMetrics(files);
    const dependencies = analyzeDependencies(files);

    console.log('Generating AI-powered code review...');
    const aiReview = await getAICodeReview(files, metrics, dependencies, repoName);

    // Calculate quality scores
    const commentRatio = metrics.commentLines / metrics.codeLines;
    const documentationScore = Math.min(100, Math.round(commentRatio * 200));
    
    const avgComplexity = metrics.averageFileSize;
    const maintainabilityScore = Math.max(0, 100 - Math.round(avgComplexity / 10));

    const uniqueDeps = new Set(dependencies.flatMap(d => d.externalDependencies)).size;
    const dependencyScore = Math.max(0, 100 - uniqueDeps * 2);

    const overallScore = Math.round((documentationScore + maintainabilityScore + dependencyScore) / 3);

    res.json({
      status: 'success',
      repoName,
      overallScore,
      scores: {
        documentation: documentationScore,
        maintainability: maintainabilityScore,
        dependencies: dependencyScore
      },
      metrics,
      dependencies: dependencies.slice(0, 20), // Top 20 most connected files
      aiReview,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ CODE REVIEW ERROR:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      apiKeySet: !!process.env.HUGGINGFACE_API_KEY
    });
    const safeMessage = error?.response?.data?.error || error?.message || 'Code review failed. Check if HUGGINGFACE_API_KEY is set in Vercel.';
    res.status(500).json({ status: 'error', message: String(safeMessage), debug: { apiKeySet: !!process.env.HUGGINGFACE_API_KEY } });
  }
}
