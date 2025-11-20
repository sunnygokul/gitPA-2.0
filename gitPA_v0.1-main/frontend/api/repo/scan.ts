import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRepoContents } from './utils/github-api';
import { validateGitHubUrl, validateRequiredFields } from './utils/validation';
import type { ScanRequestBody } from './types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    // Validate request body
    const bodyValidation = validateRequiredFields(req.body, ['url']);
    if (!bodyValidation.valid) {
      res.status(400).json({ status: 'error', message: bodyValidation.error });
      return;
    }

    const { url } = req.body as ScanRequestBody;

    // Validate GitHub URL
    const urlValidation = validateGitHubUrl(url);
    if (!urlValidation.valid) {
      res.status(400).json({ status: 'error', message: urlValidation.error });
      return;
    }

    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      res.status(400).json({ status: 'error', message: 'Invalid GitHub URL format' });
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
    // Log useful error details for debugging (response body if available)
    console.error('scan error', err?.message || err);
    if (err?.response?.data) {
      console.error('scan error response data:', err.response.data);
    }
    const safeMessage = err?.response?.data?.message || err?.message || 'Failed to scan repository';
    res.status(500).json({ status: 'error', message: String(safeMessage) });
  }
}
