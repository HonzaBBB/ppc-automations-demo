import { buildIssue, findAccountSettings, isAccountCheckEnabled, isCampaignIgnored } from '../lib/check-helpers.js';

/**
 * Disapproved responsive / display ads.
 * Mirrors AnomalyDetector checkDisapprovedAds().
 */
export async function runDisapprovedAdsCheck(dataSource, account, alertConfig) {
  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.monitored) return [];
  if (!isAccountCheckEnabled(accountSettings, 'policyCheck', alertConfig.global.policyChecksEnabled)) {
    return [];
  }

  const items = await dataSource.getDisapprovedAds(account.customerId);
  if (items.length === 0) return [];

  const filtered = items.filter(
    (item) => !isCampaignIgnored(item.campaignLabel, alertConfig.global.ignoredCampaigns)
  );
  if (filtered.length === 0) return [];

  const campaigns = [...new Set(filtered.map((item) => item.campaignLabel))];

  return [
    buildIssue({
      account: account.label,
      customerId: account.customerId,
      campaign: campaigns.join(', '),
      issue: 'Disapproved Ads',
      detail: `${filtered.length} disapproved ad(s) in ${campaigns.length} campaign(s)`,
      severity: 'CRITICAL',
    }),
  ];
}
