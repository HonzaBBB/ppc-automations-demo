import { buildIssue, findAccountSettings, formatCampaignLabel, isAccountCheckEnabled } from '../lib/check-helpers.js';

/**
 * PNO monitoring on campaigns with conversion value (30 days).
 * Mirrors AnomalyDetector checkPNO().
 */
export async function runPnoCheck(dataSource, account, alertConfig) {
  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.monitored) return [];
  if (!isAccountCheckEnabled(accountSettings, 'pnoCheck', true)) return [];
  if (!accountSettings.maxPno) return [];

  const campaigns = await dataSource.getCampaignMetrics(account.customerId, 30);
  const maxPno = accountSettings.maxPno;
  const issues = [];

  for (const campaign of campaigns) {
    if (campaign.conversionValueCzk <= 0 || campaign.spendCzk <= 0) continue;

    const pno = campaign.spendCzk / campaign.conversionValueCzk;
    const roas = (campaign.conversionValueCzk / campaign.spendCzk) * 100;
    const label = formatCampaignLabel(campaign.campaignName, campaign.channelType);

    if (pno > maxPno * 1.5) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: label,
          issue: 'PNO Critical',
          detail: `PNO ${(pno * 100).toFixed(1)}% (max ${(maxPno * 100).toFixed(0)}%) - ROAS ${roas.toFixed(0)}%`,
          severity: 'HIGH',
        })
      );
    } else if (pno > maxPno) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: label,
          issue: 'PNO Warning',
          detail: `PNO ${(pno * 100).toFixed(1)}% (max ${(maxPno * 100).toFixed(0)}%) - ROAS ${roas.toFixed(0)}%`,
          severity: 'MEDIUM',
        })
      );
    }
  }

  return issues;
}
