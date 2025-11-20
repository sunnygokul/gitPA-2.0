import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AssistRequestBody } from './types';

const MAX_FILES_IN_CONTEXT = 10; // Reduced to prevent token limit
const MAX_TOTAL_CONTEXT_SIZE = 80000; // ~20K tokens (4 chars per token)
const MAX_FILE_SIZE = 8000; // Smaller file excerpts

interface RepoFile {
  path: string;
  content: string;
}

async function fetchRepoFiles(owner: string, repo: string, path = '', files: RepoFile[] = []): Promise<RepoFile[]> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    const items = response.data;

    for (const item of items) {
      if (item.type === 'file' && item.size < 1000000) {
        try {
          const fileResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`,
                Accept: 'application/vnd.github.v3.raw',
              },
              responseType: 'text',
            }
          );
          
          let content = fileResponse.data;
          if (content.length > MAX_FILE_SIZE) {
            content = content.substring(0, MAX_FILE_SIZE) + '\n... (truncated)';
          }
          
          files.push({ path: item.path, content });
        } catch (err: unknown) {
          const error = err as Error;
          console.error(`Error fetching ${item.path}:`, error.message);
        }
      } else if (item.type === 'dir' && files.length < 50) {
        await fetchRepoFiles(owner, repo, item.path, files);
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error fetching repo contents at ${path}:`, err.message);
  }

  return files;
}

function getRelevantFiles(allFiles: RepoFile[], query: string): RepoFile[] {
  if (allFiles.length <= MAX_FILES_IN_CONTEXT) {
    return allFiles;
  }

  const queryTerms = query.toLowerCase().split(/\s+/);
  
  const scored = allFiles.map(file => {
    const pathLower = file.path.toLowerCase();
    const contentLower = file.content.toLowerCase();
    
    let score = 0;
    queryTerms.forEach(term => {
      if (pathLower.includes(term)) score += 3;
      if (contentLower.includes(term)) score += 1;
    });
    
    return { file, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FILES_IN_CONTEXT)
    .map(item => item.file);
}

async function getAIResponse(query: string, context: string, repoName: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY || '';

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
            content: `You are an expert code analysis AI analyzing: ${repoName}. ONLY answer based on provided files. Cite specific files.`
          },
          {
            role: 'user',
            content: `REPOSITORY FILES:\n${context}\n\nQUESTION: ${query}\n\nAnalyze based ONLY on files above.`
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
  try {
    const { repoUrl, query } = req.body as AssistRequestBody;
    
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });
      return;
    }

    const [, owner, repo] = match;

    console.log(`Fetching files for ${owner}/${repo} to answer query: ${query}`);
    
    const allFiles = await fetchRepoFiles(owner, repo);
    console.log(`Found ${allFiles.length} files in repository`);
    
    const relevantFiles = getRelevantFiles(allFiles, query);
    console.log(`Selected ${relevantFiles.length} relevant files for context`);
    
    let context = relevantFiles
      .map(file => `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``)
      .join('\n\n');
    
    if (context.length > MAX_TOTAL_CONTEXT_SIZE) {
      context = context.substring(0, MAX_TOTAL_CONTEXT_SIZE) + '\n... (context truncated)';
    }
    
    if (!context || context.trim().length === 0) {
      context = `Repository: ${owner}/${repo}\n(No specific file content available for this query)`;
    }
    
    const repoName = `${owner}/${repo}`;
    const response = await getAIResponse(query, context, repoName);
    res.json({ status: 'success', response });
  } catch (error: unknown) {
    const err = error as any;
    console.error('❌ ASSIST ERROR:', err);
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
    
    const safeMessage = err?.response?.data?.error || err?.message || 'Failed to process query';
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
