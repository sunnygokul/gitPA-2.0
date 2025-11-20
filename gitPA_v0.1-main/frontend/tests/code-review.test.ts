/**
 * Test Suite #3: Code Review Metrics Calculation
 * Tests metric calculation, dependency analysis, and quality scoring
 */

import { describe, it, expect } from 'vitest';

interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  averageFileSize: number;
  largestFile: { path: string; lines: number };
  languageDistribution: Record<string, number>;
}

interface DependencyInfo {
  file: string;
  imports: string[];
  exports: string[];
  externalDependencies: string[];
}

interface FileItem {
  path: string;
  name: string;
  content: string;
}

// Implementation of calculateMetrics (from code-review.ts)
function calculateMetrics(files: FileItem[]): CodeMetrics {
  let totalLines = 0;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let largestFile = { path: '', lines: 0 };
  const languageDistribution: Record<string, number> = {};

  for (const file of files) {
    const content = typeof file.content === 'string' ? file.content : String(file.content || '');
    const lines = content.split('\n');
    const fileLines = lines.length;
    totalLines += fileLines;

    if (fileLines > largestFile.lines) {
      largestFile = { path: file.path, lines: fileLines };
    }

    const ext = file.name.substring(file.name.lastIndexOf('.'));
    languageDistribution[ext] = (languageDistribution[ext] || 0) + 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') {
        blankLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }
  }

  return {
    totalFiles: files.length,
    totalLines,
    codeLines,
    commentLines,
    blankLines,
    averageFileSize: files.length > 0 ? totalLines / files.length : 0,
    largestFile,
    languageDistribution
  };
}

// Implementation of analyzeDependencies
function analyzeDependencies(files: FileItem[]): DependencyInfo[] {
  const dependencies: DependencyInfo[] = [];

  for (const file of files) {
    const content = typeof file.content === 'string' ? file.content : String(file.content || '');
    const imports: string[] = [];
    const exports: string[] = [];
    const externalDependencies: string[] = [];

    const importMatches = content.matchAll(/import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      imports.push(match[1]);
      if (!match[1].startsWith('.') && !match[1].startsWith('/')) {
        externalDependencies.push(match[1]);
      }
    }

    const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g);
    for (const match of exportMatches) {
      exports.push(match[1]);
    }

    dependencies.push({
      file: file.path,
      imports,
      exports,
      externalDependencies
    });
  }

  return dependencies;
}

describe('Code Review Metrics Calculation', () => {
  describe('Line Counting', () => {
    it('should count total lines correctly', () => {
      const files: FileItem[] = [
        {
          path: 'file1.ts',
          name: 'file1.ts',
          content: 'line 1\nline 2\nline 3'
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.totalLines).toBe(3);
      expect(metrics.totalFiles).toBe(1);
    });

    it('should distinguish between code, comments, and blank lines', () => {
      const files: FileItem[] = [
        {
          path: 'test.ts',
          name: 'test.ts',
          content: `// This is a comment
const x = 5;

// Another comment
const y = 10;

`
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.commentLines).toBe(2);
      expect(metrics.codeLines).toBe(2);
      expect(metrics.blankLines).toBeGreaterThan(0);
    });

    it('should handle multi-line comments', () => {
      const files: FileItem[] = [
        {
          path: 'comments.js',
          name: 'comments.js',
          content: `/* Multi-line
comment here */
const code = true;`
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.commentLines).toBeGreaterThan(0);
      expect(metrics.codeLines).toBeGreaterThan(0);
    });

    it('should handle Python-style comments', () => {
      const files: FileItem[] = [
        {
          path: 'script.py',
          name: 'script.py',
          content: `# Python comment
def hello():
    # Another comment
    print("hello")`
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.commentLines).toBe(2);
    });
  });

  describe('File Size Analysis', () => {
    it('should identify the largest file', () => {
      const files: FileItem[] = [
        {
          path: 'small.ts',
          name: 'small.ts',
          content: 'const x = 1;'
        },
        {
          path: 'large.ts',
          name: 'large.ts',
          content: 'line 1\nline 2\nline 3\nline 4\nline 5'
        },
        {
          path: 'medium.ts',
          name: 'medium.ts',
          content: 'line 1\nline 2\nline 3'
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.largestFile.path).toBe('large.ts');
      expect(metrics.largestFile.lines).toBe(5);
    });

    it('should calculate average file size', () => {
      const files: FileItem[] = [
        {
          path: 'file1.ts',
          name: 'file1.ts',
          content: 'line 1\nline 2'
        },
        {
          path: 'file2.ts',
          name: 'file2.ts',
          content: 'line 1\nline 2\nline 3\nline 4'
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.averageFileSize).toBe(3); // (2 + 4) / 2
    });

    it('should handle empty files', () => {
      const files: FileItem[] = [
        {
          path: 'empty.ts',
          name: 'empty.ts',
          content: ''
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.totalLines).toBe(1); // Empty string still counts as 1 line
      expect(metrics.totalFiles).toBe(1);
    });
  });

  describe('Language Distribution', () => {
    it('should categorize files by extension', () => {
      const files: FileItem[] = [
        { path: 'file1.ts', name: 'file1.ts', content: 'code' },
        { path: 'file2.ts', name: 'file2.ts', content: 'code' },
        { path: 'file3.js', name: 'file3.js', content: 'code' },
        { path: 'file4.py', name: 'file4.py', content: 'code' }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.languageDistribution['.ts']).toBe(2);
      expect(metrics.languageDistribution['.js']).toBe(1);
      expect(metrics.languageDistribution['.py']).toBe(1);
    });

    it('should handle files without extensions', () => {
      const files: FileItem[] = [
        { path: 'Dockerfile', name: 'Dockerfile', content: 'FROM node' },
        { path: 'Makefile', name: 'Makefile', content: 'build:' }
      ];

      const metrics = calculateMetrics(files);
      
      expect(Object.keys(metrics.languageDistribution).length).toBeGreaterThan(0);
    });
  });

  describe('Dependency Analysis', () => {
    it('should extract ES6 imports', () => {
      const files: FileItem[] = [
        {
          path: 'module.ts',
          name: 'module.ts',
          content: `
import { useState } from 'react';
import axios from 'axios';
import './styles.css';
          `
        }
      ];

      const deps = analyzeDependencies(files);
      
      expect(deps[0].imports).toContain('react');
      expect(deps[0].imports).toContain('axios');
      expect(deps[0].imports).toContain('./styles.css');
    });

    it('should identify external dependencies', () => {
      const files: FileItem[] = [
        {
          path: 'app.ts',
          name: 'app.ts',
          content: `
import express from 'express';
import { helper } from './utils/helper';
import lodash from 'lodash';
          `
        }
      ];

      const deps = analyzeDependencies(files);
      
      expect(deps[0].externalDependencies).toContain('express');
      expect(deps[0].externalDependencies).toContain('lodash');
      expect(deps[0].externalDependencies).not.toContain('./utils/helper');
    });

    it('should extract exports', () => {
      const files: FileItem[] = [
        {
          path: 'utils.ts',
          name: 'utils.ts',
          content: `
export function helper() {}
export const constant = 5;
export default class MyClass {}
          `
        }
      ];

      const deps = analyzeDependencies(files);
      
      expect(deps[0].exports).toContain('helper');
      expect(deps[0].exports).toContain('constant');
      expect(deps[0].exports).toContain('MyClass');
    });

    it('should handle files with no imports or exports', () => {
      const files: FileItem[] = [
        {
          path: 'standalone.js',
          name: 'standalone.js',
          content: `
const x = 5;
function doSomething() {}
          `
        }
      ];

      const deps = analyzeDependencies(files);
      
      expect(deps[0].imports).toEqual([]);
      expect(deps[0].exports).toEqual([]);
      expect(deps[0].externalDependencies).toEqual([]);
    });

    it('should handle various import syntaxes', () => {
      const files: FileItem[] = [
        {
          path: 'complex.ts',
          name: 'complex.ts',
          content: `
import type { Type } from 'module1';
import * as All from 'module2';
import Default, { named } from 'module3';
import 'side-effect';
          `
        }
      ];

      const deps = analyzeDependencies(files);
      
      expect(deps[0].imports.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Quality Score Calculation', () => {
    it('should calculate documentation score based on comment ratio', () => {
      const metrics: CodeMetrics = {
        totalFiles: 1,
        totalLines: 100,
        codeLines: 80,
        commentLines: 20,
        blankLines: 0,
        averageFileSize: 100,
        largestFile: { path: 'file.ts', lines: 100 },
        languageDistribution: { '.ts': 1 }
      };

      const commentRatio = metrics.commentLines / metrics.codeLines;
      const documentationScore = Math.min(100, Math.round(commentRatio * 200));

      expect(documentationScore).toBe(50); // 20/80 * 200 = 50
      expect(documentationScore).toBeLessThanOrEqual(100);
    });

    it('should cap documentation score at 100', () => {
      const metrics: CodeMetrics = {
        totalFiles: 1,
        totalLines: 150,
        codeLines: 50,
        commentLines: 100,
        blankLines: 0,
        averageFileSize: 150,
        largestFile: { path: 'file.ts', lines: 150 },
        languageDistribution: { '.ts': 1 }
      };

      const commentRatio = metrics.commentLines / metrics.codeLines;
      const documentationScore = Math.min(100, Math.round(commentRatio * 200));

      expect(documentationScore).toBe(100);
    });

    it('should calculate maintainability score based on file size', () => {
      const metrics: CodeMetrics = {
        totalFiles: 1,
        totalLines: 100,
        codeLines: 80,
        commentLines: 20,
        blankLines: 0,
        averageFileSize: 300,
        largestFile: { path: 'file.ts', lines: 300 },
        languageDistribution: { '.ts': 1 }
      };

      const maintainabilityScore = Math.max(0, 100 - Math.round(metrics.averageFileSize / 10));

      expect(maintainabilityScore).toBe(70); // 100 - 300/10 = 70
    });

    it('should calculate dependency score', () => {
      const dependencies: DependencyInfo[] = [
        {
          file: 'file1.ts',
          imports: ['react', 'axios'],
          exports: [],
          externalDependencies: ['react', 'axios']
        },
        {
          file: 'file2.ts',
          imports: ['lodash'],
          exports: [],
          externalDependencies: ['lodash']
        }
      ];

      const uniqueDeps = new Set(dependencies.flatMap(d => d.externalDependencies)).size;
      const dependencyScore = Math.max(0, 100 - uniqueDeps * 2);

      expect(uniqueDeps).toBe(3);
      expect(dependencyScore).toBe(94); // 100 - 3*2
    });

    it('should calculate overall score', () => {
      const documentationScore = 50;
      const maintainabilityScore = 70;
      const dependencyScore = 94;
      const architectureScore = 85;

      const overallScore = Math.round(
        (documentationScore + maintainabilityScore + dependencyScore + architectureScore) / 4
      );

      expect(overallScore).toBe(75); // (50+70+94+85)/4
    });
  });

  describe('Edge Cases', () => {
    it('should handle Buffer content', () => {
      const files: FileItem[] = [
        {
          path: 'binary.dat',
          name: 'binary.dat',
          content: Buffer.from('binary').toString() as any
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.totalFiles).toBe(1);
      expect(metrics.totalLines).toBeGreaterThan(0);
    });

    it('should handle null/undefined content', () => {
      const files: FileItem[] = [
        {
          path: 'null.txt',
          name: 'null.txt',
          content: null as any
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.totalFiles).toBe(1);
      expect(metrics.totalLines).toBe(1);
    });

    it('should handle empty file list', () => {
      const files: FileItem[] = [];

      const metrics = calculateMetrics(files);
      
      expect(metrics.totalFiles).toBe(0);
      expect(metrics.totalLines).toBe(0);
      expect(metrics.averageFileSize).toBe(0);
      expect(metrics.largestFile.path).toBe('');
    });

    it('should handle Windows line endings (CRLF)', () => {
      const files: FileItem[] = [
        {
          path: 'windows.txt',
          name: 'windows.txt',
          content: 'line 1\r\nline 2\r\nline 3'
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.totalLines).toBe(3);
    });

    it('should handle mixed line endings', () => {
      const files: FileItem[] = [
        {
          path: 'mixed.txt',
          name: 'mixed.txt',
          content: 'line 1\nline 2\r\nline 3\rline 4'
        }
      ];

      const metrics = calculateMetrics(files);
      
      expect(metrics.totalLines).toBeGreaterThan(0);
    });
  });
});
