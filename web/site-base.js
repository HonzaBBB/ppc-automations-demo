/**
 * Site root for GitHub Pages subpath and local server.
 * @returns {string} Trailing slash URL, e.g. https://user.github.io/repo/
 */
export function getSiteBaseUrl() {
  const baseHref = document.querySelector('base')?.href;
  if (baseHref) {
    return baseHref.endsWith('/') ? baseHref : `${baseHref}/`;
  }
  return new URL('/', window.location.href).href;
}

/**
 * @returns {string}
 */
export function getFixturesBaseUrl() {
  return new URL('fixtures/', getSiteBaseUrl()).href;
}
