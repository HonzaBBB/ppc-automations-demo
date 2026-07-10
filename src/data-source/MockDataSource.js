import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from './DataSource.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FIXTURES_DIR = path.resolve(__dirname, '../../fixtures');

/**
 * @param {string} filePath
 * @returns {Promise<unknown>}
 */
async function readJsonFile(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      throw new Error(`Fixture file not found: ${filePath}`);
    }
    throw new Error(`Cannot read fixture ${filePath}: ${/** @type {Error} */ (error).message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in fixture ${filePath}: ${/** @type {Error} */ (error).message}`);
  }
}

/**
 * Demo data source — reads structured JSON from /fixtures.
 */
export class MockDataSource extends DataSource {
  /**
   * @param {{ fixturesDir?: string }} [options]
   */
  constructor(options = {}) {
    super();
    this.fixturesDir = options.fixturesDir ?? DEFAULT_FIXTURES_DIR;
  }

  /**
   * @param {string} relativePath
   * @returns {Promise<unknown>}
   */
  async loadFixture(relativePath) {
    const filePath = path.join(this.fixturesDir, relativePath);
    return readJsonFile(filePath);
  }

  /** @returns {Promise<import('./types.js').Account[]>} */
  async getAccounts() {
    const data = /** @type {{ accounts: import('./types.js').Account[] }} */ (
      await this.loadFixture('accounts.json')
    );

    if (!Array.isArray(data.accounts) || data.accounts.length === 0) {
      throw new Error('fixtures/accounts.json must contain a non-empty "accounts" array');
    }

    return data.accounts;
  }

  /** @returns {Promise<import('./types.js').AlertConfig>} */
  async getAlertConfig() {
    const data = /** @type {import('./types.js').AlertConfig} */ (
      await this.loadFixture('alert-config.json')
    );

    if (!data.global || !Array.isArray(data.accounts)) {
      throw new Error('fixtures/alert-config.json must contain "global" and "accounts"');
    }

    return data;
  }

  /**
   * @param {string} customerId
   * @returns {Promise<string>}
   */
  async accountDir(customerId) {
    const dir = path.join(this.fixturesDir, 'accounts', customerId);
    return dir;
  }

  /**
   * @param {string} customerId
   * @param {string} fileName
   * @returns {Promise<unknown>}
   */
  async loadAccountFixture(customerId, fileName) {
    return this.loadFixture(path.join('accounts', customerId, fileName));
  }

  /** @returns {Promise<{ reportMonth: string, simulatedRunDate: string }>} */
  async getMeta() {
    const data = /** @type {{ reportMonth?: string, simulatedRunDate?: string }} */ (
      await this.loadFixture('meta.json')
    );

    if (!data.reportMonth || !data.simulatedRunDate) {
      throw new Error('fixtures/meta.json must contain "reportMonth" and "simulatedRunDate"');
    }

    return { reportMonth: data.reportMonth, simulatedRunDate: data.simulatedRunDate };
  }

  /** @inheritdoc */
  async getCampaignMetrics(customerId, lookbackDays) {
    const data = /** @type {{
      lookbacks?: Record<string, { campaigns: import('./types.js').CampaignRow[] }>,
      lookbackDays?: number,
      campaigns?: import('./types.js').CampaignRow[]
    }} */ (await this.loadAccountFixture(customerId, 'campaign-metrics.json'));

    const key = String(lookbackDays);

    if (data.lookbacks?.[key]?.campaigns) {
      return data.lookbacks[key].campaigns;
    }

    // Backward-compatible single-lookback shape
    if (data.lookbackDays === lookbackDays && Array.isArray(data.campaigns)) {
      return data.campaigns;
    }

    throw new Error(
      `No campaign-metrics lookback ${lookbackDays}d for account ${customerId} in fixtures`
    );
  }

  /** @inheritdoc */
  async getAccountTotalsForDateRange(customerId, startDate, endDate) {
    const data = /** @type {{
      periods: Array<{ startDate: string, endDate: string, totals: import('./types.js').AccountTotals }>
    }} */ (await this.loadAccountFixture(customerId, 'monthly-metrics.json'));

    if (!Array.isArray(data.periods)) {
      throw new Error(
        `fixtures/accounts/${customerId}/monthly-metrics.json must contain "periods" array`
      );
    }

    const match = data.periods.find(
      (period) => period.startDate === startDate && period.endDate === endDate
    );

    if (!match) {
      throw new Error(
        `No monthly-metrics period for ${customerId} (${startDate} – ${endDate}) in fixtures`
      );
    }

    return match.totals;
  }

  /** @inheritdoc */
  async getAccountHealth(customerId) {
    return /** @type {import('./types.js').AccountHealthSnapshot} */ (
      await this.loadAccountFixture(customerId, 'account-health.json')
    );
  }

  /** @inheritdoc */
  async getDisapprovedAds(customerId) {
    const data = /** @type {{ items: import('./types.js').DisapprovedItem[] }} */ (
      await this.loadAccountFixture(customerId, 'disapproved-ads.json')
    );
    return data.items ?? [];
  }

  /** @inheritdoc */
  async getDisapprovedKeywords(customerId) {
    const data = /** @type {{ items: import('./types.js').DisapprovedItem[] }} */ (
      await this.loadAccountFixture(customerId, 'disapproved-keywords.json')
    );
    return data.items ?? [];
  }

  /** @inheritdoc */
  async getDisapprovedAssets(customerId) {
    const data = /** @type {{ items: import('./types.js').DisapprovedItem[] }} */ (
      await this.loadAccountFixture(customerId, 'disapproved-assets.json')
    );
    return data.items ?? [];
  }

  /** @inheritdoc */
  async getCampaignPolicyIssues(customerId) {
    const data = /** @type {{ items: import('./types.js').CampaignPolicyIssue[] }} */ (
      await this.loadAccountFixture(customerId, 'campaign-policy.json')
    );
    return data.items ?? [];
  }

  /** @inheritdoc */
  async getAdStrengthIssues(customerId) {
    const data = /** @type {{ items: import('./types.js').AdStrengthIssue[] }} */ (
      await this.loadAccountFixture(customerId, 'ad-strength.json')
    );
    return data.items ?? [];
  }

  /** @inheritdoc */
  async getQualityScoreIssues(customerId) {
    const data = /** @type {{ items: import('./types.js').QualityScoreIssue[] }} */ (
      await this.loadAccountFixture(customerId, 'quality-score.json')
    );
    return data.items ?? [];
  }
}
