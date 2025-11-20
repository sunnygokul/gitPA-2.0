/**
 * Unified GitHub API utilities for fetching repository contents
 * Eliminates code duplication across endpoints
 */

// @ts-nocheck
import axios from 'axios';

export interface FetchOptions {
  maxDepth?: number;
  maxFiles?: number;
  maxFileSize?: number;
  fileExtensions?: string[];
  excludeTests?: boolean;
  excludeDirs?: string[];
  responseType?: 'text' | 'json';
}

export interface FileItem {
  path: string;
  name: string;
  content: string;
  size?: number;
  language?: string;
}

const DEFAULT_OPTIONS: FetchOptions = {
  maxDepth: 10,
  maxFiles: 100,
  maxFileSize: 200000,
  excludeDirs: ['node_modules', '.git', 'dist', 'build'],
  responseType: 'text'
};

/**
 * Fetch repository files with configurable options
 * @param owner - GitHub repository owner
 * @param repo - GitHub repository name
 * @param options - Configuration options
 * @param path - Current path (used internally for recursion)
 * @param files - Accumulated files array (used internally)
 * @param depth - Current recursion depth (used internally)
 */
export async function fetchRepoFiles(
  owner: string,
  repo: string,
  options: FetchOptions = {},
  path = '',
  files: FileItem[] = [],
  depth = 0
): Promise<FileItem[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Stop conditions
  if (depth > opts.maxDepth! || files.length >= opts.maxFiles!) {
    return files;
  }

  try {
    const githubToken = process.env.GITHUB_TOKEN || '';
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const items = Array.isArray(response.data) ? response.data : [response.data];

    for (const item of items) {
      if (item.type === 'file' && item.size < opts.maxFileSize!) {
        // Check file extension filter
        if (opts.fileExtensions && opts.fileExtensions.length > 0) {
          const hasValidExt = opts.fileExtensions.some(ext => item.name.endsWith(ext));
          if (!hasValidExt) continue;
        }

        // Exclude test files if requested
        if (opts.excludeTests) {
          const isTestFile = item.name.includes('.test.') ||
                            item.name.includes('.spec.') ||
                            item.name.includes('_test');
          if (isTestFile) continue;
        }

        try {
          const contentResponse = await axios.get(item.download_url, {
            responseType: opts.responseType || 'text'
          });

          const content = typeof contentResponse.data === 'string'
            ? contentResponse.data
            : String(contentResponse.data || '');

          files.push({
            path: item.path,
            name: item.name,
            content: content,
            size: item.size
          });
        } catch (err: any) {
          console.error(`Failed to fetch ${item.path}:`, err.message);
        }
      } else if (item.type === 'dir') {
        // Check if directory should be excluded
        const shouldExclude = opts.excludeDirs?.some(dir => item.name.includes(dir));
        if (!shouldExclude) {
          await fetchRepoFiles(owner, repo, opts, item.path, files, depth + 1);
        }
      }
    }
  } catch (error: any) {
    console.error(`Error fetching repo contents at ${path}:`, error.message);
  }

  return files;
}

/**
 * Fetch repository contents as nested tree structure (for scan endpoint)
 */
export async function fetchRepoContents(
  owner: string,
  repo: string,
  path = ''
): Promise<any[]> {
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

/**
 * Parse GitHub URL and extract owner/repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}
