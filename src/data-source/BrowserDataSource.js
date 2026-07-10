import { FixtureDataSource } from './FixtureDataSource.js';

/**
 * @param {string} baseUrl Must end with /
 * @param {string} relativePath
 */
async function fetchJsonFixture(baseUrl, relativePath) {
  const url = new URL(relativePath, baseUrl).href;

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Cannot fetch fixture ${url}: ${/** @type {Error} */ (error).message}`);
  }

  if (!response.ok) {
    throw new Error(`Fixture not found: ${url} (${response.status})`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Invalid JSON in fixture ${url}: ${/** @type {Error} */ (error).message}`);
  }
}

/**
 * Browser demo data source — fetches JSON fixtures over HTTP (GitHub Pages).
 */
export class BrowserDataSource extends FixtureDataSource {
  /**
   * @param {string} [fixturesBaseUrl] e.g. https://user.github.io/repo/fixtures/
   */
  constructor(fixturesBaseUrl) {
    const baseUrl = fixturesBaseUrl ?? new URL('../fixtures/', import.meta.url).href;
    super((relativePath) => fetchJsonFixture(baseUrl, relativePath));
  }
}
