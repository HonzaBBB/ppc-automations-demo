import { buildIssue, findAccountSettings, isAccountCheckEnabled } from '../lib/check-helpers.js';

/**
 * Weak RSA ad strength.
 * Mirrors AnomalyDetector checkAdStrength().
 */
export async function runAdStrengthCheck(dataSource, account, alertConfig) {
  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.monitored) return [];
  if (
    !isAccountCheckEnabled(
      accountSettings,
      'adStrengthCheck',
      alertConfig.global.adStrengthEnabled
    )
  ) {
    return [];
  }

  const items = await dataSource.getAdStrengthIssues(account.customerId);
  const alertOn = new Set(alertConfig.global.adStrengthAlertOn);
  const ignored = new Set(alertConfig.global.adStrengthIgnoredCampaigns);

  const weakAds = items.filter(
    (item) => alertOn.has(item.strength) && !ignored.has(item.campaignLabel)
  );

  if (weakAds.length === 0) return [];

  const campaigns = [...new Set(weakAds.map((item) => item.campaignLabel))];

  return [
    buildIssue({
      account: account.label,
      customerId: account.customerId,
      campaign: campaigns.join(', '),
      issue: 'Weak Ad Strength',
      detail: `${weakAds.length} RSA(s) with ${[...alertOn].join('/')} strength`,
      severity: 'INFO',
    }),
  ];
}
