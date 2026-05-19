# Documentation Guidelines

- Keep README examples synchronized with `action.yml`, `package.json`, and CLI options.
- Document implemented behavior as implemented and planned behavior as planned.
- Prefer concrete command examples over vague descriptions.
- Use ASCII punctuation in new Markdown unless the surrounding section intentionally uses icons.
- Keep AI instruction files focused and routeable; do not duplicate large blocks across files.
- For internal instruction docs, state mandatory steps directly.

Verification:

- Run `npm run prettier:check` after Markdown changes.
