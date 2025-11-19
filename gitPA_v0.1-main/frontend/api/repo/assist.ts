// @ts-nocheck
import axios from 'axios';
import { HfInference } from '@huggingface/inference';

const MAX_FILES_IN_CONTEXT = 25; // Qwen handles large context well
const MAX_TOTAL_CONTEXT_SIZE = 600000; // 32K token context
const MAX_FILE_SIZE = 100000;

async function fetchRepoFiles(owner: string, repo: string, path = '', files = []) {
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
        } catch (err) {
          console.error(`Error fetching ${item.path}:`, err.message);
        }
      } else if (item.type === 'dir' && files.length < 50) {
        await fetchRepoFiles(owner, repo, item.path, files);
      }
    }
  } catch (error) {
    console.error(`Error fetching repo contents at ${path}:`, error.message);
  }

  return files;
}

function getRelevantFiles(allFiles, query) {
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
  const hf = new HfInference(apiKey);

  const response = await hf.chatCompletion({
    model: 'Qwen/Qwen2.5-7B-Instruct',
    messages: [
      {
        role: 'system',
        content: `You are an expert code analysis AI analyzing the GitHub repository: ${repoName}.\n\nIMPORTANT:\n- ONLY answer based on the repository files provided\n- Always cite specific files\n- If info isn't in files, say so clearly`
      },
      {
        role: 'user',
        content: `REPOSITORY FILES:\n${context}\n\n---\n\nQUESTION: ${query}\n\nAnalyze the code and provide detailed insights based ONLY on the files above.`
      }
    ],
    max_tokens: 2048,
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

export default async function handler(req, res) {
  try {
    const { repoUrl, query } = req.body;
    
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });
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
  } catch (error) {
    console.error('assist error', error);
    const safeMessage = error?.response?.data?.message || error?.message || 'Failed to process query';
    res.status(500).json({ status: 'error', message: String(safeMessage) });
  }
}
