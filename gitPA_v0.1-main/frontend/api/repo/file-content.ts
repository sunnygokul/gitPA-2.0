import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateGitHubUrl, validateFilePath, validateRequiredFields } from './utils/validation';
import type { FileContentRequestBody } from './types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    // Validate request body
    const bodyValidation = validateRequiredFields(req.body, ['repoUrl', 'filePath']);
    if (!bodyValidation.valid) {
      res.status(400).json({ status: 'error', message: bodyValidation.error });
      return;
    }

    const { repoUrl, filePath } = req.body as FileContentRequestBody;

    // Validate GitHub URL
    const urlValidation = validateGitHubUrl(repoUrl);
    if (!urlValidation.valid) {
      res.status(400).json({ status: 'error', message: urlValidation.error });
      return;
    }

    // Validate file path (prevent path traversal)
    const pathValidation = validateFilePath(filePath);
    if (!pathValidation.valid) {
      res.status(400).json({ status: 'error', message: pathValidation.error });
      return;
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      res.status(400).json({ status: 'error', message: 'Invalid GitHub URL format' });
      return;
    }

    const [, owner, repo] = match;
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`, Accept: 'application/vnd.github.v3.raw' },
      }
    );

    res.json({ status: 'success', content: response.data, fileName: filePath.split('/').pop() });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('file-content error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch file content' });
  }
}
