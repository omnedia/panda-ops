# VCS Adapter Guidelines

Provider-specific behavior belongs in `src/adapters/*`.

The shared provider contract is `VCSAdapter` in `src/config.ts`:

- `getDiff()` is required.
- `postComment()` is required.
- `postInlineComment()` is optional.
- `setReviewStatus()` is optional.
- `getPullRequestMetadata()` is optional.

Rules:

- Keep provider API details out of core review logic.
- Use optional adapter methods for capability differences.
- Do not branch on provider names in core code unless adapter construction requires it.
- Inline comments should only be attempted when file and line are known.
- One failed inline comment should not prevent other comments from being attempted.
- Treat Bitbucket and Azure as placeholders until fully implemented.

Verification:

- Run `npm run build`.
- Run `npm run lint`.
