// @ts-nocheck
import type { ImportNode, ExportNode, FunctionNode, ClassNode, ASTNode } from './ast-parser';

export interface GraphNode {
  id: string;
  type: 'file' | 'function' | 'class' | 'variable';
  name: string;
  file: string;
  metadata: any;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'imports' | 'calls' | 'extends' | 'references' | 'exports';
  weight: number;
}

export interface DependencyGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  adjacencyList: Map<string, string[]>;
}

export interface SymbolInfo {
  name: string;
  type: string;
  file: string;
  scope: 'global' | 'local';
  usages: { file: string; line: number; }[];
  exportedFrom?: string;
  importedIn: string[];
}

export class RepositoryGraph {
  private graph: DependencyGraph;
  private symbolTable: Map<string, SymbolInfo>;
  private fileMap: Map<string, any>;

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: [],
      adjacencyList: new Map()
    };
    this.symbolTable = new Map();
    this.fileMap = new Map();
  }

  buildGraph(parsedFiles: Map<string, any>): DependencyGraph {
    this.fileMap = parsedFiles;

    // Phase 1: Create nodes for all files and their contents
    parsedFiles.forEach((parsed, filePath) => {
      this.addFileNode(filePath);
      
      // Add function nodes
      parsed.functions?.forEach((func: FunctionNode) => {
        this.addFunctionNode(func);
      });

      // Add class nodes
      parsed.classes?.forEach((cls: ClassNode) => {
        this.addClassNode(cls);
        cls.methods.forEach(method => this.addFunctionNode(method, cls.name));
      });

      // Add variable nodes
      parsed.variables?.forEach((v: ASTNode) => {
        this.addVariableNode(v);
      });
    });

    // Phase 2: Create edges for imports/exports
    parsedFiles.forEach((parsed, filePath) => {
      parsed.imports?.forEach((imp: ImportNode) => {
        this.addImportEdges(imp, filePath);
      });

      parsed.exports?.forEach((exp: ExportNode) => {
        this.addExportEdges(exp);
      });
    });

    // Phase 3: Create edges for function calls and references
    parsedFiles.forEach((parsed, filePath) => {
      parsed.functions?.forEach((func: FunctionNode) => {
        func.calls.forEach(callName => {
          this.addCallEdge(func.name, callName, filePath);
        });
        func.references.forEach(refName => {
          this.addReferenceEdge(func.name, refName, filePath);
        });
      });
    });

    // Phase 4: Create edges for class inheritance
    parsedFiles.forEach((parsed) => {
      parsed.classes?.forEach((cls: ClassNode) => {
        if (cls.extends) {
          this.addInheritanceEdge(cls.name, cls.extends, cls.file);
        }
      });
    });

    return this.graph;
  }

  buildSymbolTable(parsedFiles: Map<string, any>): Map<string, SymbolInfo> {
    parsedFiles.forEach((parsed, filePath) => {
      // Process exports first
      parsed.exports?.forEach((exp: ExportNode) => {
        const symbolId = `${filePath}:${exp.name}`;
        this.symbolTable.set(symbolId, {
          name: exp.name,
          type: exp.exportType,
          file: filePath,
          scope: 'global',
          usages: [],
          exportedFrom: filePath,
          importedIn: []
        });
      });

      // Process functions
      parsed.functions?.forEach((func: FunctionNode) => {
        const symbolId = `${filePath}:${func.name}`;
        if (!this.symbolTable.has(symbolId)) {
          this.symbolTable.set(symbolId, {
            name: func.name,
            type: 'function',
            file: filePath,
            scope: func.scope,
            usages: [{ file: filePath, line: func.location.line }],
            importedIn: []
          });
        }
      });

      // Process classes
      parsed.classes?.forEach((cls: ClassNode) => {
        const symbolId = `${filePath}:${cls.name}`;
        if (!this.symbolTable.has(symbolId)) {
          this.symbolTable.set(symbolId, {
            name: cls.name,
            type: 'class',
            file: filePath,
            scope: 'global',
            usages: [{ file: filePath, line: cls.location.line }],
            importedIn: []
          });
        }
      });

      // Track imports
      parsed.imports?.forEach((imp: ImportNode) => {
        imp.specifiers.forEach(spec => {
          const resolved = this.resolveImport(imp.source, filePath);
          if (resolved) {
            const symbolId = `${resolved}:${spec}`;
            const symbol = this.symbolTable.get(symbolId);
            if (symbol) {
              symbol.importedIn.push(filePath);
            }
          }
        });
      });
    });

    return this.symbolTable;
  }

  private addFileNode(filePath: string): void {
    const nodeId = `file:${filePath}`;
    this.graph.nodes.set(nodeId, {
      id: nodeId,
      type: 'file',
      name: filePath.split('/').pop() || filePath,
      file: filePath,
      metadata: { fullPath: filePath }
    });
  }

  private addFunctionNode(func: FunctionNode, className?: string): void {
    const nodeId = className 
      ? `function:${func.file}:${className}.${func.name}`
      : `function:${func.file}:${func.name}`;
    
    this.graph.nodes.set(nodeId, {
      id: nodeId,
      type: 'function',
      name: func.name,
      file: func.file,
      metadata: {
        params: func.params,
        complexity: func.complexity,
        line: func.location.line,
        className
      }
    });

    // Add edge from file to function
    this.addEdge(`file:${func.file}`, nodeId, 'exports', 1);
  }

  private addClassNode(cls: ClassNode): void {
    const nodeId = `class:${cls.file}:${cls.name}`;
    
    this.graph.nodes.set(nodeId, {
      id: nodeId,
      type: 'class',
      name: cls.name,
      file: cls.file,
      metadata: {
        extends: cls.extends,
        methodCount: cls.methods.length,
        propertyCount: cls.properties.length,
        line: cls.location.line
      }
    });

    // Add edge from file to class
    this.addEdge(`file:${cls.file}`, nodeId, 'exports', 1);
  }

  private addVariableNode(v: ASTNode): void {
    if (v.scope === 'local') return; // Only track global variables

    const nodeId = `variable:${v.file}:${v.name}`;
    
    this.graph.nodes.set(nodeId, {
      id: nodeId,
      type: 'variable',
      name: v.name,
      file: v.file,
      metadata: {
        line: v.location.line
      }
    });

    this.addEdge(`file:${v.file}`, nodeId, 'exports', 1);
  }

  private addImportEdges(imp: ImportNode, fromFile: string): void {
    const targetFile = this.resolveImport(imp.source, fromFile);
    if (!targetFile) return;

    const fromNodeId = `file:${fromFile}`;
    const toNodeId = `file:${targetFile}`;

    this.addEdge(fromNodeId, toNodeId, 'imports', imp.specifiers.length);
  }

  private addExportEdges(exp: ExportNode): void {
    // Exports are already handled when adding nodes
  }

  private addCallEdge(fromFunc: string, toFunc: string, file: string): void {
    const fromNodeId = `function:${file}:${fromFunc}`;
    
    // Try to find the target function
    const targetSymbol = this.findSymbol(toFunc, file);
    if (targetSymbol) {
      const toNodeId = `function:${targetSymbol.file}:${toFunc}`;
      this.addEdge(fromNodeId, toNodeId, 'calls', 1);
    }
  }

  private addReferenceEdge(fromFunc: string, toVar: string, file: string): void {
    const fromNodeId = `function:${file}:${fromFunc}`;
    
    // Try to find the referenced variable
    const targetSymbol = this.findSymbol(toVar, file);
    if (targetSymbol) {
      const toNodeId = `variable:${targetSymbol.file}:${toVar}`;
      this.addEdge(fromNodeId, toNodeId, 'references', 1);
    }
  }

  private addInheritanceEdge(childClass: string, parentClass: string, file: string): void {
    const fromNodeId = `class:${file}:${childClass}`;
    
    const parentSymbol = this.findSymbol(parentClass, file);
    if (parentSymbol) {
      const toNodeId = `class:${parentSymbol.file}:${parentClass}`;
      this.addEdge(fromNodeId, toNodeId, 'extends', 1);
    }
  }

  private addEdge(from: string, to: string, type: GraphEdge['type'], weight: number): void {
    this.graph.edges.push({ from, to, type, weight });

    if (!this.graph.adjacencyList.has(from)) {
      this.graph.adjacencyList.set(from, []);
    }
    this.graph.adjacencyList.get(from)!.push(to);
  }

  private resolveImport(source: string, fromFile: string): string | null {
    // Handle relative imports
    if (source.startsWith('.')) {
      const fromDir = fromFile.split('/').slice(0, -1).join('/');
      const resolved = this.resolvePath(fromDir, source);
      
      // Try different extensions
      const extensions = ['.ts', '.js', '.tsx', '.jsx', '/index.ts', '/index.js'];
      for (const ext of extensions) {
        const candidate = resolved + ext;
        if (this.fileMap.has(candidate)) {
          return candidate;
        }
      }
      
      // Try without extension
      if (this.fileMap.has(resolved)) {
        return resolved;
      }
    }

    return null; // External dependency
  }

  private resolvePath(baseDir: string, relativePath: string): string {
    const parts = baseDir.split('/').filter(Boolean);
    const relParts = relativePath.split('/').filter(Boolean);

    for (const part of relParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.') {
        parts.push(part);
      }
    }

    return parts.join('/');
  }

  private findSymbol(name: string, contextFile: string): SymbolInfo | null {
    // Check in current file first
    const localSymbol = this.symbolTable.get(`${contextFile}:${name}`);
    if (localSymbol) return localSymbol;

    // Check in imported files
    const parsed = this.fileMap.get(contextFile);
    if (parsed?.imports) {
      for (const imp of parsed.imports) {
        const targetFile = this.resolveImport(imp.source, contextFile);
        if (targetFile) {
          const importedSymbol = this.symbolTable.get(`${targetFile}:${name}`);
          if (importedSymbol) return importedSymbol;
        }
      }
    }

    return null;
  }

  // Analysis methods
  
  getFileDependencies(filePath: string): string[] {
    const nodeId = `file:${filePath}`;
    return this.graph.adjacencyList.get(nodeId) || [];
  }

  getFileDependents(filePath: string): string[] {
    const nodeId = `file:${filePath}`;
    const dependents: string[] = [];

    this.graph.edges.forEach(edge => {
      if (edge.to === nodeId && edge.type === 'imports') {
        dependents.push(edge.from);
      }
    });

    return dependents;
  }

  findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recStack.add(nodeId);
      path.push(nodeId);

      const neighbors = this.graph.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
        }
      }

      recStack.delete(nodeId);
    };

    this.graph.nodes.forEach((_, nodeId) => {
      if (!visited.has(nodeId) && nodeId.startsWith('file:')) {
        dfs(nodeId, []);
      }
    });

    return cycles;
  }

  getImpactAnalysis(filePath: string): {
    directImpact: string[];
    indirectImpact: string[];
    totalImpact: number;
  } {
    const nodeId = `file:${filePath}`;
    const directImpact: Set<string> = new Set();
    const indirectImpact: Set<string> = new Set();
    const visited = new Set<string>();

    // BFS to find all impacted files
    const queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }];
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      
      if (visited.has(id)) continue;
      visited.add(id);

      if (depth > 0) {
        if (depth === 1) {
          directImpact.add(id);
        } else {
          indirectImpact.add(id);
        }
      }

      // Find all files that depend on this one
      this.graph.edges.forEach(edge => {
        if (edge.to === id && edge.type === 'imports') {
          queue.push({ id: edge.from, depth: depth + 1 });
        }
      });
    }

    return {
      directImpact: Array.from(directImpact),
      indirectImpact: Array.from(indirectImpact),
      totalImpact: directImpact.size + indirectImpact.size
    };
  }

  getSymbolUsages(symbolName: string): SymbolInfo | null {
    for (const [, symbol] of this.symbolTable) {
      if (symbol.name === symbolName) {
        return symbol;
      }
    }
    return null;
  }

  getArchitectureMetrics(): {
    totalFiles: number;
    totalFunctions: number;
    totalClasses: number;
    averageComplexity: number;
    maxDepth: number;
    circularDependencies: number;
  } {
    let totalFunctions = 0;
    let totalClasses = 0;
    let totalComplexity = 0;
    let functionCount = 0;

    this.graph.nodes.forEach(node => {
      if (node.type === 'function') {
        totalFunctions++;
        totalComplexity += node.metadata.complexity || 0;
        functionCount++;
      } else if (node.type === 'class') {
        totalClasses++;
      }
    });

    const circles = this.findCircularDependencies();

    return {
      totalFiles: Array.from(this.graph.nodes.values()).filter(n => n.type === 'file').length,
      totalFunctions,
      totalClasses,
      averageComplexity: functionCount > 0 ? totalComplexity / functionCount : 0,
      maxDepth: this.calculateMaxDepth(),
      circularDependencies: circles.length
    };
  }

  private calculateMaxDepth(): number {
    let maxDepth = 0;

    const dfs = (nodeId: string, depth: number, visited: Set<string>): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      maxDepth = Math.max(maxDepth, depth);

      const neighbors = this.graph.adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighbor => {
        dfs(neighbor, depth + 1, visited);
      });
    };

    this.graph.nodes.forEach((_, nodeId) => {
      if (nodeId.startsWith('file:')) {
        dfs(nodeId, 0, new Set());
      }
    });

    return maxDepth;
  }

  getGraph(): DependencyGraph {
    return this.graph;
  }

  getSymbolTable(): Map<string, SymbolInfo> {
    return this.symbolTable;
  }
}
