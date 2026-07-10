import { buildIssue, findAccountSettings, isAccountCheckEnabled, isCampaignIgnored } from '../lib/check-helpers.js';

export const APP_CAMPAIGN_POLICY_ISSUE = 'Campaign Policy Limitation [app]';

/**
 * App-side campaign policy limitations.
 * Mirrors platform evaluate-campaign-policy.ts.
 */
export async function runCampaignPolicyAppCheck(dataSource, account, alertConfig) {
  if (!alertConfig.global.policyChecksEnabled) return [];

  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (accountSettings && !accountSettings.monitored) return [];
  if (accountSettings && !accountSettings.policyCheck) return [];

  const items = await dataSource.getCampaignPolicyIssues(account.customerId);
  const appItems = items.filter((item) => item.kind === 'app');
  const issues = [];

  for (const item of appItems) {
    if (isCampaignIgnored(item.campaignLabel, alertConfig.global.ignoredCampaigns)) continue;

    issues.push(
      buildIssue({
        account: account.label,
        customerId: account.customerId,
        campaign: item.campaignLabel,
        issue: APP_CAMPAIGN_POLICY_ISSUE,
        detail: item.detail,
        severity: 'CRITICAL',
      })
    );
  }

  return issues;
}
