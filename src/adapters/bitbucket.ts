import { AppConfig, VCSAdapter } from '../config.js';

export class BitbucketAdapter implements VCSAdapter {
  constructor(private cfg: AppConfig) {}

  async getDiff(): Promise<string> {
    console.error('[Bitbucket] Diff retrieval not implemented yet.');
    return new Promise<string>((resolve) => resolve(''));
  }

  async postComment(): Promise<void> {
    console.error('[Bitbucket] Comment posting not implemented yet.');
  }
}
