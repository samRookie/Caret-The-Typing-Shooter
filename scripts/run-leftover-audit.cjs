const fs = require('fs');
const path = require('path');

console.log('========================================================================');
console.log('REVISION R1 - LEFTOVER & DEAD CODE AUDIT (7.E)');
console.log('========================================================================');

let failureCount = 0;

function walkDir(dir, filter = () => true) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkDir(fullPath, filter));
    } else if (filter(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

// 1. Source files audit for retired tokens
const retiredTokens = [
  'DIFFICULTY_PRESETS',
  'DifficultyPresetId',
  'ActiveTargetReadout',
  'enemyClearBonus',
  'waveClearBonus',
  'bonusScore',
];

console.log('\n--- 1. AUDITING SRC FOR RETIRED TOKENS ---');
const srcFiles = walkDir('src', f => /\.(ts|tsx)$/.test(f));

for (const token of retiredTokens) {
  const matches = [];
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(token)) {
      matches.push(file);
    }
  }
  if (matches.length > 0) {
    console.error(`FAIL: Token "${token}" found in: ${matches.join(', ')}`);
    failureCount++;
  } else {
    console.log(`PASS: Zero occurrences of "${token}" in src/`);
  }
}

// 2. Core simulation wall-clock and non-deterministic random audit (Rule R-B)
console.log('\n--- 2. AUDITING SRC/GAME/CORE FOR WALL-CLOCK & NONDETERMINISTIC CALLS ---');
const coreFiles = walkDir('src/game/core', f => /\.(ts|tsx)$/.test(f));
const coreForbiddenPatterns = [
  { name: 'Date.now()', regex: /Date\.now\(\)/ },
  { name: 'new Date()', regex: /new\s+Date\(\)/ },
  { name: 'Math.random()', regex: /Math\.random\(\)/ },
  { name: 'performance.now()', regex: /performance\.now\(\)/ },
];

for (const { name, regex } of coreForbiddenPatterns) {
  const matches = [];
  for (const file of coreFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (regex.test(content)) {
      matches.push(file);
    }
  }
  if (matches.length > 0) {
    console.error(`FAIL: "${name}" found in core: ${matches.join(', ')}`);
    failureCount++;
  } else {
    console.log(`PASS: Zero occurrences of "${name}" in src/game/core/`);
  }
}

// 3. Production bundle check for dev hooks in dist/
console.log('\n--- 3. AUDITING DIST/ PRODUCTION BUNDLE FOR DEV HOOKS ---');
const distFiles = walkDir('dist/assets', f => /\.js$/.test(f));
if (distFiles.length === 0) {
  console.log('SKIP: dist/assets not found, build first');
} else {
  let hasDevCaret = false;
  for (const file of distFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('__caret') && content.includes('installDevCaretHook')) {
      hasDevCaret = true;
      console.error(`FAIL: Dev hook found in production bundle: ${file}`);
      failureCount++;
    }
  }
  if (!hasDevCaret) {
    console.log('PASS: Zero active dev hooks (__caret) in production bundle');
  }
}

console.log('========================================================================');
if (failureCount === 0) {
  console.log('LEFTOVER CODE & CORE PURITY AUDIT: 100% PASS');
  process.exit(0);
} else {
  console.error(`LEFTOVER AUDIT FAILED WITH ${failureCount} DEFECT(S)`);
  process.exit(1);
}
