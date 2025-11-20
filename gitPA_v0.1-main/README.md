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

### API Layer
- **Vercel Serverless Functions** - Scalable serverless architecture (no separate backend!)
- **TypeScript** - Type-safe API endpoints in `frontend/api/repo/`
- **GitHub REST API** - Direct repository data fetching
- **Multi-Provider AI** - Automatic fallback between providers

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
├── frontend/
│   ├── api/repo/           # Vercel Serverless API endpoints
│   │   ├── utils/          # Shared utilities (AI service, GitHub API)
│   │   ├── assist.ts       # AI chat endpoint
│   │   ├── code-review.ts  # Code review endpoint
│   │   ├── refactor.ts     # Refactoring suggestions endpoint
│   │   ├── security-scan.ts # Security scanning endpoint
│   │   ├── generate-tests.ts # Test generation endpoint
│   │   └── scan.ts         # Repository scanning endpoint
│   ├── src/                # Vue.js frontend application
│   └── package.json
├── AI_PROVIDERS.md         # AI provider setup guide
├── SECURITY.md             # Security documentation
└── README.md               # This file
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

# Start development server
pnpm dev
```

The application will be available at http://localhost:5173

**Note**: API endpoints are serverless functions that work automatically in both development and production.

## 🔧 API Endpoints

All endpoints are Vercel serverless functions (no separate backend needed):

- `POST /api/repo/scan` - Scan repository structure
- `POST /api/repo/assist` - AI-powered Q&A about code
- `POST /api/repo/code-review` - Comprehensive code review
- `POST /api/repo/refactor` - Refactoring suggestions
- `POST /api/repo/security-scan` - Security vulnerability detection
- `POST /api/repo/generate-tests` - Automated test generation
- `GET /api/repo/file-content` - Fetch individual file contents

## 📦 Environment Variables (Production)

Set these in your Vercel project dashboard:

**Required:**
- `GITHUB_TOKEN` - Your GitHub Personal Access Token

**Recommended (AI Providers):**
- `GEMINI_API_KEY` - Google Gemini API key (1,500 requests/day FREE)
- `GROQ_API_KEY` - Groq API key (14,400 requests/day FREE)

**Optional:**
- `HUGGINGFACE_API_KEY` - HuggingFace key (fallback only)

With Gemini + Groq, you get **16,000 FREE AI requests/day**!

## License

MIT
