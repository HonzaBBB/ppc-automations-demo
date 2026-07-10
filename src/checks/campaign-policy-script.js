import { buildIssue, findAccountSettings, isAccountCheckEnabled, isCampaignIgnored } from '../lib/check-helpers.js';

/**
 * Campaign policy limitations from script layer.
 * Mirrors AnomalyDetector checkCampaignPolicyLimitations().
 */
export async function runCampaignPolicyScriptCheck(dataSource, account, alertConfig) {
  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.monitored) return [];
  if (!isAccountCheckEnabled(accountSettings, 'policyCheck', alertConfig.global.policyChecksEnabled)) {
    return [];
  }

  const items = await dataSource.getCampaignPolicyIssues(account.customerId);
  const scriptItems = items.filter((item) => item.kind !== 'app');

  const issues = [];
  for (const item of scriptItems) {
    if (isCampaignIgnored(item.campaignLabel, alertConfig.global.ignoredCampaigns)) continue;

    issues.push(
      buildIssue({
        account: account.label,
        customerId: account.customerId,
        campaign: item.campaignLabel,
        issue: 'Campaign Policy Limitation',
        detail: item.detail,
        severity: 'CRITICAL',
      })
    );
  }

  return issues;
}
