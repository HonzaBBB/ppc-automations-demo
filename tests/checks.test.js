import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runAllChecks } from '../src/checks/index.js';
import { runCampaignHealthCheck } from '../src/checks/campaign-health.js';
import { runBudgetSpendWithTrendCheck } from '../src/checks/budget-spend-with-trend.js';
import { evaluateAccountHealthSnapshot } from '../src/checks/account-health.js';
import { evaluateEshopOverspend } from '../src/checks/eshop-overspend.js';
import { MockDataSource } from '../src/data-source/MockDataSource.js';
import { DEFAULT_GLOBAL_ALERT_SETTINGS } from '../src/config.js';

const dataSource = new MockDataSource();
const referenceDate = new Date('2026-06-30T12:00:00');

test('fixtures load three demo accounts', async () => {
  const accounts = await dataSource.getAccounts();
  assert.equal(accounts.length, 3);
  assert.ok(accounts.every((account) => /^800100200[1-3]$/.test(account.customerId)));
});

test('campaign-health flags zero impressions and zero clicks', async () => {
  const accounts = await dataSource.getAccounts();
  const alertConfig = await dataSource.getAlertConfig();
  const servixa = accounts.find((account) => account.customerId === '8001002002');
  assert.ok(servixa);

  const issues = await runCampaignHealthCheck(dataSource, servixa, alertConfig);
  assert.ok(issues.some((issue) => issue.issue === 'Zero Impressions (7 days)'));
  assert.ok(issues.some((issue) => issue.issue === 'Zero Clicks (7 days)'));
});

test('budget spend detects underspend and critical overspend', async () => {
  const accounts = await dataSource.getAccounts();
  const alertConfig = await dataSource.getAlertConfig();

  const servixa = accounts.find((account) => account.customerId === '8001002002');
  const leadflow = accounts.find((account) => account.customerId === '8001002003');

  const underspend = await runBudgetSpendWithTrendCheck(
    dataSource,
    servixa,
    alertConfig,
    referenceDate
  );
  assert.ok(underspend.some((issue) => issue.issue === 'Budget Underspend'));

  const overspend = await runBudgetSpendWithTrendCheck(
    dataSource,
    leadflow,
    alertConfig,
    referenceDate
  );
  assert.ok(overspend.some((issue) => issue.issue === 'Budget Overspend (CRITICAL)'));
});

test('account health detects invalid payment method', () => {
  const result = evaluateAccountHealthSnapshot({
    customerId: '8001002003',
    accountName: 'LeadFlow Demo',
    status: 'ENABLED',
    enabledCampaignCount: 2,
    pausedCampaignCount: 1,
    payPerConversionFailureReasons: ['OTHER'],
    identityVerification: { kind: 'unavailable', reason: 'NOT_MONTHLY_INVOICING' },
    billing: { setups: [], queryError: null },
  });

  assert.equal(result.alert, true);
  assert.equal(result.issue, 'Invalid Payment Method [app]');
});

test('eshop overspend evaluation triggers on high PNO', () => {
  const result = evaluateEshopOverspend(
    {
      projectedSpendPct: 105,
      actualPnoPercent: 45,
      pnoRatio: 1.8,
      targetMaxPno: 0.25,
      projectedMonthlyCzk: 52500,
      monthlyBudgetCzk: 50000,
      spend7dCzk: 12000,
    },
    DEFAULT_GLOBAL_ALERT_SETTINGS
  );

  assert.equal(result.alert, true);
  assert.equal(result.issue, 'Budget Overspend + High PNO (CRITICAL) [app]');
});

test('runAllChecks covers every check module at least once', async () => {
  const issues = await runAllChecks(dataSource, referenceDate);
  const issueNames = new Set(issues.map((issue) => issue.issue));

  const expected = [
    'Zero Impressions (7 days)',
    'Zero Clicks (7 days)',
    'Budget Lost Impression Share',
    'Campaign Status: Limited by Budget',
    'Campaign Status: Limited by Bidding Strategy',
    'Budget Underspend',
    'Budget Overspend (CRITICAL)',
    'PNO Critical',
    'Disapproved Ads',
    'Disapproved Keywords',
    'Disapproved Assets',
    'Campaign Policy Limitation',
    'No Conversions',
    'Weak Ad Strength',
    'Low Quality Score',
    'Invalid Payment Method [app]',
    'Budget Overspend + High PNO (CRITICAL) [app]',
    'Campaign Policy Limitation [app]',
  ];

  for (const name of expected) {
    assert.ok(issueNames.has(name), `Missing expected issue: ${name}`);
  }
});
