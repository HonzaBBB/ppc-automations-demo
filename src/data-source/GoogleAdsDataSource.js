import { DataSource } from './DataSource.js';

/**
 * Production data source stub — not implemented in the public demo.
 *
 * In production this class wraps:
 * - Google Ads API (campaign metrics, account health, policy status, disapprovals)
 * - Google Sheets (AnomalyDetector Issues, Alert Config)
 *
 * See ppc-automation/platform/backend/src/ads/ and anomaly/ for the real implementation.
 */
export class GoogleAdsDataSource extends DataSource {
  constructor() {
    super();
    throw new Error(
      'GoogleAdsDataSource is a structural stub only. ' +
        'Use MockDataSource in the demo, or wire production credentials in your private fork.'
    );
  }
}
