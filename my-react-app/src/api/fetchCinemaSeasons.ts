import type { ActiveSupportedCinema } from "../types/cinemaSeasons";
import type { GetSeasonsForCinemaResponse } from "../types/cinemaSeasons";

const LAMBDA_URL =
  "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

export async function fetchGetSeasonsForCinema(
  cinemaId: ActiveSupportedCinema
): Promise<GetSeasonsForCinemaResponse> {
  const payload = {
    handler: "get_seasons_for_cinema",
    cinema_id: cinemaId,
  } as const;

  const res = await fetch(LAMBDA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Lambda error: ${res.status}`);

  return (await res.json()) as GetSeasonsForCinemaResponse;
}
