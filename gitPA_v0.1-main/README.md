# 🤖 GitPA 2.0 - AI-Powered GitHub Repository Analysis Platform

An advanced web-based application that revolutionizes code analysis with comprehensive AI-powered features. Go beyond simple code browsing with intelligent security scanning, automated test generation, code review, and refactoring suggestions.

## ✨ Features

### 🔍 Core Analysis
- **Smart Repository Scanning** - Analyzes entire repository structure and relationships
- **AI-Powered Chat** - Ask questions about your codebase using Google Gemini 2.0 Flash
- **Multi-File Context** - Understands code across files (up to 1M token context)
- **Interactive File Explorer** - Browse repository structure with syntax highlighting

### 🛡️ Security & Quality
- **🔒 Security Vulnerability Scanner** - Detects 14+ types of security issues
  - Hardcoded credentials and API keys
  - SQL injection, XSS, command injection
  - Insecure protocols and permissions
  - Code injection (eval, exec)
  - Weak cryptography
  
- **📊 Comprehensive Code Review** - AI-driven architecture and quality assessment
  - Code quality metrics (documentation, maintainability, dependencies)
  - Performance bottleneck detection
  - Architecture pattern recognition
  - Technical debt identification
  
- **🧪 Automated Test Generation** - Creates unit tests for multiple frameworks
  - Jest (JavaScript/TypeScript)
  - pytest (Python)
  - JUnit (Java)
  - NUnit (C#)
  - Includes happy path, edge cases, and error handling tests
  
- **🔧 Intelligent Refactoring Suggestions** - Identifies code smells and improvements
  - Long functions and complex logic
  - Code duplication detection
  - Magic number elimination
  - Deep nesting simplification

## 🚀 Tech Stack

### Frontend
- **Vue.js 3** (Composition API with TypeScript)
- **Tailwind CSS** - Modern utility-first styling
- **Pinia** - State management
- **Marked + Highlight.js** - Markdown rendering with syntax highlighting

### Backend
- **Vercel Serverless Functions** - Scalable serverless architecture
- **Google Gemini 2.0 Flash** - Free AI with 1M token context window
- **GitHub REST API** - Repository data fetching
- **TypeScript** - Type-safe code

### AI Capabilities (Multi-Provider with Automatic Fallback)
- **Primary**: Google Gemini 2.5 Flash (1M token context, 1,500 requests/day FREE)
- **Fallback**: Groq Llama 3.3 70B (128K context, 14,400 requests/day FREE)
- **Additional**: HuggingFace Qwen 2.5-7B (limited free tier)
- **Total**: 477,000 FREE requests/month across all providers
- **Features**: Enhanced code review with severity classifications, intelligent refactoring with file-by-file breakdown, automated test generation with downloadable ZIP, multi-file context reasoning

👉 **See [AI_PROVIDERS.md](AI_PROVIDERS.md) for complete setup guide**

## Project Structure

```
gitPA_v0.1/
├── frontend/          # Vue.js frontend application
├── backend/           # Express.js backend server
├── .env.example       # Example environment variables
└── README.md          # Project documentation
```

## 🎯 Quick Start (5 minutes)

### 1. Get API Keys (Both FREE)

#### GitHub Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` or `public_repo`
4. Copy the token

#### AI Provider API Keys (All FREE)

**Gemini (Primary - Recommended):**
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key (FREE - 1,500 requests/day, 1M token context)

**Groq (Fallback - Recommended):**
1. Go to https://console.groq.com/
2. Sign up and get API key
3. Copy the key (FREE - 14,400 requests/day, ultra-fast)

**HuggingFace (Optional):**
1. Go to https://huggingface.co/settings/tokens
2. Create new token
3. Copy the key (FREE but very limited)

### 2. Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sunnygokul/gitPA-2.0)

1. Click the button above
2. Set environment variables in Vercel:
   - `GITHUB_TOKEN`: Your GitHub token
   - `GEMINI_API_KEY`: Your Gemini API key (primary)
   - `GROQ_API_KEY`: Your Groq API key (fallback)
   - `HUGGINGFACE_API_KEY`: (Optional) HuggingFace key
3. Deploy!

**Note:** You only need GEMINI_API_KEY + GROQ_API_KEY for 16,000 free requests/day!

### 3. Local Development

```bash
# Clone the repository
git clone https://github.com/sunnygokul/gitPA-2.0.git
cd gitPA-2.0

# Install dependencies
cd frontend
pnpm install

# Set up environment variables
# In Vercel dashboard, add GITHUB_TOKEN and GEMINI_API_KEY

# Run development server
pnpm run dev
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
