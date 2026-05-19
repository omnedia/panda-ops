# PandaOps System Context

PandaOps is a Node.js 20+ TypeScript CLI and composite GitHub Action for automated pull request review. It fetches a PR
diff from a VCS provider, runs deterministic heuristics and optional OpenAI structured analysis, then posts a summary and
inline comments back to the provider.

## Repository Structure

```text
src/
  main.ts                 CLI entrypoint, option parsing, config loading, provider dispatch
  config.ts               config types, Zod schema, env/CLI merge, review result types
  adapters/
    github.ts             implemented GitHub API adapter
    bitbucket.ts          placeholder adapter
    azure.ts              placeholder adapter
  core/
    diffFetcher.ts        calls the active adapter to fetch a unified diff
    reviewEngine.ts       heuristic checks plus OpenAI structured review
    commentPoster.ts      summary formatting, inline comment posting, review status logic
    logger.ts             Pino logger
.github/
  ai/                     layered AI instruction files
  guidelines/             focused technology and concern guidelines
  workflows/              CI and PandaOps workflow examples
action.yml                composite GitHub Action wrapper
README.md                 public usage documentation
package.json              package metadata, scripts, runtime/dependency declarations
```

## Stack

- TypeScript with ES modules
- Node.js `>=20.0.0`
- npm with `package-lock.json`
- Commander for CLI options
- Zod for runtime validation and AI response schemas
- Axios for provider API calls
- OpenAI SDK for AI review
- Pino for logging
- ESLint flat config and Prettier

## Current Boundaries

- GitHub is implemented.
- Bitbucket and Azure adapters are placeholders.
- There is no implemented YAML repo config loader.
- There is no implemented diff parser, risk scorer, repository context collector, incremental review store, or Mermaid
  diagram generator.
- Future pipeline concepts are valid product direction, but they must not be treated as existing code.

## Required Entrypoints

- CLI entrypoint: `src/main.ts`
- Config boundary: `src/config.ts`
- Review engine: `src/core/reviewEngine.ts`
- Review output/posting: `src/core/commentPoster.ts`
- VCS provider boundary: `src/adapters/*`
- GitHub Action metadata: `action.yml`
- Public docs: `README.md`

When a change touches one of these entrypoints, check whether the related entrypoints also need updates.
