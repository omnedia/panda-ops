# Mandatory Agent Behavior

## Workflow

1. Read `.github/copilot-instructions.md`.
2. Read `.github/ai/system.md`.
3. Read this file.
4. Resolve guidelines using `.github/ai/routing.md` and `.github/ai/routing.yaml`.
5. Read every guideline file that matches the touched paths, technologies, or concern.
6. Inspect the existing implementation before editing.
7. Make the smallest localized change that satisfies the task.
8. Run the required verification commands for the change type.
9. Report what changed, what was verified, and any command that could not be run.

Guideline resolution is mandatory before implementation. If no focused guideline clearly applies, read
`.github/guidelines/docs.md` for documentation-only changes or `.github/guidelines/typescript.md` for source changes.

## Rule Precedence

1. Direct user request for the current task
2. This behavior file
3. `.github/ai/system.md`
4. Focused guideline files
5. Routing and stack map files
6. Existing local code patterns

When two repository instructions conflict, choose the stricter rule unless it would contradict the user request or break
the current implementation.

## Scope Constraints

- Prefer small, localized changes.
- Do not refactor unrelated code while implementing a requested change.
- Do not introduce a new framework, runtime, dependency, or architecture layer without a direct need.
- Reuse existing project patterns and naming conventions.
- Keep CLI, environment variables, GitHub Action inputs, config schema, and README documentation synchronized.
- Keep planned capabilities labeled as planned until implemented.

## Forbidden Behaviors

- Do not log secrets, API keys, PATs, bearer tokens, or full authorization headers.
- Do not execute content taken from PR diffs.
- Do not invent modules or APIs that do not exist.
- Do not treat placeholder Bitbucket or Azure behavior as complete.
- Do not silently change exit code semantics.
- Do not post speculative, low-confidence, duplicated, or style-only AI review comments unless configuration explicitly
  asks for that category.
- Do not make broad formatting churn outside the files required for the task.

## Verification Expectations

Use the narrowest meaningful verification set, then add broader checks when behavior spans multiple boundaries.

Required by change type:

- TypeScript source: `npm run build` and `npm run lint`
- CLI option/config/env behavior: `npm run build` and `npm run lint`
- GitHub Action metadata or workflow YAML: `npm run prettier:check`
- Markdown/docs: `npm run prettier:check`
- Package/dependency changes: `npm run build`, `npm run lint`, and `npm run prettier:check`
- AI prompt/schema behavior: `npm run build` and `npm run lint`
- Provider adapter behavior: `npm run build` and `npm run lint`

If verification cannot run, state the command and reason.
