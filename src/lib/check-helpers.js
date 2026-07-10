/**
 * @param {string} customerId
 * @param {string} campaign
 * @param {string} issue
 */
export function buildIssueFingerprint(customerId, campaign, issue) {
  const normalized = `${customerId}|${campaign}|${issue}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}

/**
 * @param {string} campaignName
 * @param {string} channelType
 */
export function formatCampaignLabel(campaignName, channelType) {
  if (channelType === 'PERFORMANCE_MAX') {
    return `${campaignName} [PMAX]`;
  }
  return campaignName;
}

/**
 * @param {import('../data-source/types.js').AlertConfig} alertConfig
 * @param {string} customerId
 */
export function findAccountSettings(alertConfig, customerId) {
  return alertConfig.accounts.find((account) => account.customerId === customerId);
}

/**
 * @param {import('../data-source/types.js').AccountAlertSettings | undefined} accountSettings
 * @param {keyof import('../data-source/types.js').AccountAlertSettings} key
 * @param {boolean} globalEnabled
 */
export function isAccountCheckEnabled(accountSettings, key, globalEnabled) {
  if (!globalEnabled) return false;
  if (!accountSettings) return true;
  return accountSettings[key] !== false;
}

/**
 * @param {string} campaignLabel
 * @param {string[]} ignoredCampaigns
 */
export function isCampaignIgnored(campaignLabel, ignoredCampaigns) {
  if (ignoredCampaigns.length === 0) return false;
  const normalizedLabel = campaignLabel.trim().toLowerCase();
  const plainName = normalizedLabel.replace(/\s+\[pmax\]$/i, '');
  return ignoredCampaigns.some((ignored) => {
    const normalizedIgnored = ignored.trim().toLowerCase();
    return normalizedIgnored === normalizedLabel || normalizedIgnored === plainName;
  });
}

/**
 * @param {Object} params
 * @param {string} params.account
 * @param {string} params.customerId
 * @param {string} params.campaign
 * @param {string} params.issue
 * @param {string} params.detail
 * @param {import('../data-source/types.js').IssueSeverity} params.severity
 * @returns {import('../data-source/types.js').AnomalyIssue}
 */
export function buildIssue({ account, customerId, campaign, issue, detail, severity }) {
  return { account, customerId, campaign, issue, detail, severity };
}
