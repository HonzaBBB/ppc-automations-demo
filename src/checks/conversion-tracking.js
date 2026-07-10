import { buildIssue, findAccountSettings, formatCampaignLabel, isAccountCheckEnabled } from '../lib/check-helpers.js';

/**
 * Spend without conversions in lookback window.
 * Mirrors AnomalyDetector checkConversionTracking().
 */
export async function runConversionTrackingCheck(dataSource, account, alertConfig) {
  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.monitored) return [];
  if (
    !isAccountCheckEnabled(
      accountSettings,
      'conversionCheck',
      alertConfig.global.conversionCheckEnabled
    )
  ) {
    return [];
  }

  const lookbackDays = alertConfig.global.conversionLookbackDays;
  const minSpend = alertConfig.global.conversionMinSpend;
  const campaigns = await dataSource.getCampaignMetrics(account.customerId, lookbackDays);
  const issues = [];

  for (const campaign of campaigns) {
    if (campaign.status !== 'ENABLED') continue;
    if (campaign.spendCzk > minSpend && campaign.conversions === 0) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: formatCampaignLabel(campaign.campaignName, campaign.channelType),
          issue: 'No Conversions',
          detail: `Spend ${Math.round(campaign.spendCzk)} in ${lookbackDays} days with 0 conversions - check tracking`,
          severity: 'HIGH',
        })
      );
    }
  }

  return issues;
}
