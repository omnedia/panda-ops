# 🐼 PandaOps — AI-Powered Pull Request Reviewer

**PandaOps** is a TypeScript-based CLI tool that automatically analyzes Pull Requests using heuristics and AI (via
OpenAI models). It fetches PR diffs, runs intelligent reviews, and posts actionable feedback directly to GitHub,
Bitbucket, or Azure DevOps.

---

## 🚀 Features

- **Multi-platform support** — Works with GitHub, Bitbucket, and Azure DevOps.
- **AI-driven code reviews** — Uses OpenAI models (default: `gpt-5-mini`) to produce clear, concise feedback.
- **Heuristic scanning** — Detects common issues like TODOs, `console.log`, `debugger`, or large diffs.
- **Inline and summary comments** — Posts detailed code-level feedback directly to PRs.
- **Dry-run & JSON output modes** — Preview or integrate with other tools.
- **Configurable behavior** — Focus AI on errors, warnings, tips, notes, or grammar.
- **Fail-on flags** — Enforce stricter CI/CD pipelines with `--fail-on-comments` or `--fail-on-warnings`.

---

## 🧩 Installation

```bash
npm install -g @omnedia/panda-ops
```

Or use locally:

```bash
npm install @omnedia/panda-ops --save-dev
```

Build from source:

```bash
git clone https://github.com/omnedia/panda-ops.git
cd panda-ops
npm install
npm run build
```

---

## ⚙️ Usage

### CLI Example

```bash
panda-ops \
  --provider github \
  --repository owner/repo \
  --pull-request-id 123 \
  --token $GITHUB_TOKEN \
  --openai-api-key $OPENAI_API_KEY
```

---

### 🧠 GitHub Actions Integration

You can run PandaOps automatically on pull requests using GitHub Actions.

#### Add this workflow to `.github/workflows/panda-ops.yml`:

```yaml
name: AI PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - uses: omnedia/panda-ops@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          fail_on_warnings: true
```

#### Full input list (for customization):

| Input                | Description                                   | Default                                   |
| -------------------- | --------------------------------------------- | ----------------------------------------- |
| `github_token`       | GitHub token (required)                       | —                                         |
| `openai_api_key`     | OpenAI API key (required)                     | —                                         |
| `provider`           | VCS provider (`github`, `bitbucket`, `azure`) | `github`                                  |
| `repository`         | Repository identifier (`owner/name`)          | `${{ github.repository }}`                |
| `pull_request_id`    | PR number                                     | `${{ github.event.pull_request.number }}` |
| `dry_run`            | Log output only, no posting                   | `false`                                   |
| `output_json`        | Output machine-readable JSON                  | `false`                                   |
| `fail_on_comments`   | Exit with code 2 if comments found            | `false`                                   |
| `fail_on_warnings`   | Request changes if warnings found             | `false`                                   |
| `ai_enabled`         | Enable AI processing                          | `true`                                    |
| `max_comments`       | Max number of comments                        | `50`                                      |
| `openai_model`       | Model name                                    | `gpt-5-mini`                              |
| `openai_temperature` | Sampling temperature                          | `1`                                       |
| `openai_max_tokens`  | Max tokens per completion                     | `1500`                                    |
| `ai_focus_errors`    | Detect critical/breaking issues               | `true`                                    |
| `ai_focus_warn`      | Detect risky logic                            | `true`                                    |
| `ai_focus_tips`      | Suggest maintainability improvements          | `true`                                    |
| `ai_focus_notes`     | Add design/architecture notes                 | `false`                                   |
| `ai_focus_grammar`   | Grammar/naming checks                         | `false`                                   |

---

### Other CLI Options

| Option                   | Description                            |
| ------------------------ | -------------------------------------- |
| `--dry-run`              | Console-only output.                   |
| `--output-json`          | Emit JSON report.                      |
| `--fail-on-comments`     | Exit code 2 if comments found.         |
| `--fail-on-warnings`     | Mark PR as _Changes Requested_.        |
| `--openai-model <model>` | Specify model (default: `gpt-5-mini`). |
| `--max-comments <n>`     | Limit total AI + heuristic comments.   |

---

## 🧱 Project Structure

```
src/
├── main.ts              # CLI entrypoint
├── config.ts            # Configuration and schema validation
├── core/
│   ├── reviewEngine.ts  # AI + heuristic analysis logic
│   ├── diffFetcher.ts   # Unified diff retrieval
│   ├── commentPoster.ts # Review posting logic
│   └── logger.ts        # Pino-based logging
├── adapters/
│   ├── github.ts        # GitHub API integration
│   ├── bitbucket.ts     # Bitbucket API integration
│   └── azure.ts         # Azure DevOps API integration
```

---

## 🛠 Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

---

## 🔒 Permissions

PandaOps requires read access to PR diffs and write access to post review comments.

For GitHub, recommended scopes:

- `repo`
- `pull_requests`

---

## 🧭 Exit Codes

| Code | Meaning                               |
| ---- | ------------------------------------- |
| `0`  | Success / Approved                    |
| `1`  | Configuration or execution error      |
| `2`  | Comments found (`--fail-on-comments`) |

---

## 🪄 Example Output

```
[PandaOps] --- DRY RUN ---
Comments: 5 (Heuristic 2 + AI 3)

- src/app.ts:24 [ERROR] Missing null check for user input.
- src/utils/db.ts:10 [WARN] Missing transaction rollback on error.
- src/routes/api.ts:3 [TIP] Avoid using console.log in production.

✅ Summary: 5 issues detected — review before merging.
```

---

## 📜 License

MIT © 2025 Omnedia

---

## 🤝 Contributing

Pull requests and suggestions are welcome!

- Fork the repo
- Create a feature branch (`git checkout -b feature-name`)
- Commit changes and open a PR

---

> _Automate code reviews. Catch bugs before they merge. Let the Panda do the work._ 🐼
