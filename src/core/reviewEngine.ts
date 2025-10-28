import {AIBehaviorConfig, AIConfig, ReviewComment, ReviewResponseSchema, ReviewResult} from '../config.js';
import {log} from "./logger.js";
import {OpenAI} from "openai";
import {zodResponseFormat} from "openai/helpers/zod";

// ---------- Heuristic Rules ----------
function runHeuristic(diff: string): { comments: ReviewComment[]; addedLines: number } {
    const lines = diff.split(/\r?\n/);
    const comments: ReviewComment[] = [];
    let addedLines = 0;

    for (const line of lines) {
        if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ')) continue;
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
                    message: 'console.log found – remove or replace with a proper logger: ' + content.trim(),
                    source: 'heuristic',
                });
            }
            if (/debugger;?/.test(content)) {
                comments.push({
                    message: 'debugger statement found – remove before merge.',
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

    return {comments, addedLines};
}

// ---------- AI Review ----------
async function runAI(
    diff: string,
    cfg: AIConfig & AIBehaviorConfig
): Promise<ReviewComment[]> {
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

    const openai = new OpenAI({apiKey: openaiApiKey});

    const MAX_DIFF_CHARS = 60_000;
    const trimmedDiff =
        diff.length > MAX_DIFF_CHARS
            ? diff.slice(0, MAX_DIFF_CHARS) + "\n... [Diff truncated]"
            : diff;

    // --- Build behavior prompt ---
    const focusInstructions: string[] = [];
    if (focusErrors)
        focusInstructions.push(
            "[ERROR] - Functional bugs, incorrect logic, or runtime issues."
        );
    if (focusWarn)
        focusInstructions.push(
            "[WARN] - Potential problems, non-critical risks, UX or performance concerns."
        );
    if (focusTips)
        focusInstructions.push(
            "[TIP] - Readability, performance, or maintainability improvements."
        );
    if (focusNotes)
        focusInstructions.push("[NOTE] - Architectural or strategic advice.");
    if (focusGrammar)
        focusInstructions.push(
            "[GRAMMAR] - Grammar or spelling issues in comments or naming."
        );

    const focusText = focusInstructions.length
        ? `Only check the code for the following focus types:\n${focusInstructions.join("\n")} \n While doing so, try to find all places in the code, where these focus types apply.`
        : "Focus only on meaningful code issues.";

    const systemPrompt = [
        "You are a precise, constructive code review assistant analyzing a unified Git diff.",
        "Each comment must correspond to a file and line if possible.",
        "If no issues are found, return an empty 'comments' array.",
        "Respond ONLY with a JSON object matching this schema:",
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
        "",
        "Each message must begin with its [TYPE] prefix, e.g. [ERROR] Missing null check.",
        focusText,
    ].join("\n");

    const userPrompt = `Analyze the following diff and provide actionable review comments as structured JSON.\n\n${trimmedDiff}`;

    try {
        log.debug(`Calling ${openaiModel} with structured Zod output...`);

        const completion = await openai.chat.completions.parse({
            model: openaiModel,
            temperature: openaiTemperature,
            max_completion_tokens: openaiMaxTokens,
            messages: [
                {role: "system", content: systemPrompt},
                {role: "user", content: userPrompt},
            ],
            response_format: zodResponseFormat(
                ReviewResponseSchema,
                "review_response"
            ),
        });

        const parsed = completion.choices[0].message.parsed as unknown as ReviewResult;

        if (!parsed || !Array.isArray(parsed.comments)) {
            return [{message: "AI response missing valid 'comments' array.", source: "ai"}];
        }

        const comments = parsed.comments.map(c => ({
            file: c.file,
            line: c.line,
            message: c.message.trim(),
            source: "ai" as const,
        }));

        log.debug(`AI returned ${comments.length} structured comments`);
        return comments;
    } catch (err: any) {
        log.error(err, "AI structured review failed");
        return [
            {
                message:
                    "AI error: " + (err instanceof Error ? err.message : String(err)),
                source: "ai",
            },
        ];
    }
}

// ---------- Combined Review ----------
export async function runReview(diff: string, cfg: AIConfig): Promise<ReviewResult> {
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

