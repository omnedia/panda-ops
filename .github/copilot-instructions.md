# PandaOps - GitHub Copilot Instructions

## Project Overview
PandaOps is an AI-powered Pull Request reviewer that behaves like a strong first-pass senior reviewer. It reads a PR, understands the changed code in repository context, produces a clear summary, walkthrough, and architecture diagram, then posts high-signal inline review comments only when there is a concrete, actionable issue.

It's a TypeScript-based CLI tool and GitHub Action that uses OpenAI models with a structured review pipeline to generate intelligent, context-aware code reviews and posts them directly to GitHub, Bitbucket, or Azure DevOps.

### Design Philosophy
The system is **not** a single "ask the LLM to review this PR" step. It's a **structured pipeline** with distinct phases for quality, scale, and noise control. The reviewer should:
- **Summarize first, then inspect deeply**
- **Prefer concrete bugs over opinions**
- **Explain runtime impact**
- **Post only high-confidence inline comments**
- **Stay quiet when there is no meaningful issue**
- **Degrade gracefully on huge PRs**
- **Be deterministic and configurable**

### Final Product Goals
The final system produces:
- ✅ **TL;DR summary** of the PR
- ✅ **Walkthrough** of the main changes grouped by theme/subsystem
- ✅ **Architectural/data-flow diagram** (Mermaid) showing affected components
- ✅ **Ranked inline review comments** on exact changed lines
- ✅ **Optional small fix suggestions** (code snippets)
- ✅ **Incremental re-review** when new commits are pushed
- ✅ **YAML-driven customization** for coding guidelines, scope, thresholds, and workflow behavior

The target outcome is a PR review bot that:
- Catches meaningful bugs
- Explains what changed
- Reduces reviewer load
- Scales well to very large diffs without becoming noisy or useless

## Tech Stack
- **Language**: TypeScript (ES Modules)
- **Runtime**: Node.js >= 20.0.0
- **Key Dependencies**:
  - `openai` (v6.6.0) - OpenAI API integration
  - `axios` - HTTP requests for VCS APIs
  - `commander` - CLI argument parsing
  - `zod` - Schema validation and structured outputs
  - `pino` / `pino-pretty` - Structured logging
  - `dotenv` - Environment variable management
  - `js-yaml` - YAML configuration parsing
  - `simple-git` - Repository context retrieval
  - *(Planned)* Mermaid generation for architecture diagrams

## Architecture

### Project Structure
```
src/
├── main.ts              # CLI entrypoint, command parsing, orchestration
├── config.ts            # Zod schemas, type definitions, configuration loading
├── core/
│   ├── reviewEngine.ts  # AI + heuristic analysis engine
│   ├── diffFetcher.ts   # Unified diff retrieval logic
│   ├── diffParser.ts    # Diff parsing and hunk extraction
│   ├── commentPoster.ts # Review posting and formatting
│   ├── logger.ts        # Pino logger configuration
│   ├── riskScorer.ts    # File and hunk risk scoring
│   ├── repoContext.ts   # Repository context retrieval
│   ├── summarizer.ts    # PR summary and walkthrough generation
│   ├── architectureDiagram.ts # Mermaid diagram generation
│   ├── incrementalReview.ts   # Incremental review reconciliation
│   ├── findingValidator.ts    # Comment validation and deduplication
│   └── largePRHandler.ts      # Large PR clustering and hotspot detection
├── adapters/
│   ├── github.ts        # GitHub API adapter
│   ├── bitbucket.ts     # Bitbucket API adapter
│   └── azure.ts         # Azure DevOps API adapter
├── types/
│   ├── review.ts        # Review-related type definitions
│   ├── diff.ts          # Diff-related type definitions
│   └── config.ts        # Configuration type definitions
└── utils/
    ├── yamlConfig.ts    # YAML configuration loader
    └── tokenBudget.ts   # Token budget management
```

### Key Patterns
- **Adapter Pattern**: VCS providers implement a common `VCSAdapter` interface
- **Pipeline Pattern**: Review process is a multi-stage pipeline with clear separation of concerns
- **Strategy Pattern**: Large PR handling switches between detailed and hotspot-focused strategies
- **Schema Validation**: All configuration uses Zod schemas for type safety
- **Structured Logging**: Use Pino logger (`log.info`, `log.error`, `log.debug`)
- **ES Modules**: All imports must include `.js` extension
- **Token Budget Management**: Enforce limits on API usage for cost control
- **Incremental Processing**: Support for reviewing only changed parts on PR updates

## Code Style & Conventions

### TypeScript
- Use ES modules syntax (`import/export`)
- Always include `.js` extension in imports (TypeScript requirement for ES modules)
- Prefer explicit types over `any`
- Use Zod schemas for runtime validation
- Use interfaces for configuration objects

### Naming
- File names: camelCase for source files (e.g., `reviewEngine.ts`)
- Exported functions: camelCase (e.g., `runReview`, `fetchDiff`)
- Classes: PascalCase with "Adapter" suffix (e.g., `GitHubAdapter`)
- Constants: UPPER_SNAKE_CASE for environment variables

### Error Handling
- Use try-catch blocks for async operations
- Log errors with `log.error()`
- Provide meaningful error messages
- Exit with appropriate codes: 0 (success), 1 (error), 2 (fail-on-comments)

### Logging
- Use `log` from `./core/logger.js`
- Prefix messages with `[PandaOps]` for user-facing logs
- Use appropriate log levels: `debug`, `info`, `warn`, `error`

## Domain Concepts

### Review Workflow
The system follows a **structured pipeline** (not a single LLM call):

1. **Config Loading**: Parse CLI args/env vars, load YAML config, validate with Zod
2. **Adapter Creation**: Instantiate appropriate VCS adapter
3. **Diff Fetching**: Retrieve PR diff, metadata, and commit history
4. **Diff Parsing**: Extract hunks, changed lines, file paths
5. **Repository Context**: Fetch related files, dependencies, test coverage info
6. **File Classification**: Categorize files by type, risk, and subsystem
7. **Risk Scoring**: Assign risk scores to files and hunks based on complexity, size, test coverage
8. **PR Planning**: Determine review strategy (detailed vs. hotspot-focused) based on PR size
9. **Summary Generation**: Create TL;DR, walkthrough, key risks, test impact
10. **Architecture Extraction**: Generate Mermaid diagram of affected components and data flow
11. **Line Review Passes**: 
    - Run heuristic checks (TODOs, console.log, debugger, etc.)
    - Run AI analysis using OpenAI on high-risk areas (if enabled)
12. **Finding Validation**: Validate findings for accuracy and actionability
13. **Deduplication**: Remove duplicate or redundant comments
14. **Ranking**: Sort comments by severity and confidence
15. **Comment Posting**: Format and post comments via adapter
16. **Incremental Reconciliation**: Track reviewed state for future updates

### Configuration
- **AppConfig**: VCS provider, repository, PR ID, auth token, API base URL
- **AIConfig**: OpenAI settings (model, temperature, enabled flag, max comments)
- **AIBehaviorConfig**: Focus flags (errors, warnings, tips, notes, grammar)
- **YAMLConfig**: Repository-level configuration (`.panda-ops.yml`):
  - `ignoredPaths`: Files/directories to skip during review
  - `highRiskPaths`: Paths that require extra scrutiny
  - `summaryOptions`: Control summary generation behavior
  - `reviewStrictness`: Adjust threshold for posting comments
  - `commentThresholds`: Min confidence levels for different severity types
  - `focusCategories`: Which finding types to prioritize
  - `largePRStrategy`: How to handle large diffs (hotspot vs. detailed)
  - `languageRules`: Language/framework-specific review guidelines
  - `customRules`: Project-specific heuristics and patterns to check

### Review Comments
- **Source**: `'heuristic'` or `'ai'`
- **Severity**: `'ERROR'`, `'WARN'`, `'TIP'`, `'NOTE'`
- **Message**: Human-readable feedback
- **Optional fields**: 
  - `file`: Path to the affected file
  - `line`: Exact line number in the diff
  - `suggestion`: Proposed code fix
  - `confidence`: Score indicating certainty (0-1)
  - `category`: Type of issue (e.g., 'security', 'performance', 'correctness')
  - `impact`: Expected runtime impact explanation

### Heuristic Rules
Built-in checks for:
- TODO/FIXME comments
- console.log statements
- debugger statements
- TypeScript `any` usage
- Large diffs (>500 added lines)

### Finding Categories (Prioritized)
High-value findings that should be surfaced:
- **Correctness issues**: Logic bugs, null pointer risks, type mismatches
- **Security issues**: SQL injection, XSS, insecure authentication, exposed secrets
- **Performance regressions**: N+1 queries, inefficient algorithms, memory leaks
- **Concurrency problems**: Race conditions, deadlocks, missing synchronization
- **API contract risks**: Breaking changes, missing validation, incompatible types
- **Missing test coverage**: Risky logic without tests

Low-value findings that should be suppressed:
- Style noise (formatting, whitespace)
- Weak speculation without concrete evidence
- Duplicate or redundant comments
- Subjective opinions without clear benefit

### Large PR Handling Strategy
The system must adapt its review approach based on PR size:

**Small/Medium PRs (< 500 lines changed)**:
- Perform detailed line-by-line review
- Generate comprehensive inline comments
- Full AI analysis on all changed code

**Large PRs (500-2000 lines changed)**:
- Cluster changes by subsystem/module
- Summarize each cluster
- Focus AI analysis on high-risk files
- Batch low-risk mechanical changes

**Huge PRs (> 2000 lines changed)**:
- Generate high-level summary only
- Identify top 10-20% hotspots by risk score
- Deep review only critical/high-risk areas
- Provide coverage notes for unreviewed sections
- Enforce strict token budget limits
- Recommend splitting the PR if possible

**Risk Scoring Factors**:
- File complexity (cyclomatic complexity, nesting depth)
- Change size (lines added/deleted)
- File type (core logic vs. config/generated)
- Test coverage (existing tests, tests in PR)
- Historical bug frequency
- Security-sensitive paths
- API/contract changes

## AI Integration

### OpenAI Usage
- Default model: `gpt-5-mini`
- Uses structured output with Zod schema (`ReviewResponseSchema`)
- Focus flags control what AI should look for:
  - `focusErrors`: Critical/breaking issues
  - `focusWarn`: Risky or unstable logic
  - `focusTips`: Readability/maintainability
  - `focusNotes`: Architectural suggestions
  - `focusGrammar`: Naming/spelling consistency

### Prompt Engineering
- System prompt includes focus flags and instructions
- Diff is provided with line numbers
- AI returns structured JSON with comments array

### PR Summary Generation
The AI generates a comprehensive summary including:
- **TL;DR**: One-sentence description of the PR's purpose
- **Walkthrough**: Grouped explanations of major changes by subsystem/theme
- **Key Risks**: Highlighted areas that need careful review
- **Test Impact**: Changes to tests, coverage gaps, integration concerns
- **Dependencies**: New dependencies or version updates introduced

### Architecture Diagram Generation
The system extracts structural information and generates a Mermaid diagram showing:
- **Affected Components**: Modules, services, classes changed by the PR
- **Data Flow**: How data moves through the changed components
- **Control Flow**: Key interactions and dependencies
- **New Dependencies**: External libraries or internal modules newly referenced
- **Changed Interfaces**: API contracts or public interfaces modified

The diagram should be compact, focused on the PR scope, and avoid showing the entire codebase.

## VCS Adapters

### Common Interface (VCSAdapter)
```typescript
interface VCSAdapter {
  fetchDiff(): Promise<string>;
  postComment(body: string, event?: string): Promise<void>;
}
```

### Supported Providers
- **GitHub**: Uses REST API v3, requires `repo` scope
- **Bitbucket**: Uses REST API 2.0
- **Azure DevOps**: Uses Azure DevOps REST API

## Testing & Development

### Build Commands
- `npm run build` - Compile TypeScript to `dist/`
- `npm run dev` - Run with ts-node
- `npm run start` - Execute compiled version

### Linting
- Uses ESLint with TypeScript parser
- Prettier for formatting
- Run `npm run lint` or `npm run lint:fix`

## GitHub Action Usage

### Key Inputs
- `github_token`: Required for posting comments
- `openai_api_key`: Required for AI analysis
- `provider`: VCS type (github/bitbucket/azure)
- `fail_on_warnings`: Request changes if warnings found
- `ai_focus_*`: Control AI behavior

### Environment Variables
Maps action inputs to environment variables consumed by CLI.

## Important Notes

### For Code Changes
- Always maintain ES module compatibility (`.js` imports)
- Update both CLI and GitHub Action when adding features
- Validate config changes with Zod schemas
- Test with multiple VCS providers if changing adapters

### For New Features
- Add CLI option in `main.ts` using Commander
- Add corresponding GitHub Action input in `action.yml`
- Update config schema in `config.ts`
- Document in README.md

### Performance Considerations
- Limit AI token usage (respect `maxComments`)
- Handle large diffs gracefully
- Use streaming/pagination for large PRs

### Security
- Never log API keys or tokens
- Sanitize diff content before sending to OpenAI
- Validate all external inputs with Zod

## Common Tasks

### Adding a New Heuristic Rule
Edit `src/core/reviewEngine.ts` in the `runHeuristic()` function.

### Adding a New VCS Provider
1. Create adapter in `src/adapters/`
2. Implement `VCSAdapter` interface
3. Add to `createAdapter()` in `src/main.ts`
4. Update `Provider` type in `src/config.ts`

### Modifying AI Behavior
Adjust system prompt in `src/core/reviewEngine.ts` `runAI()` function.

### Changing Output Format
Edit `src/core/commentPoster.ts` functions.

## Package Distribution
- Published as `@omnedia/panda-ops` on npm
- GitHub Action available as `omnedia/panda-ops@v1`
- License: MIT
- Author: Omnedia

