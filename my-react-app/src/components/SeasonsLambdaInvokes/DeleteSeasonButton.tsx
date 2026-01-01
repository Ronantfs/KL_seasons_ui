import React, { useState } from "react";
import type { ActiveSupportedCinema } from "../../types/cinemaSeasons";

const LAMBDA_URL =
  "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

type DeleteSeasonButtonProps = {
  cinemaId: ActiveSupportedCinema;   
  seasonKey: string; 
};
    
export function DeleteSeasonButton({ cinemaId, seasonKey }: DeleteSeasonButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handler: "delete_season_from_cinema", // backend dispatch key
          cinema_id: cinemaId,
          season_key: seasonKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log("Delete season result:", result);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={onDelete} disabled={loading}>
      {loading ? "Deleting..." : "Delete Season"}
      {error && <span style={{ color: "red", marginLeft: 8 }}>{error}</span>}
    </button>
  );
}
