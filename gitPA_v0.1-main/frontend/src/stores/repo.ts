import { defineStore } from 'pinia';
import axios from 'axios';

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
}

export const useRepoStore = defineStore('repo', {
  state: (): RepoState => ({
    url: '',
    isLoading: false,
    error: null,
    repoInfo: null,
    messages: [],
  }),

  actions: {
    async scanRepository(url: string) {
      this.url = url;
      this.messages = [];
      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.post('http://localhost:3000/api/repo/scan', { url });
        this.repoInfo = response.data.repo;
        
        // Add initial system message
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: `I've analyzed the repository "${this.repoInfo.name}". How can I help you with it?`
        });
      } catch (error) {
        this.error = 'Failed to scan repository';
        console.error('Error scanning repository:', error);
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
        const response = await axios.post('http://localhost:3000/api/repo/assist', {
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

    clearConversation() {
      this.messages = [];
      this.repoInfo = null;
      this.url = '';
      this.error = null;
    },
  },
}); 