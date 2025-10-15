# GitHub Assistant

A web-based application that helps developers interact with public GitHub repositories using AI-powered assistance.

## Features

- Repository URL input and validation
- Repository content scanning and analysis
- AI-powered assistance using GPT-4o-mini
- Interactive chat interface
- Conversation history and context retention

## Tech Stack

### Frontend
- Vue.js 3 (Composition API)
- TypeScript
- Tailwind CSS
- Pinia
- Axios

### Backend
- Node.js with Express.js
- TypeScript
- GitHub API integration
- OpenAI API integration

## Project Structure

```
gitPA_v0.1/
├── frontend/          # Vue.js frontend application
├── backend/           # Express.js backend server
├── .env.example       # Example environment variables
└── README.md          # Project documentation
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   pnpm install

   # Install backend dependencies
   cd ../backend
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - For the backend, you'll need:
     - A GitHub Personal Access Token (from GitHub Developer Settings)
     - An OpenAI API Key (from OpenAI Platform)
   - For the frontend, configure the backend API URL (default: http://localhost:3000)
   - In case you get an `Invalid API key error`. Try setting your api key manually in the command line
      - For powershell: `$env:OPENAI_API_KEY = "your-api-key"`
      - For bash: `export OPENAI_API_KEY="your-api-key"`

4. Start development servers:
   ```bash
   # Start frontend
   cd frontend
   pnpm dev

   # Start backend
   cd ../backend
   pnpm dev
   ```

## Environment Variables

### Backend (.env)
- `PORT`: The port number for the backend server (default: 3000)
- `NODE_ENV`: The environment mode (development/production)
- `GITHUB_TOKEN`: Your GitHub Personal Access Token
- `OPENAI_API_KEY`: Your OpenAI API Key

### Frontend (.env)
- `VITE_API_BASE_URL`: The URL of your backend server

## License

MIT
