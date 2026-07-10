import { runAccountHealthCheck } from './account-health.js';
import { runAdStrengthCheck } from './ad-strength.js';
import { runBudgetLimitationCheck } from './budget-limitation.js';
import { runBudgetSpendWithTrendCheck, isScriptBudgetOverspendIssue } from './budget-spend-with-trend.js';
import { runCampaignHealthCheck } from './campaign-health.js';
import { runCampaignPolicyAppCheck } from './campaign-policy-app.js';
import { runCampaignPolicyScriptCheck } from './campaign-policy-script.js';
import { runCampaignStatusCheck } from './campaign-status.js';
import { runConversionTrackingCheck } from './conversion-tracking.js';
import { runDisapprovedAdsCheck } from './disapproved-ads.js';
import { runDisapprovedAssetsCheck } from './disapproved-assets.js';
import { runDisapprovedKeywordsCheck } from './disapproved-keywords.js';
import { runEshopOverspendCheck } from './eshop-overspend.js';
import { runPnoCheck } from './pno.js';
import { runQualityScoreCheck } from './quality-score.js';

/** @typedef {import('../data-source/index.js').DataSource} DataSource */

const SCRIPT_CHECKS = [
  runCampaignHealthCheck,
  runBudgetLimitationCheck,
  runCampaignStatusCheck,
  runBudgetSpendWithTrendCheck,
  runPnoCheck,
  runDisapprovedAdsCheck,
  runDisapprovedKeywordsCheck,
  runDisapprovedAssetsCheck,
  runCampaignPolicyScriptCheck,
  runConversionTrackingCheck,
  runAdStrengthCheck,
  runQualityScoreCheck,
];

const APP_CHECKS = [runAccountHealthCheck, runCampaignPolicyAppCheck];

/**
 * Run all daily monitoring checks (script + app layers).
 *
 * @param {DataSource} dataSource
 * @param {Date} [referenceDate]
 * @returns {Promise<import('../data-source/types.js').AnomalyIssue[]>}
 */
export async function runAllChecks(dataSource, referenceDate = new Date()) {
  const [accounts, alertConfig] = await Promise.all([
    dataSource.getAccounts(),
    dataSource.getAlertConfig(),
  ]);

  let issues = [];

  for (const account of accounts) {
    for (const check of SCRIPT_CHECKS) {
      const found = await check(dataSource, account, alertConfig, referenceDate);
      issues.push(...found);
    }
  }

  const eshopIds = new Set(accounts.filter((account) => account.profile === 'eshop').map((a) => a.customerId));
  issues = issues.filter(
    (issue) => !(eshopIds.has(issue.customerId) && isScriptBudgetOverspendIssue(issue))
  );

  for (const account of accounts.filter((row) => row.profile === 'eshop')) {
    const { issues: merged, added } = await runEshopOverspendCheck(
      dataSource,
      account,
      alertConfig,
      issues,
      referenceDate
    );
    issues = merged;
    void added;
  }

  for (const account of accounts) {
    for (const check of APP_CHECKS) {
      issues.push(...(await check(dataSource, account, alertConfig)));
    }
  }

  return sortIssues(issues);
}

/**
 * @param {import('../data-source/types.js').AnomalyIssue[]} issues
 */
function sortIssues(issues) {
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3, OK: 4 };
  return [...issues].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return `${a.account}${a.campaign}${a.issue}`.localeCompare(
      `${b.account}${b.campaign}${b.issue}`,
      'cs'
    );
  });
}

export {
  runAccountHealthCheck,
  runAdStrengthCheck,
  runBudgetLimitationCheck,
  runBudgetSpendWithTrendCheck,
  runCampaignHealthCheck,
  runCampaignPolicyAppCheck,
  runCampaignPolicyScriptCheck,
  runCampaignStatusCheck,
  runConversionTrackingCheck,
  runDisapprovedAdsCheck,
  runDisapprovedAssetsCheck,
  runDisapprovedKeywordsCheck,
  runEshopOverspendCheck,
  runPnoCheck,
  runQualityScoreCheck,
  isScriptBudgetOverspendIssue,
};
