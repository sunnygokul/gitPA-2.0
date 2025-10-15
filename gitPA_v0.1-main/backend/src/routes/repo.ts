import express from 'express';
import { z } from 'zod';
import { scanRepository, processQuery, logFileStoreContents } from '../controllers/repo';
import axios from 'axios';
import { GITHUB_TOKEN } from '../config';
import { fileStore } from '../services/fileStore';

const router = express.Router();

// Validation schemas
const scanRepoSchema = z.object({
  url: z.string().url().regex(/github\.com\/[^/]+\/[^/]+/)
});

const querySchema = z.object({
  repoUrl: z.string().url().regex(/github\.com\/[^/]+\/[^/]+/),
  query: z.string().min(1)
});

const fileContentSchema = z.object({
  repoUrl: z.string().url().regex(/github\.com\/[^/]+\/[^/]+/),
  filePath: z.string().min(1)
});

// Helper function to recursively fetch repository contents
export async function fetchRepoContents(owner: string, repo: string, path: string = ''): Promise<any[]> {
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  const contents = await Promise.all(response.data.map(async (item: any) => {
    if (item.type === 'dir') {
      return {
        name: item.name,
        path: item.path,
        type: 'dir',
        children: await fetchRepoContents(owner, repo, item.path)
      };
    } else {
      // Fetch file content if it's a text file
      let content = '';
      if (item.size < 1000000) { // Only fetch files smaller than 1MB
        try {
          const fileResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`,
            {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3.raw'
              }
            }
          );
          content = fileResponse.data;
          // Store file content in the file store
          fileStore.setFile(item.path, content);
        } catch (error) {
          console.error(`Error fetching content for ${item.path}:`, error);
        }
      }
      
      return {
        name: item.name,
        path: item.path,
        type: 'file',
        content: content,
        size: item.size
      };
    }
  }));

  return contents;
}

// Scan repository endpoint
router.post('/scan', async (req, res) => {
  const { url } = req.body;
  
  try {
    // Extract owner and repo from GitHub URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid GitHub URL format' 
      });
    }

    const [, owner, repo] = match;

    // Fetch repository metadata
    const metadataResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    // Fetch all repository contents recursively
    const fileStructure = await fetchRepoContents(owner, repo);

    // Generate a summary based on repository metadata and contents
    const summary = `This is a ${metadataResponse.data.language || 'multi-language'} repository created by ${owner}. 
    ${metadataResponse.data.description || 'No description provided.'}
    It has ${metadataResponse.data.stargazers_count} stars and ${metadataResponse.data.forks_count} forks.
    The repository contains ${fileStructure.length} top-level items including directories and files.`;

    // Log file store contents after scanning
    logFileStoreContents();

    res.json({ 
      status: 'success', 
      fileStructure,
      repo: {
        name: metadataResponse.data.name,
        owner: metadataResponse.data.owner.login,
        description: metadataResponse.data.description,
        summary: summary
      }
    });
  } catch (error) {
    console.error('Repository scan error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to scan repository' 
    });
  }
});

// Process query endpoint
router.post('/assist', async (req, res) => {
  try {
    const { repoUrl, query } = querySchema.parse(req.body);
    const result = await processQuery(repoUrl, query);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request parameters' });
    } else {
      console.error('Query processing error:', error);
      res.status(500).json({ error: 'Failed to process query' });
    }
  }
});

// Get file content endpoint
router.post('/file-content', async (req, res) => {
  try {
    const { repoUrl, filePath } = fileContentSchema.parse(req.body);
    
    // Extract owner and repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid GitHub URL format' 
      });
    }

    const [, owner, repo] = match;

    // Fetch file content
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      }
    );

    res.json({ 
      status: 'success',
      content: response.data,
      fileName: filePath.split('/').pop()
    });
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch file content' 
    });
  }
});

export const repoRoutes = router; 