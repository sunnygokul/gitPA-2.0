// @ts-nocheck
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const { repoUrl, filePath } = req.body;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });

    const [, owner, repo] = match;
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`, Accept: 'application/vnd.github.v3.raw' },
      }
    );

    res.json({ status: 'success', content: response.data, fileName: filePath.split('/').pop() });
  } catch (error) {
    console.error('file-content error', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch file content' });
  }
}
