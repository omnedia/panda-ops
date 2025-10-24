import { AppConfig, VCSAdapter } from '../config.js';

export class AzureAdapter implements VCSAdapter {
  constructor(private cfg: AppConfig) {}

  async getDiff(): Promise<string> {
    return `diff --git a/service.ts b/service.ts\n+ // New service logic`;
  }

  async postComment(message: string): Promise<void> {
    console.log('[Azure DevOps] PR', this.cfg.pullRequestId, 'comment:\n', message);
  }
}
