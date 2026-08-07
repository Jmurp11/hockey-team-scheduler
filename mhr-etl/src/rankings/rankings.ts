import { runPuppeteer } from "../helper/puppeteer";
import { RankingsLevel } from "./rankings.constants";

export function formatUrl(baseUrl: string, item: RankingsLevel): string {
  if (item.age === "9u" && item.gender === "boys") {
    return `${baseUrl}y=${item.year}&a=1&v=${item.v}`;
  }
  return `${baseUrl}y=${item.year}&v=${item.v}`;
}

export async function rankings(
  url: string,
  level: RankingsLevel
): Promise<{ rankings: any[] }> {
  const age = level.age;
  console.log(
    `[Rankings] Fetching rankings for ${level.gender} ${age} from ${url}`
  );

  const rawRankings = await runPuppeteer(url, level);

  if (!rawRankings || !Array.isArray(rawRankings)) {
    throw new Error(`Failed to fetch rankings for ${age}: No data returned`);
  }

  const processedRankings = rawRankings
    .filter((r) => r && r.team)
    .map((ranking) => ({
      team_name: ranking.team,
      association: ranking.association || null,
      associationUrl: ranking.associationUrl || null,
      rating: parseFloat(ranking.rating),
      record: ranking.record,
      avg_goal_diff: parseFloat(ranking.avg_goal_diff),
      schedule: parseFloat(ranking.schedule),
      leagues: ranking.leagues || null,
      location: ranking.location || null,
      age,
    }))
    .filter((ranking) => ranking.team_name && !isNaN(ranking.rating));

  if (processedRankings.length === 0) {
    throw new Error(`No valid rankings found for ${age}`);
  }

  console.log(
    `[Rankings] Processed ${processedRankings.length} rankings for ${age}`
  );
  console.log("[Rankings] Sample record:", JSON.stringify(processedRankings[0]));

  return { rankings: processedRankings };
}
