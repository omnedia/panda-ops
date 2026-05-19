# Configuration Guidelines

`src/config.ts` is the single config merge and validation boundary.

When adding or changing a user-facing option:

1. Update the relevant TypeScript type.
2. Update `ConfigSchema`.
3. Merge CLI and environment values in `loadConfig()`.
4. Add a Commander option in `src/main.ts` when CLI-facing.
5. Add an `action.yml` input and env mapping when GitHub Action-facing.
6. Update `README.md`.

Rules:

- Keep defaults stable unless intentionally changing behavior.
- Validate external inputs with Zod.
- Treat GitHub Action inputs as strings when they arrive from workflow metadata.
- Keep option names consistent:
  - CLI flags use kebab-case.
  - Action inputs use snake_case.
  - Environment variables use UPPER_SNAKE_CASE.

Verification:

- Run `npm run build`.
- Run `npm run lint`.
- Run `npm run prettier:check` if Markdown, YAML, or JSON changed.
