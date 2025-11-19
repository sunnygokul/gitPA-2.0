import { FileAnalysis } from './ast';

export interface RefactorSuggestion {
  file: string;
  severity: 'High' | 'Medium' | 'Low';
  type: 'Extract Function' | 'Simplify Logic' | 'Remove Duplication' | 'Modernize' | 'Performance' | 'Rename';
  title: string;
  description: string;
  location?: string;
}

function jaccard(a: string, b: string): number {
  const A = new Set(a.split(/\W+/).filter(Boolean));
  const B = new Set(b.split(/\W+/).filter(Boolean));
  const inter = new Set([...A].filter(x => B.has(x))).size;
  const uni = new Set([...A, ...B]).size;
  return uni === 0 ? 0 : inter / uni;
}

export function detectSmells(analyses: FileAnalysis[]): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];
  for (const a of analyses) {
    // Long functions based on body length
    for (const body of a.functionBodies) {
      const lines = body.split('\n').length;
      if (lines > 80) {
        suggestions.push({
          file: a.path,
          severity: 'High',
          type: 'Extract Function',
          title: `Long function (~${lines} lines)`,
          description: 'Break into smaller functions to improve readability and testing.'
        });
        break;
      }
    }

    // Many imports => potentially high coupling
    if (a.imports.length > 10) {
      suggestions.push({
        file: a.path,
        severity: 'Medium',
        type: 'Simplify Logic',
        title: 'High coupling due to many imports',
        description: 'Consider splitting the module or reducing dependencies.'
      });
    }
  }

  // Cross-file duplication: compare function bodies across files
  const allBodies: { file: string; body: string }[] = [];
  analyses.forEach(a => a.functionBodies.forEach(b => allBodies.push({ file: a.path, body: b })));
  for (let i = 0; i < allBodies.length; i++) {
    for (let j = i + 1; j < allBodies.length; j++) {
      const sim = jaccard(allBodies[i].body, allBodies[j].body);
      if (sim > 0.65 && allBodies[i].file !== allBodies[j].file) {
        suggestions.push({
          file: allBodies[i].file,
          severity: 'High',
          type: 'Remove Duplication',
          title: 'Duplicate code across files',
          description: `Detected ~${Math.round(sim * 100)}% similarity with ${allBodies[j].file}. Extract shared utility.`
        });
      }
    }
  }

  return suggestions;
}
