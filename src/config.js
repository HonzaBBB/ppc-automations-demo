/**
 * Demo configuration — generic defaults only.
 * Production thresholds are tuned per client in Alert Config (Google Sheet).
 */

/** @type {import('./data-source/types.js').GlobalAlertSettings} */
export const DEFAULT_GLOBAL_ALERT_SETTINGS = {
  budgetUnderspendWarning: 60,
  budgetOverspendWarning: 90,
  budgetOverspendCritical: 100,
  trendEnabled: true,
  trendSignificantPct: 10,
  trendReduceSeverity: true,
  policyChecksEnabled: true,
  ignoredCampaigns: [],
  ignoredIssueTypes: [],
  conversionCheckEnabled: true,
  conversionMinSpend: 1000,
  conversionLookbackDays: 14,
  adStrengthEnabled: true,
  adStrengthAlertOn: ['POOR'],
  adStrengthIgnoredCampaigns: [],
  qsCheckEnabled: false,
  qsMinThreshold: 5,
  qsMinImpressions: 100,
  eshopOverspendEvalEnabled: true,
  eshopOverspendWarningPct: 90,
  eshopOverspendCriticalPct: 100,
  eshopOverspendRequireBadPno: true,
  eshopPnoRatioCritical: 1.25,
  eshopPnoLookbackDays: 14,
  eshopSpendLookbackDays: 7,
  eshopShowEfficientOverspendInfo: true,
  eshopEfficientPnoRatioMax: 1.0,
  eshopMinSpendForEval: 500,
  accountStatusCheckEnabled: true,
};

/**
 * Monthly report status badges — generic demo thresholds.
 * Production values live in platform/backend/src/reporting/thresholds.ts
 */
export const REPORTING_THRESHOLDS = {
  leadgenCpaGoodMaxPercent: -5,
  leadgenCpaStableMaxAbsPercent: 5,
  leadgenCpaBadMinPercent: 15,
  eshopRoasGoodMinPercent: 5,
  eshopRoasStableMaxAbsPercent: 5,
  eshopRoasBadMaxPercent: -15,
  minSpendForTrendCzk: 500,
  minConversionsForCpaTrend: 3,
  minSpendForRoasTrendCzk: 500,
};

/** Minimum budget lost IS (%) to flag — mirrors AnomalyDetector default */
export const BUDGET_LOST_IS_THRESHOLD = 10;

/** Campaign health lookback in days */
export const CAMPAIGN_HEALTH_LOOKBACK_DAYS = 7;
