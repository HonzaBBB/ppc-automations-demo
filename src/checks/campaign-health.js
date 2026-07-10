import { CAMPAIGN_HEALTH_LOOKBACK_DAYS } from '../config.js';
import { buildIssue, findAccountSettings, formatCampaignLabel, isAccountCheckEnabled } from '../lib/check-helpers.js';

/**
 * Zero impressions / zero clicks on enabled campaigns (7 days).
 * Mirrors AnomalyDetector checkCampaignHealth().
 *
 * @param {import('../data-source/index.js').DataSource} dataSource
 * @param {import('../data-source/types.js').Account} account
 * @param {import('../data-source/types.js').AlertConfig} alertConfig
 * @returns {Promise<import('../data-source/types.js').AnomalyIssue[]>}
 */
export async function runCampaignHealthCheck(dataSource, account, alertConfig) {
  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.monitored) return [];
  if (!isAccountCheckEnabled(accountSettings, 'campaignHealthCheck', true)) return [];

  const campaigns = await dataSource.getCampaignMetrics(
    account.customerId,
    CAMPAIGN_HEALTH_LOOKBACK_DAYS
  );
  const issues = [];

  for (const campaign of campaigns) {
    if (campaign.status !== 'ENABLED') continue;

    const label = formatCampaignLabel(campaign.campaignName, campaign.channelType);

    if (campaign.impressions === 0) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: label,
          issue: 'Zero Impressions (7 days)',
          detail: 'Campaign not serving',
          severity: 'CRITICAL',
        })
      );
    }

    if (campaign.clicks === 0 && campaign.impressions > 0) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: label,
          issue: 'Zero Clicks (7 days)',
          detail: `${campaign.impressions} impressions, 0 clicks`,
          severity: 'CRITICAL',
        })
      );
    }
  }

  return issues;
}
