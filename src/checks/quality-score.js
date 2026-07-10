import { buildIssue, findAccountSettings, isAccountCheckEnabled } from '../lib/check-helpers.js';

/**
 * Low quality score keywords.
 * Mirrors AnomalyDetector checkQualityScore().
 */
export async function runQualityScoreCheck(dataSource, account, alertConfig) {
  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.monitored) return [];
  if (!isAccountCheckEnabled(accountSettings, 'qsCheck', alertConfig.global.qsCheckEnabled)) {
    return [];
  }

  const minQs = alertConfig.global.qsMinThreshold;
  const minImpressions = alertConfig.global.qsMinImpressions;
  const items = await dataSource.getQualityScoreIssues(account.customerId);

  const lowQs = items.filter(
    (item) => item.qualityScore < minQs && item.impressions >= minImpressions
  );

  if (lowQs.length === 0) return [];

  const campaigns = [...new Set(lowQs.map((item) => item.campaignLabel))];

  return [
    buildIssue({
      account: account.label,
      customerId: account.customerId,
      campaign: campaigns.join(', '),
      issue: 'Low Quality Score',
      detail: `${lowQs.length} keyword(s) with QS < ${minQs} in ${campaigns.length} campaign(s)`,
      severity: 'INFO',
    }),
  ];
}
