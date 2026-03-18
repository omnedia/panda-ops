import { PandaOpsConfig, ReviewResult, VCSAdapter } from '../config.js';
import { log } from './logger.js';

function summarizeResult(result: ReviewResult, cfg: PandaOpsConfig) {
  const { comments, rawDiffStats, aiUsed } = result;

  const errors = comments.filter((c) => /\[ERROR\]/i.test(c.message)).length;
  const warns = comments.filter((c) => /\[WARN\]/i.test(c.message)).length;
  const tips = comments.filter((c) => /\[TIP\]/i.test(c.message)).length;
  const notes = comments.filter((c) => /\[NOTE\]/i.test(c.message)).length;
  const grammar = comments.filter((c) => /\[GRAMMAR\]/i.test(c.message)).length;
  const total = comments.length;

  const hasErrors = errors > 0;
  const hasWarns = warns > 0;
  const status =
    cfg.failOnWarnings && (hasErrors || hasWarns) ? 'CHANGES_REQUESTED' : hasErrors ? 'CHANGES_REQUESTED' : 'APPROVED';

  const hasIssues = status === 'CHANGES_REQUESTED';

  return {
    total,
    errors,
    warns,
    tips,
    notes,
    grammar,
    addedLines: rawDiffStats.addedLines,
    aiUsed,
    status,
    hasIssues,
  };
}

function formatSummary(result: ReviewResult, cfg: PandaOpsConfig): string {
  const stats = summarizeResult(result, cfg);

  if (stats.total === 0) {
    return ['### 🐼 PandaOps Automated Review Summary', '', '✅ **No issues found — looks great!** 🎉'].join('\n');
  }

  const lines = ['### 🐼 PandaOps Summary', '', `**Comments:** ${stats.total}`];

  if (cfg.focusErrors ?? true) lines.push(`- ❌ Errors: ${stats.errors}`);
  if (cfg.focusWarn ?? true) lines.push(`- ⚠️ Warnings: ${stats.warns}`);
  if (cfg.focusTips ?? true) lines.push(`- 💡 Tips: ${stats.tips}`);
  if (cfg.focusNotes) lines.push(`- 📝 Notes: ${stats.notes}`);
  if (cfg.focusGrammar) lines.push(`- ✏️ Grammar: ${stats.grammar}`);

  lines.push('', stats.hasIssues ? '🚫 **Review Result:** Changes Requested' : '✅ **Review Result:** Approved');

  return lines.join('\n');
}

export function formatSummaryCLI(result: ReviewResult, cfg: PandaOpsConfig): string {
  const stats = summarizeResult(result, cfg);

  if (stats.total === 0) {
    return `
        PandaOps Review Summary
        ----------------------------------------
        No issues found — looks great!
        Lines added: ${stats.addedLines}
        AI Used: ${stats.aiUsed ? 'Yes' : 'No'}
        Status: APPROVED
        `;
  }

  return `
    PandaOps Review Summary
    ----------------------------------------
    Comments: ${stats.total}
    Errors: ${stats.errors}
    Warnings: ${stats.warns}
    Tips: ${stats.tips}
    Notes: ${stats.notes}
    Grammar: ${stats.grammar}
    Lines added: ${stats.addedLines}
    AI Used: ${stats.aiUsed ? 'Yes' : 'No'}
    Status: ${stats.status}
    `;
}

export async function postReview(adapter: VCSAdapter, result: ReviewResult, cfg: PandaOpsConfig): Promise<void> {
  log.info('[PandaOps] Posting inline and summary comments...');

  const summary = formatSummary(result, cfg);
  try {
    await adapter.postComment(summary);
    log.info('[PandaOps] Summary comment posted.');
  } catch (err) {
    log.error({ err }, '[PandaOps] Failed to post summary comment.');
  }

  if (adapter.postInlineComment) {
    for (const c of result.comments) {
      if (c.file && typeof c.line === 'number') {
        try {
          await adapter.postInlineComment(c.file, c.line, beautifyTagPrefix(c.message));
        } catch (err) {
          log.warn({ err }, `[PandaOps] Failed to post inline comment at ${c.file}:${c.line}`);
        }
      }
    }
  }
}

function beautifyTagPrefix(message: string): string {
  return message
    .replace(/^\[ERROR\]/i, '**[❌]**')
    .replace(/^\[WARN\]/i, '**[⚠️]**')
    .replace(/^\[TIP\]/i, '**[💡]**')
    .replace(/^\[NOTE\]/i, '**[📝]**')
    .replace(/^\[GRAMMAR\]/i, '**[✏️]**');
}
