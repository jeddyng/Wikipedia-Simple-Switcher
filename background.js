/*
  Wikipedia Simple Switcher - background service worker

  The extension first asks the current Wikipedia API whether the current article
  has an official Simple English language link. This is more reliable than just
  guessing the same page title on simple.wikipedia.org, because some articles
  have different titles or redirects on Simple English Wikipedia.
*/

browser.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== "CHECK_SIMPLE_WIKI") {
    return Promise.resolve({ exists: false });
  }

  return findSimpleWikipediaPage(message);
});

async function findSimpleWikipediaPage(message) {
  const pageTitle = normalizeTitle(message.pageTitle);
  const currentHost = normalizeHost(message.currentHost);

  if (!pageTitle || !currentHost || currentHost === "simple.wikipedia.org") {
    return { exists: false };
  }

  const apiUrl = new URL(`https://${currentHost}/w/api.php`);
  apiUrl.search = new URLSearchParams({
    action: "query",
    prop: "langlinks",
    lllang: "simple",
    llprop: "url",
    titles: pageTitle,
    redirects: "1",
    format: "json",
    formatversion: "2"
  }).toString();

  try {
    const response = await fetch(apiUrl.href, {
      method: "GET",
      credentials: "omit"
    });

    if (!response.ok) {
      return await fallbackCheck(message);
    }

    const data = await response.json();
    const page = data?.query?.pages?.[0];
    const langLink = page?.langlinks?.find((link) => link.lang === "simple" && link.url);

    if (langLink?.url && isSafeSimpleWikipediaUrl(langLink.url)) {
      return { exists: true, simpleUrl: langLink.url, source: "langlink" };
    }

    return await fallbackCheck(message);
  } catch (error) {
    return await fallbackCheck(message);
  }
}

async function fallbackCheck(message) {
  const simpleUrl = buildGuessedSimpleUrl(message.currentPath, message.currentSearch, message.currentHash);

  if (!simpleUrl) {
    return { exists: false };
  }

  try {
    const response = await fetch(simpleUrl, {
      method: "GET",
      credentials: "omit",
      redirect: "follow"
    });

    const finalUrl = response.url;

    if (response.ok && isSafeSimpleWikipediaUrl(finalUrl)) {
      return { exists: true, simpleUrl: finalUrl, source: "fallback" };
    }
  } catch (error) {
    // No button is better than a broken button.
  }

  return { exists: false };
}

function normalizeTitle(title) {
  return typeof title === "string" ? title.trim() : "";
}

function normalizeHost(host) {
  if (typeof host !== "string") return "";

  const cleanHost = host.trim().toLowerCase();
  return cleanHost.endsWith(".wikipedia.org") ? cleanHost : "";
}

function buildGuessedSimpleUrl(path, search, hash) {
  if (typeof path !== "string" || !path.startsWith("/wiki/")) return "";

  const url = new URL(`https://simple.wikipedia.org${path}`);

  if (typeof search === "string") url.search = search;
  if (typeof hash === "string") url.hash = hash;

  return url.href;
}

function isSafeSimpleWikipediaUrl(urlString) {
  try {
    const url = new URL(urlString);

    if (url.protocol !== "https:") return false;
    if (url.hostname !== "simple.wikipedia.org") return false;
    if (!url.pathname.startsWith("/wiki/")) return false;

    const decodedPath = decodeURIComponent(url.pathname);
    const blockedNamespaces = [
      "/wiki/Special:",
      "/wiki/Talk:",
      "/wiki/User:",
      "/wiki/File:",
      "/wiki/Category:",
      "/wiki/Template:",
      "/wiki/Help:",
      "/wiki/Wikipedia:",
      "/wiki/Portal:"
    ];

    return !blockedNamespaces.some((prefix) => decodedPath.startsWith(prefix));
  } catch (error) {
    return false;
  }
}
