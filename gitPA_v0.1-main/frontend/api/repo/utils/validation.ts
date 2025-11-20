/**
 * Input validation utilities for API endpoints
 * Prevents path traversal, injection attacks, and malformed input
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates GitHub repository URL
 * Must match github.com/owner/repo format
 */
export function validateGitHubUrl(url: unknown): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Repository URL is required and must be a string' };
  }

  if (url.length > 200) {
    return { valid: false, error: 'Repository URL is too long (max 200 characters)' };
  }

  // Validate GitHub URL format - allow various valid GitHub URL patterns
  // Remove trailing slash if present for consistent validation
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  // Match github.com/owner/repo (with optional .git suffix)
  const githubPattern = /^https?:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+(\.git)?$/;
  if (!githubPattern.test(cleanUrl)) {
    return { valid: false, error: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo' };
  }

  return { valid: true };
}

/**
 * Validates file path within repository
 * Prevents path traversal attacks (../, ..\, etc.)
 */
export function validateFilePath(filePath: unknown): ValidationResult {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'File path is required and must be a string' };
  }

  if (filePath.length > 500) {
    return { valid: false, error: 'File path is too long (max 500 characters)' };
  }

  // Prevent path traversal
  if (filePath.includes('..') || filePath.startsWith('/') || filePath.startsWith('\\')) {
    return { valid: false, error: 'Invalid file path: path traversal detected' };
  }

  // Prevent null bytes
  if (filePath.includes('\0')) {
    return { valid: false, error: 'Invalid file path: null byte detected' };
  }

  // Allow only safe characters in file paths
  const safePathPattern = /^[a-zA-Z0-9_.\-/]+$/;
  if (!safePathPattern.test(filePath)) {
    return { valid: false, error: 'Invalid file path: contains unsafe characters' };
  }

  return { valid: true };
}

/**
 * Validates user query string
 * Sanitizes input to prevent injection attacks
 */
export function validateQuery(query: unknown): ValidationResult {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Query is required and must be a string' };
  }

  if (query.length > 1000) {
    return { valid: false, error: 'Query is too long (max 1000 characters)' };
  }

  // Prevent script injection
  if (/<script|javascript:|onerror=|onclick=/i.test(query)) {
    return { valid: false, error: 'Invalid query: potential script injection detected' };
  }

  return { valid: true };
}

/**
 * Sanitizes string input by removing potentially dangerous characters
 * Use for user-facing display, not for validation
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"']/g, '') // Remove HTML/script characters
    .replace(/\0/g, '') // Remove null bytes
    .trim();
}

/**
 * Validates request body has required fields
 */
export function validateRequiredFields(
  body: unknown,
  requiredFields: string[]
): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const missingFields = requiredFields.filter(
    field => !(field in (body as Record<string, unknown>))
  );

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { valid: true };
}
