/**
 * Monthly report builder — scaffold.
 * Full logic mirrors platform/backend/src/reporting/build-monthly-report.ts
 */

import { REPORTING_THRESHOLDS } from '../config.js';

/**
 * @param {string} monthKey YYYY-MM
 * @returns {{ year: number, month: number }}
 */
export function parseMonthKey(monthKey) {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) {
    throw new Error(`Invalid month key "${monthKey}" — expected YYYY-MM`);
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

/**
 * @param {number} year
 * @param {number} month 1-12
 * @returns {import('./types.js').MonthPeriod}
 */
export function buildMonthPeriod(year, month) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const startDate = `${monthKey}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  const label = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1)
  );

  return { year, month, monthKey, label, startDate, endDate };
}

/**
 * @param {import('../data-source/types.js').Account} account
 * @param {string} monthLabel Locative month label in Czech
 * @param {import('./types.js').PeriodMetrics} current
 * @param {import('./types.js').MetricChanges} changes
 */
function buildSummary(account, monthLabel, current, changes) {
  const spend = formatCzk(current.totals.spendCzk);
  const conv = formatNum(current.totals.conversions, 0);

  if (account.profile === 'leadgen') {
    const cpa = current.totals.cpaCzk !== null ? formatCzk(current.totals.cpaCzk) : '—';
    return (
      `V ${monthLabel} jsme investovali ${spend} a získali ${conv} konverzí. ` +
      `Průměrná cena konverze byla ${cpa}. Oproti předchozímu měsíci CPA ${formatChangePhrase(changes.cpaPercent)}.`
    );
  }

  const roas = current.totals.roas > 0 ? formatNum(current.totals.roas, 0) : '—';
  const pno =
    current.totals.pnoPercent !== null ? `${formatNum(current.totals.pnoPercent, 1)} %` : '—';

  return (
    `V ${monthLabel} jsme investovali ${spend}, získali ${conv} konverzí ` +
    `a dosáhli ROAS ${roas} (PNO ${pno}). Oproti předchozímu měsíci ROAS ${formatChangePhrase(changes.roasPercent)}.`
  );
}

function formatCzk(n) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNum(n, decimals = 1) {
  return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: decimals }).format(n);
}

function formatChangePhrase(value) {
  if (value === null) return 'bez srovnatelných dat z minulého měsíce';
  const abs = Math.abs(value);
  if (abs <= 3) return 'zůstalo přibližně stejné';
  const direction = value > 0 ? 'vzrostlo' : 'kleslo';
  return `${direction} o ${formatNum(abs, 1)} %`;
}

/**
 * Czech month name in locative case (v červnu…)
 * @param {number} year
 * @param {number} month
 */
export function formatMonthLabelLocative(year, month) {
  const locativeMonths = [
    'lednu',
    'únoru',
    'březnu',
    'dubnu',
    'květnu',
    'červnu',
    'červenci',
    'srpnu',
    'září',
    'říjnu',
    'listopadu',
    'prosinci',
  ];
  return `${locativeMonths[month - 1]} ${year}`;
}

/**
 * @param {number} year
 * @param {number} month
 * @returns {{ year: number, month: number }}
 */
export function getPreviousMonth(year, month) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * @param {number | null} current
 * @param {number | null} previous
 * @returns {number | null}
 */
export function percentChange(current, previous) {
  if (current === null || previous === null || previous === 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** @type {Record<import('./types.js').ReportStatus, { emoji: string, label: string }>} */
const STATUS_META = {
  good: { emoji: '🟢', label: 'Dobrý výkon' },
  warning: { emoji: '🟡', label: 'Střední výkon' },
  bad: { emoji: '🔴', label: 'Slabší výkon' },
};

/**
 * @param {import('./types.js').ReportStatus} status
 */
export function statusMeta(status) {
  return STATUS_META[status];
}

/**
 * @param {import('../data-source/types.js').AccountProfile} profile
 * @param {import('../data-source/types.js').AccountTotals} current
 * @param {import('../data-source/types.js').AccountTotals} previous
 * @returns {import('./types.js').ReportStatus}
 */
export function evaluateReportStatus(profile, current, previous) {
  const t = REPORTING_THRESHOLDS;

  if (current.spendCzk < t.minSpendForTrendCzk) {
    return 'warning';
  }

  if (profile === 'leadgen') {
    if (
      current.conversions < t.minConversionsForCpaTrend ||
      previous.conversions < t.minConversionsForCpaTrend ||
      current.cpaCzk === null ||
      previous.cpaCzk === null
    ) {
      return 'warning';
    }

    const change = percentChange(current.cpaCzk, previous.cpaCzk);
    if (change === null) return 'warning';
    if (change <= t.leadgenCpaGoodMaxPercent || Math.abs(change) <= t.leadgenCpaStableMaxAbsPercent) {
      return 'good';
    }
    if (change >= t.leadgenCpaBadMinPercent) {
      return 'bad';
    }
    return 'warning';
  }

  if (
    current.spendCzk < t.minSpendForRoasTrendCzk ||
    previous.spendCzk < t.minSpendForRoasTrendCzk ||
    current.roas <= 0 ||
    previous.roas <= 0
  ) {
    return 'warning';
  }

  const change = percentChange(current.roas, previous.roas);
  if (change === null) return 'warning';
  if (change >= t.eshopRoasGoodMinPercent || Math.abs(change) <= t.eshopRoasStableMaxAbsPercent) {
    return 'good';
  }
  if (change <= t.eshopRoasBadMaxPercent) {
    return 'bad';
  }
  return 'warning';
}

/**
 * @param {import('../data-source/types.js').Account} account
 * @param {string} monthKey
 * @param {import('../data-source/index.js').DataSource} dataSource
 * @returns {Promise<import('./types.js').MonthlyReport>}
 */
export async function buildMonthlyReport(account, monthKey, dataSource) {
  const { year, month } = parseMonthKey(monthKey);
  const prev = getPreviousMonth(year, month);
  const currentPeriod = buildMonthPeriod(year, month);
  const previousPeriod = buildMonthPeriod(prev.year, prev.month);

  const [currentTotals, previousTotals] = await Promise.all([
    dataSource.getAccountTotalsForDateRange(
      account.customerId,
      currentPeriod.startDate,
      currentPeriod.endDate
    ),
    dataSource.getAccountTotalsForDateRange(
      account.customerId,
      previousPeriod.startDate,
      previousPeriod.endDate
    ),
  ]);

  const changes = {
    spendPercent: percentChange(currentTotals.spendCzk, previousTotals.spendCzk),
    conversionsPercent: percentChange(currentTotals.conversions, previousTotals.conversions),
    cpaPercent: percentChange(currentTotals.cpaCzk, previousTotals.cpaCzk),
    roasPercent: percentChange(currentTotals.roas, previousTotals.roas),
    pnoPoints:
      currentTotals.pnoPercent !== null && previousTotals.pnoPercent !== null
        ? Math.round((currentTotals.pnoPercent - previousTotals.pnoPercent) * 10) / 10
        : null,
  };

  const status = evaluateReportStatus(account.profile, currentTotals, previousTotals);
  const meta = statusMeta(status);
  const monthLabel = formatMonthLabelLocative(year, month);
  const current = { period: currentPeriod, totals: currentTotals };

  return {
    accountId: account.customerId,
    accountName: account.label,
    profile: account.profile,
    month: monthKey,
    current,
    previous: { period: previousPeriod, totals: previousTotals },
    changes,
    status,
    statusEmoji: meta.emoji,
    statusLabel: meta.label,
    summary: buildSummary(account, monthLabel, current, changes),
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * @param {import('../data-source/types.js').Account[]} accounts
 * @param {string} monthKey
 * @param {import('../data-source/index.js').DataSource} dataSource
 * @returns {Promise<import('./types.js').MonthlyReport[]>}
 */
export async function buildMonthlyReportsOverview(accounts, monthKey, dataSource) {
  return Promise.all(accounts.map((account) => buildMonthlyReport(account, monthKey, dataSource)));
}
