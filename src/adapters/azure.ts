import { AppConfig, VCSAdapter } from '../config.js';
import { log } from '../core/logger.js';

export class AzureAdapter implements VCSAdapter {
  constructor(private cfg: AppConfig) {}

  async getDiff(): Promise<string> {
    log.error('[Azure DevOps] Diff retrieval not implemented yet.');
    return new Promise<string>((resolve) => resolve(''));
  }

  async postComment(): Promise<void> {
    log.error('[Azure DevOps] Comment posting not implemented yet.');
  }
}
