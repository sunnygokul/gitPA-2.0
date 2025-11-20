import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Standard Vercel serverless handler function type
 */
export type Handler = (
  req: VercelRequest,
  res: VercelResponse
) => Promise<void>;

/**
 * GitHub repository URL components
 */
export interface GitHubRepoUrl {
  owner: string;
  repo: string;
}

/**
 * Request body for AI chat/assist endpoint
 */
export interface AssistRequestBody {
  repoUrl: string;
  query: string;
}

/**
 * Request body for code review endpoint
 */
export interface CodeReviewRequestBody {
  repoUrl: string;
}

/**
 * Request body for security scan endpoint
 */
export interface SecurityScanRequestBody {
  repoUrl: string;
}

/**
 * Request body for test generation endpoint
 */
export interface TestGenerationRequestBody {
  repoUrl: string;
  filePath?: string;
}

/**
 * Request body for refactoring suggestions endpoint
 */
export interface RefactorRequestBody {
  repoUrl: string;
}

/**
 * Request body for repository scan endpoint
 */
export interface ScanRequestBody {
  url: string;
}

/**
 * Request body for file content retrieval endpoint
 */
export interface FileContentRequestBody {
  repoUrl: string;
  filePath: string;
}

/**
 * GitHub file structure returned from API
 */
export interface GitHubFile {
  name: string;
  path: string;
  content: string;
  size: number;
  language?: string;
}

/**
 * Options for fetching repository files
 */
export interface FetchRepoFilesOptions {
  maxDepth?: number;
  maxFiles?: number;
  maxFileSize?: number;
  fileExtensions?: string[];
  excludeTests?: boolean;
}
