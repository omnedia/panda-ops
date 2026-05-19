# TypeScript Guidelines

- Use ES modules.
- Include `.js` extensions in local imports so compiled ESM runs in Node.js.
- Prefer explicit domain types and Zod schemas at external boundaries.
- Avoid new `any` usage unless an external API response requires it; narrow values before using them.
- Keep filenames camelCase.
- Keep functions and variables camelCase.
- Keep classes PascalCase. Provider adapters should end with `Adapter`.
- Keep environment variables UPPER_SNAKE_CASE.
- Follow Prettier: single quotes, semicolons, 2 spaces, 120 character print width, trailing commas.
- Let Prettier sort imports according to `.prettierrc`.
- Do not introduce unrelated abstractions or broad file moves for localized changes.

Verification:

- Run `npm run build` for TypeScript changes.
- Run `npm run lint` for TypeScript changes.
