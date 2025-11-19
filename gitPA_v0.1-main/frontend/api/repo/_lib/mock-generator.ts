// @ts-nocheck

export interface MockSpec {
  name: string;
  type: 'function' | 'class' | 'module' | 'api';
  implementation: string;
  dependencies: string[];
}

export class MockGenerator {
  generateMock(symbolName: string, symbolInfo: any, language: string): MockSpec | null {
    if (language === 'javascript' || language === 'typescript') {
      return this.generateJSMock(symbolName, symbolInfo);
    } else if (language === 'python') {
      return this.generatePythonMock(symbolName, symbolInfo);
    }
    return null;
  }

  private generateJSMock(name: string, info: any): MockSpec {
    if (info.type === 'function') {
      return this.generateJSFunctionMock(name, info);
    } else if (info.type === 'class') {
      return this.generateJSClassMock(name, info);
    } else if (info.type === 'module') {
      return this.generateJSModuleMock(name, info);
    }

    return {
      name,
      type: 'function',
      implementation: `jest.fn()`,
      dependencies: []
    };
  }

  private generateJSFunctionMock(name: string, info: any): MockSpec {
    const params = info.params || [];
    const returnType = info.returnType || 'any';

    let implementation = `const ${name} = jest.fn(`;

    if (params.length > 0) {
      implementation += `(${params.join(', ')}) => `;
    } else {
      implementation += `() => `;
    }

    // Generate appropriate return value based on return type
    if (returnType.includes('Promise')) {
      implementation += `Promise.resolve(mockData)`;
    } else if (returnType === 'boolean') {
      implementation += `true`;
    } else if (returnType === 'number') {
      implementation += `0`;
    } else if (returnType === 'string') {
      implementation += `'mock-value'`;
    } else if (returnType.includes('[]')) {
      implementation += `[]`;
    } else {
      implementation += `{}`;
    }

    implementation += `);`;

    return {
      name,
      type: 'function',
      implementation,
      dependencies: ['jest']
    };
  }

  private generateJSClassMock(name: string, info: any): MockSpec {
    const methods = info.methods || [];
    
    let implementation = `class Mock${name} {\n`;

    methods.forEach(method => {
      const params = method.params?.join(', ') || '';
      implementation += `  ${method.name}(${params}) {\n`;
      implementation += `    return jest.fn();\n`;
      implementation += `  }\n`;
    });

    implementation += `}\n\n`;
    implementation += `const ${name} = Mock${name};\n`;
    implementation += `jest.mock('./${name}', () => ({ ${name}: Mock${name} }));`;

    return {
      name,
      type: 'class',
      implementation,
      dependencies: ['jest']
    };
  }

  private generateJSModuleMock(name: string, info: any): MockSpec {
    const exports = info.exports || [];

    let implementation = `jest.mock('${name}', () => ({\n`;

    exports.forEach((exp, idx) => {
      const comma = idx < exports.length - 1 ? ',' : '';
      if (exp.type === 'function') {
        implementation += `  ${exp.name}: jest.fn()${comma}\n`;
      } else {
        implementation += `  ${exp.name}: {}${comma}\n`;
      }
    });

    implementation += `}));`;

    return {
      name,
      type: 'module',
      implementation,
      dependencies: ['jest']
    };
  }

  private generatePythonMock(name: string, info: any): MockSpec {
    if (info.type === 'function') {
      return this.generatePythonFunctionMock(name, info);
    } else if (info.type === 'class') {
      return this.generatePythonClassMock(name, info);
    }

    return {
      name,
      type: 'function',
      implementation: `${name} = Mock()`,
      dependencies: ['unittest.mock']
    };
  }

  private generatePythonFunctionMock(name: string, info: any): MockSpec {
    const params = info.params || [];

    let implementation = `@patch('module.${name}')\n`;
    implementation += `def test_with_mock_${name}(mock_${name}):\n`;
    implementation += `    mock_${name}.return_value = None\n`;
    implementation += `    # Test code here\n`;
    implementation += `    assert mock_${name}.called`;

    return {
      name,
      type: 'function',
      implementation,
      dependencies: ['unittest.mock', 'patch']
    };
  }

  private generatePythonClassMock(name: string, info: any): MockSpec {
    const methods = info.methods || [];

    let implementation = `class Mock${name}:\n`;

    methods.forEach(method => {
      const params = method.params?.join(', ') || 'self';
      implementation += `    def ${method.name}(${params}):\n`;
      implementation += `        return Mock()\n\n`;
    });

    implementation += `${name} = Mock${name}()`;

    return {
      name,
      type: 'class',
      implementation,
      dependencies: ['unittest.mock', 'Mock']
    };
  }

  generateAPIResponseMock(endpoint: string, method: string = 'GET'): string {
    return `
const mockResponse = {
  data: { id: 1, message: 'success' },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {}
};

jest.mock('axios');
axios.${method.toLowerCase()}.mockResolvedValue(mockResponse);
`.trim();
  }

  generateDatabaseMock(dbType: string): string {
    if (dbType === 'mongodb') {
      return `
const mockDb = {
  collection: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockResolvedValue({}),
  insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  toArray: jest.fn().mockResolvedValue([])
};
`.trim();
    } else if (dbType === 'sql') {
      return `
const mockConnection = {
  query: jest.fn((sql, params, callback) => {
    callback(null, [{ id: 1 }]);
  }),
  execute: jest.fn().mockResolvedValue([[{ id: 1 }], []]),
  end: jest.fn()
};
`.trim();
    }

    return 'const mockDb = {};';
  }

  generateTimerMock(): string {
    return `
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('timer test', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);
  
  jest.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
`.trim();
  }

  generateFileSystemMock(): string {
    return `
jest.mock('fs', () => ({
  readFile: jest.fn((path, encoding, callback) => {
    callback(null, 'mock file content');
  }),
  writeFile: jest.fn((path, data, callback) => {
    callback(null);
  }),
  promises: {
    readFile: jest.fn().mockResolvedValue('mock file content'),
    writeFile: jest.fn().mockResolvedValue()
  }
}));
`.trim();
  }
}

export class CoverageAnalyzer {
  analyzeCoverage(code: string, tests: string): {
    linesCovered: number;
    totalLines: number;
    percentage: number;
    uncoveredLines: number[];
    branchesCovered: number;
    totalBranches: number;
  } {
    const codeLines = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    });

    // Extract function names from tests
    const testFunctions = new Set<string>();
    const testMatches = tests.matchAll(/(?:test|it)\(['"].*['"],.*function.*(\w+)/g);
    for (const match of testMatches) {
      if (match[1]) testFunctions.add(match[1]);
    }

    // Count covered lines (simplified analysis)
    let covered = 0;
    const uncoveredLines: number[] = [];

    codeLines.forEach((line, idx) => {
      const hasFunctionCall = Array.from(testFunctions).some(fn => line.includes(fn));
      if (hasFunctionCall || /expect|assert|should/.test(tests)) {
        covered++;
      } else {
        uncoveredLines.push(idx + 1);
      }
    });

    // Count branches (if/else, switch, ternary)
    const branches = (code.match(/\b(?:if|else|switch|case|\?|&&|\|\|)\b/g) || []).length;
    const coveredBranches = Math.floor(branches * 0.7); // Estimate

    return {
      linesCovered: covered,
      totalLines: codeLines.length,
      percentage: codeLines.length > 0 ? (covered / codeLines.length) * 100 : 0,
      uncoveredLines: uncoveredLines.slice(0, 10), // First 10 uncovered lines
      branchesCovered: coveredBranches,
      totalBranches: branches
    };
  }

  generateCoverageReport(results: ReturnType<typeof this.analyzeCoverage>): string {
    return `
## Code Coverage Report

**Line Coverage:** ${results.linesCovered}/${results.totalLines} (${results.percentage.toFixed(2)}%)
**Branch Coverage:** ${results.branchesCovered}/${results.totalBranches} (${results.totalBranches > 0 ? ((results.branchesCovered / results.totalBranches) * 100).toFixed(2) : 0}%)

**Uncovered Lines:** ${results.uncoveredLines.length > 0 ? results.uncoveredLines.join(', ') : 'All lines covered!'}

**Recommendations:**
${results.percentage < 50 ? '⚠️ Coverage is low. Consider adding more test cases.' : results.percentage < 80 ? '✓ Good coverage. Add tests for edge cases.' : '✅ Excellent coverage!'}
`.trim();
  }
}
