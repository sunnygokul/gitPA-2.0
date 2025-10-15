import { defineStore } from 'pinia';
import api from '../utils/axios';

interface FileStructureItem {
  name: string;
  path: string;
  type: 'dir' | 'file';
  children?: FileStructureItem[];
  expanded?: boolean;
}

export const useRepositoryStore = defineStore('repository', {
  state: () => ({
    repositoryUrl: '',
    fileStructure: [] as FileStructureItem[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async scanRepository(url: string) {
      this.loading = true;
      this.error = null;
      this.repositoryUrl = url;

      try {
        const response = await api.post('/api/repo/scan', { url });
        this.fileStructure = response.data.fileStructure;
      } catch (error) {
        this.error = 'Failed to scan repository. Please check the URL and try again.';
        console.error('Repository scan error:', error);
      } finally {
        this.loading = false;
      }
    },

    clearRepository() {
      this.repositoryUrl = '';
      this.fileStructure = [];
      this.error = null;
    }
  }
}); 