/**
 * @typedef {'eshop' | 'leadgen'} AccountProfile
 */

/**
 * @typedef {Object} Account
 * @property {string} customerId
 * @property {string} label
 * @property {AccountProfile} profile
 */

/**
 * @typedef {Object} AccountAlertSettings
 * @property {string} customerId
 * @property {string} label
 * @property {boolean} monitored
 * @property {number | null} monthlyBudgetCzk
 * @property {number | null} maxPno
 * @property {boolean} budgetCheck
 * @property {boolean} pnoCheck
 * @property {boolean} policyCheck
 * @property {boolean} conversionCheck
 * @property {boolean} adStrengthCheck
 * @property {boolean} qsCheck
 * @property {boolean} campaignHealthCheck
 */

/**
 * @typedef {Object} GlobalAlertSettings
 * @property {number} budgetUnderspendWarning
 * @property {number} budgetOverspendWarning
 * @property {number} budgetOverspendCritical
 * @property {boolean} trendEnabled
 * @property {number} trendSignificantPct
 * @property {boolean} trendReduceSeverity
 * @property {boolean} policyChecksEnabled
 * @property {string[]} ignoredCampaigns
 * @property {string[]} ignoredIssueTypes
 * @property {boolean} conversionCheckEnabled
 * @property {number} conversionMinSpend
 * @property {number} conversionLookbackDays
 * @property {boolean} adStrengthEnabled
 * @property {string[]} adStrengthAlertOn
 * @property {string[]} adStrengthIgnoredCampaigns
 * @property {boolean} qsCheckEnabled
 * @property {number} qsMinThreshold
 * @property {number} qsMinImpressions
 * @property {boolean} eshopOverspendEvalEnabled
 * @property {number} eshopOverspendWarningPct
 * @property {number} eshopOverspendCriticalPct
 * @property {boolean} eshopOverspendRequireBadPno
 * @property {number} eshopPnoRatioCritical
 * @property {number} eshopPnoLookbackDays
 * @property {number} eshopSpendLookbackDays
 * @property {boolean} eshopShowEfficientOverspendInfo
 * @property {number} eshopEfficientPnoRatioMax
 * @property {number} eshopMinSpendForEval
 * @property {boolean} accountStatusCheckEnabled
 */

/**
 * @typedef {Object} AlertConfig
 * @property {GlobalAlertSettings} global
 * @property {AccountAlertSettings[]} accounts
 */

/**
 * @typedef {Object} CampaignRow
 * @property {string} campaignId
 * @property {string} campaignName
 * @property {string} channelType
 * @property {string} status
 * @property {string[]} statusReasons
 * @property {number} budgetCzk
 * @property {number} spendCzk
 * @property {number} clicks
 * @property {number} impressions
 * @property {number} conversions
 * @property {number} conversionValueCzk
 * @property {number} roas
 * @property {number | null} pnoPercent
 * @property {number | null} cpaCzk
 * @property {number} [budgetLostImpressionShare]
 */

/**
 * @typedef {Object} AccountTotals
 * @property {number} spendCzk
 * @property {number} conversions
 * @property {number} clicks
 * @property {number} conversionValueCzk
 * @property {number} roas
 * @property {number | null} pnoPercent
 * @property {number | null} cpaCzk
 */

/**
 * @typedef {Object} BillingSetup
 * @property {string} status
 */

/**
 * @typedef {Object} BillingSnapshot
 * @property {BillingSetup[]} setups
 * @property {string | null} queryError
 */

/**
 * @typedef {Object} IdentityVerificationSnapshot
 * @property {'data' | 'no_effective_billing' | 'unavailable'} kind
 * @property {string} [programStatus]
 * @property {string | null} [completionDeadline]
 * @property {string} [reason]
 */

/**
 * @typedef {Object} AccountHealthSnapshot
 * @property {string} customerId
 * @property {string} accountName
 * @property {string} status
 * @property {number} enabledCampaignCount
 * @property {number} pausedCampaignCount
 * @property {string[]} payPerConversionFailureReasons
 * @property {IdentityVerificationSnapshot} identityVerification
 * @property {BillingSnapshot} billing
 */

/**
 * @typedef {Object} DisapprovedItem
 * @property {string} campaignLabel
 * @property {string} entityLabel
 * @property {string} detail
 */

/**
 * @typedef {Object} CampaignPolicyIssue
 * @property {'script' | 'app'} [kind]
 * @property {string} campaignLabel
 * @property {string} policyTopic
 * @property {string} detail
 */

/**
 * @typedef {Object} AdStrengthIssue
 * @property {string} campaignLabel
 * @property {string} adLabel
 * @property {string} strength
 */

/**
 * @typedef {Object} QualityScoreIssue
 * @property {string} campaignLabel
 * @property {string} keywordLabel
 * @property {number} qualityScore
 * @property {number} impressions
 */

/**
 * @typedef {'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO' | 'OK'} IssueSeverity
 */

/**
 * @typedef {Object} AnomalyIssue
 * @property {string} account
 * @property {string} customerId
 * @property {string} campaign
 * @property {string} issue
 * @property {string} detail
 * @property {IssueSeverity} severity
 */

export {};
