import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export interface ParsedFile {
  path: string;
  ast: t.File | null;
  error?: string;
}

export interface SymbolInfo {
  name: string;
  kind: 'function' | 'class' | 'variable';
  loc?: { start: number; end: number };
}

export interface FileAnalysis {
  path: string;
  imports: string[];
  exports: string[];
  symbols: SymbolInfo[];
  functionBodies: string[];
  calls: string[];
}

export function parseJSOrTS(code: string, sourceType: 'module' | 'script' = 'module') {
  try {
    return parse(code, {
      sourceType,
      plugins: ['typescript', 'jsx', 'classProperties', 'classPrivateProperties', 'decorators-legacy', 'objectRestSpread', 'dynamicImport'],
      errorRecovery: true,
      tokens: false,
    });
  } catch (e: any) {
    return null;
  }
}

export function analyzeFile(path: string, content: string): FileAnalysis {
  const isModule = /import\s|export\s/.test(content);
  const ast = parseJSOrTS(content, isModule ? 'module' : 'script');
  const imports: string[] = [];
  const exports: string[] = [];
  const symbols: SymbolInfo[] = [];
  const functionBodies: string[] = [];
  const calls: string[] = [];

  if (!ast) {
    return { path, imports, exports, symbols, functionBodies, calls };
  }

  traverse(ast, {
    ImportDeclaration(p) {
      if (p.node.source?.value) imports.push(String(p.node.source.value));
    },
    ExportNamedDeclaration(p) {
      if (p.node.declaration) {
        if (t.isFunctionDeclaration(p.node.declaration) && p.node.declaration.id) {
          exports.push(p.node.declaration.id.name);
        }
        if (t.isClassDeclaration(p.node.declaration) && p.node.declaration.id) {
          exports.push(p.node.declaration.id.name);
        }
      }
    },
    ExportDefaultDeclaration(p) {
      exports.push('default');
    },
    FunctionDeclaration(p) {
      const id = p.node.id?.name || 'anonymous';
      symbols.push({ name: id, kind: 'function' });
      const bodyCode = content.slice(p.node.start || 0, p.node.end || 0);
      if (bodyCode) functionBodies.push(bodyCode);
    },
    ArrowFunctionExpression(p) {
      const bodyCode = content.slice(p.node.start || 0, p.node.end || 0);
      if (bodyCode) functionBodies.push(bodyCode);
    },
    ClassDeclaration(p) {
      const id = p.node.id?.name || 'AnonymousClass';
      symbols.push({ name: id, kind: 'class' });
    },
    VariableDeclarator(p) {
      if (t.isIdentifier(p.node.id)) {
        symbols.push({ name: p.node.id.name, kind: 'variable' });
      }
    },
    CallExpression(p) {
      const callee = p.node.callee;
      let name = '';
      if (t.isIdentifier(callee)) name = callee.name;
      else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) name = callee.property.name;
      if (name) calls.push(name);
    }
  });

  return { path, imports, exports, symbols, functionBodies, calls };
}
