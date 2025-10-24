import { AppConfig, VCSAdapter } from '../config.js';

export class BitbucketAdapter implements VCSAdapter {
  constructor(private cfg: AppConfig) {}

  async getDiff(): Promise<string> {
    return `diff --git a/app.js b/app.js\n- console.log('debug')\n+ console.log('info')`;
  }

  async postComment(message: string): Promise<void> {
    console.log('[Bitbucket] Comment for PR', this.cfg.pullRequestId, '\n', message);
  }
}
