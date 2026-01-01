import { useEffect, useState } from "react";
import type {
  ActiveSupportedCinema,
  Season,
} from "../types/cinemaSeasons";
import { CinemaSeason } from "./CinemaSeason";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

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
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : String(e)
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [cinemaId]);

  if (loading) return <div>Loading…</div>;
  if (error)
    return (
      <div style={{ color: "crimson" }}>
        Error: {error}
      </div>
    );
  if (!data) return <div>No data.</div>;

  const seasons = data.seasons;

  return (
    <div>
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
    </div>
  );
}
