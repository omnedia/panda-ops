# PandaOps AI Instructions Loader

This file is the root loader for AI coding agents working in this repository.

Before implementing any change, load and apply these files in order:

1. `.github/ai/system.md`
2. `.github/ai/behavior.md`
3. `.github/ai/routing.md`
4. `.github/ai/stack-map.md`
5. The focused guideline files selected by `.github/ai/routing.md` and `.github/ai/routing.yaml`

Guideline resolution is mandatory. Do not start implementation until the relevant guideline files for the touched paths
and technologies have been identified.

If instructions conflict, use this precedence:

1. Direct user request for the current task
2. `.github/ai/behavior.md`
3. `.github/ai/system.md`
4. Focused files in `.github/guidelines/`
5. `.github/ai/routing.md` and `.github/ai/stack-map.md`
6. Existing local code patterns

Default engineering posture:

- Prefer small, localized changes.
- Reuse existing project patterns before introducing new abstractions.
- Keep user-facing CLI, GitHub Action, config, and README changes synchronized.
- Verify with the required commands for the change type.
- Mark planned behavior as planned. Do not document placeholders as implemented.
