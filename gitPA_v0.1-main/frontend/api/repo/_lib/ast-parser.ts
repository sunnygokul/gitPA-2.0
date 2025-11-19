// @ts-nocheck
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

export interface ASTNode {
  type: string;
  name: string;
  location: { line: number; column: number };
  scope: 'global' | 'local';
  file: string;
}

export interface FunctionNode extends ASTNode {
  type: 'function';
  params: string[];
  returnType?: string;
  complexity: number;
  calls: string[];
  references: string[];
}

export interface ClassNode extends ASTNode {
  type: 'class';
  extends?: string;
  implements?: string[];
  methods: FunctionNode[];
  properties: PropertyNode[];
}

export interface PropertyNode extends ASTNode {
  type: 'property';
  valueType?: string;
  isStatic: boolean;
}

export interface ImportNode {
  type: 'import';
  source: string;
  specifiers: string[];
  isExternal: boolean;
  file: string;
}

export interface ExportNode {
  type: 'export';
  name: string;
  exportType: 'default' | 'named';
  file: string;
}

export class ASTParser {
  private parsedFiles: Map<string, any> = new Map();
  
  parseJavaScript(code: string, filePath: string): {
    functions: FunctionNode[];
    classes: ClassNode[];
    imports: ImportNode[];
    exports: ExportNode[];
    variables: ASTNode[];
  } {
    const result = {
      functions: [] as FunctionNode[],
      classes: [] as ClassNode[],
      imports: [] as ImportNode[],
      exports: [] as ExportNode[],
      variables: [] as ASTNode[]
    };

    try {
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties']
      });

      traverse(ast, {
        FunctionDeclaration: (path) => {
          const func = this.extractFunction(path, filePath);
          if (func) result.functions.push(func);
        },
        
        ArrowFunctionExpression: (path) => {
          if (t.isVariableDeclarator(path.parent)) {
            const func = this.extractArrowFunction(path, filePath);
            if (func) result.functions.push(func);
          }
        },

        ClassDeclaration: (path) => {
          const cls = this.extractClass(path, filePath);
          if (cls) result.classes.push(cls);
        },

        ImportDeclaration: (path) => {
          const imp = this.extractImport(path, filePath);
          if (imp) result.imports.push(imp);
        },

        ExportNamedDeclaration: (path) => {
          const exp = this.extractExport(path, filePath);
          if (exp) result.exports.push(...exp);
        },

        ExportDefaultDeclaration: (path) => {
          const exp = this.extractDefaultExport(path, filePath);
          if (exp) result.exports.push(exp);
        },

        VariableDeclaration: (path) => {
          const vars = this.extractVariables(path, filePath);
          result.variables.push(...vars);
        }
      });

      this.parsedFiles.set(filePath, result);
      return result;
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
      return result;
    }
  }

  parsePython(code: string, filePath: string): any {
    // Basic Python parsing using regex patterns (Python AST would require py-to-js compiler)
    const result = {
      functions: [] as FunctionNode[],
      classes: [] as ClassNode[],
      imports: [] as ImportNode[],
      exports: [] as ExportNode[],
      variables: [] as ASTNode[]
    };

    const lines = code.split('\n');
    
    // Parse imports
    lines.forEach((line, idx) => {
      const importMatch = line.match(/^(?:from\s+(\S+)\s+)?import\s+(.+)/);
      if (importMatch) {
        const source = importMatch[1] || importMatch[2].split(',')[0].trim();
        const specifiers = importMatch[2].split(',').map(s => s.trim());
        result.imports.push({
          type: 'import',
          source,
          specifiers,
          isExternal: !source.startsWith('.'),
          file: filePath
        });
      }
    });

    // Parse functions
    lines.forEach((line, idx) => {
      const funcMatch = line.match(/^(\s*)def\s+(\w+)\s*\(([^)]*)\)/);
      if (funcMatch) {
        const params = funcMatch[3].split(',').map(p => p.trim()).filter(Boolean);
        result.functions.push({
          type: 'function',
          name: funcMatch[2],
          location: { line: idx + 1, column: funcMatch[1].length },
          scope: funcMatch[1].length === 0 ? 'global' : 'local',
          file: filePath,
          params,
          complexity: 1,
          calls: [],
          references: []
        });
      }
    });

    // Parse classes
    lines.forEach((line, idx) => {
      const classMatch = line.match(/^class\s+(\w+)(?:\(([^)]*)\))?:/);
      if (classMatch) {
        result.classes.push({
          type: 'class',
          name: classMatch[1],
          location: { line: idx + 1, column: 0 },
          scope: 'global',
          file: filePath,
          extends: classMatch[2],
          methods: [],
          properties: []
        });
      }
    });

    return result;
  }

  private extractFunction(path: any, filePath: string): FunctionNode | null {
    const node = path.node;
    if (!node.id) return null;

    const complexity = this.calculateComplexity(path);
    const calls = this.extractFunctionCalls(path);
    const references = this.extractReferences(path);

    return {
      type: 'function',
      name: node.id.name,
      location: {
        line: node.loc?.start.line || 0,
        column: node.loc?.start.column || 0
      },
      scope: path.scope.parent ? 'local' : 'global',
      file: filePath,
      params: node.params.map((p: any) => p.name || ''),
      returnType: node.returnType?.typeAnnotation?.type,
      complexity,
      calls,
      references
    };
  }

  private extractArrowFunction(path: any, filePath: string): FunctionNode | null {
    const parent = path.parent;
    if (!t.isVariableDeclarator(parent) || !t.isIdentifier(parent.id)) return null;

    const complexity = this.calculateComplexity(path);
    const calls = this.extractFunctionCalls(path);
    const references = this.extractReferences(path);

    return {
      type: 'function',
      name: parent.id.name,
      location: {
        line: path.node.loc?.start.line || 0,
        column: path.node.loc?.start.column || 0
      },
      scope: path.scope.parent ? 'local' : 'global',
      file: filePath,
      params: path.node.params.map((p: any) => p.name || ''),
      complexity,
      calls,
      references
    };
  }

  private extractClass(path: any, filePath: string): ClassNode | null {
    const node = path.node;
    if (!node.id) return null;

    const methods: FunctionNode[] = [];
    const properties: PropertyNode[] = [];

    path.traverse({
      ClassMethod: (methodPath: any) => {
        const method = methodPath.node;
        if (t.isIdentifier(method.key)) {
          methods.push({
            type: 'function',
            name: method.key.name,
            location: {
              line: method.loc?.start.line || 0,
              column: method.loc?.start.column || 0
            },
            scope: 'local',
            file: filePath,
            params: method.params.map((p: any) => p.name || ''),
            complexity: this.calculateComplexity(methodPath),
            calls: this.extractFunctionCalls(methodPath),
            references: []
          });
        }
      },

      ClassProperty: (propPath: any) => {
        const prop = propPath.node;
        if (t.isIdentifier(prop.key)) {
          properties.push({
            type: 'property',
            name: prop.key.name,
            location: {
              line: prop.loc?.start.line || 0,
              column: prop.loc?.start.column || 0
            },
            scope: 'local',
            file: filePath,
            isStatic: prop.static || false
          });
        }
      }
    });

    return {
      type: 'class',
      name: node.id.name,
      location: {
        line: node.loc?.start.line || 0,
        column: node.loc?.start.column || 0
      },
      scope: 'global',
      file: filePath,
      extends: node.superClass?.name,
      methods,
      properties
    };
  }

  private extractImport(path: any, filePath: string): ImportNode {
    const node = path.node;
    const source = node.source.value;
    const specifiers = node.specifiers.map((s: any) => 
      s.imported?.name || s.local?.name || 'default'
    );

    return {
      type: 'import',
      source,
      specifiers,
      isExternal: !source.startsWith('.') && !source.startsWith('/'),
      file: filePath
    };
  }

  private extractExport(path: any, filePath: string): ExportNode[] {
    const node = path.node;
    const exports: ExportNode[] = [];

    if (node.declaration) {
      if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
        exports.push({
          type: 'export',
          name: node.declaration.id.name,
          exportType: 'named',
          file: filePath
        });
      } else if (t.isVariableDeclaration(node.declaration)) {
        node.declaration.declarations.forEach((decl: any) => {
          if (t.isIdentifier(decl.id)) {
            exports.push({
              type: 'export',
              name: decl.id.name,
              exportType: 'named',
              file: filePath
            });
          }
        });
      }
    }

    node.specifiers?.forEach((spec: any) => {
      exports.push({
        type: 'export',
        name: spec.exported.name,
        exportType: 'named',
        file: filePath
      });
    });

    return exports;
  }

  private extractDefaultExport(path: any, filePath: string): ExportNode {
    const node = path.node;
    let name = 'default';

    if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
      name = node.declaration.id.name;
    } else if (t.isClassDeclaration(node.declaration) && node.declaration.id) {
      name = node.declaration.id.name;
    } else if (t.isIdentifier(node.declaration)) {
      name = node.declaration.name;
    }

    return {
      type: 'export',
      name,
      exportType: 'default',
      file: filePath
    };
  }

  private extractVariables(path: any, filePath: string): ASTNode[] {
    const node = path.node;
    const variables: ASTNode[] = [];

    node.declarations.forEach((decl: any) => {
      if (t.isIdentifier(decl.id)) {
        variables.push({
          type: 'variable',
          name: decl.id.name,
          location: {
            line: decl.loc?.start.line || 0,
            column: decl.loc?.start.column || 0
          },
          scope: path.scope.parent ? 'local' : 'global',
          file: filePath
        });
      }
    });

    return variables;
  }

  private calculateComplexity(path: any): number {
    let complexity = 1;

    path.traverse({
      IfStatement: () => complexity++,
      WhileStatement: () => complexity++,
      ForStatement: () => complexity++,
      SwitchCase: (switchPath: any) => {
        if (switchPath.node.test) complexity++;
      },
      ConditionalExpression: () => complexity++,
      LogicalExpression: () => complexity++,
      CatchClause: () => complexity++
    });

    return complexity;
  }

  private extractFunctionCalls(path: any): string[] {
    const calls: Set<string> = new Set();

    path.traverse({
      CallExpression: (callPath: any) => {
        const callee = callPath.node.callee;
        if (t.isIdentifier(callee)) {
          calls.add(callee.name);
        } else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
          calls.add(callee.property.name);
        }
      }
    });

    return Array.from(calls);
  }

  private extractReferences(path: any): string[] {
    const refs: Set<string> = new Set();

    path.traverse({
      Identifier: (idPath: any) => {
        if (!idPath.isReferencedIdentifier()) return;
        const name = idPath.node.name;
        if (name && !path.scope.hasOwnBinding(name)) {
          refs.add(name);
        }
      }
    });

    return Array.from(refs);
  }

  getLanguage(fileName: string): 'javascript' | 'python' | 'java' | 'unknown' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(ext || '')) {
      return 'javascript';
    }
    if (ext === 'py') return 'python';
    if (ext === 'java') return 'java';
    
    return 'unknown';
  }

  parseFile(code: string, filePath: string): any {
    const language = this.getLanguage(filePath);

    if (language === 'javascript') {
      return this.parseJavaScript(code, filePath);
    } else if (language === 'python') {
      return this.parsePython(code, filePath);
    }

    return {
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      variables: []
    };
  }
}
