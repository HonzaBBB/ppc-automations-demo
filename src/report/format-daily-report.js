import { buildMonthlyReportsOverview } from '../reporting/build-monthly-report.js';

const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'];

/**
 * @param {import('../data-source/types.js').AnomalyIssue[]} issues
 * @param {import('../reporting/types.js').MonthlyReport[]} monthlyReports
 * @param {{ simulatedRunDate: string, reportMonth: string }} meta
 * @returns {string}
 */
export function formatDailyReportMarkdown(issues, monthlyReports, meta) {
  const lines = [
    '# PPC Automation Demo — Daily Report',
    '',
    `_Simulovaný běh: ${meta.simulatedRunDate}_`,
    `_Vygenerováno: ${new Date().toISOString()}_`,
    '',
    '## Shrnutí',
    '',
    `- **Kontrol:** 13 modulů (10 skript + 3 app)`,
    `- **Nalezeno problémů:** ${issues.length}`,
    `- **Účtů v mock datech:** ${new Set(issues.map((issue) => issue.customerId)).size || 3}`,
    '',
    '## Denní kontroly',
    '',
  ];

  if (issues.length === 0) {
    lines.push('_Žádné problémy._');
  } else {
    for (const severity of SEVERITY_ORDER) {
      const group = issues.filter((issue) => issue.severity === severity);
      if (group.length === 0) continue;

      lines.push(`### ${severity}`, '');
      for (const issue of group) {
        lines.push(
          `- **${issue.account}** · \`${issue.campaign}\``,
          `  - ${issue.issue}`,
          `  - ${issue.detail}`,
          ''
        );
      }
    }
  }

  lines.push('## Měsíční reporting', '');
  lines.push(`Období: **${meta.reportMonth}** (srovnání s předchozím měsícem)`, '');

  for (const report of monthlyReports) {
    const metricLine =
      report.profile === 'leadgen'
        ? `Spend ${formatCzk(report.current.totals.spendCzk)} · Konverze ${report.current.totals.conversions} · CPA ${report.current.totals.cpaCzk !== null ? formatCzk(report.current.totals.cpaCzk) : '—'}`
        : `Spend ${formatCzk(report.current.totals.spendCzk)} · Konverze ${report.current.totals.conversions} · ROAS ${report.current.totals.roas} · PNO ${report.current.totals.pnoPercent ?? '—'} %`;

    lines.push(
      `### ${report.statusEmoji} ${report.accountName}`,
      '',
      `- Status: **${report.statusLabel}**`,
      `- ${metricLine}`,
      `- ${report.summary}`,
      ''
    );
  }

  lines.push(
    '---',
    '',
    '_Demo běží na fiktivních datech. Produční prahy a klientské konfigurace nejsou součástí repozitáře._',
    ''
  );

  return lines.join('\n');
}

/**
 * @param {number} value
 */
function formatCzk(value) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * @param {string} markdown
 */
export function printReportToConsole(markdown) {
  console.log(markdown);
}

/**
 * @param {import('../data-source/types.js').Account[]} accounts
 * @param {string} monthKey
 * @param {import('../data-source/index.js').DataSource} dataSource
 */
export async function buildReportMonthlySection(accounts, monthKey, dataSource) {
  return buildMonthlyReportsOverview(accounts, monthKey, dataSource);
}
