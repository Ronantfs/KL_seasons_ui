import { useState } from "react";
import type {
  ActiveSupportedCinema,
  Season,
} from "../types/cinemaSeasons";
import { CinemaSeason } from "./CinemaSeason";
import { CreateSeasonForm } from "./SeasonsLambdaInvokes/CreateSeasonForm";
import { AssignFilmsToSeasons } from "./SeasonsLambdaInvokes/AssignFilmsToSeasons";

const LAMBDA_URL =
  "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

interface GetSeasonsForCinemaResponse {
  status: "ok" | "error";
  cinema_id: ActiveSupportedCinema;
  seasons: Record<string, Season>;
  seasons_total: number;
}

interface Props {
  cinemaId: ActiveSupportedCinema;
}

export function CinemaSeasonsView({ cinemaId }: Props) {
  const [data, setData] =
    useState<GetSeasonsForCinemaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  async function loadSeasons() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "get_seasons_for_cinema",
          cinema_id: cinemaId,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json =
        (await res.json()) as GetSeasonsForCinemaResponse;

      setData(json);
      setHasLoaded(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const seasons = data?.seasons ?? {};

  return (
    <div>
      {/* Always available: allows creating first season */}
      <CreateSeasonForm cinemaId={cinemaId} />

      <button onClick={loadSeasons} disabled={loading}>
        {loading
          ? "Loading…"
          : `Load ${cinemaId} seasons`}
      </button>

      {error && (
        <div style={{ color: "crimson" }}>
          Error: {error}
        </div>
      )}

      {hasLoaded && (
        <>
          <AssignFilmsToSeasons cinemaId={cinemaId} />

          {Object.entries(seasons).map(
            ([seasonKey, season]) => (
              <CinemaSeason
                key={seasonKey}
                cinemaId={cinemaId}
                seasonKey={seasonKey}
                season={season}
              />
            )
          )}
        </>
      )}
    </div>
  );
}
