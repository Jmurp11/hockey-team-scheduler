import * as cheerio from "cheerio";
import { launchBrowser, openSession } from "../helper/browser";
import { leaguesExtract } from "../helper/extract.constants";
import { parse_html } from "../helper/util";

export interface ScrapedLeague {
  name: string;
  location: string;
  abbreviation: string;
}

/**
 * Fetch the league directory through a real browser session. A plain HTTP
 * client cannot be used here: MHR is behind Cloudflare, which rejects requests
 * that did not solve its JS challenge. See helper/browser.ts.
 */
export async function getLeaguesHtml(url: string): Promise<string> {
  const browser = await launchBrowser();
  try {
    const page = await openSession(browser, url);
    return await page.content();
  } finally {
    await browser.close();
  }
}

export async function leagues(
  url: string,
  element: string,
  element2: string
): Promise<{ leagues: ScrapedLeague[] }> {
  const html = await getLeaguesHtml(url);
  const $ = cheerio.load(html);
  const parsed = parse_html($(element), leaguesExtract(element2));

  const leagues: ScrapedLeague[] = parsed.leagues.map((league) => ({
    name: league.name.selector,
    location: league.location.selector.split("\n").map((line) => line.trim())[2],
    abbreviation: league.abbreviation.selector,
  }));

  // Previously both helpers swallowed their errors and returned a shape without
  // a `leagues` key, so a failed scrape reached Supabase as an empty batch.
  // Fail loudly instead; the caller wraps this with context.
  if (leagues.length === 0) {
    throw new Error(`No leagues extracted from ${url}`);
  }

  return { leagues };
}
