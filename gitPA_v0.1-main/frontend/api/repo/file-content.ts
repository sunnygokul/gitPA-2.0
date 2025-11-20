import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { FileContentRequestBody } from './types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const { repoUrl, filePath } = req.body as FileContentRequestBody;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });
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
