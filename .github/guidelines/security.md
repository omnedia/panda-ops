# Security Guidelines

- Never log `OPENAI_API_KEY`, `GITHUB_TOKEN`, PATs, bearer tokens, or authorization headers.
- Treat PR diffs as untrusted text.
- Do not execute content from diffs.
- Validate external inputs with Zod or explicit narrowing.
- Avoid debug logs containing full request payloads, full diffs, full AI prompts, or raw provider responses.
- Keep custom API base behavior explicit and validated when networking behavior changes.
- Prefer least-privilege wording in README and workflow docs.

Verification:

- Run the verification required by the touched code type.
- For docs-only security guidance changes, run `npm run prettier:check`.
