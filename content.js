/* Wikipedia Simple Switcher - content script */

(() => {
  const BUTTON_ID = "wiki-simple-switcher-button";
  const ROOT_ID = "wiki-simple-switcher-root";

  function isWikipediaArticlePage() {
    const decodedPath = decodeURIComponent(location.pathname);

    return (
      location.hostname.endsWith(".wikipedia.org") &&
      location.hostname !== "simple.wikipedia.org" &&
      location.pathname.startsWith("/wiki/") &&
      !decodedPath.includes(":")
    );
  }

  function getPageTitle() {
    const canonicalTitle = document.querySelector('meta[property="mw:PageProp/displaytitle"]')?.content;
    if (canonicalTitle) return canonicalTitle;

    const heading = document.querySelector("#firstHeading")?.textContent?.trim();
    if (heading) return heading;

    return decodeURIComponent(location.pathname.replace(/^\/wiki\//, "")).replaceAll("_", " ");
  }

  function createButton(simpleUrl) {
    if (document.getElementById(ROOT_ID)) return;

    const root = document.createElement("div");
    root.id = ROOT_ID;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Simple English";
    button.title = "Open the Simple English Wikipedia version of this article";
    button.setAttribute("aria-label", "Open Simple English Wikipedia version");

    button.addEventListener("click", () => {
      window.location.assign(simpleUrl);
    });

    root.appendChild(button);
    document.documentElement.appendChild(root);
  }

  async function main() {
    if (!isWikipediaArticlePage()) return;

    try {
      const result = await browser.runtime.sendMessage({
        type: "CHECK_SIMPLE_WIKI",
        pageTitle: getPageTitle(),
        currentHost: location.hostname,
        currentPath: location.pathname,
        currentSearch: location.search,
        currentHash: location.hash
      });

      if (result?.exists && result.simpleUrl) {
        createButton(result.simpleUrl);
      }
    } catch (error) {
      // Fail silently. The page should never break because of the extension.
    }
  }

  main();
})();
