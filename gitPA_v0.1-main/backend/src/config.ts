import dotenv from 'dotenv';

dotenv.config();

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

if (!GITHUB_TOKEN) {
  console.warn('GITHUB_TOKEN is not set in environment variables');
}

if (!HUGGINGFACE_API_KEY) {
  console.warn('HUGGINGFACE_API_KEY is not set in environment variables');
}

export const config = {
  GITHUB_TOKEN,
  HUGGINGFACE_API_KEY,
}; 