import { canadianRegions } from "./organizations.constants";

/**
 * Pure normalization helpers for scraped row data.
 *
 * Kept free of any Supabase or network imports so they can be unit tested
 * without credentials.
 */

export function isCanada(region: string): string {
  return canadianRegions.includes(region) ? "Canada" : "USA";
}

export function handleBadLocationData(rank: any): {
  city: string;
  state: string;
} {
  // Handle missing or null location
  if (!rank.location || typeof rank.location !== "string") {
    console.warn(`[Location] Missing location data for team: ${rank.team_name}`);
    return { city: "UNKNOWN", state: "UNKNOWN" };
  }

  const locationArr = rank.location.split(",").map((s: string) => s.trim());

  if (locationArr.length <= 1) {
    console.warn(
      `[Location] Malformed location "${rank.location}" for team: ${rank.team_name}`
    );
    return { city: "UNKNOWN", state: locationArr[0] || "UNKNOWN" };
  }

  // Handle "City, State, Country" format by taking first two parts
  return { city: locationArr[0], state: locationArr[1] };
}
