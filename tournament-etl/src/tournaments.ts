import { findTournaments } from "./open-ai";
import { getTournaments, insertTournaments } from "./supabase";
import { TournamentProps } from "./types";

export async function runETL(props: TournamentProps) {
  try {
    const output = await findTournaments(props);
    console.log({ output });

    const foundTournaments = await getTournaments(output);

    console.log({ foundTournaments });
    const newTournaments = output.filter((t: any) => {
      return !foundTournaments.data?.some(
        (ft: any) => ft.registration_link === t.registrationUrl
      );
    });

    console.log({ newTournaments });
    const insertResult = await insertTournaments(newTournaments);
    console.log({ insertResult });
  } catch (error) {
    throw new Error("ETL process failed: " + (error as Error).message);
  }
}
