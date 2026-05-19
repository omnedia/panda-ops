# Node CLI Guidelines

- Keep `src/main.ts` as the CLI entrypoint.
- Use Commander for CLI flags.
- Load environment variables through `dotenv.config()`.
- Keep command defaults aligned with `loadConfig()` defaults.
- Preserve exit code semantics:
  - `0`: success
  - `1`: configuration or execution error
  - `2`: comments found with `--fail-on-comments`
- Keep `package.json` `bin`, `main`, and scripts consistent with compiled output.
- Do not add a runtime dependency unless it removes real complexity or is required for the requested feature.

Verification:

- Run `npm run build` after CLI or package metadata changes.
- Run `npm run lint` after CLI TypeScript changes.
