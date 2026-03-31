/**
 * Wrapper for dynamic import() that handles stale chunk errors.
 * After a Vercel redeployment, cached HTML may reference old hashed filenames
 * that no longer exist. This forces a cache-busting page reload to fetch
 * the latest index.html with correct chunk references.
 */
export async function dynamicImport(importFn) {
  try {
    return await importFn();
  } catch (err) {
    // Only handle chunk/module load failures
    if (!err?.message?.includes('dynamically imported module') &&
        !err?.message?.includes('Failed to fetch')) {
      throw err;
    }
    const key = 'chunk_reload';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      // Cache-busting reload: add timestamp to force fresh HTML fetch
      const url = new URL(window.location.href);
      url.searchParams.set('_cb', Date.now());
      window.location.replace(url.toString());
      return new Promise(() => {}); // never resolves — page is reloading
    }
    sessionStorage.removeItem(key);
    return importFn(); // second attempt, throw if still fails
  }
}
