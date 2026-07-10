import { buildIssue, findAccountSettings } from '../lib/check-helpers.js';
import { computeAccountTotals, computeProjectedSpendPct, computeSpendTrend } from '../lib/metrics.js';

/**
 * Monthly budget pacing with week-over-week trend.
 * Mirrors AnomalyDetector checkBudgetSpendWithTrend().
 */
export async function runBudgetSpendWithTrendCheck(dataSource, account, alertConfig, referenceDate = new Date()) {
  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.monitored || !accountSettings.budgetCheck) return [];
  if (!accountSettings.monthlyBudgetCzk) return [];

  const [campaigns7d, campaigns14d] = await Promise.all([
    dataSource.getCampaignMetrics(account.customerId, 7),
    dataSource.getCampaignMetrics(account.customerId, 14),
  ]);

  const currentSpend = computeAccountTotals(campaigns7d).spendCzk;
  const total14d = computeAccountTotals(campaigns14d).spendCzk;
  const previousSpend = total14d - currentSpend;
  const global = alertConfig.global;
  const { trendPct, trendDirection } = computeSpendTrend(
    currentSpend,
    previousSpend,
    global.trendSignificantPct
  );

  const monthlyBudget = accountSettings.monthlyBudgetCzk;
  const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
  const projectedMonthlySpend = (currentSpend / 7) * daysInMonth;
  const spendPercent = computeProjectedSpendPct(currentSpend, monthlyBudget, referenceDate);
  const trendSuffix = ` | Trend: ${trendDirection} (${trendPct.toFixed(1)}%)`;
  const baseDetail = `Projected ${Math.round(projectedMonthlySpend)} / ${Math.round(monthlyBudget)} (${spendPercent.toFixed(1)}%)${trendSuffix}`;
  const issues = [];

  if (spendPercent < global.budgetUnderspendWarning) {
    if (
      !(
        global.trendEnabled &&
        trendDirection === 'UP' &&
        global.trendReduceSeverity
      )
    ) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: 'ACCOUNT TOTAL',
          issue: 'Budget Underspend',
          detail: baseDetail,
          severity: 'MEDIUM',
        })
      );
    }
    return issues;
  }

  if (spendPercent > global.budgetOverspendCritical) {
    if (global.trendEnabled && trendDirection === 'DOWN' && global.trendReduceSeverity) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: 'ACCOUNT TOTAL',
          issue: 'Budget Overspend (Improving)',
          detail: baseDetail,
          severity: 'HIGH',
        })
      );
    } else {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: 'ACCOUNT TOTAL',
          issue: 'Budget Overspend (CRITICAL)',
          detail: baseDetail,
          severity: 'CRITICAL',
        })
      );
    }
    return issues;
  }

  if (spendPercent > global.budgetOverspendWarning) {
    if (!(global.trendEnabled && trendDirection === 'DOWN' && global.trendReduceSeverity)) {
      issues.push(
        buildIssue({
          account: account.label,
          customerId: account.customerId,
          campaign: 'ACCOUNT TOTAL',
          issue: 'Budget Overspend Warning',
          detail: baseDetail,
          severity: 'HIGH',
        })
      );
    }
  }

  return issues;
}

/** @param {import('../data-source/types.js').AnomalyIssue} issue */
export function isScriptBudgetOverspendIssue(issue) {
  return issue.campaign === 'ACCOUNT TOTAL' && /^Budget Overspend/i.test(issue.issue);
}
