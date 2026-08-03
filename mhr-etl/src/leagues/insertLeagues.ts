import "../helper/env";
import { insertLeagues } from "../helper/insert";
import { writeSummary } from "../helper/summary";

async function main() {
  try {
    const result = await insertLeagues();
    console.log(`Leagues inserted: ${result.leagues}`);
    writeSummary(`**leagues** — ${result.leagues} inserted`);
  } catch (error) {
    console.error("Error inserting leagues:", error);
    process.exit(1);
  }
}

main();
