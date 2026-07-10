/**
 * @typedef {'good' | 'warning' | 'bad'} ReportStatus
 */

/**
 * @typedef {Object} MonthPeriod
 * @property {number} year
 * @property {number} month
 * @property {string} monthKey
 * @property {string} label
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @typedef {Object} PeriodMetrics
 * @property {MonthPeriod} period
 * @property {import('../data-source/types.js').AccountTotals} totals
 */

/**
 * @typedef {Object} MetricChanges
 * @property {number | null} spendPercent
 * @property {number | null} conversionsPercent
 * @property {number | null} cpaPercent
 * @property {number | null} roasPercent
 * @property {number | null} pnoPoints
 */

/**
 * @typedef {Object} MonthlyReport
 * @property {string} accountId
 * @property {string} accountName
 * @property {import('../data-source/types.js').AccountProfile} profile
 * @property {string} month
 * @property {PeriodMetrics} current
 * @property {PeriodMetrics} previous
 * @property {MetricChanges} changes
 * @property {ReportStatus} status
 * @property {string} statusEmoji
 * @property {string} statusLabel
 * @property {string} summary
 * @property {string} fetchedAt
 */

export {};
