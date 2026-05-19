# Testing And Verification Guidelines

Use the narrowest meaningful command set for the change, then broaden when a change crosses boundaries.

Required commands by change type:

| Change Type                      | Required Verification                                      |
| -------------------------------- | ---------------------------------------------------------- |
| TypeScript source                | `npm run build`, `npm run lint`                            |
| CLI option/config/env behavior   | `npm run build`, `npm run lint`                            |
| OpenAI prompt/schema behavior    | `npm run build`, `npm run lint`                            |
| Provider adapter behavior        | `npm run build`, `npm run lint`                            |
| GitHub Action metadata/workflows | `npm run prettier:check`                                   |
| Markdown/docs                    | `npm run prettier:check`                                   |
| Package/dependency changes       | `npm run build`, `npm run lint`, `npm run prettier:check`  |
| Formatting/lint configuration    | `npm run prettier:check`, plus affected build/lint command |

If a required command cannot be run, report:

- the exact command
- why it could not run
- what risk remains
