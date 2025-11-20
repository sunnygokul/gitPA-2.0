import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRepoContents } from './utils/github-api';
import type { ScanRequestBody } from './types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Force redeploy - working version
  try {
    const { url } = req.body as ScanRequestBody;
    
    if (!url) {
      res.status(400).json({ status: 'error', message: 'Repository URL is required' });
      return;
    }

    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });
      return;
    }

    const [, owner, repo] = match;

    const metadataResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const fileStructure = await fetchRepoContents(owner, repo);

    const summary = `This is a ${metadataResponse.data.language || 'multi-language'} repository created by ${owner}. ${metadataResponse.data.description || 'No description provided.'}`;

    res.json({ status: 'success', fileStructure, repo: { name: metadataResponse.data.name, owner: metadataResponse.data.owner.login, description: metadataResponse.data.description, summary } });
  } catch (error: unknown) {
    const err = error as any;
    console.error('=== SCAN ERROR START ===');
    console.error('Error message:', err?.message);
    console.error('Error stack:', err?.stack);
    console.error('Has GITHUB_TOKEN:', !!process.env.GITHUB_TOKEN);
    
    if (err?.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data));
    }
    console.error('=== SCAN ERROR END ===');
    
    const safeMessage = err?.response?.data?.message || err?.message || 'Failed to scan repository';
    res.status(500).json({ status: 'error', message: String(safeMessage) });
  }
}
