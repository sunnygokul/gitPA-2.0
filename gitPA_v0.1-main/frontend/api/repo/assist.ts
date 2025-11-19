// @ts-nocheck
import axios from 'axios';

// Optional advanced features
let ContextAggregator;
try {
  ContextAggregator = require('./_lib/context-aggregator').ContextAggregator;
} catch (e) {
  console.warn('Advanced assist features not available');
}

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

function getRelevantFiles(allFiles, query, aggregator) {
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
      
      // Check if query mentions a symbol in this file (if aggregator available)
      if (aggregator) {
        try {
          const fileContext = aggregator.getFileContext(file.path);
          if (fileContext.symbols.some(s => s.name.toLowerCase().includes(term))) {
            score += 5; // High priority for symbol matches
          }
        } catch (e) {
          // Ignore errors, just skip advanced scoring
        }
      }
    });
    
    return { file, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FILES_IN_CONTEXT)
    .map(item => item.file);
}

async function getAIResponse(query: string, context: string, repoName: string, aggregator) {
  const apiKey = process.env.HUGGINGFACE_API_KEY || '';
  
  let additionalContext = '';
  
  // Get architecture insights if available
  if (aggregator) {
    try {
      const archInsights = aggregator.getArchitectureInsights();
      const queryTerms = query.toLowerCase().split(/\s+/);
      const symbolContexts = [];
      
      for (const term of queryTerms) {
        const symbolInfo = aggregator.getSymbolContext(term);
        if (symbolInfo.definition) {
          symbolContexts.push(`Symbol "${term}": Defined in ${symbolInfo.definition.file}, used in ${symbolInfo.references.length} files`);
        }
      }

      additionalContext = `\nARCHITECTURE: ${archInsights.pattern}${symbolContexts.length > 0 ? `\nSYMBOL INFO:\n${symbolContexts.join('\n')}` : ''}`;
    } catch (e) {
      console.warn('Could not get architecture insights:', e.message);
    }
  }

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
            content: `You are an expert code analysis AI with deep understanding of software architecture analyzing: ${repoName}. ONLY answer based on provided files. Cite specific files and explain cross-file relationships when relevant.`
          },
          {
            role: 'user',
            content: `${additionalContext}\n\nREPOSITORY FILES:\n${context}\n\nQUESTION: ${query}\n\nAnalyze based ONLY on files above. Consider architecture patterns and cross-file relationships in your answer.`
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
    
    let aggregator = null;
    
    // Try advanced analysis if available
    if (ContextAggregator) {
      try {
        console.log('Building repository context...');
        aggregator = new ContextAggregator();
        await aggregator.buildContext(allFiles);
      } catch (advErr) {
        console.warn('Advanced assist features failed:', advErr.message);
        aggregator = null;
      }
    }
    
    const relevantFiles = getRelevantFiles(allFiles, query, aggregator);
    console.log(`Selected ${relevantFiles.length} relevant files for context`);
    
    let context = relevantFiles
      .map(file => {
        if (aggregator) {
          const fileContext = aggregator.getFileContext(file.path);
          const symbolInfo = fileContext.symbols.length > 0 
            ? `\nExports: ${fileContext.symbols.map(s => s.name).join(', ')}`
            : '';
          return `File: ${file.path}${symbolInfo}\n\`\`\`\n${file.content}\n\`\`\``;
        } else {
          return `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``;
        }
      })
      .join('\n\n');
    
    if (context.length > MAX_TOTAL_CONTEXT_SIZE) {
      context = context.substring(0, MAX_TOTAL_CONTEXT_SIZE) + '\n... (context truncated)';
    }
    
    if (!context || context.trim().length === 0) {
      context = `Repository: ${owner}/${repo}\n(No specific file content available for this query)`;
    }
    
    const repoName = `${owner}/${repo}`;
    const response = await getAIResponse(query, context, repoName, aggregator);
    res.json({ status: 'success', response });
  } catch (error) {
    console.error('❌ ASSIST ERROR:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      apiKeySet: !!process.env.HUGGINGFACE_API_KEY
    });
    const safeMessage = error?.response?.data?.error || error?.message || 'Failed to process query. Check if HUGGINGFACE_API_KEY is set in Vercel.';
    res.status(500).json({ status: 'error', message: String(safeMessage), debug: { apiKeySet: !!process.env.HUGGINGFACE_API_KEY } });
  }
}
