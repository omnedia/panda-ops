# Stack Map

| Area               | Paths                                              | Primary Technologies               | Notes                                                                        |
| ------------------ | -------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| CLI orchestration  | `src/main.ts`                                      | TypeScript, Commander, dotenv      | Parses options, loads config, dispatches providers, controls exit behavior   |
| Configuration      | `src/config.ts`                                    | TypeScript, Zod                    | Defines runtime config, review types, provider interface, AI response schema |
| Review engine      | `src/core/reviewEngine.ts`                         | TypeScript, OpenAI SDK, Zod        | Runs heuristics and structured AI review                                     |
| Review output      | `src/core/commentPoster.ts`                        | TypeScript                         | Formats summaries, posts inline comments, maps review status                 |
| Diff retrieval     | `src/core/diffFetcher.ts`                          | TypeScript                         | Calls `VCSAdapter.getDiff()`                                                 |
| Logging            | `src/core/logger.ts`                               | Pino                               | Central logging setup                                                        |
| GitHub adapter     | `src/adapters/github.ts`                           | TypeScript, Axios, GitHub REST API | Implemented provider                                                         |
| Bitbucket adapter  | `src/adapters/bitbucket.ts`                        | TypeScript                         | Placeholder                                                                  |
| Azure adapter      | `src/adapters/azure.ts`                            | TypeScript                         | Placeholder                                                                  |
| GitHub Action      | `action.yml`                                       | Composite action, npm, Node.js 20  | Maps action inputs to environment variables and runs `npx panda-ops`         |
| CI workflows       | `.github/workflows/*.yml`                          | GitHub Actions                     | Lint, format, and example PandaOps review workflows                          |
| Package metadata   | `package.json`, `package-lock.json`                | npm                                | Scripts, dependencies, bin entry                                             |
| Formatting/linting | `.prettierrc`, `eslint.config.js`, `tsconfig.json` | Prettier, ESLint, TypeScript       | Project standards                                                            |
| Documentation      | `README.md`, `.github/**/*.md`                     | Markdown                           | Public usage docs and AI instructions                                        |
