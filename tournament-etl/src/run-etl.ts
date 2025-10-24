#!/usr/bin/env node

import { runETL } from "./tournaments";
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
  .help()
  .alias("help", "h")
  .parseSync();

async function main() {
  try {
    console.log("🏒 Starting Tournament ETL Process...");
    console.log(`Parameters:
  Location: ${argv.location}`);

    const props: TournamentProps = {
      location: argv.location,
      locationType: argv.locationType,
    };

    await runETL(props);

    console.log("✅ Tournament ETL Process completed successfully!");
  } catch (error) {
    console.error("❌ Tournament ETL Process failed:", error);
    process.exit(1);
  }
}

// Run the main function
main();
