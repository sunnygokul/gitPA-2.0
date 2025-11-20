import { defineStore } from 'pinia';
import api from '../utils/axios';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fileContent?: {
    content: string;
    fileName: string;
  };
}

interface RepoInfo {
  name: string;
  owner: string;
  description: string;
  summary: string;
}

interface RepoState {
  url: string;
  isLoading: boolean;
  error: string | null;
  repoInfo: RepoInfo | null;
  messages: Message[];
  securityReport: any | null;
  codeReview: any | null;
  refactoringSuggestions: any | null;
  generatedTests: any | null;
}

export const useRepoStore = defineStore('repo', {
  state: (): RepoState => ({
    url: '',
    isLoading: false,
    error: null,
    repoInfo: null,
    messages: [],
    securityReport: null,
    codeReview: null,
    refactoringSuggestions: null,
    generatedTests: null,
  }),

  actions: {
    async scanRepository(url: string) {
      this.url = url;
      this.messages = [];
      this.isLoading = true;
      this.error = null;

      try {
        const response = await api.post('/api/repo/scan', { url });
        this.repoInfo = response.data.repo;
        
        // Add initial system message
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: `I've analyzed the repository "${this.repoInfo?.name ?? 'repository'}". How can I help you with it?`
        });
      } catch (error: any) {
        const msg = error?.response?.data?.message || error?.message || 'Failed to scan repository';
        this.error = String(msg);
        console.error('Error scanning repository:', msg, error);
      } finally {
        this.isLoading = false;
      }
    },

    async sendQuery(query: string) {
      if (!this.url) return;

      // Add user message
      this.messages.push({
        id: Date.now().toString(),
        role: 'user',
        content: query
      });

      this.isLoading = true;
      this.error = null;

      try {
        const response = await api.post('/api/repo/assist', {
          repoUrl: this.url,
          query
        });

        this.messages.push({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.response,
          fileContent: response.data.fileContent
        });
      } catch (error) {
        this.error = 'Failed to process query';
        console.error('Error processing query:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async runSecurityScan() {
      if (!this.url) return;
      this.isLoading = true;
      this.error = null;

      try {
        const response = await api.post('/api/repo/security-scan', { repoUrl: this.url });
        this.securityReport = response.data;
        
        // Format issues for Enhanced UI parser
        const issuesList = response.data.issues.map((issue: any) => {
          const emoji = issue.severity === 'CRITICAL' ? '🔴' : issue.severity === 'HIGH' ? '🟠' : issue.severity === 'MEDIUM' ? '🟡' : '🟢';
          return `${emoji} ${issue.severity} ISSUES\nFile: ${issue.file}\nDescription: ${issue.description}\nFix Recommendation: ${issue.recommendation}\n`;
        }).join('\n');

        const summary = `[Enhanced Code Review]\n` +
          `**Security Score:** ${response.data.securityScore}/100\n\n` +
          `${issuesList}\n\n` +
          `Scanned ${response.data.filesScanned} files.`;
        
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: summary
        });
      } catch (error: any) {
        this.error = 'Security scan failed';
        console.error('Security scan error:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async runCodeReview() {
      if (!this.url) return;
      this.isLoading = true;
      this.error = null;

      try {
        const response = await api.post('/api/repo/code-review', { repoUrl: this.url });
        this.codeReview = response.data;
        
        // Pass complete AI review for enhanced UI parsing
        // Remove Multi-file Context from AI review
        let cleanedReview = response.data.aiReview || '';
        cleanedReview = cleanedReview.replace(/\[Multi-file Context Reasoning\][\s\S]*?(?=\[Enhanced Code Review\]|$)/gi, '');
        
        const fullReview = `📊 **Code Review Complete**\n\n` +
          `**Overall Score:** ${response.data.overallScore}/100\n\n` +
          `**Detailed Scores:**\n\n` +
          `- Documentation: ${response.data.scores.documentation}/100\n` +
          `- Maintainability: ${response.data.scores.maintainability}/100\n` +
          `- Dependencies: ${response.data.scores.dependencies}/100\n\n` +
          `---\n\n` +
          `${cleanedReview}`;
        
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: fullReview
        });
      } catch (error: any) {
        this.error = 'Code review failed';
        console.error('Code review error:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async generateTests(filePath?: string) {
      if (!this.url) return;
      this.isLoading = true;
      this.error = null;

      try {
        const response = await api.post('/api/repo/generate-tests', { 
          repoUrl: this.url,
          filePath 
        });
        this.generatedTests = response.data;
        
        // Include complete test code for enhanced UI display
        const testsWithCode = response.data.tests
          .map((t: any, idx: number) => {
            if (t.error) return `❌ **${t.originalFile}**: ${t.error}`;
            // Format matches aiResponseParser.ts expectation: "Test Case X: Name"
            return `Test Case ${idx + 1}: ${t.testFile}\n\`\`\`${t.language || 'typescript'}\n${t.testCode || '// No test code generated'}\n\`\`\`\n\n**Framework:** ${t.framework || 'Unknown'} | **File:** ${t.originalFile}`;
          })
          .join('\n\n---\n\n');
        
        const summary = `[Automated Test Suite Generation]\n` +
          `Tests Generated For: ${response.data.totalFiles} files\n\n` +
          `${testsWithCode}\n\n` +
          `[ZIP Package Specification]\n` +
          `File Structure:\n` +
          response.data.tests.map((t: any) => `- tests/${t.testFile}`).join('\n');
        
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: summary
        });
      } catch (error: any) {
        this.error = 'Test generation failed';
        console.error('Test generation error:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async suggestRefactoring() {
      if (!this.url) return;
      this.isLoading = true;
      this.error = null;

      try {
        const response = await api.post('/api/repo/refactor', { repoUrl: this.url });
        this.refactoringSuggestions = response.data;
        
        // Pass complete AI analysis for enhanced UI parsing
        const fullAnalysis = `🔧 **Refactoring Analysis Complete**\n\n` +
          `Found ${response.data.stats.total} improvement opportunities:\n` +
          `- 🔴 High Priority: ${response.data.stats.highPriority}\n` +
          `- 🟡 Medium Priority: ${response.data.stats.mediumPriority}\n` +
          `- 🟢 Low Priority: ${response.data.stats.lowPriority}\n\n` +
          `---\n\n` +
          `${response.data.aiAnalysis || ''}`;
        
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: fullAnalysis
        });
      } catch (error: any) {
        this.error = 'Refactoring analysis failed';
        console.error('Refactoring error:', error);
      } finally {
        this.isLoading = false;
      }
    },

    clearConversation() {
      this.messages = [];
      this.repoInfo = null;
      this.url = '';
      this.error = null;
    },
  },
}); 