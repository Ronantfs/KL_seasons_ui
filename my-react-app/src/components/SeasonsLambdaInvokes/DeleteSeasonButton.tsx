import { useState } from "react";
import type { ActiveSupportedCinema } from "../../types/cinemaSeasons";

const LAMBDA_URL =
  "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

type DeleteSeasonButtonProps = {
  cinemaId: ActiveSupportedCinema;
  seasonKey: string;
};

export function DeleteSeasonButton({
  cinemaId,
  seasonKey,
}: DeleteSeasonButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "delete_season_from_cinema",
          cinema_id: cinemaId,
          season_key: seasonKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        <span
          style={{ fontSize: "0.78rem", color: "#f77", fontWeight: 500 }}
        >
          Delete?
        </span>
        <button
          onClick={onDelete}
          disabled={loading}
          style={{
            padding: "4px 12px",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "#fff",
            background: "#d43f3f",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            padding: "4px 12px",
            fontSize: "0.78rem",
            fontWeight: 500,
            color: "#bbb",
            background: "transparent",
            border: "1px solid #444",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        {error && (
          <span style={{ fontSize: "0.75rem", color: "#f77" }}>{error}</span>
        )}
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        padding: "5px 14px",
        fontSize: "0.78rem",
        fontWeight: 500,
        color: "#f77",
        background: "rgba(238, 85, 85, 0.1)",
        border: "1px solid rgba(238, 85, 85, 0.25)",
        borderRadius: 6,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      Delete
    </button>
  );
}
