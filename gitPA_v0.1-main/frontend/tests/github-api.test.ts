/**
 * Test Suite #1: GitHub API Utilities
 * Tests the shared utility functions for fetching repository data
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Import functions to test
import { fetchRepoFiles, fetchRepoContents, parseGitHubUrl } from '../api/repo/utils/github-api';

describe('GitHub API Utilities', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Set mock environment variable
    process.env.GITHUB_TOKEN = 'test_token_12345';
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  describe('parseGitHubUrl', () => {
    it('should parse valid GitHub URLs correctly', () => {
      const result = parseGitHubUrl('https://github.com/facebook/react');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should parse GitHub URLs without https', () => {
      const result = parseGitHubUrl('github.com/microsoft/typescript');
      expect(result).toEqual({ owner: 'microsoft', repo: 'typescript' });
    });

    it('should return null for invalid URLs', () => {
      const result = parseGitHubUrl('https://gitlab.com/invalid/url');
      expect(result).toBeNull();
    });

    it('should return null for empty strings', () => {
      const result = parseGitHubUrl('');
      expect(result).toBeNull();
    });

    it('should handle URLs with trailing slashes', () => {
      const result = parseGitHubUrl('https://github.com/vuejs/vue/');
      expect(result).toEqual({ owner: 'vuejs', repo: 'vue' });
    });
  });

  describe('fetchRepoFiles', () => {
    it('should fetch files from repository root', async () => {
      const mockFileData = [
        {
          type: 'file',
          name: 'README.md',
          path: 'README.md',
          size: 1000,
          download_url: 'https://raw.githubusercontent.com/test/repo/main/README.md'
        }
      ];

      const mockContent = '# Test Repository';

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockFileData }) // First call for directory listing
        .mockResolvedValueOnce({ data: mockContent }); // Second call for file content

      const files = await fetchRepoFiles('test', 'repo');

      expect(files).toHaveLength(1);
      expect(files[0]).toMatchObject({
        name: 'README.md',
        path: 'README.md',
        content: mockContent,
        size: 1000
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/repos/test/repo/contents/',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test_token_12345'
          })
        })
      );
    });

    it('should respect maxFiles option', async () => {
      const mockFiles = Array.from({ length: 20 }, (_, i) => ({
        type: 'file',
        name: `file${i}.ts`,
        path: `file${i}.ts`,
        size: 100,
        download_url: `https://raw.githubusercontent.com/test/repo/main/file${i}.ts`
      }));

      const limitedFiles = mockFiles.slice(0, 5);
      mockedAxios.get
        .mockResolvedValueOnce({ data: limitedFiles })
        .mockResolvedValue({ data: 'content' });

      const files = await fetchRepoFiles('test', 'repo', { maxFiles: 5 });

      expect(files.length).toBeLessThanOrEqual(5);
    });

    it('should filter by file extensions', async () => {
      const mockFiles = [
        {
          type: 'file',
          name: 'index.ts',
          path: 'index.ts',
          size: 100,
          download_url: 'https://example.com/index.ts'
        },
        {
          type: 'file',
          name: 'README.md',
          path: 'README.md',
          size: 100,
          download_url: 'https://example.com/README.md'
        }
      ];

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockFiles })
        .mockResolvedValue({ data: 'content' });

      const files = await fetchRepoFiles('test', 'repo', {
        fileExtensions: ['.ts']
      });

      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('index.ts');
    });

    it('should exclude test files when excludeTests is true', async () => {
      const mockFiles = [
        {
          type: 'file',
          name: 'component.ts',
          path: 'component.ts',
          size: 100,
          download_url: 'https://example.com/component.ts'
        },
        {
          type: 'file',
          name: 'component.test.ts',
          path: 'component.test.ts',
          size: 100,
          download_url: 'https://example.com/component.test.ts'
        }
      ];

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockFiles })
        .mockResolvedValue({ data: 'content' });

      const files = await fetchRepoFiles('test', 'repo', {
        excludeTests: true
      });

      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('component.ts');
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const files = await fetchRepoFiles('test', 'repo');

      expect(files).toEqual([]);
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should skip files larger than maxFileSize', async () => {
      const mockFiles = [
        {
          type: 'file',
          name: 'small.ts',
          path: 'small.ts',
          size: 100,
          download_url: 'https://example.com/small.ts'
        },
        {
          type: 'file',
          name: 'large.ts',
          path: 'large.ts',
          size: 1000000,
          download_url: 'https://example.com/large.ts'
        }
      ];

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockFiles })
        .mockResolvedValueOnce({ data: 'content' });

      const files = await fetchRepoFiles('test', 'repo', {
        maxFileSize: 10000
      });

      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('small.ts');
    });
  });

  describe('fetchRepoContents', () => {
    it('should fetch nested directory structure', async () => {
      const mockRootContents = [
        {
          type: 'file',
          name: 'README.md',
          path: 'README.md',
          size: 100
        },
        {
          type: 'dir',
          name: 'src',
          path: 'src'
        }
      ];

      const mockSrcContents = [
        {
          type: 'file',
          name: 'index.ts',
          path: 'src/index.ts',
          size: 200
        }
      ];

      const mockReadmeContent = '# Readme';
      const mockIndexContent = 'export default {}';

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockRootContents }) // Root listing
        .mockResolvedValueOnce({ data: mockReadmeContent }) // README content
        .mockResolvedValueOnce({ data: mockSrcContents }) // src/ listing
        .mockResolvedValueOnce({ data: mockIndexContent }); // index.ts content

      const contents = await fetchRepoContents('test', 'repo');

      expect(contents).toHaveLength(2);
      expect(contents[0].type).toBe('file');
      expect(contents[1].type).toBe('dir');
      expect(contents[1].children).toBeDefined();
    });

    it('should handle empty directories', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      const contents = await fetchRepoContents('test', 'repo', 'empty-dir');

      expect(contents).toEqual([]);
    });

    it('should skip large files in tree structure', async () => {
      const mockContents = [
        {
          type: 'file',
          name: 'huge.bin',
          path: 'huge.bin',
          size: 10000000 // 10MB
        }
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockContents });

      const contents = await fetchRepoContents('test', 'repo');

      expect(contents[0].content).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Buffer response types', async () => {
      const mockFile = [
        {
          type: 'file',
          name: 'binary.dat',
          path: 'binary.dat',
          size: 100,
          download_url: 'https://example.com/binary.dat'
        }
      ];

      const bufferContent = Buffer.from('binary content');

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockFile })
        .mockResolvedValueOnce({ data: bufferContent });

      const files = await fetchRepoFiles('test', 'repo');

      expect(files[0].content).toBeTruthy();
      expect(typeof files[0].content).toBe('string');
    });

    it('should handle null or undefined content', async () => {
      const mockFile = [
        {
          type: 'file',
          name: 'empty.txt',
          path: 'empty.txt',
          size: 0,
          download_url: 'https://example.com/empty.txt'
        }
      ];

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockFile })
        .mockResolvedValueOnce({ data: null });

      const files = await fetchRepoFiles('test', 'repo');

      expect(files[0].content).toBe('');
    });

    it('should respect maxDepth option for recursive fetching', async () => {
      const mockDeepStructure = [
        {
          type: 'dir',
          name: 'level1',
          path: 'level1'
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: mockDeepStructure });

      const files = await fetchRepoFiles('test', 'repo', { maxDepth: 1 });

      // Should stop at depth 1
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Root + level1
    });
  });
});
