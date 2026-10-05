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