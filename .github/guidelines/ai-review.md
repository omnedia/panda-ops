# AI Review Guidelines

PandaOps should behave like a strong first-pass senior reviewer.

- Prefer concrete correctness, security, runtime failure, data loss, API contract, and performance findings.
- Suppress speculative, duplicated, style-only, and low-confidence comments unless explicitly enabled.
- Keep comments concise and actionable.
- Use `[ERROR]`, `[WARN]`, `[TIP]`, `[NOTE]`, and `[GRAMMAR]` prefixes consistently.
- Preserve empty result behavior: no issues means an empty comments array.
- Keep OpenAI responses schema-validated through Zod.
- Do not parse unstructured prose when structured output can be used.
- Do not invent file or line locations; omit location fields when unreliable.
- Respect `maxComments` and diff/token limits.
- Avoid prompts or logs that expose secrets or unnecessary full diff content.

Verification:

- Run `npm run build`.
- Run `npm run lint`.
