import { Tournament } from "./types";

/** Build a Tournament fixture matching the real DB/LLM shape. */
export function makeTournament(
  overrides: Partial<Tournament> = {}
): Tournament {
  return {
    name: "Test Tournament",
    location: "Buffalo, NY, USA",
    description: "A test tournament",
    rink: "Test Rink",
    startDate: "2025-12-01",
    endDate: "2025-12-03",
    level: ["AAA"],
    age: ["12U"],
    registrationUrl: "https://example.com/tournament",
    latitude: 42.8864,
    longitude: -78.8784,
    ...overrides,
  };
}
