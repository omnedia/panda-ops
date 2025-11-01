import { z } from 'zod';

export type Provider = 'github' | 'bitbucket' | 'azure';

export interface AIBehaviorConfig {
  focusErrors?: boolean;
  focusWarn?: boolean;
  focusTips?: boolean;
  focusNotes?: boolean;
  focusGrammar?: boolean;
}

export interface AIConfig {
  openaiApiKey: string;
  openaiModel: string;
  openaiTemperature: number;
  openaiMaxTokens: number;
  aiEnabled: boolean;
  maxComments: number;
}

export interface AppConfig {
  provider: Provider;
  repository: string;
  pullRequestId: string;
  token: string;
  apiBase?: string;
  dryRun: boolean;
  outputJson: boolean;
  failOnComments: boolean;
  failOnWarnings: boolean;
}

export type PandaOpsConfig = AppConfig & AIConfig & AIBehaviorConfig;

export const ConfigSchema = z.object({
  provider: z.enum(['github', 'bitbucket', 'azure']),
  repository: z.string().min(1, 'Repository is required'),
  pullRequestId: z.string().min(1, 'Pull request ID is required'),
  token: z.string().min(1, 'Auth token is required'),
  apiBase: z.string().optional(),
  dryRun: z.boolean().default(false),
  outputJson: z.boolean().default(false),
  failOnComments: z.boolean().default(false),
  failOnWarnings: z.boolean().default(false),

  openaiApiKey: z.string().min(1, 'OpenAI API key missing').default(''),
  openaiModel: z.string().default('gpt-5-mini'),
  openaiTemperature: z.number().default(1),
  openaiMaxTokens: z.number().default(1500),
  aiEnabled: z.boolean().default(true),
  maxComments: z.number().default(50),

  focusErrors: z.boolean().default(true),
  focusWarn: z.boolean().default(true),
  focusTips: z.boolean().default(true),
  focusNotes: z.boolean().default(false),
  focusGrammar: z.boolean().default(false),
});

export type ReviewSource = 'heuristic' | 'ai';

export interface ReviewComment {
  file?: string;
  line?: number;
  message: string;
  source: ReviewSource;
}

export interface ReviewResult {
  comments: ReviewComment[];
  summary: string;
  rawDiffStats: { addedLines: number; totalLines: number };
  aiUsed: boolean;
}

export const ReviewResponseSchema = z.object({
  comments: z.array(
    z.object({
      file: z.string().optional().nullable(),
      line: z.number().optional().nullable(),
      type: z.enum(['ERROR', 'WARN', 'TIP', 'NOTE', 'GRAMMAR']),
      message: z.string(),
    }),
  ),
});

export interface VCSAdapter {
  getDiff(): Promise<string>;

  postComment(message: string): Promise<void>; // summary comment
  postInlineComment?(file: string, line: number, message: string): Promise<void>;

  setReviewStatus?(
    status: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED',
    body?: string,
    comments?: ReviewComment[],
  ): Promise<void>;

  getPullRequestMetadata?(): Promise<{ title: string; author?: string }>;
}

export function loadConfig(
  env: NodeJS.ProcessEnv,
  cli: Partial<PandaOpsConfig>,
): PandaOpsConfig {
  const merged = {
    provider: cli.provider || env.PROVIDER || 'github',
    repository: cli.repository || env.GITHUB_REPOSITORY || '',
    pullRequestId: cli.pullRequestId || env.GITHUB_PR_ID || '',
    token: cli.token || env.GITHUB_TOKEN || '',
    apiBase: cli.apiBase || env.GITHUB_API_BASE,

    dryRun: cli.dryRun ?? env.DRY_RUN === 'true',
    outputJson: cli.outputJson ?? env.OUTPUT_JSON === 'true',
    failOnComments: cli.failOnComments ?? env.FAIL_ON_COMMENTS === 'true',
    failOnWarnings: cli.failOnWarnings ?? env.FAIL_ON_WARNINGS === 'true',

    openaiApiKey: cli.openaiApiKey || env.OPENAI_API_KEY || '',
    openaiModel: cli.openaiModel || env.OPENAI_MODEL || 'gpt-5-mini',
    openaiTemperature: cli.openaiTemperature ?? Number(env.OPENAI_TEMPERATURE ?? 1),
    openaiMaxTokens: cli.openaiMaxTokens ?? Number(env.OPENAI_MAX_TOKENS ?? 1500),
    aiEnabled: cli.aiEnabled ?? env.AI_ENABLED !== 'false',
    maxComments: cli.maxComments ?? Number(env.MAX_COMMENTS ?? 50),

    focusErrors:
      cli.focusErrors !== undefined ? cli.focusErrors : env.AI_FOCUS_ERRORS !== 'false',

    focusWarn:
      cli.focusWarn !== undefined ? cli.focusWarn : env.AI_FOCUS_WARN !== 'false',

    focusTips:
      cli.focusTips !== undefined ? cli.focusTips : env.AI_FOCUS_TIPS !== 'false',

    focusNotes:
      cli.focusNotes !== undefined ? cli.focusNotes : env.AI_FOCUS_NOTES === 'true',

    focusGrammar:
      cli.focusGrammar !== undefined ? cli.focusGrammar : env.AI_FOCUS_GRAMMAR === 'true',
  };

  return ConfigSchema.parse(merged);
}
