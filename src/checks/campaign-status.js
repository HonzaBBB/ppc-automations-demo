import { buildIssue, findAccountSettings, formatCampaignLabel, isAccountCheckEnabled, isCampaignIgnored } from '../lib/check-helpers.js';
import { CAMPAIGN_HEALTH_LOOKBACK_DAYS } from '../config.js';

/**
 * Campaign status reasons (budget / bidding constrained).
 * Mirrors AnomalyDetector checkCampaignStatus().
 */
export async function runCampaignStatusCheck(dataSource, account, alertConfig) {
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

    const label = formatCampaignLabel(campaign.campaignName, campaign.channelType);
    const reasons = campaign.statusReasons ?? [];

    if (reasons.includes('BUDGET_CONSTRAINED')) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: label,
          issue: 'Campaign Status: Limited by Budget',
          detail: 'Primary status reason: BUDGET_CONSTRAINED',
          severity: 'HIGH',
        })
      );
    }

    if (reasons.includes('BIDDING_STRATEGY_CONSTRAINED')) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: label,
          issue: 'Campaign Status: Limited by Bidding Strategy',
          detail: 'Primary status reason: BIDDING_STRATEGY_CONSTRAINED',
          severity: 'MEDIUM',
        })
      );
    }
  }

  return issues;
}
