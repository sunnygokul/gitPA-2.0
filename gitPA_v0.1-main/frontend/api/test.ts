// Simple test endpoint to check if environment variables are set

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const hasGithubToken = !!process.env.GITHUB_TOKEN;
  const hasHFKey = !!process.env.HUGGINGFACE_API_KEY;
  
  const githubTokenPrefix = process.env.GITHUB_TOKEN 
    ? process.env.GITHUB_TOKEN.substring(0, 7) + '...' 
    : 'NOT SET';
    
  const hfKeyPrefix = process.env.HUGGINGFACE_API_KEY 
    ? process.env.HUGGINGFACE_API_KEY.substring(0, 7) + '...' 
    : 'NOT SET';

  res.json({
    status: 'success',
    environment: 'vercel',
    timestamp: new Date().toISOString(),
    env: {
      GITHUB_TOKEN: hasGithubToken ? 'SET (' + githubTokenPrefix + ')' : 'NOT SET',
      HUGGINGFACE_API_KEY: hasHFKey ? 'SET (' + hfKeyPrefix + ')' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'unknown'
    }
  });
}
