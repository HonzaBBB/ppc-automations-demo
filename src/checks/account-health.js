import { buildIssue, findAccountSettings } from '../lib/check-helpers.js';

export const APP_ACCOUNT_SUSPENDED_ISSUE = 'Account Suspended [app]';
export const APP_ACCOUNT_PAUSED_ISSUE = 'Account Paused (No Active Campaigns) [app]';
export const APP_ACCOUNT_UNREACHABLE_ISSUE = 'Account Unreachable [app]';
export const APP_ACCOUNT_VERIFICATION_ISSUE = 'Account Verification Expired [app]';
export const APP_ACCOUNT_BILLING_ISSUE = 'Invalid Payment Method [app]';

/**
 * @param {import('../data-source/types.js').AccountHealthSnapshot} snapshot
 * @returns {{ alert: boolean, issue?: string, severity?: import('../data-source/types.js').IssueSeverity, detail?: string }}
 */
export function evaluateAccountHealthSnapshot(snapshot) {
  if (snapshot.status !== 'ENABLED') {
    return {
      alert: true,
      issue: APP_ACCOUNT_SUSPENDED_ISSUE,
      severity: 'CRITICAL',
      detail: `Stav účtu: ${snapshot.status} — účet není aktivní v Google Ads`,
    };
  }

  const verification = snapshot.identityVerification;

  if (verification.kind === 'no_effective_billing') {
    return {
      alert: true,
      issue: APP_ACCOUNT_BILLING_ISSUE,
      severity: 'CRITICAL',
      detail:
        'Google Ads hlásí NO_EFFECTIVE_BILLING — nelze účtovat na vrub platebních metod.',
    };
  }

  if (
    verification.kind === 'unavailable' &&
    verification.reason === 'NOT_MONTHLY_INVOICING' &&
    snapshot.payPerConversionFailureReasons.includes('OTHER')
  ) {
    return {
      alert: true,
      issue: APP_ACCOUNT_BILLING_ISSUE,
      severity: 'CRITICAL',
      detail:
        'Nelze účtovat na vrub platebních metod (pay_per_conversion=OTHER) — přidej nebo oprav platební metodu.',
    };
  }

  if (snapshot.billing.setups.length === 0) {
    return {
      alert: true,
      issue: APP_ACCOUNT_BILLING_ISSUE,
      severity: 'CRITICAL',
      detail: 'Účet nemá žádný billing setup — reklamy nemohou běžet bez platící metody.',
    };
  }

  const hasApproved = snapshot.billing.setups.some((setup) => setup.status === 'APPROVED');
  if (!hasApproved) {
    const statuses = snapshot.billing.setups.map((setup) => setup.status).join(', ');
    return {
      alert: true,
      issue: APP_ACCOUNT_BILLING_ISSUE,
      severity: 'CRITICAL',
      detail: `Billing setup není schválený (stav: ${statuses}).`,
    };
  }

  if (snapshot.enabledCampaignCount === 0) {
    const pausedPart =
      snapshot.pausedCampaignCount > 0
        ? `${snapshot.pausedCampaignCount} PAUSED kampaní, 0 ENABLED`
        : 'žádné ENABLED ani PAUSED kampaně';
    return {
      alert: true,
      issue: APP_ACCOUNT_PAUSED_ISSUE,
      severity: 'CRITICAL',
      detail: `Účet nemá aktivní kampaně (${pausedPart}) — reklamy neběží`,
    };
  }

  if (verification.kind === 'data') {
    if (verification.programStatus === 'FAILURE') {
      return {
        alert: true,
        issue: APP_ACCOUNT_VERIFICATION_ISSUE,
        severity: 'CRITICAL',
        detail: 'Ověření inzerenta selhalo — účet může být pozastavený',
      };
    }
  }

  return { alert: false };
}

/**
 * Account health via API layer.
 * Mirrors platform evaluate-account-health.ts.
 */
export async function runAccountHealthCheck(dataSource, account, alertConfig) {
  if (!alertConfig.global.accountStatusCheckEnabled) return [];

  const accountSettings = findAccountSettings(alertConfig, account.customerId);
  if (accountSettings && !accountSettings.monitored) return [];

  try {
    const snapshot = await dataSource.getAccountHealth(account.customerId);
    const result = evaluateAccountHealthSnapshot(snapshot);
    if (!result.alert) return [];

    return [
      buildIssue({
        account: account.label,
        customerId: account.customerId,
        campaign: 'ACCOUNT TOTAL',
        issue: result.issue,
        detail: result.detail,
        severity: result.severity,
      }),
    ];
  } catch (error) {
    return [
      buildIssue({
        account: account.label,
        customerId: account.customerId,
        campaign: 'ACCOUNT TOTAL',
        issue: APP_ACCOUNT_UNREACHABLE_ISSUE,
        detail: `Data source error: ${/** @type {Error} */ (error).message}`,
        severity: 'CRITICAL',
      }),
    ];
  }
}
