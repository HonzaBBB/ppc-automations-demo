/**
 * Abstract data access layer for checks and reporting.
 * Production uses Google Ads API + Google Sheets; demo uses JSON fixtures.
 *
 * @abstract
 */
export class DataSource {
  /**
   * Pilot accounts included in daily runs and monthly reports.
   * @returns {Promise<import('./types.js').Account[]>}
   */
  async getAccounts() {
    throw new Error('DataSource.getAccounts() is not implemented');
  }

  /**
   * Alert thresholds and per-account check toggles.
   * @returns {Promise<import('./types.js').AlertConfig>}
   */
  async getAlertConfig() {
    throw new Error('DataSource.getAlertConfig() is not implemented');
  }

  /**
   * Campaign-level metrics for a rolling lookback window.
   * @param {string} customerId
   * @param {number} lookbackDays
   * @returns {Promise<import('./types.js').CampaignRow[]>}
   */
  async getCampaignMetrics(customerId, lookbackDays) {
    throw new Error('DataSource.getCampaignMetrics() is not implemented');
  }

  /**
   * Aggregated account metrics for an inclusive date range (YYYY-MM-DD).
   * Used by monthly reporting.
   * @param {string} customerId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<import('./types.js').AccountTotals>}
   */
  async getAccountTotalsForDateRange(customerId, startDate, endDate) {
    throw new Error('DataSource.getAccountTotalsForDateRange() is not implemented');
  }

  /**
   * Account status, billing and active campaign counts.
   * @param {string} customerId
   * @returns {Promise<import('./types.js').AccountHealthSnapshot>}
   */
  async getAccountHealth(customerId) {
    throw new Error('DataSource.getAccountHealth() is not implemented');
  }

  /**
   * @param {string} customerId
   * @returns {Promise<import('./types.js').DisapprovedItem[]>}
   */
  async getDisapprovedAds(customerId) {
    throw new Error('DataSource.getDisapprovedAds() is not implemented');
  }

  /**
   * @param {string} customerId
   * @returns {Promise<import('./types.js').DisapprovedItem[]>}
   */
  async getDisapprovedKeywords(customerId) {
    throw new Error('DataSource.getDisapprovedKeywords() is not implemented');
  }

  /**
   * @param {string} customerId
   * @returns {Promise<import('./types.js').DisapprovedItem[]>}
   */
  async getDisapprovedAssets(customerId) {
    throw new Error('DataSource.getDisapprovedAssets() is not implemented');
  }

  /**
   * Policy limitations at campaign / asset-group level.
   * @param {string} customerId
   * @returns {Promise<import('./types.js').CampaignPolicyIssue[]>}
   */
  async getCampaignPolicyIssues(customerId) {
    throw new Error('DataSource.getCampaignPolicyIssues() is not implemented');
  }

  /**
   * @param {string} customerId
   * @returns {Promise<import('./types.js').AdStrengthIssue[]>}
   */
  async getAdStrengthIssues(customerId) {
    throw new Error('DataSource.getAdStrengthIssues() is not implemented');
  }

  /**
   * @param {string} customerId
   * @returns {Promise<import('./types.js').QualityScoreIssue[]>}
   */
  async getQualityScoreIssues(customerId) {
    throw new Error('DataSource.getQualityScoreIssues() is not implemented');
  }
}
