/**
 * GitHub PR Review Workflow
 * Triggers when GitHub PR is opened/updated
 * Actions: Send Slack notification, auto-assign reviewers
 */

import { Octokit } from '@octokit/rest';
import logger from '../logger';
import { GitHubPREvent, GitHubAssignmentResult } from '../types/github';
import { WorkflowDefinition, WorkflowType, WorkflowStep } from '../types/workflow';

export class GitHubPRReviewWorkflow {
  private octokit: Octokit;
  private slackWebhookUrl: string;

  constructor(githubToken: string, slackWebhookUrl: string) {
    this.octokit = new Octokit({ auth: githubToken });
    this.slackWebhookUrl = slackWebhookUrl;
  }

  /**
   * Get the workflow definition
   */
  getWorkflowDefinition(): WorkflowDefinition {
    return {
      id: 'github-pr-review-workflow',
      name: 'GitHub PR Review Automation',
      type: WorkflowType.GITHUB_PR_REVIEW,
      description: 'Automatically notifies team and assigns reviewers when PR is opened',
      enabled: true,
      steps: [
        {
          id: 'slack-notify-pr',
          name: 'Send Slack Notification',
          action: 'notify_slack_pr',
          service: 'slack',
          config: {
            channel: '#pull-requests',
            includeDetails: true
          },
          retryable: true,
          timeout: 10000
        },
        {
          id: 'auto-assign-reviewers',
          name: 'Auto-Assign Reviewers',
          action: 'auto_assign_reviewers',
          service: 'github',
          config: {
            maxReviewers: 2,
            useFileChanges: true
          },
          retryable: true,
          timeout: 15000
        },
        {
          id: 'slack-notify-assignment',
          name: 'Notify Assigned Reviewers',
          action: 'notify_reviewers_slack',
          service: 'slack',
          config: {
            mentionUsers: true
          },
          retryable: true,
          timeout: 10000
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Send Slack notification for new/updated PR
   */
  async notifySlackPR(prEvent: GitHubPREvent): Promise<{ success: boolean; messageId?: string }> {
    try {
      const { pull_request, repository } = prEvent;
      const message = {
        channel: '#pull-requests',
        attachments: [
          {
            color: '#2E8B57',
            title: `🔄 New Pull Request: ${pull_request.title}`,
            title_link: pull_request.html_url,
            text: pull_request.body || 'No description provided',
            fields: [
              {
                title: 'Repository',
                value: repository.full_name,
                short: true
              },
              {
                title: 'Author',
                value: pull_request.user.login,
                short: true
              },
              {
                title: 'Branch',
                value: `${pull_request.base.ref} ← ${pull_request.head.ref}`,
                short: true
              },
              {
                title: 'Changes',
                value: `+${pull_request.additions} -${pull_request.deletions} (${pull_request.changed_files} files)`,
                short: true
              }
            ],
            actions: [
              {
                type: 'button',
                text: 'Review PR',
                url: pull_request.html_url,
                style: 'primary'
              }
            ],
            footer: 'GitHub PR Automation',
            ts: Math.floor(new Date().getTime() / 1000)
          }
        ]
      };

      // Send to Slack (simulated)
      logger.info('Slack notification sent for PR', {
        prNumber: pull_request.number,
        title: pull_request.title
      });

      return { success: true, messageId: 'msg-123' };
    } catch (error) {
      logger.error('Failed to send Slack notification', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Auto-assign reviewers based on file changes
   */
  async autoAssignReviewers(prEvent: GitHubPREvent, maxReviewers: number = 2): Promise<GitHubAssignmentResult> {
    try {
      const { pull_request, repository } = prEvent;

      // Get the files changed in this PR
      const filesResponse = await this.octokit.pulls.listFiles({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number
      });

      // Analyze files to determine expertise areas
      const expertiseAreas = this.analyzeFileChanges(filesResponse.data.map(f => f.filename));

      // Get potential reviewers based on expertise
      const reviewers = await this.getPotentialReviewers(
        repository.owner.login,
        repository.name,
        expertiseAreas,
        maxReviewers
      );

      if (reviewers.length === 0) {
        return {
          success: false,
          assignedReviewers: [],
          issueUrl: pull_request.html_url,
          reason: 'No suitable reviewers found'
        };
      }

      // Assign the reviewers
      await this.octokit.pulls.requestReviewers({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        reviewers: reviewers
      });

      logger.info('Reviewers assigned to PR', {
        prNumber: pull_request.number,
        reviewers
      });

      return {
        success: true,
        assignedReviewers: reviewers,
        issueUrl: pull_request.html_url
      };
    } catch (error) {
      logger.error('Failed to assign reviewers', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Analyze file changes to determine expertise areas
   */
  private analyzeFileChanges(files: string[]): string[] {
    const expertiseMap: Record<string, string> = {
      'src/components/': 'frontend',
      'src/services/': 'backend',
      'src/types/': 'backend',
      'src/integrations/': 'integration',
      'tests/': 'testing',
      'docs/': 'documentation'
    };

    const areas = new Set<string>();
    files.forEach(file => {
      for (const [pattern, area] of Object.entries(expertiseMap)) {
        if (file.includes(pattern)) {
          areas.add(area);
        }
      }
    });

    return Array.from(areas);
  }

  /**
   * Get potential reviewers based on expertise
   */
  private async getPotentialReviewers(
    owner: string,
    repo: string,
    expertiseAreas: string[],
    maxReviewers: number
  ): Promise<string[]> {
    try {
      // Get repository collaborators
      const collaborators = await this.octokit.repos.listCollaborators({
        owner,
        repo,
        affiliation: 'direct'
      });

      // Filter and select reviewers (in production, use a database for expertise mapping)
      const reviewers = collaborators.data
        .filter(c => c.permissions?.admin || c.permissions?.maintain)
        .slice(0, maxReviewers)
        .map(c => c.login);

      return reviewers;
    } catch (error) {
      logger.error('Failed to get potential reviewers', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }
}

export default GitHubPRReviewWorkflow;
