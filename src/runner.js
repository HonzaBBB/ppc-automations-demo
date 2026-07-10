/**
 * Daily monitoring runner.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runAllChecks } from './checks/index.js';
import { MockDataSource } from './data-source/index.js';
import { formatDailyReportMarkdown, printReportToConsole } from './report/format-daily-report.js';
import { buildMonthlyReportsOverview } from './reporting/build-monthly-report.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../output');

/**
 * @param {import('./data-source/index.js').DataSource} dataSource
 * @param {Date} referenceDate
 */
export async function runDailyChecks(dataSource, referenceDate) {
  return runAllChecks(dataSource, referenceDate);
}

export async function main() {
  const dataSource = new MockDataSource();
  const meta = await dataSource.getMeta();
  const referenceDate = new Date(`${meta.simulatedRunDate}T12:00:00`);

  const accounts = await dataSource.getAccounts();
  const issues = await runDailyChecks(dataSource, referenceDate);
  const monthlyReports = await buildMonthlyReportsOverview(
    accounts,
    meta.reportMonth,
    dataSource
  );

  const markdown = formatDailyReportMarkdown(issues, monthlyReports, meta);
  printReportToConsole(markdown);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, 'daily-report.md');
  await writeFile(outputPath, markdown, 'utf8');
  console.log(`\nReport written to ${outputPath}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(`Demo run failed: ${error.message}`);
    process.exit(1);
  });
}
