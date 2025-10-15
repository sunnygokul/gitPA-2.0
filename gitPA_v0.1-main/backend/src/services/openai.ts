import OpenAI from 'openai';
import { config } from '../config';

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

// Maximum context length in characters (approximately 50KB)
const MAX_CONTEXT_LENGTH = 50000;

export async function getAIResponse(query: string, context: string): Promise<string> {
  try {
    // Truncate context if it's too large
    const truncatedContext = context.length > MAX_CONTEXT_LENGTH
      ? context.substring(0, MAX_CONTEXT_LENGTH) + '\n... (context truncated due to size limits)'
      : context;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that helps users understand code repositories. You have access to the repository contents and can provide detailed explanations and insights. If the context is truncated, please mention that in your response.'
        },
        {
          role: 'user',
          content: `Context: ${truncatedContext}\n\nQuery: ${query}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // Handle rate limit errors specifically
    if (error.code === 'rate_limit_exceeded') {
      throw new Error('The request was too large. Please try a more specific query or view smaller files.');
    }
    
    // Handle other OpenAI errors
    if (error.response?.data?.error?.message) {
      throw new Error(`OpenAI API error: ${error.response.data.error.message}`);
    }
    
    throw new Error('Failed to generate AI response');
  }
} 