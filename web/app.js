import { runAllChecks } from '../src/checks/index.js';
import { BrowserDataSource } from '../src/data-source/BrowserDataSource.js';
import { formatDailyReportMarkdown } from '../src/report/format-daily-report.js';
import { buildMonthlyReportsOverview } from '../src/reporting/build-monthly-report.js';

const runButton = document.getElementById('run-demo');
const statusEl = document.getElementById('status');
const summaryEl = document.getElementById('summary');
const reportEl = document.getElementById('report');

/**
 * Minimal markdown → HTML for demo report (no dependencies).
 * @param {string} markdown
 */
function markdownToHtml(markdown) {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(/^### (CRITICAL|HIGH|MEDIUM|INFO)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^_(.+?)_$/gm, '<p><em>$1</em></p>')
    .replace(/^- \*\*(.*?)\*\* · `(.*?)`$/gm, '<div class="issue-block"><strong>$1</strong> · <code>$2</code>')
    .replace(/^  - (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
    .replace(/\n\n/g, '</div><p>')
    .replace(/^([^<\n].*)$/gm, (line) => (line.startsWith('<') ? line : `<p>${line}</p>`));
}

/**
 * @param {import('../src/data-source/types.js').AnomalyIssue[]} issues
 */
function renderSummary(issues) {
  const accounts = new Set(issues.map((issue) => issue.customerId));
  const critical = issues.filter((issue) => issue.severity === 'CRITICAL').length;
  const high = issues.filter((issue) => issue.severity === 'HIGH').length;

  summaryEl.innerHTML = `
    <div class="summary-card"><strong>${issues.length}</strong> problémů celkem</div>
    <div class="summary-card"><strong>${accounts.size}</strong> mock účtů</div>
    <div class="summary-card"><strong>${critical}</strong> critical</div>
    <div class="summary-card"><strong>${high}</strong> high</div>
  `;
  summaryEl.classList.remove('hidden');
}

async function runDemoInBrowser() {
  runButton.disabled = true;
  statusEl.textContent = 'Načítám mock data a spouštím kontroly…';
  reportEl.classList.add('hidden');
  summaryEl.classList.add('hidden');

  try {
    const fixturesBaseUrl = new URL('../fixtures/', import.meta.url).href;
    const dataSource = new BrowserDataSource(fixturesBaseUrl);
    const meta = await dataSource.getMeta();
    const referenceDate = new Date(`${meta.simulatedRunDate}T12:00:00`);
    const accounts = await dataSource.getAccounts();

    const [issues, monthlyReports] = await Promise.all([
      runAllChecks(dataSource, referenceDate),
      buildMonthlyReportsOverview(accounts, meta.reportMonth, dataSource),
    ]);

    const markdown = formatDailyReportMarkdown(issues, monthlyReports, meta);
    renderSummary(issues);
    reportEl.innerHTML = markdownToHtml(markdown);
    reportEl.classList.remove('hidden');
    statusEl.textContent = `Hotovo — simulovaný běh ${meta.simulatedRunDate}, reporting za ${meta.reportMonth}.`;
  } catch (error) {
    statusEl.textContent = `Chyba: ${/** @type {Error} */ (error).message}`;
  } finally {
    runButton.disabled = false;
  }
}

runButton.addEventListener('click', () => {
  void runDemoInBrowser();
});
