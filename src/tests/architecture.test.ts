import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Architecture & Framework Boundary Constraints', () => {
  const targetDirs = [
    path.resolve(__dirname, '../game/core'),
    path.resolve(__dirname, '../shared/domain'),
  ];

  function getAllFiles(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) return [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath));
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allFiles = targetDirs.flatMap(getAllFiles);

  it('scans at least one core and domain file', () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });

  const forbiddenImportPatterns = [
    { pattern: /from\s+['"]phaser['"]/i, desc: "importing 'phaser'" },
    { pattern: /from\s+['"]phaser\/.*?['"]/i, desc: "importing from 'phaser/*'" },
    { pattern: /require\(['"]phaser.*?['"]\)/i, desc: "requiring 'phaser'" },
    { pattern: /from\s+['"]react['"]/i, desc: "importing 'react'" },
    { pattern: /from\s+['"]react\/.*?['"]/i, desc: "importing from 'react/*'" },
    { pattern: /require\(['"]react.*?['"]\)/i, desc: "requiring 'react'" },
  ];

  const forbiddenGlobalPatterns = [
    { pattern: /\bwindow\b/, desc: 'reference to window' },
    { pattern: /\bdocument\b/, desc: 'reference to document' },
    { pattern: /Math\.random\s*\(/, desc: 'call to Math.random()' },
    { pattern: /Date\.now\s*\(/, desc: 'call to Date.now()' },
    { pattern: /performance\.now\s*\(/, desc: 'call to performance.now()' },
  ];

  it('ensures core and domain modules do not import Phaser or React', () => {
    const violations: string[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          return;
        }

        for (const { pattern, desc } of forbiddenImportPatterns) {
          if (pattern.test(line)) {
            const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
            violations.push(`${relPath}:${index + 1} - Forbidden: ${desc}`);
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('ensures core and domain modules do not reference browser globals or non-deterministic APIs', () => {
    const violations: string[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          return;
        }

        for (const { pattern, desc } of forbiddenGlobalPatterns) {
          if (pattern.test(line)) {
            const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
            violations.push(`${relPath}:${index + 1} - Forbidden: ${desc}`);
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
