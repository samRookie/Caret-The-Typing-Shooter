AGENT RULES — apply to every step.

R1  INSPECT FIRST. Before changing anything, read the relevant existing files. For every issue you are told about, confirm it exists and cite file:line. If it does not exist, report "not applicable" with evidence and change nothing.
R2  SMALLEST COHERENT CHANGE. Do not rewrite or reformat working files. A broad refactor needs a written explanation and my approval first.
R3  ONE STEP ONLY. Do not start, scaffold, or "prepare" later steps. Stop after the report.
R4  CORE PURITY. Code under src/game/core and src/shared/domain must not import phaser, react, react-dom, or anything under src/ui, src/game/scenes, src/game/rendering, src/game/input. It must not touch window/document/navigator/localStorage, and must not call Math.random, Date.now, performance.now, or construct Date objects. Enforced by lint AND by src/tests/architecture.test.ts.
R5  EVIDENCE. Paste the raw output of every command you claim to have run (test, lint, build, type-check, e2e). "Should pass" is not a result. If you could not run something, write UNVERIFIED and say why. Never write PASS without evidence. Never write "verified" about a license.
R6  NEVER WEAKEN CHECKS. Do not delete, skip, loosen, or rewrite a failing test or lint rule to make it pass. If a test is wrong, explain why in the report and wait for approval.
R7  NO SILENT PLACEHOLDERS. Any stub or temporary logic carries a marker: TODO(step-N) or TODO(phase2) with a one-line reason.
R8  DEPENDENCIES. Do not add a package without listing in the report: name, version, why it is needed, license as listed in its package.json, and the alternative you rejected. Prefer no new dependency.
R9  NO MAGIC NUMBERS. Gameplay and layout values live in src/shared/config. No hard-coded speeds, timings, positions, or colors inside simulation or scene code.
R10 NO FAKE DATA IN PRODUCTION. Mock telemetry, preview switchboards, and demo content must be unreachable in a production build (verify by searching dist/).
R11 ORIGINALITY. No code, assets, music, names, or artwork copied from ZType or any other game. Third-party assets are listed in CREDITS.md with the license text stored in the repo.
R12 ENVIRONMENT. The machine runs Windows PowerShell. Use PowerShell-compatible commands (Select-String, Get-ChildItem), not grep/ls/cat.
R13 GIT. One commit per numbered sub-section of the step, message format "step-N: <imperative summary>". Make the commit before starting the next sub-section.
R14 SCOPE REPORTING. List every file you created, changed, or deleted. If you touched a file outside the step's stated scope, explain why.
R15 AMBIGUITY. If an instruction is ambiguous or two instructions conflict, stop and ask. Do not guess silently.
R16 TWO STRIKES. If the same failure persists after two fix attempts, stop and report the evidence instead of trying more variations.
R17 DATA-DRIVEN BEHAVIOR. New enemy types, abilities, packs and modes are validated data plus registry entries. No `if (type === "...")` chains in the simulation loop. Registry lookups fail loudly in tests and fall back safely at runtime.
R18 RNG DISCIPLINE. Every random draw uses a named seeded stream (spawnRng, wordRng). A change to the number or order of draws changes every golden hash and every stored replay: say so in the report, update the golden in its own commit, and explain it. When a spawn has only one possible choice, make NO draw (this keeps older goldens valid).
R19 COMMANDS. Everything the player can do that affects the simulation is a member of GameCommand, is applied through handleCommand at a tick, appears in runtime.commandLog, and has a replay test.
R20 FIXTURES. Every new gameplay feature ships with a named fixture (DEV only, absent from dist/) and an e2e spec that uses it.
R21 CANONICAL STATE. State hashing and replay comparison use canonical serialization (sorted keys, no undefined, no -0, one number formatter). Never hash raw JSON.stringify output.
R22 PERSISTENCE. New stored fields are additive with per-field defaults. Changing or removing the meaning of a stored field needs a version bump, a migration function, and a test using a stored old-version fixture.
R23 DOCUMENT TRUTH. Every file path or symbol named in README.md, docs/ARCHITECTURE.md, docs/simulation.md, docs/effects.md, or any report must exist in the repository. `npm run docs:check` (Step 1) enforces this and is part of `npm run verify`. Never describe a feature you did not see in the code or the running game; mark anything unobserved UNVERIFIED.
R24 VERIFY GATE. `npm run verify` (lint + tests + build + leftover audit + docs check) must pass and its raw output must be pasted in every report. A report without it is incomplete.