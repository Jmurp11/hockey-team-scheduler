#!/usr/bin/env node

import { runETL } from "./tournaments";
import { writeSummary } from "./summary";
import { TournamentProps } from "./types";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option("location", {
    alias: "l",
    type: "string",
    description: "Location to search for tournaments",
    demandOption: true,
  })
  .option("locationType", {
    alias: "lt",
    type: "string",
    description: "Type of location (e.g. state, province)",
    demandOption: true,
  })
  .option("passes", {
    alias: "p",
    type: "number",
    description:
      "Independent search passes to union. Model yield varies widely " +
      "between identical calls, so more passes means better coverage.",
    default: 3,
  })
  .help()
  .alias("help", "h")
  .parseSync();

async function main() {
  try {
    console.log("🏒 Starting Tournament ETL Process...");
    console.log(`Parameters:
  Location: ${argv.location}
  Location Type: ${argv.locationType}
  Passes: ${argv.passes}`);

    const props: TournamentProps = {
      location: argv.location,
      locationType: argv.locationType,
    };

    const result = await runETL(props, { passes: argv.passes });

    writeSummary(
      `**${argv.location}** — ${result.found} found, ` +
        `${result.inserted} inserted, ${result.alreadyPresent} already present` +
        ` (passes: ${result.passYields.join(", ")})` +
        (result.sharedUrlGroups > 0
          ? `, ${result.sharedUrlGroups} shared-URL groups`
          : "")
    );

    console.log("✅ Tournament ETL Process completed successfully!");
  } catch (error) {
    console.error("❌ Tournament ETL Process failed:", error);
    writeSummary(
      `**${argv.location}** — FAILED: ${(error as Error).message}`
    );
    process.exit(1);
  }
}

// Run the main function
main();
