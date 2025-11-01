import {
  PandaOpsConfig,
  ReviewComment,
  ReviewResponseSchema,
  ReviewResult,
} from '../config.js';
import { log } from './logger.js';
import { OpenAI } from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

// ---------- Heuristic Rules ----------
function runHeuristic(diff: string): {
  comments: ReviewComment[];
  addedLines: number;
} {
  const lines = diff.split(/\r?\n/);
  const comments: ReviewComment[] = [];
  let addedLines = 0;

  for (const line of lines) {
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff '))
      continue;
    if (line.startsWith('+')) {
      addedLines++;
      const content = line.slice(1);

      if (/TODO/i.test(content)) {
        comments.push({
          message: 'Avoid TODOs in production code: ' + content.trim(),
          source: 'heuristic',
        });
      }
      if (/console\.log/.test(content)) {
        comments.push({
          message:
            'console.log found – remove or replace with a proper logger: ' +
            content.trim(),
          source: 'heuristic',
        });
      }
      if (/debugger;?/.test(content)) {
        comments.push({
          message: 'debugger statement found – remove before merge.',
          source: 'heuristic',
        });
      }

      if (/\bany\b/.test(content)) {
        comments.push({
          message: "TypeScript 'any' used — prefer explicit types.",
          source: 'heuristic',
        });
      }
    }
  }

  if (addedLines > 500) {
    comments.push({
      message: `Large diff with ${addedLines} added lines – consider splitting into smaller PRs.`,
      source: 'heuristic',
    });
  }

  return { comments, addedLines };
}

// ---------- AI Review ----------
async function runAI(diff: string, cfg: PandaOpsConfig): Promise<ReviewComment[]> {
  const {
    openaiApiKey,
    openaiModel,
    openaiTemperature,
    openaiMaxTokens,
    focusErrors = true,
    focusWarn = true,
    focusTips = true,
    focusNotes = false,
    focusGrammar = false,
  } = cfg;

  const openai = new OpenAI({ apiKey: openaiApiKey });

  const MAX_DIFF_CHARS = 60_000;
  const trimmedDiff =
    diff.length > MAX_DIFF_CHARS
      ? diff.slice(0, MAX_DIFF_CHARS) + '\n... [Diff truncated]'
      : diff;

  // --- Build behavior prompt ---
  const focusInstructions: string[] = [];
  if (focusErrors) {
    focusInstructions.push(
      '[ERROR] – Security vulnerabilities (injection, unsafe eval, unvalidated input), ' +
        'syntax errors, build/runtime breaking logic, incorrect conditions, or any code ' +
        'that will cause crashes or incorrect results.',
    );
  }

  if (focusWarn) {
    focusInstructions.push(
      '[WARN] – Potential problems that may not fail immediately: performance issues, ' +
        'concurrency risks, missing error handling, data leaks, weak validation, or bad UX implications.',
    );
  }

  if (focusTips) {
    focusInstructions.push(
      '[TIP] – Readability, maintainability, testability, or minor performance improvements.',
    );
  }

  if (focusNotes) {
    focusInstructions.push('[NOTE] – Broader architectural or design feedback.');
  }

  if (focusGrammar) {
    focusInstructions.push('[GRAMMAR] – Grammar, spelling, or naming consistency.');
  }

  const focusText = focusInstructions.length
    ? `Only check the code for these focus types:\n${focusInstructions.join(
        '\n',
      )}\nBe concise and practical.`
    : 'Focus only on clear, actionable code issues.';

  const systemPrompt = [
    'You are a **senior software engineer** conducting a professional pull-request review.',
    "You are analyzing a unified Git diff (with '@@ -a,b +c,d @@' hunk headers).",
    '',
    'Diff format reminder:',
    " - Lines starting with 'diff --git a/... b/...' or '---'/'+++' indicate file paths.",
    " - Lines starting with '+' are added code; '-' are removed code.",
    " - The hunk header '@@ -a,b +c,d @@' means the new code starts at line c in the target file.",
    '',
    'When writing comments:',
    " - Always include the **file path** from the most recent '+++ b/...' line, if available.",
    " - Extract the **approximate line number** from the most recent '@@ ... +c,d @@' header plus the number of '+' lines within that hunk.",
    ' - If the line cannot be determined, omit it (do not guess).',
    '',
    'Your goal: identify all **real, production-relevant issues** within the diff.',
    'Treat security, correctness, and logic problems as highest priority.',
    '',
    'Each comment must be **precise, standalone, and actionable**.',
    'Keep every comment short and focused — ideally one or two sentences.',
    'Use direct, reviewer-style phrasing (like real code review feedback).',
    'Prefer commands or short recommendations over long explanations.',
    "For example: instead of 'Recommend using...', write 'Use smaller default size (e.g. 1000x800) to fit common screens.'",
    'Avoid speculation. If uncertain, mark as [WARN] rather than [ERROR].',
    'Do not comment on unchanged or deleted code.',
    'If no issues exist, return an empty comments array.',
    '',
    'Return strictly valid JSON matching this schema:',
    `{
      "comments": [
        {
          "file": "string (optional)",
          "line": number (optional)",
          "type": "ERROR" | "WARN" | "TIP" | "NOTE" | "GRAMMAR",
          "message": "string"
        }
      ]
    }`,
    '',
    'Each message must start with its [TYPE] prefix, e.g. [ERROR] Missing null check.',
    '',
    'Classification rules:',
    focusText,
  ].join('\n');

  const userPrompt = [
    'Analyze the following Git diff carefully.',
    'Find every applicable issue based on the above focus rules.',
    'Be strict but fair — assume this is a production PR about to be merged.',
    'Write concise, professional review comments. Avoid repetition or lengthy justification.',
    'Each message should be readable in a code review UI at a glance.',
    '',
    trimmedDiff,
  ].join('\n');

  try {
    log.debug(`Calling ${openaiModel} with structured Zod output...`);

    const completion = await openai.chat.completions.parse({
      model: openaiModel,
      temperature: openaiTemperature,
      max_completion_tokens: openaiMaxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(ReviewResponseSchema, 'review_response'),
    });

    const parsed = completion.choices[0].message.parsed as unknown as ReviewResult;

    if (!parsed || !Array.isArray(parsed.comments)) {
      return [
        {
          message: "AI response missing valid 'comments' array.",
          source: 'ai',
        },
      ];
    }

    const comments = parsed.comments.map((c) => ({
      file: c.file,
      line: c.line,
      message: c.message.trim(),
      source: 'ai' as const,
    }));

    log.debug(`AI returned ${comments.length} structured comments`);
    return comments;
  } catch (err: any) {
    log.debug(err, 'AI structured review failed');
    process.exitCode = 1;
    throw new Error(
      `AI review failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ---------- Combined Review ----------
export async function runReview(
  diff: string,
  cfg: PandaOpsConfig,
): Promise<ReviewResult> {
  const heuristic = runHeuristic(diff);
  let aiComments: ReviewComment[] = [];
  let aiUsed = false;

  if (cfg.aiEnabled) {
    aiComments = await runAI(diff, cfg);
    aiUsed = true;
  }

  const merged = [...heuristic.comments];
  for (const c of aiComments) {
    if (!merged.some((m) => m.message === c.message)) merged.push(c);
  }

  const limited = merged.slice(0, cfg.maxComments);

  const summary = `Comments: ${limited.length} (Heuristic ${heuristic.comments.length}${
    aiUsed ? ` + AI ${aiComments.length}` : ''
  })`;

  return {
    comments: limited,
    summary,
    rawDiffStats: {
      addedLines: heuristic.addedLines,
      totalLines: diff.split(/\r?\n/).length,
    },
    aiUsed,
  };
}
