# Guideline Routing

Resolve guideline files before implementation. Match all relevant path patterns and concerns; multiple guideline files may
apply.

## Path And Technology Routes

| Paths                                              | Required Guidelines                                     |
| -------------------------------------------------- | ------------------------------------------------------- |
| `src/**/*.ts`                                      | `typescript.md`, `node-cli.md`                          |
| `src/main.ts`                                      | `typescript.md`, `node-cli.md`, `config.md`             |
| `src/config.ts`                                    | `typescript.md`, `config.md`, `security.md`             |
| `src/core/reviewEngine.ts`                         | `typescript.md`, `ai-review.md`, `security.md`          |
| `src/core/commentPoster.ts`                        | `typescript.md`, `ai-review.md`, `vcs-adapters.md`      |
| `src/core/logger.ts`                               | `typescript.md`, `security.md`                          |
| `src/adapters/**/*.ts`                             | `typescript.md`, `vcs-adapters.md`, `security.md`       |
| `action.yml`                                       | `github-action.md`, `config.md`, `docs.md`              |
| `.github/workflows/**/*.yml`                       | `github-action.md`, `testing-verification.md`           |
| `.github/**/*.md`                                  | `docs.md`, `testing-verification.md`                    |
| `README.md`                                        | `docs.md`, `github-action.md` when action usage changes |
| `package.json`, `package-lock.json`                | `node-cli.md`, `testing-verification.md`                |
| `.prettierrc`, `eslint.config.js`, `tsconfig.json` | `typescript.md`, `testing-verification.md`              |

## Concern Routes

| Concern                                          | Required Guidelines                        |
| ------------------------------------------------ | ------------------------------------------ |
| CLI flags, environment variables, defaults       | `config.md`, `node-cli.md`, `docs.md`      |
| GitHub Action inputs or env mapping              | `github-action.md`, `config.md`, `docs.md` |
| OpenAI prompts, schemas, model options, findings | `ai-review.md`, `security.md`              |
| Provider API calls, comments, review status      | `vcs-adapters.md`, `security.md`           |
| Logging, credentials, external inputs            | `security.md`                              |
| Build, lint, formatting, CI                      | `testing-verification.md`                  |

When in doubt, include the stricter or more specific guideline.
