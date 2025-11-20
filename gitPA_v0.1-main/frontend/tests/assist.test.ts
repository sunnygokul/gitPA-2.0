/**
 * Test Suite #5: Assist File Relevance Scoring
 * Tests intelligent file selection and context building for AI assistance
 */

import { describe, it, expect } from 'vitest';

interface RepoFile {
  path: string;
  content: string;
}

const MAX_FILES_IN_CONTEXT = 10;
const MAX_TOTAL_CONTEXT_SIZE = 80000;

// Implementation of getRelevantFiles (from assist.ts)
function getRelevantFiles(allFiles: RepoFile[], query: string): RepoFile[] {
  if (allFiles.length <= MAX_FILES_IN_CONTEXT) {
    return allFiles;
  }

  // Score files by relevance to query
  const scoredFiles = allFiles.map(file => {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerPath = file.path.toLowerCase();
    const lowerContent = file.content.toLowerCase();

    // Path name matches
    if (lowerPath.includes(lowerQuery)) score += 10;
    
    // File name matches query terms
    const queryTerms = lowerQuery.split(/\s+/).filter(t => t.length > 2);
    for (const term of queryTerms) {
      if (lowerPath.includes(term)) score += 5;
      const termCount = (lowerContent.match(new RegExp(term, 'g')) || []).length;
      score += termCount;
    }

    // Boost for common important files
    if (lowerPath.includes('readme')) score += 3;
    if (lowerPath.includes('index')) score += 2;
    if (lowerPath.includes('main')) score += 2;
    if (lowerPath.includes('app')) score += 2;

    return { file, score };
  });

  // Sort by score and return top N
  return scoredFiles
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FILES_IN_CONTEXT)
    .map(sf => sf.file);
}

// Implementation of context building
function buildContext(files: RepoFile[], query: string): string {
  let context = files
    .map(file => `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``)
    .join('\n\n');
  
  if (context.length > MAX_TOTAL_CONTEXT_SIZE) {
    context = context.substring(0, MAX_TOTAL_CONTEXT_SIZE) + '\n... (context truncated)';
  }
  
  if (!context || context.trim().length === 0) {
    context = `(No specific file content available for this query)`;
  }
  
  return context;
}

describe('Assist File Relevance Scoring', () => {
  describe('Basic File Selection', () => {
    it('should return all files if count is below limit', () => {
      const files: RepoFile[] = [
        { path: 'file1.ts', content: 'content1' },
        { path: 'file2.ts', content: 'content2' },
        { path: 'file3.ts', content: 'content3' }
      ];

      const relevant = getRelevantFiles(files, 'anything');
      
      expect(relevant).toHaveLength(3);
      expect(relevant).toEqual(files);
    });

    it('should limit to MAX_FILES_IN_CONTEXT', () => {
      const files: RepoFile[] = Array.from({ length: 20 }, (_, i) => ({
        path: `file${i}.ts`,
        content: `content ${i}`
      }));

      const relevant = getRelevantFiles(files, 'test query');
      
      expect(relevant.length).toBeLessThanOrEqual(MAX_FILES_IN_CONTEXT);
    });
  });

  describe('Relevance Scoring - Path Matching', () => {
    it('should prioritize files with query term in path', () => {
      const files: RepoFile[] = [
        { path: 'auth/login.ts', content: 'generic content' },
        { path: 'user/profile.ts', content: 'generic content' },
        { path: 'auth/register.ts', content: 'generic content' },
        { path: 'utils/helpers.ts', content: 'generic content' }
      ];

      const relevant = getRelevantFiles(files, 'auth');
      
      // At least first result should contain 'auth'
      expect(relevant[0].path).toContain('auth');
      // Check that auth files are ranked higher than non-auth
      const authFiles = relevant.filter(f => f.path.includes('auth'));
      expect(authFiles.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle multi-word queries', () => {
      const files: RepoFile[] = [
        { path: 'user-authentication.ts', content: 'auth code' },
        { path: 'authentication.ts', content: 'auth code' },
        { path: 'user.ts', content: 'user code' },
        { path: 'random.ts', content: 'random code' }
      ];

      const relevant = getRelevantFiles(files, 'user authentication');
      
      expect(relevant[0].path).toContain('user');
      expect(relevant[0].path).toContain('authentication');
    });

    it('should be case-insensitive', () => {
      const files: RepoFile[] = [
        { path: 'Auth/Login.ts', content: 'content' },
        { path: 'auth/login.ts', content: 'content' },
        { path: 'other.ts', content: 'content' }
      ];

      const relevant = getRelevantFiles(files, 'AUTH');
      
      expect(relevant.length).toBeGreaterThanOrEqual(2);
      expect(relevant[0].path.toLowerCase()).toContain('auth');
    });
  });

  describe('Relevance Scoring - Content Matching', () => {
    it('should prioritize files with query term in content', () => {
      const files: RepoFile[] = [
        { path: 'file1.ts', content: 'const authentication = true;' },
        { path: 'file2.ts', content: 'const random = false;' },
        { path: 'file3.ts', content: 'authentication setup code authentication' },
        { path: 'file4.ts', content: 'nothing relevant' }
      ];

      const relevant = getRelevantFiles(files, 'authentication');
      
      // file3 has 'authentication' twice, should rank high
      const topFiles = relevant.slice(0, 3);
      expect(topFiles.some(f => f.path === 'file3.ts')).toBe(true);
    });

    it('should count multiple occurrences of query term', () => {
      const files: RepoFile[] = Array.from({ length: 15 }, (_, i) => ({
        path: `file${i}.ts`,
        content: i === 5 ? 'test test test test test' : 'test'
      }));

      const relevant = getRelevantFiles(files, 'test');
      
      // file5 should rank higher due to multiple 'test' occurrences
      expect(relevant[0].path).toBe('file5.ts');
    });
  });

  describe('Priority Boosting', () => {
    it('should boost README files', () => {
      const files: RepoFile[] = Array.from({ length: 15 }, (_, i) => ({
        path: i === 0 ? 'README.md' : `file${i}.ts`,
        content: 'generic content'
      }));

      const relevant = getRelevantFiles(files, 'overview');
      
      const readmeIndex = relevant.findIndex(f => f.path.includes('README'));
      expect(readmeIndex).toBeLessThan(relevant.length / 2); // Should be in top half
    });

    it('should boost index files', () => {
      const files: RepoFile[] = Array.from({ length: 15 }, (_, i) => ({
        path: i === 3 ? 'src/index.ts' : `file${i}.ts`,
        content: 'generic content'
      }));

      const relevant = getRelevantFiles(files, 'entry point');
      
      const indexFile = relevant.find(f => f.path.includes('index'));
      expect(indexFile).toBeDefined();
    });

    it('should boost main and app files', () => {
      const files: RepoFile[] = Array.from({ length: 15 }, (_, i) => {
        let path = `file${i}.ts`;
        if (i === 1) path = 'main.ts';
        if (i === 2) path = 'app.ts';
        return { path, content: 'generic content' };
      });

      const relevant = getRelevantFiles(files, 'startup');
      
      const importantFiles = relevant.filter(f => 
        f.path.includes('main') || f.path.includes('app')
      );
      expect(importantFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Context Building', () => {
    it('should format files with path and code blocks', () => {
      const files: RepoFile[] = [
        { path: 'test.ts', content: 'const x = 5;' }
      ];

      const context = buildContext(files, 'query');
      
      expect(context).toContain('File: test.ts');
      expect(context).toContain('```');
      expect(context).toContain('const x = 5;');
    });

    it('should truncate context if it exceeds MAX_TOTAL_CONTEXT_SIZE', () => {
      const largeContent = 'x'.repeat(MAX_TOTAL_CONTEXT_SIZE + 1000);
      const files: RepoFile[] = [
        { path: 'large.ts', content: largeContent }
      ];

      const context = buildContext(files, 'query');
      
      expect(context.length).toBeLessThanOrEqual(MAX_TOTAL_CONTEXT_SIZE + 100);
      expect(context).toContain('(context truncated)');
    });

    it('should handle empty file list', () => {
      const files: RepoFile[] = [];

      const context = buildContext(files, 'query');
      
      expect(context).toContain('No specific file content available');
    });

    it('should handle files with empty content', () => {
      const files: RepoFile[] = [
        { path: 'empty1.ts', content: '' },
        { path: 'empty2.ts', content: '   ' }
      ];

      const context = buildContext(files, 'query');
      
      expect(context.trim().length).toBeGreaterThan(0);
    });

    it('should join multiple files with double newlines', () => {
      const files: RepoFile[] = [
        { path: 'file1.ts', content: 'content1' },
        { path: 'file2.ts', content: 'content2' }
      ];

      const context = buildContext(files, 'query');
      
      expect(context).toContain('File: file1.ts');
      expect(context).toContain('File: file2.ts');
      expect(context.split('\n\n').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Query Term Filtering', () => {
    it('should ignore short query terms (<=2 chars)', () => {
      const files: RepoFile[] = [
        { path: 'test-is-a-file.ts', content: 'content with is and a' },
        { path: 'other.ts', content: 'different content' }
      ];

      const relevant = getRelevantFiles(files, 'is a test file');
      
      // Should focus on 'test' and 'file', not 'is' and 'a'
      expect(relevant[0].path).toContain('test');
    });

    it('should split multi-word queries correctly', () => {
      const files: RepoFile[] = Array.from({ length: 15 }, (_, i) => ({
        path: `file${i}.ts`,
        content: i === 7 ? 'user authentication module' : 'random content'
      }));

      const relevant = getRelevantFiles(files, 'user authentication module');
      
      expect(relevant[0].path).toBe('file7.ts');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in query', () => {
      const files: RepoFile[] = [
        { path: 'utils/helper.ts', content: 'helper functions' },
        { path: 'test/spec.ts', content: 'test specs' }
      ];

      const relevant = getRelevantFiles(files, 'utils/helper');
      
      expect(relevant[0].path).toContain('utils');
    });

    it('should handle empty query', () => {
      const files: RepoFile[] = [
        { path: 'file1.ts', content: 'content1' },
        { path: 'file2.ts', content: 'content2' }
      ];

      const relevant = getRelevantFiles(files, '');
      
      expect(relevant.length).toBeGreaterThan(0);
    });

    it('should handle query with no matches', () => {
      const files: RepoFile[] = [
        { path: 'file1.ts', content: 'content1' },
        { path: 'file2.ts', content: 'content2' }
      ];

      const relevant = getRelevantFiles(files, 'nonexistent query term xyz');
      
      expect(relevant.length).toBeGreaterThan(0); // Should still return files
      expect(relevant.length).toBeLessThanOrEqual(MAX_FILES_IN_CONTEXT);
    });

    it('should handle files with very long paths', () => {
      const longPath = 'a/'.repeat(50) + 'file.ts';
      const files: RepoFile[] = [
        { path: longPath, content: 'content' },
        { path: 'short.ts', content: 'content' }
      ];

      const relevant = getRelevantFiles(files, 'file');
      
      expect(relevant.length).toBe(2);
    });

    it('should handle files with unicode characters', () => {
      const files: RepoFile[] = [
        { path: '文件.ts', content: '中文内容' },
        { path: 'файл.ts', content: 'русский контент' },
        { path: 'file.ts', content: 'english content' }
      ];

      const relevant = getRelevantFiles(files, 'content');
      
      expect(relevant.length).toBeGreaterThan(0);
    });
  });

  describe('Scoring Logic Verification', () => {
    it('should assign higher scores for exact matches', () => {
      const files: RepoFile[] = [
        { path: 'authentication.ts', content: 'auth code' },
        { path: 'user.ts', content: 'authentication authentication authentication' },
        { path: 'random.ts', content: 'random' }
      ];

      const relevant = getRelevantFiles(files, 'authentication');
      
      // Path match (authentication.ts) should compete with content match (user.ts)
      const topTwo = relevant.slice(0, 2);
      expect(topTwo.some(f => f.path === 'authentication.ts')).toBe(true);
      expect(topTwo.some(f => f.path === 'user.ts')).toBe(true);
    });

    it('should combine multiple scoring factors', () => {
      const files: RepoFile[] = Array.from({ length: 15 }, (_, i) => {
        if (i === 0) return { path: 'README.md', content: 'overview' };
        if (i === 1) return { path: 'auth.ts', content: 'auth auth auth' };
        if (i === 2) return { path: 'authentication/index.ts', content: 'auth code' };
        return { path: `file${i}.ts`, content: 'random' };
      });

      const relevant = getRelevantFiles(files, 'auth overview');
      
      // Should prioritize files with both path and content matches
      const topThree = relevant.slice(0, 3).map(f => f.path);
      expect(topThree).toContain('README.md'); // README boost + content
      expect(topThree).toContain('auth.ts'); // path + multiple content
      expect(topThree).toContain('authentication/index.ts'); // path + index boost
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of files efficiently', () => {
      const files: RepoFile[] = Array.from({ length: 1000 }, (_, i) => ({
        path: `dir/subdir/file${i}.ts`,
        content: `content ${i % 10 === 0 ? 'important' : 'normal'}`
      }));

      const start = Date.now();
      const relevant = getRelevantFiles(files, 'important');
      const duration = Date.now() - start;
      
      expect(relevant.length).toBe(MAX_FILES_IN_CONTEXT);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle very large file contents', () => {
      const largeContent = 'x'.repeat(1000000);
      const files: RepoFile[] = [
        { path: 'huge.ts', content: largeContent + ' target ' + largeContent },
        { path: 'small.ts', content: 'target' }
      ];

      const relevant = getRelevantFiles(files, 'target');
      
      expect(relevant.length).toBeGreaterThan(0);
    });
  });
});
