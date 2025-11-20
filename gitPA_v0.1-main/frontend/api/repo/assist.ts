import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAI } from './utils/ai-service.js';
import type { AssistRequestBody } from './types.js';

const MAX_FILES_IN_CONTEXT = 3; // Only 3 files for fast responses
const MAX_TOTAL_CONTEXT_SIZE = 3000; // ~750 tokens for 3-5 second response
const MAX_FILE_SIZE = 1000; // Very small excerpts for speed

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

    const allFiles = await fetchRepoFiles(owner, repo);
    
    const relevantFiles = getRelevantFiles(allFiles, query);
    
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
    const simpleSystemPrompt = `You are a helpful coding assistant. Answer questions directly and naturally. No special formatting, no headers, no structured output. Just give a clear, simple answer.`;
    const prompt = `Question about the ${repoName} repository: \"${query}\"`;
    const response = await callAI(prompt, context, simpleSystemPrompt);
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
