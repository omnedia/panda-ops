import { VCSAdapter } from '../config.js';
import { log } from './logger.js';

export async function fetchDiff(adapter: VCSAdapter): Promise<string> {
  log.debug('Fetching diff...');
  try {
    const diff = await adapter.getDiff();
    log.debug(`Fetched diff (${diff.length} chars)`);
    return diff.replace(/\r\n/g, '\n');
  } catch (err) {
    log.error(err, 'Failed to fetch diff');
    throw new Error(
      'Failed to fetch diff: ' + (err instanceof Error ? err.message : String(err)),
    );
  }
}
