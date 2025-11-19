// @ts-nocheck
import { ASTParser } from './ast-parser';
import { RepositoryGraph } from './dependency-graph';
import type { DependencyGraph, SymbolInfo } from './dependency-graph';

export interface ContextWindow {
  files: FileContext[];
  totalTokens: number;
  relevantSymbols: SymbolInfo[];
  dependencies: string[];
}

export interface FileContext {
  path: string;
  content: string;
  parsed: any;
  relevanceScore: number;
  relationships: {
    imports: string[];
    exports: string[];
    dependents: string[];
  };
}

export class ContextAggregator {
  private parser: ASTParser;
  private graph: RepositoryGraph;
  private parsedFiles: Map<string, any>;
  private fileContents: Map<string, string>;

  constructor() {
    this.parser = new ASTParser();
    this.graph = new RepositoryGraph();
    this.parsedFiles = new Map();
    this.fileContents = new Map();
  }

  async analyzeRepository(files: { path: string; content: string }[]): Promise<void> {
    // Phase 1: Parse all files
    for (const file of files) {
      this.fileContents.set(file.path, file.content);
      const parsed = this.parser.parseFile(file.content, file.path);
      this.parsedFiles.set(file.path, parsed);
    }

    // Phase 2: Build dependency graph
    this.graph.buildGraph(this.parsedFiles);
    this.graph.buildSymbolTable(this.parsedFiles);
  }

  buildContextForQuery(query: string, maxTokens: number = 50000): ContextWindow {
    // Extract relevant terms from query
    const terms = this.extractQueryTerms(query);

    // Find relevant files based on query
    const scoredFiles = this.scoreFilesByRelevance(terms);

    // Build context window
    const context: ContextWindow = {
      files: [],
      totalTokens: 0,
      relevantSymbols: [],
      dependencies: []
    };

    // Add files until we hit token limit
    for (const { path, score } of scoredFiles) {
      const content = this.fileContents.get(path);
      const parsed = this.parsedFiles.get(path);
      
      if (!content || !parsed) continue;

      const fileTokens = this.estimateTokens(content);
      if (context.totalTokens + fileTokens > maxTokens) break;

      const fileContext: FileContext = {
        path,
        content,
        parsed,
        relevanceScore: score,
        relationships: {
          imports: parsed.imports?.map((imp: any) => imp.source) || [],
          exports: parsed.exports?.map((exp: any) => exp.name) || [],
          dependents: this.graph.getFileDependents(path).map(id => id.replace('file:', ''))
        }
      };

      context.files.push(fileContext);
      context.totalTokens += fileTokens;
    }

    // Find relevant symbols
    context.relevantSymbols = this.findRelevantSymbols(terms);

    // Track dependencies
    context.files.forEach(file => {
      context.dependencies.push(...file.relationships.imports);
    });

    return context;
  }

  buildContextForFile(filePath: string, includeDepth: number = 2): ContextWindow {
    const context: ContextWindow = {
      files: [],
      totalTokens: 0,
      relevantSymbols: [],
      dependencies: []
    };

    // Add the target file first
    this.addFileToContext(filePath, context, 1.0);

    // Add direct dependencies
    const deps = this.graph.getFileDependencies(filePath);
    deps.forEach(depId => {
      const depPath = depId.replace('file:', '');
      this.addFileToContext(depPath, context, 0.8);
    });

    // Add files that depend on this one
    if (includeDepth > 1) {
      const dependents = this.graph.getFileDependents(filePath);
      dependents.forEach(depId => {
        const depPath = depId.replace('file:', '');
        this.addFileToContext(depPath, context, 0.6);
      });
    }

    // Find all symbols in context
    context.files.forEach(file => {
      const parsed = file.parsed;
      parsed.functions?.forEach((func: any) => {
        const symbol = this.graph.getSymbolUsages(func.name);
        if (symbol) context.relevantSymbols.push(symbol);
      });
    });

    return context;
  }

  buildContextForRefactoring(files: string[]): ContextWindow {
    const context: ContextWindow = {
      files: [],
      totalTokens: 0,
      relevantSymbols: [],
      dependencies: []
    };

    // Add all specified files
    files.forEach(filePath => {
      this.addFileToContext(filePath, context, 1.0);
    });

    // For each file, add its immediate dependencies for context
    files.forEach(filePath => {
      const deps = this.graph.getFileDependencies(filePath);
      deps.forEach(depId => {
        const depPath = depId.replace('file:', '');
        if (!context.files.find(f => f.path === depPath)) {
          this.addFileToContext(depPath, context, 0.5);
        }
      });
    });

    return context;
  }

  private addFileToContext(filePath: string, context: ContextWindow, relevanceScore: number): void {
    const content = this.fileContents.get(filePath);
    const parsed = this.parsedFiles.get(filePath);

    if (!content || !parsed) return;

    const fileTokens = this.estimateTokens(content);

    const fileContext: FileContext = {
      path: filePath,
      content,
      parsed,
      relevanceScore,
      relationships: {
        imports: parsed.imports?.map((imp: any) => imp.source) || [],
        exports: parsed.exports?.map((exp: any) => exp.name) || [],
        dependents: this.graph.getFileDependents(filePath).map(id => id.replace('file:', ''))
      }
    };

    context.files.push(fileContext);
    context.totalTokens += fileTokens;
  }

  private scoreFilesByRelevance(terms: string[]): { path: string; score: number }[] {
    const scores: Map<string, number> = new Map();

    this.fileContents.forEach((content, path) => {
      let score = 0;

      // Score based on term frequency
      const lowerContent = content.toLowerCase();
      terms.forEach(term => {
        const matches = (lowerContent.match(new RegExp(term, 'gi')) || []).length;
        score += matches * 10;
      });

      // Boost score for file path matches
      const lowerPath = path.toLowerCase();
      terms.forEach(term => {
        if (lowerPath.includes(term)) {
          score += 50;
        }
      });

      // Boost score for symbol matches
      const parsed = this.parsedFiles.get(path);
      if (parsed) {
        parsed.functions?.forEach((func: any) => {
          if (terms.some(term => func.name.toLowerCase().includes(term))) {
            score += 30;
          }
        });

        parsed.classes?.forEach((cls: any) => {
          if (terms.some(term => cls.name.toLowerCase().includes(term))) {
            score += 30;
          }
        });
      }

      if (score > 0) {
        scores.set(path, score);
      }
    });

    return Array.from(scores.entries())
      .map(([path, score]) => ({ path, score }))
      .sort((a, b) => b.score - a.score);
  }

  private extractQueryTerms(query: string): string[] {
    // Remove common words
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'in', 'to', 'for', 'of', 'and', 'a', 'an']);
    
    const words = query
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    return [...new Set(words)];
  }

  private findRelevantSymbols(terms: string[]): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const symbolTable = this.graph.getSymbolTable();

    symbolTable.forEach(symbol => {
      const nameMatch = terms.some(term => 
        symbol.name.toLowerCase().includes(term)
      );

      if (nameMatch) {
        symbols.push(symbol);
      }
    });

    return symbols;
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ~= 4 characters
    return Math.ceil(text.length / 4);
  }

  // Public analysis methods

  getGraph(): DependencyGraph {
    return this.graph.getGraph();
  }

  getSymbolTable(): Map<string, SymbolInfo> {
    return this.graph.getSymbolTable();
  }

  findCircularDependencies(): string[][] {
    return this.graph.findCircularDependencies();
  }

  getImpactAnalysis(filePath: string) {
    return this.graph.getImpactAnalysis(filePath);
  }

  getArchitectureMetrics() {
    return this.graph.getArchitectureMetrics();
  }

  getCrossFileReferences(symbolName: string): {
    definition: SymbolInfo | null;
    usages: Array<{ file: string; line: number; context: string }>;
  } {
    const definition = this.graph.getSymbolUsages(symbolName);
    const usages: Array<{ file: string; line: number; context: string }> = [];

    if (definition) {
      // Find all files that import this symbol
      definition.importedIn.forEach(filePath => {
        const content = this.fileContents.get(filePath);
        if (content) {
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes(symbolName)) {
              usages.push({
                file: filePath,
                line: idx + 1,
                context: line.trim()
              });
            }
          });
        }
      });
    }

    return { definition, usages };
  }

  detectArchitecturePatterns(): {
    patterns: Array<{ name: string; confidence: number; files: string[] }>;
  } {
    const patterns: Array<{ name: string; confidence: number; files: string[] }> = [];

    // Detect MVC pattern
    const hasModels = Array.from(this.fileContents.keys()).some(path => 
      path.toLowerCase().includes('model')
    );
    const hasViews = Array.from(this.fileContents.keys()).some(path => 
      path.toLowerCase().includes('view') || path.toLowerCase().includes('component')
    );
    const hasControllers = Array.from(this.fileContents.keys()).some(path => 
      path.toLowerCase().includes('controller')
    );

    if (hasModels && hasViews && hasControllers) {
      patterns.push({
        name: 'MVC (Model-View-Controller)',
        confidence: 0.9,
        files: Array.from(this.fileContents.keys()).filter(path =>
          path.toLowerCase().includes('model') ||
          path.toLowerCase().includes('view') ||
          path.toLowerCase().includes('controller')
        )
      });
    }

    // Detect Layered Architecture
    const hasServices = Array.from(this.fileContents.keys()).some(path =>
      path.toLowerCase().includes('service')
    );
    const hasRepositories = Array.from(this.fileContents.keys()).some(path =>
      path.toLowerCase().includes('repository') || path.toLowerCase().includes('dao')
    );

    if (hasServices && hasRepositories) {
      patterns.push({
        name: 'Layered Architecture',
        confidence: 0.85,
        files: Array.from(this.fileContents.keys()).filter(path =>
          path.toLowerCase().includes('service') ||
          path.toLowerCase().includes('repository') ||
          path.toLowerCase().includes('controller')
        )
      });
    }

    // Detect Component-Based Architecture
    const componentFiles = Array.from(this.fileContents.keys()).filter(path =>
      path.toLowerCase().includes('component') ||
      path.endsWith('.vue') ||
      path.endsWith('.jsx') ||
      path.endsWith('.tsx')
    );

    if (componentFiles.length > 5) {
      patterns.push({
        name: 'Component-Based Architecture (React/Vue)',
        confidence: 0.95,
        files: componentFiles
      });
    }

    // Detect API/Route structure
    const hasRoutes = Array.from(this.fileContents.keys()).some(path =>
      path.toLowerCase().includes('route') || path.toLowerCase().includes('/api/')
    );

    if (hasRoutes) {
      patterns.push({
        name: 'REST API Architecture',
        confidence: 0.8,
        files: Array.from(this.fileContents.keys()).filter(path =>
          path.toLowerCase().includes('route') ||
          path.toLowerCase().includes('/api/') ||
          path.toLowerCase().includes('endpoint')
        )
      });
    }

    return { patterns };
  }

  findCodeDuplication(): Array<{
    similarity: number;
    files: string[];
    fragment: string;
  }> {
    const duplicates: Array<{
      similarity: number;
      files: string[];
      fragment: string;
    }> = [];

    const files = Array.from(this.fileContents.entries());

    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const [path1, content1] = files[i];
        const [path2, content2] = files[j];

        const similarity = this.calculateSimilarity(content1, content2);

        if (similarity > 0.7) {
          const commonFragment = this.extractCommonFragment(content1, content2);
          duplicates.push({
            similarity,
            files: [path1, path2],
            fragment: commonFragment
          });
        }
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(text1.split(/\W+/).filter(t => t.length > 2));
    const tokens2 = new Set(text2.split(/\W+/).filter(t => t.length > 2));

    const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  private extractCommonFragment(text1: string, text2: string): string {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');

    let longestMatch = '';
    let maxLength = 0;

    for (let i = 0; i < lines1.length; i++) {
      for (let j = 0; j < lines2.length; j++) {
        let k = 0;
        while (i + k < lines1.length && j + k < lines2.length && 
               lines1[i + k] === lines2[j + k]) {
          k++;
        }

        if (k > maxLength) {
          maxLength = k;
          longestMatch = lines1.slice(i, i + k).join('\n');
        }
      }
    }

    return longestMatch.substring(0, 200) + (longestMatch.length > 200 ? '...' : '');
  }
}
