import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DataSource } from '../src/data-source/DataSource.js';
import { GoogleAdsDataSource } from '../src/data-source/GoogleAdsDataSource.js';
import { MockDataSource } from '../src/data-source/MockDataSource.js';
import { evaluateReportStatus } from '../src/reporting/build-monthly-report.js';

test('DataSource base class throws on unimplemented methods', async () => {
  const source = new DataSource();
  await assert.rejects(() => source.getAccounts(), /not implemented/);
});

test('GoogleAdsDataSource is a non-functional stub', () => {
  assert.throws(() => new GoogleAdsDataSource(), /structural stub only/);
});

test('MockDataSource reports missing fixtures clearly', async () => {
  const source = new MockDataSource({ fixturesDir: '/nonexistent/path' });
  await assert.rejects(() => source.getAccounts(), /Fixture file not found/);
});

test('evaluateReportStatus uses generic demo thresholds for leadgen', () => {
  const current = {
    spendCzk: 10000,
    conversions: 50,
    clicks: 1000,
    conversionValueCzk: 0,
    roas: 0,
    pnoPercent: null,
    cpaCzk: 200,
  };
  const previous = {
    spendCzk: 10000,
    conversions: 50,
    clicks: 1000,
    conversionValueCzk: 0,
    roas: 0,
    pnoPercent: null,
    cpaCzk: 250,
  };

  assert.equal(evaluateReportStatus('leadgen', current, previous), 'good');
});
