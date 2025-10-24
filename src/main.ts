#!/usr/bin/env node
import {AIConfig, AppConfig, loadConfig, VCSAdapter} from './config.js';
import {GitHubAdapter} from './adapters/github.js';
import {BitbucketAdapter} from './adapters/bitbucket.js';
import {AzureAdapter} from './adapters/azure.js';
import {fetchDiff} from './core/diffFetcher.js';
import {runReview} from './core/reviewEngine.js';
import {formatSummaryCLI, postReview} from './core/commentPoster.js';
import {Command} from 'commander';
import dotenv from 'dotenv';
import {ZodError} from "zod";
import {log} from "./core/logger.js";

dotenv.config();

function createAdapter(cfg: AppConfig): VCSAdapter {
    switch (cfg.provider) {
        case 'github':
            return new GitHubAdapter(cfg);
        case 'bitbucket':
            return new BitbucketAdapter(cfg);
        case 'azure':
            return new AzureAdapter(cfg);
        default:
            throw new Error(`Unsupported provider: ${cfg.provider}`);
    }
}

async function execute(cfg: AppConfig & AIConfig) {
    const adapter = createAdapter(cfg);

    try {
        log.info('[PandaOps] Fetching PR diff...');
        const diff = await fetchDiff(adapter);

        log.info('[PandaOps] Running AI review...');
        const review = await runReview(diff, cfg);

        if (cfg.outputJson) {
            const json = {
                summary: review.summary,
                comments: review.comments,
                stats: review.rawDiffStats,
                aiUsed: review.aiUsed,
                provider: cfg.provider,
                pullRequestId: cfg.pullRequestId,
            };
            console.log(JSON.stringify(json, null, 2));
        } else if (cfg.dryRun) {
            log.info('[PandaOps] --- DRY RUN ---');
            log.info(review.summary);

            for (const c of review.comments) {
                const location =
                    c.file && typeof c.line === 'number'
                        ? `${c.file}:${c.line}`
                        : '(no location)';
                log.info(`- ${location} ${c.message}`);
            }

            const summaryBlock = formatSummaryCLI(review);
            log.info('\n' + summaryBlock);
        } else {
            log.info('[PandaOps] Posting review comments...');
            await postReview(adapter, review);
            log.info('[PandaOps] Review successfully posted.');

            if (adapter.setReviewStatus) {
                const hasIssues = review.comments.some(c =>
                    /\[ERROR\]|\[WARN\]/i.test(c.message)
                );
                const status = hasIssues ? 'CHANGES_REQUESTED' : 'APPROVED';
                try {
                    await adapter.setReviewStatus(status, review.summary);
                    log.info(`[PandaOps] PR status set to ${status}`);
                } catch (err) {
                    log.warn({err}, '[PandaOps] Failed to set PR review status.');
                }
            }
        }

        if (cfg.failOnComments && review.comments.length > 0) {
            log.warn('[PandaOps] Comments found — exiting with code 2 (--fail-on-comments enabled)');
            process.exitCode = 2;
        }
    } catch (err: any) {
        log.error(`[PandaOps] Review execution failed: \n ${err.message}`);
        process.exitCode = 1;
    }
}

async function main(argv: string[]) {
    const program = new Command();
    program
        .name('panda-ops')
        .description('AI-powered PR review tool for GitHub, Bitbucket, and Azure DevOps')
        .option('-p, --provider <name>', 'Provider (github|bitbucket|azure)')
        .option('-r, --repository <repo>', 'Repository identifier (owner/name or project/repo)')
        .option('-i, --pull-request-id <id>', 'Pull Request ID')
        .option('-t, --token <token>', 'Auth Token / PAT')
        .option('--api-base <url>', 'Base URL override for API')
        .option('--dry-run', 'Console output only, no posting')
        .option('--output-json', 'Output JSON instead of formatted text')
        .option('--fail-on-comments', 'Exit code 2 if comments found')
        .option('--openai-api-key <key>', 'OpenAI API Key')
        .option('--openai-model <model>', 'OpenAI model', 'gpt-4o-mini')
        .option('--openai-temperature <num>', 'OpenAI temperature', (v) => Number(v), 0.2)
        .option('--openai-max-tokens <num>', 'OpenAI max tokens', (v) => Number(v), 800)
        .option('--no-ai', 'Disable AI processing')
        .option('--max-comments <num>', 'Maximum number of comments', (v) => Number(v), 50)
        .parse(argv);

    const opts = program.opts();
    try {
        const cfg = loadConfig(process.env, {
            provider: opts.provider,
            repository: opts.repository,
            pullRequestId: opts.pullRequestId,
            token: opts.token,
            apiBase: opts.apiBase,
            dryRun: opts.dryRun,
            outputJson: opts.outputJson,
            failOnComments: opts.failOnComments,
            openaiApiKey: opts.openaiApiKey,
            openaiModel: opts.openaiModel,
            openaiTemperature: opts.openaiTemperature,
            openaiMaxTokens: opts.openaiMaxTokens,
            aiEnabled: !opts.noAi,
            maxComments: opts.maxComments,
        });
        await execute(cfg);
    } catch (err) {
        if (err instanceof ZodError) {
            log.error(err, '[PandaOps] Invalid configuration:');
        } else {
            log.error(err, '[PandaOps] Configuration or execution failed');
        }
        process.exitCode = 1;
    }
}

main(process.argv);
