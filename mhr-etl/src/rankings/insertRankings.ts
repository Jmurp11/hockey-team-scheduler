import "../helper/env";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { insertRankings } from "../helper/insert";
import { writeSummary } from "../helper/summary";
import { resolveSeasonYear } from "../helper/util";
import { findRankingsLevel } from "./rankings.constants";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("year", {
      alias: "y",
      description:
        "Season year to fetch rankings for. Defaults to the current MHR season.",
      type: "number",
      default: resolveSeasonYear(),
    })
    .option("age", {
      alias: "a",
      description: "Age group to fetch, e.g. 9u, 12u, 19u",
      type: "string",
      demandOption: true,
    })
    .option("gender", {
      alias: "g",
      description: "boys or girls",
      type: "string",
      choices: ["boys", "girls"],
      demandOption: true,
    })
    .option("allow-zero-ratings", {
      description:
        "Load roster data even when MHR has published no ratings yet. " +
        "Off by default so an offseason run cannot zero out existing ratings.",
      type: "boolean",
      default: false,
    })
    .help()
    .alias("help", "h").argv;

  try {
    const level = findRankingsLevel(argv.year, argv.age, argv.gender);
    const result = await insertRankings(level, {
      allowZeroRatings: argv["allow-zero-ratings"],
    });

    if (result.skipped) {
      writeSummary(
        `**${result.gender} ${result.age}** (season ${argv.year}) — SKIPPED: ` +
          `MHR has no ratings yet (${result.teams} rosters seen)`
      );
      return;
    }

    console.log(
      `Rankings for ${argv.year} (${level.level} - ${level.age}) inserted. (${level.gender})`
    );
    writeSummary(
      `**${result.gender} ${result.age}** (season ${argv.year}) — ` +
        `${result.teams} teams (${result.ratedTeams} rated), ` +
        `${result.associations} associations, girls_only=${result.girlsOnly}` +
        (result.unknownLocations > 0
          ? `, ${result.unknownLocations} unknown locations`
          : "")
    );
  } catch (error) {
    console.error("Error inserting rankings:", error);
    process.exit(1);
  }
}

main();
