import { FileAnalysis } from './ast';

export interface GeneratedTest {
  file: string;
  testFile: string;
  code: string;
}

function getTestFileName(filePath: string): string {
  const dot = filePath.lastIndexOf('.');
  const base = dot > -1 ? filePath.substring(0, dot) : filePath;
  const ext = dot > -1 ? filePath.substring(dot) : '.ts';
  return `${base}.test${ext}`;
}

export function generateJestTests(analyses: FileAnalysis[]): GeneratedTest[] {
  const out: GeneratedTest[] = [];
  for (const a of analyses) {
    // Only JS/TS files
    if (!/\.(ts|tsx|js|jsx)$/.test(a.path)) continue;
    const exported = a.symbols.map(s => s.name).filter(Boolean);
    const imports = `import * as Module from '../${a.path}';\n`;
    const mocks = a.imports
      .filter(i => !i.startsWith('.') && !i.startsWith('/'))
      .map(i => `jest.mock('${i}', () => ({ __esModule: true }));`)
      .join('\n');
    const tests = exported.slice(0, 10).map(name => `
describe('${name}', () => {
  it('should work (happy path)', () => {
    // TODO: provide proper inputs
    const result = (Module as any)['${name}']?.();
    expect(result).not.toBeUndefined();
  });
});
`).join('\n');

    const code = `/* Auto-generated Jest test */\n${imports}${mocks ? '\n' + mocks + '\n' : ''}${tests || "test('module loads', () => { expect(Module).toBeDefined(); });"}`;
    out.push({ file: a.path, testFile: getTestFileName(a.path), code });
  }
  return out;
}
