// @ts-nocheck
import axios from 'axios';

async function fetchRepoContents(owner: string, repo: string, path = ''): Promise<any[]> {
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`,
        Accept: 'application/vnd.github.v3+json',
      },
      responseType: 'json',
    }
  );

  const items = response.data as any[];

  const contents = await Promise.all(
    items.map(async (item: any) => {
      if (item.type === 'dir') {
        return {
          name: item.name,
          path: item.path,
          type: 'dir',
          children: await fetchRepoContents(owner, repo, item.path),
        };
      } else {
        let content = '';
        if (item.size < 1000000) {
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
            content = fileResponse.data as string;
          } catch (err) {
            console.error(`Error fetching content for ${item.path}:`, err);
          }
        }

        return {
          name: item.name,
          path: item.path,
          type: 'file',
          content,
          size: item.size,
        };
      }
    })
  );

  return contents;
}

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
    // Log useful error details for debugging (response body if available)
    console.error('scan error', error?.message || error);
    if (error?.response?.data) {
      console.error('scan error response data:', error.response.data);
    }
    const safeMessage = error?.response?.data?.message || error?.message || 'Failed to scan repository';
    res.status(500).json({ status: 'error', message: String(safeMessage) });
  }
}
