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
  const seasonCount = Object.keys(seasons).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <CreateSeasonForm cinemaId={cinemaId} />

      <button
        onClick={loadSeasons}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 20px",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          border: "2px solid #444",
          borderRadius: 10,
          background: loading ? "rgba(124, 106, 239, 0.08)" : "#7c6aef",
          color: "#fff",
          transition: "all 0.15s ease",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Loading..." : `Load seasons for ${cinemaId}`}
      </button>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: "0.88rem",
            fontWeight: 500,
            background: "rgba(238, 85, 85, 0.12)",
            color: "#f77",
            border: "1px solid rgba(238, 85, 85, 0.25)",
          }}
        >
          {error}
        </div>
      )}

      {hasLoaded && (
        <>
          <div
            style={{
              fontSize: "0.82rem",
              color: "#888",
              padding: "4px 0",
            }}
          >
            {seasonCount} season{seasonCount !== 1 ? "s" : ""} loaded
          </div>

          <AssignFilmsToSeasons cinemaId={cinemaId} />

          {Object.entries(seasons).map(([seasonKey, season]) => (
            <CinemaSeason
              key={seasonKey}
              cinemaId={cinemaId}
              seasonKey={seasonKey}
              season={season}
            />
          ))}
        </>
      )}
    </div>
  );
}
