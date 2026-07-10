import { BUDGET_LOST_IS_THRESHOLD, CAMPAIGN_HEALTH_LOOKBACK_DAYS } from '../config.js';
import { buildIssue, findAccountSettings, formatCampaignLabel, isAccountCheckEnabled, isCampaignIgnored } from '../lib/check-helpers.js';

/**
 * Budget lost impression share above threshold.
 * Mirrors AnomalyDetector checkBudgetLimitation().
 */
export async function runBudgetLimitationCheck(dataSource, account, alertConfig) {
  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.monitored) return [];
  if (!isAccountCheckEnabled(accountSettings, 'policyCheck', alertConfig.global.policyChecksEnabled)) {
    return [];
  }

  const campaigns = await dataSource.getCampaignMetrics(
    account.customerId,
    CAMPAIGN_HEALTH_LOOKBACK_DAYS
  );
  const issues = [];

  for (const campaign of campaigns) {
    if (campaign.status !== 'ENABLED') continue;
    if (isCampaignIgnored(campaign.campaignName, alertConfig.global.ignoredCampaigns)) continue;

    const lostIs = campaign.budgetLostImpressionShare ?? 0;
    if (lostIs <= BUDGET_LOST_IS_THRESHOLD) continue;

    issues.push(
      buildIssue({
        account: account.label,
        customerId: account.customerId,
        campaign: formatCampaignLabel(campaign.campaignName, campaign.channelType),
        issue: 'Budget Lost Impression Share',
        detail: `${lostIs}% budget lost IS`,
        severity: 'INFO',
      })
    );
  }

  return issues;
}
