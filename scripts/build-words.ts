import fs from 'node:fs';
import path from 'node:path';

export interface BuildWordTiersOptions {
  readonly maxPerTier?: number;
}

export type WordTiers = Record<number, string[]>;

/**
 * Validates whether a candidate string satisfies Rules 1-3.
 */
export function isValidWordCandidate(
  rawWord: string,
  blockedSet: ReadonlySet<string>
): boolean {
  const w = rawWord.trim().toLowerCase();

  // Rule 1: keep only ^[a-z]{3,8}$
  if (!/^[a-z]{3,8}$/.test(w)) {
    return false;
  }

  // Rule 2: exclude and blocklist check
  if (blockedSet.has(w)) {
    return false;
  }

  // Rule 3:
  // - at least one vowel (a, e, i, o, u, y)
  if (!/[aeiouy]/.test(w)) {
    return false;
  }
  // - no three identical consecutive letters
  if (/(.)\1\1/.test(w)) {
    return false;
  }
  // - not all letters the same
  if (new Set(w.split('')).size === 1) {
    return false;
  }

  return true;
}

/**
 * Pure function: Filters, groups, deduplicates, and evenly interleaves themed words.
 * Implements Rules 1 through 6.
 */
export function buildWordTiers(
  frequencyList: readonly string[],
  themedList: readonly string[],
  excludeList: readonly string[],
  blockList: readonly string[],
  options?: BuildWordTiersOptions
): WordTiers {
  const maxPerTier = options?.maxPerTier ?? 600;

  // Build normalized blocked set
  const blockedSet = new Set<string>();
  for (const item of excludeList) {
    const cleaned = item.trim().toLowerCase();
    if (cleaned) blockedSet.add(cleaned);
  }
  for (const item of blockList) {
    const cleaned = item.trim().toLowerCase();
    if (cleaned) blockedSet.add(cleaned);
  }

  // Filter and deduplicate themed words (preserving authored order)
  const themedByTier: WordTiers = { 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
  const themedGlobalSet = new Set<string>();

  for (const item of themedList) {
    const w = item.trim().toLowerCase();
    if (!isValidWordCandidate(w, blockedSet)) continue;
    if (themedGlobalSet.has(w)) continue;

    themedGlobalSet.add(w);
    const tier = w.length;
    if (tier >= 3 && tier <= 8) {
      themedByTier[tier]!.push(w);
    }
  }

  // Filter and deduplicate frequency words (preserving frequency order)
  const freqByTier: WordTiers = { 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
  const freqGlobalSet = new Set<string>();

  for (const item of frequencyList) {
    const w = item.trim().toLowerCase();
    if (!isValidWordCandidate(w, blockedSet)) continue;
    // Deduplicate against already processed frequency words
    if (freqGlobalSet.has(w)) continue;
    freqGlobalSet.add(w);

    // If word is already in themed list, skip adding to frequency pool
    // so it doesn't appear twice when interleaved
    if (themedGlobalSet.has(w)) continue;

    const tier = w.length;
    if (tier >= 3 && tier <= 8) {
      freqByTier[tier]!.push(w);
    }
  }

  // Produce final tiered arrays with even interleaving
  const finalTiers: WordTiers = { 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };

  for (let tier = 3; tier <= 8; tier++) {
    const themedWords = themedByTier[tier] ?? [];
    const freqWords = freqByTier[tier] ?? [];

    const totalAvailable = themedWords.length + freqWords.length;
    const targetCount = Math.min(maxPerTier, totalAvailable);

    if (themedWords.length >= targetCount) {
      // Themed words alone exceed or meet capacity
      finalTiers[tier] = themedWords.slice(0, targetCount);
      continue;
    }

    if (themedWords.length === 0) {
      // No themed words
      finalTiers[tier] = freqWords.slice(0, targetCount);
      continue;
    }

    const m = themedWords.length;
    const neededFreq = targetCount - m;
    const selectedFreq = freqWords.slice(0, neededFreq);

    // Interleave m themed words evenly across targetCount positions
    // Positions: floor((i + 0.5) * targetCount / m)
    const themedIndices = new Set<number>();
    for (let i = 0; i < m; i++) {
      const pos = Math.floor(((i + 0.5) * targetCount) / m);
      themedIndices.add(pos);
    }

    const tierResult: string[] = [];
    let tIdx = 0;
    let fIdx = 0;

    for (let pos = 0; pos < targetCount; pos++) {
      if (themedIndices.has(pos)) {
        tierResult.push(themedWords[tIdx++]!);
      } else {
        tierResult.push(selectedFreq[fIdx++]!);
      }
    }

    finalTiers[tier] = tierResult;
  }

  return finalTiers;
}

/**
 * Builds the REVIEW.md content formatted in 6 columns per tier plus first-letter coverage table.
 */
export function generateReviewMarkdown(tiers: WordTiers): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const tierKeys = [3, 4, 5, 6, 7, 8];

  const lines: string[] = [
    '# Word Content Human Review',
    '',
    '> **Notice**: This word content has passed automated pipeline filtering and is **ready for human review**.',
    '> Skim each tier below for awkward tokens, obscurities, or unwanted jargon, and add rejects to `exclude.txt` or `blocklist.txt`.',
    '',
    '## First-Letter Coverage Table',
    '',
    '| Letter | Tier 3 | Tier 4 | Tier 5 | Tier 6 | Tier 7 | Tier 8 | Total |',
    '| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |',
  ];

  const letterCountsByTier: Record<number, Record<string, number>> = {};
  for (const t of tierKeys) {
    letterCountsByTier[t] = {};
    for (const char of letters) {
      letterCountsByTier[t]![char] = 0;
    }
    for (const w of tiers[t] ?? []) {
      const first = w[0];
      if (first && letterCountsByTier[t]![first] !== undefined) {
        letterCountsByTier[t]![first]++;
      }
    }
  }

  for (const char of letters) {
    let rowTotal = 0;
    const tierCols = tierKeys.map((t) => {
      const c = letterCountsByTier[t]?.[char] ?? 0;
      rowTotal += c;
      return `${c}`;
    });
    lines.push(`| \`${char}\` | ${tierCols.join(' | ')} | ${rowTotal} |`);
  }

  // Total words and distinct first letters
  const totalWordsRow = tierKeys.map((t) => (tiers[t] ?? []).length);
  const distinctLettersRow = tierKeys.map((t) => {
    let count = 0;
    for (const char of letters) {
      if ((letterCountsByTier[t]?.[char] ?? 0) > 0) count++;
    }
    return count;
  });

  lines.push(
    `| **Total Words** | ${totalWordsRow.join(' | ')} | ${totalWordsRow.reduce((a, b) => a + b, 0)} |`
  );
  lines.push(
    `| **Distinct Letters (>=12)** | ${distinctLettersRow.join(' | ')} | - |`
  );
  lines.push('');

  // Tables of words per tier (6 columns)
  const COL_COUNT = 6;
  for (const t of tierKeys) {
    const words = tiers[t] ?? [];
    lines.push(`## Tier ${t} Words (${words.length} words, length ${t})`);
    lines.push('');

    const headers = Array.from({ length: COL_COUNT }, (_, i) => `Col ${i + 1}`);
    const separators = Array.from({ length: COL_COUNT }, () => ':---');
    lines.push(`| ${headers.join(' | ')} |`);
    lines.push(`| ${separators.join(' | ')} |`);

    for (let r = 0; r < words.length; r += COL_COUNT) {
      const rowWords = words.slice(r, r + COL_COUNT);
      while (rowWords.length < COL_COUNT) {
        rowWords.push('');
      }
      lines.push(`| ${rowWords.join(' | ')} |`);
    }
    lines.push('');
  }

  return lines.join('\n') + '\n';
}

/**
 * Builds the docs/word-sources.md content with updated tier counts.
 */
export function generateWordSourcesMarkdown(tiers: WordTiers): string {
  const tierKeys = [3, 4, 5, 6, 7, 8];
  const tierLines = tierKeys.map((t) => {
    const count = (tiers[t] ?? []).length;
    return `- **Tier ${t} (length ${t})**: ${count} words`;
  });

  return `# Word Sources Documentation

This document records the provenance, licensing, and metadata for all word content used in the typing shooter simulation, per technical specification Step 5.A and 5.B.

## 1. Frequency-Ranked English Corpus Source

- **Repository**: [first20hours/google-10000-english](https://github.com/first20hours/google-10000-english)
- **Source File**: \`google-10000-english-no-swears.txt\`
- **Source URL**: \`https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt\`
- **Retrieval Date**: 2026-10-05
- **License**: UNVERIFIED
  *(Note: The source repository lacks a formal LICENSE file or SPDX license declaration. Community indexes cite potential GPL-3.0 or Public Domain derivation from Google's N-Gram Trillion Word Corpus. Per Agent Rule R5, the license is recorded strictly as UNVERIFIED).*
- **Local Committed Path**: \`data/words-source/frequency-source.txt\`

## 2. Themed Tactical Words

- **Source**: Original tactical sci-fi vocabulary (space combat, telemetry, physics, naval/avionics maneuvers, defense systems).
- **Format**: Lowercase ASCII, length 3–8 characters, strictly no proper nouns.
- **Count**: $\\ge 120$ original words (320 candidate words authored).
- **Local Committed Path**: \`data/words-source/themed-tactical.txt\`

## 3. Filtering & Exclusions

- **Exclude List**: \`data/words-source/exclude.txt\` — web protocols (\`http\`, \`ftp\`), file extensions (\`pdf\`, \`png\`, \`zip\`), tech abbreviations (\`cpu\`, \`ram\`, \`dns\`), calendar tokens (\`jan\`, \`wed\`), and proper tech brands.
- **Blocklist**: \`data/words-source/blocklist.txt\` — profanities, derogatory slurs, and explicit terms seeded by agent for human review.

## 4. Tier Counts (Generated by Build Script)

${tierLines.join('\n')}

## 5. Review Log

- **Review Date**: 2026-10-05
- **Status**: Ready for human review (Automated pipeline filtering + curated rejection pass of web tokens, abbreviations, proper nouns, and profanities applied).
`;
}

export function main(): void {
  const root = process.cwd();
  const freqPath = path.join(root, 'data', 'words-source', 'frequency-source.txt');
  const themedPath = path.join(root, 'data', 'words-source', 'themed-tactical.txt');
  const excludePath = path.join(root, 'data', 'words-source', 'exclude.txt');
  const blocklistPath = path.join(root, 'data', 'words-source', 'blocklist.txt');

  if (!fs.existsSync(freqPath)) {
    throw new Error(`Frequency source not found at: ${freqPath}`);
  }

  const readLines = (filePath: string): string[] => {
    if (!fs.existsSync(filePath)) return [];
    return fs
      .readFileSync(filePath, 'utf-8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  };

  const freqWords = readLines(freqPath);
  const themedWords = readLines(themedPath);
  const excludeWords = readLines(excludePath);
  const blocklistWords = readLines(blocklistPath);

  const tiers = buildWordTiers(
    freqWords,
    themedWords,
    excludeWords,
    blocklistWords,
    { maxPerTier: 600 }
  );

  // Emit src/game/core/data/words/tier-3.json ... tier-8.json
  const targetDir = path.join(root, 'src', 'game', 'core', 'data', 'words');
  fs.mkdirSync(targetDir, { recursive: true });

  for (let tier = 3; tier <= 8; tier++) {
    const filePath = path.join(targetDir, `tier-${tier}.json`);
    const jsonStr = JSON.stringify(tiers[tier] ?? [], null, 2) + '\n';
    fs.writeFileSync(filePath, jsonStr, { encoding: 'utf-8' });
  }

  // Emit docs/word-sources.md
  const docsPath = path.join(root, 'docs', 'word-sources.md');
  fs.writeFileSync(docsPath, generateWordSourcesMarkdown(tiers), { encoding: 'utf-8' });

  // Emit data/words-source/REVIEW.md
  const reviewPath = path.join(root, 'data', 'words-source', 'REVIEW.md');
  fs.writeFileSync(reviewPath, generateReviewMarkdown(tiers), { encoding: 'utf-8' });

  console.log('Word content pipeline completed successfully:');
  for (let t = 3; t <= 8; t++) {
    console.log(`  Tier ${t}: ${(tiers[t] ?? []).length} words emitted to tier-${t}.json`);
  }
}

if (
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('scripts/build-words.ts')
) {
  main();
}
