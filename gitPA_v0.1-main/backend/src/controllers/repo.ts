import axios from 'axios';
import { extractRepoInfo, getGitHubHeaders } from '../utils/github';
import { GITHUB_TOKEN } from '../config';
import { fetchRepoContents } from '../routes/repo';
import { fileStore } from '../services/fileStore';
import { getAIResponse } from '../services/openai';

// Debug logging for API key
const apiKey = process.env.HUGGINGFACE_API_KEY;
console.log('HuggingFace API Key (masked):', apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set');

/**
 * Scans a GitHub repository and returns its summary
 */
export async function scanRepository(url: string) {
  // Clear existing store before scanning new repository
  fileStore.clear();
  
  // The actual scanning is handled in the route handler
  // This function is kept for backward compatibility
  return { status: 'success' };
}

/**
 * Processes a user query about a repository
 */
export async function processQuery(repoUrl: string, query: string) {
  try {
    // Extract file path from query using multiple patterns
    const patterns = [
      /(?:file|path|location|directory)\s+(?:at|in|of|from)?\s*([^\s]+)/i,
      /(?:display|show|get|what's in)\s+(?:the )?(?:contents? of )?([^\s]+)/i,
      /(?:explain|describe|what does)\s+(?:this )?(?:file )?([^\s]+)/i
    ];
    
    let specificFilePath = null;
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        specificFilePath = match[1].trim();
        break;
      }
    }

    // Get relevant files from the store
    const relevantFiles = fileStore.getRelevantFiles(query);
    
    // Create context from file contents
    const context = relevantFiles
      .map(file => `File: ${file.path}\nContent:\n${file.content}`)
      .join('\n\n');
    
    // Get AI response
    const response = await getAIResponse(query, context);
    
    // Only include file content if it's the specific file being asked about
    const fileContent = specificFilePath 
      ? relevantFiles.find(file => file.path === specificFilePath)
      : undefined;
    
    return {
      status: 'success',
      response,
      fileContent: fileContent || undefined // Only return file content if it's the specific file
    };
  } catch (error) {
    console.error('Error processing query:', error);
    throw new Error('Failed to process query');
  }
}

// Debug function to log file store contents
export function logFileStoreContents() {
  try {
    const allFiles = fileStore.getAllFiles();
    console.log('\n=== File Store Contents ===');
    console.log(`Total files stored: ${allFiles.length}`);
    
    allFiles.forEach((file, index) => {
      try {
        console.log(`\nFile ${index + 1}:`);
        console.log(`Path: ${file.path}`);
        
        // Safely handle content length
        const contentLength = typeof file.content === 'string' ? file.content.length : 0;
        console.log(`Content length: ${contentLength} characters`);
        
        console.log('Content preview:');
        if (typeof file.content === 'string' && file.content.length > 0) {
          console.log(file.content.substring(0, 100) + (file.content.length > 100 ? '...' : ''));
        } else {
          console.log('(No content available)');
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.path}:`, fileError);
        console.log('(Error processing file content)');
      }
    });
    
    console.log('==========================\n');
  } catch (error) {
    console.error('Error in logFileStoreContents:', error);
  }
} 