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
        
        const summary = `🔒 **Security Scan Complete**\n\n` +
          `**Security Score:** ${response.data.securityScore}/100\n\n` +
          `**Issues Found:**\n` +
          `- 🔴 Critical: ${response.data.summary.stats.critical}\n` +
          `- 🟠 High: ${response.data.summary.stats.high}\n` +
          `- 🟡 Medium: ${response.data.summary.stats.medium}\n` +
          `- 🟢 Low: ${response.data.summary.stats.low}\n\n` +
          `Scanned ${response.data.filesScanned} files. View detailed report in the Security tab.`;
        
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
        
        const summary = `📊 **Code Review Complete**\n\n` +
          `**Overall Score:** ${response.data.overallScore}/100\n\n` +
          `**Detailed Scores:**\n` +
          `- Documentation: ${response.data.scores.documentation}/100\n` +
          `- Maintainability: ${response.data.scores.maintainability}/100\n` +
          `- Dependencies: ${response.data.scores.dependencies}/100\n\n` +
          `${response.data.aiReview}`;
        
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: summary
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
        
        const summary = `🧪 **Test Generation Complete**\n\n` +
          `Generated tests for ${response.data.testsGenerated}/${response.data.totalFiles} files.\n\n` +
          response.data.tests.map((t: any) => 
            t.error ? 
              `❌ ${t.originalFile}: ${t.error}` : 
              `✅ ${t.originalFile} → ${t.testFile}`
          ).join('\n');
        
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
        
        const summary = `🔧 **Refactoring Analysis Complete**\n\n` +
          `Found ${response.data.stats.total} improvement opportunities:\n` +
          `- 🔴 High Priority: ${response.data.stats.highPriority}\n` +
          `- 🟡 Medium Priority: ${response.data.stats.mediumPriority}\n` +
          `- 🟢 Low Priority: ${response.data.stats.lowPriority}\n\n` +
          `${response.data.aiAnalysis}`;
        
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: summary
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