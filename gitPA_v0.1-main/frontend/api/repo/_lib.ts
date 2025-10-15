// @ts-nocheck
import axios from 'axios';

const GITHUB_TOKEN = (process.env as any).GITHUB_TOKEN || '';

export async function fetchRepoContents(owner: string, repo: string, path = ''): Promise<any[]> {
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
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
                  Authorization: `Bearer ${GITHUB_TOKEN}`,
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
