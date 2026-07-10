import { buildIssue, findAccountSettings } from '../lib/check-helpers.js';
import { computeAccountTotals, computePnoRatio, computeProjectedSpendPct } from '../lib/metrics.js';
import { isScriptBudgetOverspendIssue } from './budget-spend-with-trend.js';

export const APP_OVERSPEND_ISSUE_HIGH = 'Budget Overspend + High PNO [app]';
export const APP_OVERSPEND_ISSUE_CRITICAL = 'Budget Overspend + High PNO (CRITICAL) [app]';
export const APP_EFFICIENT_OVERSPEND_ISSUE = 'Efficient Overspend [app]';

/**
 * @param {import('../data-source/types.js').GlobalAlertSettings} global
 * @param {Object} input
 */
export function evaluateEshopOverspend(input, global) {
  const {
    projectedSpendPct,
    actualPnoPercent,
    pnoRatio,
    targetMaxPno,
    projectedMonthlyCzk,
    monthlyBudgetCzk,
    spend7dCzk,
  } = input;

  if (!global.eshopOverspendEvalEnabled) {
    return { alert: false };
  }

  const pnoPart =
    actualPnoPercent !== null ? `PNO ${actualPnoPercent.toFixed(1)}%` : 'PNO n/a';
  const targetPart =
    targetMaxPno !== null ? ` (cíl ${(targetMaxPno * 100).toFixed(0)}%)` : '';
  const ratioPart = pnoRatio !== null ? ` | pno_ratio ${pnoRatio.toFixed(2)}` : ' | pno_ratio n/a';
  const baseDetail = `Projected ${Math.round(projectedMonthlyCzk)} / ${Math.round(monthlyBudgetCzk)} (${projectedSpendPct.toFixed(1)}%) | spend 7d ${Math.round(spend7dCzk)} CZK | ${pnoPart}${targetPart}${ratioPart}`;

  if (projectedSpendPct < global.eshopOverspendWarningPct) {
    return { alert: false };
  }

  if (global.eshopOverspendRequireBadPno && pnoRatio === null) {
    return { alert: false };
  }

  if (pnoRatio !== null && pnoRatio <= 1.0) {
    if (global.eshopShowEfficientOverspendInfo && pnoRatio <= global.eshopEfficientPnoRatioMax) {
      return { alert: false, info: true, detail: `${baseDetail} — efektivní overspend, alert potlačen` };
    }
    return { alert: false };
  }

  if (
    projectedSpendPct >= global.eshopOverspendCriticalPct &&
    pnoRatio !== null &&
    pnoRatio > global.eshopPnoRatioCritical
  ) {
    return {
      alert: true,
      severity: 'CRITICAL',
      issue: APP_OVERSPEND_ISSUE_CRITICAL,
      detail: `${baseDetail} — vysoké tempo + PNO nad cílem`,
    };
  }

  if (pnoRatio !== null && pnoRatio > 1.0) {
    return {
      alert: true,
      severity: 'HIGH',
      issue: APP_OVERSPEND_ISSUE_HIGH,
      detail: `${baseDetail} — tempo nad prahem + PNO nad cílem`,
    };
  }

  return { alert: false };
}

/**
 * E-shop overspend with PNO context.
 * Mirrors platform evaluate-eshop-overspend.ts.
 */
export async function runEshopOverspendCheck(
  dataSource,
  account,
  alertConfig,
  existingIssues,
  referenceDate = new Date()
) {
  if (account.profile !== 'eshop' || !alertConfig.global.eshopOverspendEvalEnabled) {
    return { issues: existingIssues, added: [] };
  }

  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (!accountSettings?.budgetCheck || !accountSettings.monthlyBudgetCzk || !accountSettings.maxPno) {
    return { issues: existingIssues, added: [] };
  }

  const eshopIds = new Set(
    alertConfig.accounts
      .filter((row) => {
        const pilot = account.customerId === row.customerId;
        return pilot;
      })
      .map((row) => row.customerId)
  );

  let issues = existingIssues.filter(
    (issue) => !(eshopIds.has(issue.customerId) && isScriptBudgetOverspendIssue(issue))
  );
  const added = [];
  const global = alertConfig.global;

  const [campaignsSpend, campaignsPno] = await Promise.all([
    dataSource.getCampaignMetrics(account.customerId, global.eshopSpendLookbackDays),
    dataSource.getCampaignMetrics(account.customerId, global.eshopPnoLookbackDays),
  ]);

  const spend7d = computeAccountTotals(campaignsSpend).spendCzk;
  if (spend7d < global.eshopMinSpendForEval) {
    return { issues, added };
  }

  const pnoTotals = computeAccountTotals(campaignsPno);
  const projectedSpendPct = computeProjectedSpendPct(
    spend7d,
    accountSettings.monthlyBudgetCzk,
    referenceDate
  );
  const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
  const projectedMonthlyCzk = (spend7d / 7) * daysInMonth;
  const pnoRatio = computePnoRatio(pnoTotals.pnoPercent, accountSettings.maxPno);

  const evalResult = evaluateEshopOverspend(
    {
      projectedSpendPct,
      actualPnoPercent: pnoTotals.pnoPercent,
      pnoRatio,
      targetMaxPno: accountSettings.maxPno,
      projectedMonthlyCzk,
      monthlyBudgetCzk: accountSettings.monthlyBudgetCzk,
      spend7dCzk: spend7d,
    },
    global
  );

  if (evalResult.alert) {
    const issue = buildIssue({
      account: account.label,
      customerId: account.customerId,
      campaign: 'ACCOUNT TOTAL',
      issue: evalResult.issue,
      detail: evalResult.detail,
      severity: evalResult.severity,
    });
    issues.push(issue);
    added.push(issue);
  } else if ('info' in evalResult && evalResult.info) {
    const issue = buildIssue({
      account: account.label,
      customerId: account.customerId,
      campaign: 'ACCOUNT TOTAL',
      issue: APP_EFFICIENT_OVERSPEND_ISSUE,
      detail: evalResult.detail,
      severity: 'INFO',
    });
    issues.push(issue);
    added.push(issue);
  }

  return { issues, added };
}
