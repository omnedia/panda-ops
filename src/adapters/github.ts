import axios from 'axios';
import { AppConfig, VCSAdapter } from '../config.js';

export class GitHubAdapter implements VCSAdapter {
  constructor(private cfg: AppConfig) {}

  async getDiff(): Promise<string> {
    const url = `https://api.github.com/repos/${this.cfg.repository}/pulls/${this.cfg.pullRequestId}`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `token ${this.cfg.token}`,
        Accept: 'application/vnd.github.v3.diff',
        'User-Agent': 'PandaOps/1.0',
      },
    });
    return res.data;
  }

  async postComment(message: string): Promise<void> {
    const url = `https://api.github.com/repos/${this.cfg.repository}/issues/${this.cfg.pullRequestId}/comments`;
    await axios.post(
      url,
      { body: message },
      {
        headers: {
          Authorization: `token ${this.cfg.token}`,
          'User-Agent': 'PandaOps/1.0',
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
  }

  async postInlineComment(file: string, line: number, message: string): Promise<void> {
    const prUrl = `https://api.github.com/repos/${this.cfg.repository}/pulls/${this.cfg.pullRequestId}`;

    const pr = await axios.get(prUrl, {
      headers: {
        Authorization: `token ${this.cfg.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'PandaOps/1.0',
      },
    });

    const commitId = pr.data.head.sha;

    await axios.post(
      `${prUrl}/comments`,
      {
        body: message,
        commit_id: commitId,
        path: file,
        line,
        side: 'RIGHT',
      },
      {
        headers: {
          Authorization: `token ${this.cfg.token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'PandaOps/1.0',
        },
      },
    );
  }

  async setReviewStatus(status: 'APPROVED' | 'CHANGES_REQUESTED'): Promise<void> {
    const event = status === 'CHANGES_REQUESTED' ? 'REQUEST_CHANGES' : 'APPROVE';
    const prUrl = `https://api.github.com/repos/${this.cfg.repository}/pulls/${this.cfg.pullRequestId}`;
    const pr = await axios.get(prUrl, {
      headers: {
        Authorization: `token ${this.cfg.token}`,
        'User-Agent': 'PandaOps/1.0',
      },
    });

    const commitId = pr.data.head.sha;

    const payload: Record<string, any> = {
      event,
      commit_id: commitId,
    };

    if (event !== 'APPROVE') {
      payload.body = 'Requested changes.';
    }

    await axios.post(`${prUrl}/reviews`, payload, {
      headers: {
        Authorization: `token ${this.cfg.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'PandaOps/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  }
}
