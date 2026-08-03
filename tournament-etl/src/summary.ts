import { appendFileSync } from "node:fs";

/**
 * Append a line to the GitHub Actions job summary when running in CI, so a run
 * that quietly finds or inserts nothing is visible without opening the logs.
 * Outside CI ($GITHUB_STEP_SUMMARY unset) this only writes to stdout.
 */
export function writeSummary(line: string): void {
  console.log(`[Summary] ${line}`);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;

  try {
    appendFileSync(summaryPath, `- ${line}\n`);
  } catch (error) {
    // Never fail a successful run because reporting failed.
    console.warn(
      `[Summary] Could not write job summary: ${(error as Error).message}`
    );
  }
}
