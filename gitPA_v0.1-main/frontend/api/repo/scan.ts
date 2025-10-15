// @ts-nocheck
import { fetchRepoContents } from './_lib';
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const { url } = req.body;
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return res.status(400).json({ status: 'error', message: 'Invalid GitHub URL' });

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
  } catch (error) {
    console.error('scan error', error);
    res.status(500).json({ status: 'error', message: 'Failed to scan repository' });
  }
}
