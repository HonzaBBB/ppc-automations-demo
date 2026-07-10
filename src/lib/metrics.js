/**
 * @param {import('../data-source/types.js').CampaignRow[]} campaigns
 * @returns {import('../data-source/types.js').AccountTotals}
 */
export function computeAccountTotals(campaigns) {
  const spendCzk = campaigns.reduce((sum, row) => sum + row.spendCzk, 0);
  const conversions = campaigns.reduce((sum, row) => sum + row.conversions, 0);
  const clicks = campaigns.reduce((sum, row) => sum + row.clicks, 0);
  const conversionValueCzk = campaigns.reduce((sum, row) => sum + row.conversionValueCzk, 0);
  const pnoPercent =
    conversionValueCzk > 0 ? Math.round((spendCzk / conversionValueCzk) * 1000) / 10 : null;
  const cpaCzk = conversions > 0 ? Math.round(spendCzk / conversions) : null;
  const roas = spendCzk > 0 ? Math.round((conversionValueCzk / spendCzk) * 100) : 0;

  return {
    spendCzk,
    conversions,
    clicks,
    conversionValueCzk,
    roas,
    pnoPercent,
    cpaCzk,
  };
}

/**
 * @param {number} spend7dCzk
 * @param {number} monthlyBudgetCzk
 * @param {Date} [referenceDate]
 */
export function computeProjectedSpendPct(spend7dCzk, monthlyBudgetCzk, referenceDate = new Date()) {
  const daysInMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0
  ).getDate();
  const projectedMonthly = (spend7dCzk / 7) * daysInMonth;
  return (projectedMonthly / monthlyBudgetCzk) * 100;
}

/**
 * @param {number | null} actualPnoPercent
 * @param {number | null} targetMaxPno Decimal (0.25 = 25 %)
 */
export function computePnoRatio(actualPnoPercent, targetMaxPno) {
  if (actualPnoPercent === null || targetMaxPno === null || targetMaxPno <= 0) {
    return null;
  }
  const targetPct = targetMaxPno * 100;
  if (targetPct <= 0) return null;
  return actualPnoPercent / targetPct;
}

/**
 * @param {number} currentSpend
 * @param {number} previousSpend
 * @param {number} significantPct
 */
export function computeSpendTrend(currentSpend, previousSpend, significantPct) {
  if (previousSpend <= 0) {
    return { trendPct: 0, trendDirection: 'STABLE' };
  }

  const trendPct = ((currentSpend - previousSpend) / previousSpend) * 100;
  let trendDirection = 'STABLE';

  if (trendPct > significantPct) {
    trendDirection = 'UP';
  } else if (trendPct < -significantPct) {
    trendDirection = 'DOWN';
  }

  return { trendPct, trendDirection };
}
