// The Auditor. Pure functions: a URL counts only if a search tool actually returned it.

export function normUrl(u) {
  try {
    const url = new URL(String(u).trim());
    let host = url.hostname.toLowerCase().replace(/^(www|mobile|m)\./, '');
    if (host === 'twitter.com') host = 'x.com';
    const path = url.pathname.replace(/\/+$/, '');
    return `${host}${path}`.toLowerCase();
  } catch {
    return null;
  }
}

export function createLedger() {
  const verified = new Set();
  let unavailable = false;
  return {
    addCitations(list) {
      for (const u of list ?? []) { const n = normUrl(u); if (n) verified.add(n); }
    },
    markUnavailable() { unavailable = true; },
    has(u) { const n = normUrl(u); return !!n && verified.has(n); },
    get size() { return verified.size; },
    get unavailable() { return unavailable; },
  };
}

// Tag each evidence item with `verified`. Returns the ids of any unverified items.
export function checkItems(items, citations, urlKey = 'url') {
  const own = createLedger();
  own.addCitations(citations);
  if (!citations?.length) {
    for (const it of items) it.verified = null; // tool gave us nothing to check against
    return { unverified: [], checkable: false };
  }
  const unverified = [];
  for (const it of items) {
    it.verified = own.has(it[urlKey]);
    if (!it.verified) unverified.push(it[urlKey]);
  }
  return { unverified, checkable: true };
}

// Final audit over a list of {bot, url} claims.
export function audit(claims, ledger) {
  claims = claims.filter((c) => c.url);
  if (ledger.unavailable && ledger.size === 0) {
    return { score: null, total: claims.length, verified: 0, flagged: [], note: 'Search tools returned no citation list, so the receipts could not be checked.' };
  }
  const flagged = claims.filter((c) => !ledger.has(c.url));
  const verified = claims.length - flagged.length;
  return {
    score: claims.length ? Math.round((100 * verified) / claims.length) : 0,
    total: claims.length, verified, flagged,
    note: flagged.length ? `${flagged.length} link(s) were not returned by any search tool. Treat them as unverified.` : 'Every cited link was returned by a search tool.',
  };
}
