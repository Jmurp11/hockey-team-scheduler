import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";

const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * MHR seasons run September through August and are labelled with the calendar
 * year in which they *end* — so October 2026 belongs to season 2027.
 *
 * This previously lived as a duplicated bash snippet in each of the thirteen
 * rankings workflows; keeping it here makes it testable and single-sourced.
 */
export function resolveSeasonYear(now: Date = new Date()): number {
  const month = now.getMonth(); // 0-indexed: 8 === September
  const year = now.getFullYear();
  return month >= 8 ? year + 1 : year;
}

export async function request(
  url: string,
  retries = MAX_RETRIES
): Promise<AxiosResponse> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      return response;
    } catch (err) {
      lastError = err as Error;
      const isLastAttempt = attempt === retries;

      if (isLastAttempt) {
        console.error(
          `Request failed after ${retries} attempts for ${url}:`,
          err.message
        );
        throw lastError;
      }

      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(
        `Request attempt ${attempt}/${retries} failed for ${url}. Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError!;
}

export async function scrape_data(url: string, el1: string) {
  try {
    const response = await request(url);
    const $ = cheerio.load(response.data);
    const element = $(el1);
    return element;
  } catch (err) {
    throw new Error(`Failed to scrape ${url}: ${(err as Error).message}`, {
      cause: err,
    });
  }
}

export function parse_html(html, extractArray) {
  try {
    return html.extract(extractArray);
  } catch (err) {
    throw new Error(`Failed to parse HTML: ${(err as Error).message}`, {
      cause: err,
    });
  }
}
