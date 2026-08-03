import * as cheerio from "cheerio";
import * as puppeteer from "puppeteer";
import {
  associationExtract,
  leagueInfoExtract,
  locationExtract,
  rankingsExtract,
} from "./extract.constants";
import { parse_html } from "./util";
import { fetchHtml, launchBrowser, openSession } from "./browser";
import { base_url } from "../main.constants";
import {
  element1,
  element2,
  locationBaseElement,
  omitsRankColumn,
  RankingsLevel,
  rkInfoBaseElement,
} from "../rankings/rankings.constants";

const SUBLINK_BATCH_SIZE = 10; // Process sublinks in batches to avoid rate limiting
const BATCH_DELAY = 500; // 500ms delay between batches

// Cache association URL lookups to avoid redundant fetches for the same association
const associationUrlCache = new Map<string, Promise<string | null>>();

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Domains to skip when discovering the association's external website link
const SKIP_DOMAINS = [
  "myhockeyrankings.com",
  "myhockeytournaments.com",
  "livebarn.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "youtube.com",
  "tiktok.com",
  "linkedin.com",
  "google.com",
];

function findOrganizationUrl($: cheerio.CheerioAPI): string | null {
  let foundUrl: string | null = null;

  $('a[href^="http"]').each((_, element) => {
    if (foundUrl) return false; // stop iterating once we have a match
    const href = $(element).attr("href");
    if (!href) return;
    if (SKIP_DOMAINS.some((domain) => href.includes(domain))) return;
    foundUrl = href;
  });

  return foundUrl;
}

async function fetchAssociationUrl(
  page: puppeteer.Page,
  associationLink: string
): Promise<string | null> {
  if (!associationUrlCache.has(associationLink)) {
    associationUrlCache.set(
      associationLink,
      (async () => {
        try {
          const { status, html } = await fetchHtml(
            page,
            `${base_url}${associationLink}`
          );
          if (status !== 200) {
            console.warn(
              `[SubLink] Association page ${associationLink} returned ${status}`
            );
            return null;
          }
          return findOrganizationUrl(cheerio.load(html));
        } catch (err) {
          console.warn(
            `[SubLink] Error fetching association URL from ${associationLink}: ${err.message}`
          );
          return null;
        }
      })()
    );
  }
  return associationUrlCache.get(associationLink) ?? null;
}

export async function runPuppeteer(
  url: string,
  level: RankingsLevel
): Promise<any[]> {
  let browser: puppeteer.Browser | undefined;

  try {
    console.log(`[Puppeteer] Starting browser for ${url}`);
    browser = await launchBrowser();

    console.log(`[Puppeteer] Navigating to page...`);
    const page = await openSession(browser, url);

    console.log(`[Puppeteer] Waiting for rankings table to load...`);
    await page.waitForFunction(
      (selector) => {
        const table = document.querySelector(selector) as HTMLElement | null;
        return !!table && !table.innerText.includes("Loading rankings");
      },
      { timeout: 180000 }, // 3 minutes
      element1
    );

    const html = await page.evaluate((selector) => {
      const table = document.querySelector(selector);
      return table ? table.outerHTML : null;
    }, element1);

    if (!html) {
      throw new Error("Rankings table not found after page load");
    }

    console.log(`[Puppeteer] Parsing rankings HTML...`);
    const $ = cheerio.load(html);

    const rks = parse_html(
      $(element1),
      rankingsExtract(element2, omitsRankColumn(level))
    ).rankings;

    if (!rks || rks.length === 0) {
      throw new Error("No rankings data extracted from page");
    }

    console.log(`[Puppeteer] Found ${rks.length} rankings, fetching sublinks...`);
    const formatted = await handleSubLink(
      page,
      rks
        .filter((rk) => rk.team)
        .map((rk) => ({ ...rk, team: rk.team.selector }))
    );

    console.log(`[Puppeteer] Successfully processed ${formatted.length} rankings`);
    return formatted;
  } catch (error) {
    console.error("[Puppeteer] Error during execution:", error);
    throw error; // Re-throw to propagate the error
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function processSubLink(
  page: puppeteer.Page,
  ranking: any
): Promise<any> {
  if (!ranking.link || !ranking.link.includes("team_info.php")) {
    return ranking;
  }

  const url = `${base_url}/${ranking.link}`;

  try {
    // One request per team; both the info and location sections come from it.
    const { status, html } = await fetchHtml(page, url);
    if (status !== 200) {
      throw new Error(`HTTP ${status}`);
    }
    const $ = cheerio.load(html);

    const infoHtml = $(rkInfoBaseElement);
    const locHtml = $(locationBaseElement);

    const associationResult = parse_html(
      infoHtml,
      associationExtract("div:has(h3:contains('Association'))")
    );
    const association = associationResult?.association;

    const leagueResult = parse_html(
      infoHtml,
      leagueInfoExtract("div:has(h3:contains('Division(s)'))")
    );
    const leagues = leagueResult?.league?.value?.map((l: string) =>
      l.split(" ")[0]
    );

    const locationResult = parse_html(locHtml, locationExtract("div.-ml-4"));
    const location = locationResult?.location?.trim();

    // Extract the association detail page link and fetch the website URL
    const associationLink = infoHtml
      .find("div:has(h3:contains('Association')) a")
      .attr("href");

    let associationUrl: string | null = null;
    if (associationLink && associationLink.includes("association-info")) {
      associationUrl = await fetchAssociationUrl(page, associationLink);
    }

    return {
      ...ranking,
      association: association?.selector || null,
      associationUrl,
      leagues: leagues || null,
      location: location || null,
    };
  } catch (err) {
    console.warn(`[SubLink] Error processing ${url}: ${err.message}`);
    return {
      ...ranking,
      association: null,
      associationUrl: null,
      leagues: null,
      location: null,
      sublinkError: err.message,
    };
  }
}

export async function handleSubLink(
  page: puppeteer.Page,
  rankingsArr: any[]
): Promise<any[]> {
  const results: any[] = [];

  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < rankingsArr.length; i += SUBLINK_BATCH_SIZE) {
    const batch = rankingsArr.slice(i, i + SUBLINK_BATCH_SIZE);
    const batchNum = Math.floor(i / SUBLINK_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rankingsArr.length / SUBLINK_BATCH_SIZE);

    console.log(`[SubLink] Processing batch ${batchNum}/${totalBatches}...`);

    const batchResults = await Promise.all(
      batch.map((ranking) => processSubLink(page, ranking))
    );
    results.push(...batchResults);

    // Add delay between batches (except for the last batch)
    if (i + SUBLINK_BATCH_SIZE < rankingsArr.length) {
      await sleep(BATCH_DELAY);
    }
  }

  const errorCount = results.filter((r) => r.sublinkError).length;
  if (errorCount > 0) {
    console.warn(
      `[SubLink] ${errorCount}/${results.length} sublink fetches failed`
    );
  }

  return results;
}
