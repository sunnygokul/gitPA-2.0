import { analyzeFile, FileAnalysis } from './ast';

export interface RepoFile {
  path: string;
  content: string;
}

export interface GraphNode {
  id: string; // file path or symbol id
  type: 'file' | 'symbol';
  file?: string;
  symbolKind?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'imports' | 'exports' | 'calls' | 'symbol';
}

export interface RepositoryGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  analyses: FileAnalysis[];
}

export function buildRepositoryGraph(files: RepoFile[]): RepositoryGraph {
  const analyses: FileAnalysis[] = [];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Analyze files
  for (const f of files) {
    const fa = analyzeFile(f.path, f.content);
    analyses.push(fa);
    nodes.push({ id: f.path, type: 'file' });
  }

  // Build edges
  for (const a of analyses) {
    // Import edges
    for (const imp of a.imports) {
      // normalize relative imports by file path prefix
      edges.push({ from: a.path, to: imp, type: 'imports' });
    }
    // Export symbol nodes
    for (const sym of a.symbols) {
      const symId = `${a.path}::${sym.name}`;
      nodes.push({ id: symId, type: 'symbol', file: a.path, symbolKind: sym.kind });
      edges.push({ from: a.path, to: symId, type: 'symbol' });
    }
    // Call edges to symbol names (unresolved globally but useful)
    for (const call of a.calls) {
      edges.push({ from: a.path, to: call, type: 'calls' });
    }
  }

  return { nodes, edges, analyses };
}

export function detectCircularDependencies(graph: RepositoryGraph): string[][] {
  // Simple DFS on import edges using file nodes only
  const adj = new Map<string, string[]>();
  graph.edges.filter(e => e.type === 'imports').forEach(e => {
    const from = e.from;
    const to = e.to;
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from)!.push(to);
  });

  const visited = new Set<string>();
  const stack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]) {
    if (stack.has(node)) {
      const idx = path.indexOf(node);
      if (idx !== -1) cycles.push(path.slice(idx));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    const next = adj.get(node) || [];
    for (const n of next) dfs(n, [...path, n]);
    stack.delete(node);
  }

  for (const node of adj.keys()) dfs(node, [node]);
  return cycles;
}
