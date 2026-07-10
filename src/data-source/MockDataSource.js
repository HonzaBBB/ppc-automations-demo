import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FixtureDataSource } from './FixtureDataSource.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FIXTURES_DIR = path.resolve(__dirname, '../../fixtures');

/**
 * @param {string} filePath
 * @returns {Promise<unknown>}
 */
async function readJsonFile(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      throw new Error(`Fixture file not found: ${filePath}`);
    }
    throw new Error(`Cannot read fixture ${filePath}: ${/** @type {Error} */ (error).message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in fixture ${filePath}: ${/** @type {Error} */ (error).message}`);
  }
}

/**
 * Demo data source — reads structured JSON from /fixtures (Node.js).
 */
export class MockDataSource extends FixtureDataSource {
  /**
   * @param {{ fixturesDir?: string }} [options]
   */
  constructor(options = {}) {
    const fixturesDir = options.fixturesDir ?? DEFAULT_FIXTURES_DIR;
    super((relativePath) => readJsonFile(path.join(fixturesDir, relativePath)));
  }
}
