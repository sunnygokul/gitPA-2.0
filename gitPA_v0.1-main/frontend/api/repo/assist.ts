// @ts-nocheck
import axios from 'axios';

async function getAIResponse(query: string, context: string) {
  const apiKey = process.env.OPENAI_API_KEY || '';
  const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant for code repositories.' },
      { role: 'user', content: `Context: ${context}\n\nQuery: ${query}` }
    ],
    max_tokens: 1000,
  }, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  });

  return resp.data.choices?.[0]?.message?.content || 'No response';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { repoUrl, query } = req.body;
    // naive: fetch relevant files not implemented here; pass empty context
    const context = '';
    const response = await getAIResponse(query, context);
    res.json({ status: 'success', response });
  } catch (error) {
    console.error('assist error', error);
    res.status(500).json({ status: 'error', message: 'Failed to process query' });
  }
}
