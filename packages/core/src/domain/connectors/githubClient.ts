export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  htmlUrl: string;
  user: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  htmlUrl: string;
  user: string;
  baseBranch: string;
  headBranch: string;
  draft: boolean;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
}

export interface GitHubRepo {
  id: number;
  fullName: string;
  description: string;
  htmlUrl: string;
  private: boolean;
  language: string;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  updatedAt: string;
  defaultBranch: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  htmlUrl: string;
}

export interface GitHubClientOptions {
  accessToken?: string;
}

export class GitHubConnectorClient {
  private accessToken: string;
  private baseUrl = 'https://api.github.com';

  constructor(options: GitHubClientOptions) {
    this.accessToken = options.accessToken ?? '';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  /**
   * List repositories for the authenticated user (Read)
   */
  async listRepos(params: {
    sort?: 'updated' | 'created' | 'pushed' | 'full_name';
    maxResults?: number;
    visibility?: 'all' | 'public' | 'private';
  }): Promise<{ repos: GitHubRepo[]; totalCount: number }> {
    const { sort = 'updated', maxResults = 10, visibility = 'all' } = params;

    const url = new URL(`${this.baseUrl}/user/repos`);
    url.searchParams.set('sort', sort);
    url.searchParams.set('per_page', String(Math.min(maxResults, 100)));
    url.searchParams.set('visibility', visibility);

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`GitHub list repos failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    const repos: GitHubRepo[] = data.map((r: Record<string, unknown>) => ({
      id: r.id as number,
      fullName: r.full_name as string,
      description: (r.description as string) ?? '',
      htmlUrl: r.html_url as string,
      private: r.private as boolean,
      language: (r.language as string) ?? 'Unknown',
      stargazersCount: r.stargazers_count as number,
      forksCount: r.forks_count as number,
      openIssuesCount: r.open_issues_count as number,
      updatedAt: r.updated_at as string,
      defaultBranch: (r.default_branch as string) ?? 'main',
    }));

    return { repos, totalCount: repos.length };
  }

  /**
   * List issues in a repository (Read)
   */
  async listIssues(params: {
    owner: string;
    repo: string;
    state?: 'open' | 'closed' | 'all';
    labels?: string;
    maxResults?: number;
  }): Promise<{ issues: GitHubIssue[]; totalCount: number }> {
    const { owner, repo, state = 'open', labels, maxResults = 10 } = params;

    const url = new URL(`${this.baseUrl}/repos/${owner}/${repo}/issues`);
    url.searchParams.set('state', state);
    url.searchParams.set('per_page', String(Math.min(maxResults, 100)));
    if (labels) url.searchParams.set('labels', labels);

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`GitHub list issues failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    // Filter out pull requests from issues endpoint
    const issues: GitHubIssue[] = data
      .filter((i: Record<string, unknown>) => !i.pull_request)
      .map((i: Record<string, unknown>) => ({
        id: i.id as number,
        number: i.number as number,
        title: i.title as string,
        body: (i.body as string) ?? '',
        state: i.state as 'open' | 'closed',
        htmlUrl: i.html_url as string,
        user: (i.user as Record<string, unknown>)?.login as string,
        labels: ((i.labels as Array<Record<string, unknown>>) ?? []).map((l) => l.name as string),
        createdAt: i.created_at as string,
        updatedAt: i.updated_at as string,
        commentsCount: i.comments as number,
      }));

    return { issues, totalCount: issues.length };
  }

  /**
   * Create an issue (Create)
   */
  async createIssue(params: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  }): Promise<{ success: boolean; issue: GitHubIssue; message: string }> {
    const { owner, repo, title, body, labels, assignees } = params;

    const res = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ title, body, labels, assignees }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create GitHub issue: ${res.status} ${err}`);
    }

    const i = await res.json();
    const issue: GitHubIssue = {
      id: i.id,
      number: i.number,
      title: i.title,
      body: i.body ?? '',
      state: i.state,
      htmlUrl: i.html_url,
      user: i.user?.login,
      labels: (i.labels ?? []).map((l: Record<string, unknown>) => l.name as string),
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      commentsCount: 0,
    };

    return { success: true, issue, message: `Issue #${issue.number} "${title}" created in ${owner}/${repo}.` };
  }

  /**
   * Update an issue (Update)
   */
  async updateIssue(params: {
    owner: string;
    repo: string;
    issueNumber: number;
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
  }): Promise<{ success: boolean; issue: GitHubIssue; message: string }> {
    const { owner, repo, issueNumber, ...updates } = params;

    const res = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(updates),
    });

    if (!res.ok) throw new Error(`Failed to update GitHub issue: ${res.statusText}`);

    const i = await res.json();
    const issue: GitHubIssue = {
      id: i.id,
      number: i.number,
      title: i.title,
      body: i.body ?? '',
      state: i.state,
      htmlUrl: i.html_url,
      user: i.user?.login,
      labels: (i.labels ?? []).map((l: Record<string, unknown>) => l.name as string),
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      commentsCount: i.comments,
    };

    return { success: true, issue, message: `Issue #${issueNumber} updated in ${owner}/${repo}.` };
  }

  /**
   * List pull requests (Read)
   */
  async listPullRequests(params: {
    owner: string;
    repo: string;
    state?: 'open' | 'closed' | 'all';
    maxResults?: number;
  }): Promise<{ pullRequests: GitHubPullRequest[]; totalCount: number }> {
    const { owner, repo, state = 'open', maxResults = 10 } = params;

    const url = new URL(`${this.baseUrl}/repos/${owner}/${repo}/pulls`);
    url.searchParams.set('state', state);
    url.searchParams.set('per_page', String(Math.min(maxResults, 100)));

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`GitHub list PRs failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    const pullRequests: GitHubPullRequest[] = data.map((pr: Record<string, unknown>) => {
      const base = pr.base as Record<string, unknown>;
      const head = pr.head as Record<string, unknown>;
      return {
        id: pr.id as number,
        number: pr.number as number,
        title: pr.title as string,
        body: (pr.body as string) ?? '',
        state: (pr.merged_at ? 'merged' : pr.state) as GitHubPullRequest['state'],
        htmlUrl: pr.html_url as string,
        user: (pr.user as Record<string, unknown>)?.login as string,
        baseBranch: base?.ref as string,
        headBranch: head?.ref as string,
        draft: pr.draft as boolean,
        createdAt: pr.created_at as string,
        updatedAt: pr.updated_at as string,
        mergedAt: (pr.merged_at as string) ?? undefined,
      };
    });

    return { pullRequests, totalCount: pullRequests.length };
  }

  /**
   * Get PR details (Read)
   */
  async getPullRequest(params: {
    owner: string;
    repo: string;
    prNumber: number;
  }): Promise<GitHubPullRequest> {
    const { owner, repo, prNumber } = params;
    const res = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`Failed to get PR #${prNumber}: ${res.statusText}`);
    const pr = await res.json();
    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body ?? '',
      state: pr.merged_at ? 'merged' : pr.state,
      htmlUrl: pr.html_url,
      user: pr.user?.login,
      baseBranch: pr.base?.ref,
      headBranch: pr.head?.ref,
      draft: pr.draft,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at ?? undefined,
    };
  }

  /**
   * List recent commits on a branch (Read)
   */
  async listCommits(params: {
    owner: string;
    repo: string;
    branch?: string;
    maxResults?: number;
  }): Promise<{ commits: GitHubCommit[]; totalCount: number }> {
    const { owner, repo, branch, maxResults = 10 } = params;

    const url = new URL(`${this.baseUrl}/repos/${owner}/${repo}/commits`);
    url.searchParams.set('per_page', String(Math.min(maxResults, 100)));
    if (branch) url.searchParams.set('sha', branch);

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`GitHub list commits failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    const commits: GitHubCommit[] = data.map((c: Record<string, unknown>) => {
      const commit = c.commit as Record<string, unknown>;
      const author = commit.author as Record<string, unknown>;
      return {
        sha: (c.sha as string).slice(0, 7),
        message: ((commit.message as string) ?? '').split('\n')[0],
        author: (author?.name as string) ?? 'Unknown',
        date: author?.date as string,
        htmlUrl: c.html_url as string,
      };
    });

    return { commits, totalCount: commits.length };
  }

  /**
   * Close an issue (Delete / state change)
   */
  async closeIssue(params: {
    owner: string;
    repo: string;
    issueNumber: number;
  }): Promise<{ success: boolean; message: string }> {
    const result = await this.updateIssue({ ...params, state: 'closed' });
    return {
      success: result.success,
      message: `Issue #${params.issueNumber} closed in ${params.owner}/${params.repo}.`,
    };
  }
}
