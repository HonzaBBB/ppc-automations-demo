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
 * Resolve fixtures base URL for browser (repo root /fixtures/) or Node fallback.
 * @param {string | undefined} fixturesBaseUrl
 */
function resolveFixturesBaseUrl(fixturesBaseUrl) {
  if (fixturesBaseUrl) {
    return fixturesBaseUrl.endsWith('/') ? fixturesBaseUrl : `${fixturesBaseUrl}/`;
  }

  if (typeof document !== 'undefined' && document.baseURI) {
    return new URL('fixtures/', document.baseURI).href;
  }

  if (typeof globalThis.location?.href === 'string') {
    return new URL('fixtures/', globalThis.location.href).href;
  }

  return new URL('../../fixtures/', import.meta.url).href;
}

/**
 * Browser demo data source — fetches JSON fixtures over HTTP (GitHub Pages).
 */
export class BrowserDataSource extends FixtureDataSource {
  /**
   * @param {string} [fixturesBaseUrl] e.g. https://user.github.io/repo/fixtures/
   */
  constructor(fixturesBaseUrl) {
    const baseUrl = resolveFixturesBaseUrl(fixturesBaseUrl);
    super((relativePath) => fetchJsonFixture(baseUrl, relativePath));
  }
}
