/**
 * Extracts owner and repository name from a GitHub URL
 */
export function extractRepoInfo(url: string) {
  // Remove any duplicate https:// or http:// prefixes
  const cleanUrl = url.replace(/^(https?:\/\/)+/, 'https://');
  
  // Extract the path part after github.com
  const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }
  return {
    owner: match[1],
    repo: match[2].replace('.git', ''),
  };
}

/**
 * Returns headers for GitHub API requests
 */
export function getGitHubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  };
}

/**
 * Validates if a URL is a valid GitHub repository URL
 */
export function isValidGitHubUrl(url: string): boolean {
  try {
    const { owner, repo } = extractRepoInfo(url);
    return Boolean(owner && repo);
  } catch {
    return false;
  }
} 