import * as puppeteer from "puppeteer";

/**
 * Browser session management for scraping myhockeyrankings.com.
 *
 * MHR sits behind Cloudflare bot protection. Two things are required to get
 * past it, and both are load-bearing:
 *
 *  1. A realistic User-Agent. Puppeteer's default advertises "HeadlessChrome",
 *     which Cloudflare rejects outright.
 *  2. Every request must originate from the browser. Cloudflare binds its
 *     `cf_clearance` cookie to the TLS fingerprint of the client that solved
 *     the challenge, so copying the cookie into a Node HTTP client (axios,
 *     fetch, curl) still yields 403. Sub-page fetches therefore run inside the
 *     page context via `fetchHtml`, where they inherit both the cookie jar and
 *     Chrome's TLS stack.
 */

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CHALLENGE_PATTERN = /just a moment|performing security verification/i;
const CHALLENGE_TIMEOUT_MS = 60000;
const CHALLENGE_POLL_MS = 1000;

export async function launchBrowser(): Promise<puppeteer.Browser> {
  return puppeteer.launch({
    // Undefined uses Puppeteer's bundled Chrome-for-Testing, which is how this
    // runs both locally and in CI. No Docker or system Chromium required.
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // Avoids the small default /dev/shm on CI runners
      "--disable-blink-features=AutomationControlled",
    ],
  });
}

/**
 * Open a page, navigate to `url`, and wait for any Cloudflare interstitial to
 * clear. The resulting page holds the clearance cookie for the whole session.
 */
export async function openSession(
  browser: puppeteer.Browser,
  url: string
): Promise<puppeteer.Page> {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.setViewport({ width: 1200, height: 800 });
  page.setDefaultNavigationTimeout(3 * 60 * 1000);

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForChallenge(page);

  return page;
}

/** Poll until the Cloudflare interstitial is gone, or give up. */
async function waitForChallenge(page: puppeteer.Page): Promise<void> {
  const deadline = Date.now() + CHALLENGE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const challenged = await page
      .evaluate(
        (pattern) =>
          new RegExp(pattern, "i").test(document.body?.innerText || ""),
        CHALLENGE_PATTERN.source
      )
      .catch(() => false); // Navigation mid-evaluate; retry on the next poll.

    if (!challenged) return;
    await new Promise((r) => setTimeout(r, CHALLENGE_POLL_MS));
  }

  throw new Error(
    `Cloudflare challenge did not clear within ${
      CHALLENGE_TIMEOUT_MS / 1000
    }s for ${page.url()}`
  );
}

export interface FetchResult {
  status: number;
  html: string;
}

/**
 * Fetch a URL from inside the page context so it carries the session's
 * Cloudflare clearance. Returns the status rather than throwing on 4xx/5xx so
 * callers can decide (a missing team page legitimately 404s).
 */
export async function fetchHtml(
  page: puppeteer.Page,
  url: string
): Promise<FetchResult> {
  return page.evaluate(async (target) => {
    const response = await fetch(target, { credentials: "include" });
    return { status: response.status, html: await response.text() };
  }, url);
}
