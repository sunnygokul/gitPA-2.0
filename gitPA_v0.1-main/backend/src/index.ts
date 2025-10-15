import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { repoRoutes } from './routes/repo';

// Load environment variables
dotenv.config();

// Debug logging for environment variables
console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'Set' : 'Not set'
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/repo', repoRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 