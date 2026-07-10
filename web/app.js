import { runAllChecks } from '../src/checks/index.js';
import { BrowserDataSource } from '../src/data-source/BrowserDataSource.js';
import { buildMonthlyReportsOverview } from '../src/reporting/build-monthly-report.js';
import { getFixturesBaseUrl } from './site-base.js';

const runButton = document.getElementById('run-demo');
const refreshButton = document.getElementById('refresh-btn');
const alertBadge = document.getElementById('alert-badge');
const statusEl = document.getElementById('status');
const statusPill = document.getElementById('status-pill');
const summaryEl = document.getElementById('summary');
const reportEl = document.getElementById('report');

/**
 * @param {string} text
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {'ok' | 'warn' | 'err'} state
 * @param {string} message
 */
function setStatus(state, message) {
  statusPill.className = `status-pill ${state}`;
  statusEl.textContent = message;
}

/**
 * @param {import('../src/data-source/types.js').IssueSeverity} severity
 */
function severityClass(severity) {
  return `severity-${severity.toLowerCase()}`;
}

/**
 * @param {import('../src/data-source/types.js').AnomalyIssue[]} issues
 * @param {{ simulatedRunDate: string, reportMonth: string }} meta
 */
function renderKpis(issues, meta) {
  const critical = issues.filter((issue) => issue.severity === 'CRITICAL').length;
  const high = issues.filter((issue) => issue.severity === 'HIGH').length;
  const accounts = new Set(issues.map((issue) => issue.customerId)).size;

  summaryEl.innerHTML = `
    <div class="kpi">
      <span class="kpi-label">Simulovaný běh</span>
      <span class="kpi-value">${escapeHtml(meta.simulatedRunDate)}</span>
    </div>
    <div class="kpi">
      <span class="kpi-label">Problémů</span>
      <span class="kpi-value">${issues.length}</span>
    </div>
    <div class="kpi">
      <span class="kpi-label">Critical</span>
      <span class="kpi-value">${critical}</span>
    </div>
    <div class="kpi">
      <span class="kpi-label">High</span>
      <span class="kpi-value">${high}</span>
    </div>
    <div class="kpi">
      <span class="kpi-label">Mock účtů</span>
      <span class="kpi-value">${accounts}</span>
    </div>
    <div class="kpi">
      <span class="kpi-label">Reporting</span>
      <span class="kpi-value">${escapeHtml(meta.reportMonth)}</span>
    </div>
  `;
  summaryEl.classList.remove('hidden');
}

/**
 * @param {import('../src/data-source/types.js').AnomalyIssue[]} issues
 */
function renderIssueTable(issues) {
  if (issues.length === 0) {
    return '<p class="section-empty">Žádné problémy.</p>';
  }

  const rows = issues
    .map(
      (issue) => `
        <tr>
          <td><span class="severity-pill ${severityClass(issue.severity)}">${issue.severity}</span></td>
          <td class="name">${escapeHtml(issue.account)}</td>
          <td class="name"><code>${escapeHtml(issue.campaign)}</code></td>
          <td>${escapeHtml(issue.issue)}</td>
          <td class="detail-cell">${escapeHtml(issue.detail)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Účet</th>
            <th>Kampaň</th>
            <th>Issue</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/**
 * @param {string} title
 * @param {string} description
 * @param {import('../src/data-source/types.js').AnomalyIssue[]} issues
 * @param {{ critical?: boolean }} [options]
 */
function renderIssueSection(title, description, issues, options = {}) {
  return `
    <section class="alerts-section">
      <h2 class="section-title ${options.critical ? 'section-critical' : ''}">
        ${escapeHtml(title)}
        <span class="section-count">${issues.length}</span>
      </h2>
      <p class="section-desc">${escapeHtml(description)}</p>
      ${renderIssueTable(issues)}
    </section>
  `;
}

/**
 * @param {import('../src/reporting/types.js').MonthlyReport[]} reports
 */
function renderMonthlySection(reports) {
  const rows = reports
    .map(
      (report) => `
        <tr>
          <td class="report-status">${report.statusEmoji}</td>
          <td class="name">${escapeHtml(report.accountName)}</td>
          <td>${escapeHtml(report.profile)}</td>
          <td>${escapeHtml(report.statusLabel)}</td>
          <td>${Math.round(report.current.totals.spendCzk).toLocaleString('cs-CZ')} Kč</td>
          <td>${report.current.totals.conversions}</td>
          <td class="report-summary-cell">${escapeHtml(report.summary)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <section class="config-section">
      <h2>Měsíční reporting</h2>
      <p class="section-hint">Mock přehled za ${escapeHtml(reports[0]?.month ?? '—')} · srovnání s předchozím měsícem</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Účet</th>
              <th>Profil</th>
              <th>Status</th>
              <th>Spend</th>
              <th>Konverze</th>
              <th>Shrnutí</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * @param {import('../src/data-source/types.js').AnomalyIssue[]} issues
 * @param {import('../src/reporting/types.js').MonthlyReport[]} monthlyReports
 */
function renderReport(issues, monthlyReports) {
  const actionRequired = issues.filter(
    (issue) => issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
  );
  const lowerPriority = issues.filter(
    (issue) => issue.severity === 'MEDIUM' || issue.severity === 'INFO'
  );

  reportEl.innerHTML = `
    ${renderIssueSection(
      'Vyžaduje pozornost',
      'CRITICAL a HIGH — stejná logika jako záložka Alerts v produkci.',
      actionRequired,
      { critical: true }
    )}
    ${renderIssueSection(
      'Nižší priorita',
      'MEDIUM a INFO — informativní nálezy, bez okamžité akce.',
      lowerPriority
    )}
    ${renderMonthlySection(monthlyReports)}
  `;
  reportEl.classList.remove('hidden');
}

async function runDemoInBrowser() {
  runButton.disabled = true;
  if (refreshButton) refreshButton.disabled = true;
  setStatus('warn', 'Načítám mock data a spouštím kontroly…');
  reportEl.classList.add('hidden');
  summaryEl.classList.add('hidden');

  try {
    const dataSource = new BrowserDataSource(getFixturesBaseUrl());
    const meta = await dataSource.getMeta();
    const referenceDate = new Date(`${meta.simulatedRunDate}T12:00:00`);
    const accounts = await dataSource.getAccounts();

    const [issues, monthlyReports] = await Promise.all([
      runAllChecks(dataSource, referenceDate),
      buildMonthlyReportsOverview(accounts, meta.reportMonth, dataSource),
    ]);

    renderKpis(issues, meta);
    renderReport(issues, monthlyReports);

    const actionRequired = issues.filter(
      (issue) => issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
    ).length;
    if (actionRequired > 0) {
      alertBadge.textContent = String(actionRequired);
      alertBadge.classList.remove('hidden');
    } else {
      alertBadge.classList.add('hidden');
    }

    setStatus('ok', `Běh dokončen · ${meta.simulatedRunDate} · ${issues.length} problémů`);
  } catch (error) {
    setStatus('err', `Chyba: ${/** @type {Error} */ (error).message}`);
  } finally {
    runButton.disabled = false;
    if (refreshButton) refreshButton.disabled = false;
  }
}

runButton.addEventListener('click', () => {
  void runDemoInBrowser();
});

if (refreshButton) {
  refreshButton.addEventListener('click', () => {
    void runDemoInBrowser();
  });
}
