import { config } from '../config';

// Maximum context length in characters (approximately 50KB)
const MAX_CONTEXT_LENGTH = 50000;

export async function getAIResponse(query: string, context: string): Promise<string> {
  try {
    // Truncate context if it's too large
    const truncatedContext = context.length > MAX_CONTEXT_LENGTH
      ? context.substring(0, MAX_CONTEXT_LENGTH) + '\n... (context truncated due to size limits)'
      : context;

    const apiKey = process.env.HUGGINGFACE_API_KEY || config.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY is not set');
    }

    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
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
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';
  } catch (error: any) {
    console.error('HuggingFace API error:', error);
    
    // Handle rate limit errors specifically
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    // Handle other API errors
    if (error.message) {
      throw new Error(`HuggingFace API error: ${error.message}`);
    }
    
    throw new Error('Failed to generate AI response');
  }
} 