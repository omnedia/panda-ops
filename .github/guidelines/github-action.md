# GitHub Action Guidelines

`action.yml` defines a composite action that installs and runs PandaOps.

- Keep input names snake_case.
- Map action inputs to environment variables consumed by `loadConfig()`.
- Keep required secrets explicit.
- Keep Node.js version aligned with `package.json` engines.
- Update README action examples when inputs, defaults, or required permissions change.
- Avoid logging secrets in workflow steps.
- Be careful with empty optional inputs; GitHub Actions passes them as strings.

Verification:

- Run `npm run prettier:check` after YAML changes.
- Run `npm run build` if the action change depends on TypeScript behavior.
