import { useEffect, useState } from "react";
import type {
  ActiveSupportedCinema,
  Season,
} from "../../types/cinemaSeasons";
import "./AssignFilmsToSeasons.css";

const LAMBDA_URL =
  "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

interface Film {
  title?: string;
  name?: string;
}

interface Props {
  cinemaId: ActiveSupportedCinema;
}

interface DragPayload {
  filmId: string;
  fromSeason: string;
}

export function AssignFilmsToSeasons({ cinemaId }: Props) {
  const [open, setOpen] = useState(false);

  const [films, setFilms] =
    useState<Record<string, Film>>({});
  const [seasons, setSeasons] =
    useState<Record<string, Season>>({});
  const [assignments, setAssignments] =
    useState<Record<string, string[]>>({});
  const [dragging, setDragging] =
    useState<DragPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoading(true);

      const [filmsRes, seasonsRes] =
        await Promise.all([
          fetch(LAMBDA_URL, {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              handler:
                "get_cinemas_active_listings",
              cinema_id: cinemaId,
            }),
          }),
          fetch(LAMBDA_URL, {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              handler:
                "get_seasons_for_cinema",
              cinema_id: cinemaId,
            }),
          }),
        ]);

      const filmsJson = await filmsRes.json();
      const seasonsJson =
        await seasonsRes.json();

      const filmsData =
        filmsJson.active_listings;
      const seasonsData = seasonsJson.seasons;

      const initialAssignments: Record<
        string,
        string[]
      > = {
        season_none: Object.keys(filmsData),
      };

      Object.keys(seasonsData).forEach(
        (seasonKey) => {
          if (seasonKey !== "season_none") {
            initialAssignments[seasonKey] = [];
          }
        }
      );

      setFilms(filmsData);
      setSeasons(seasonsData);
      setAssignments(initialAssignments);
      setLoading(false);
    }

    load();
  }, [open, cinemaId]);

  function moveFilm(
    filmId: string,
    fromSeason: string,
    toSeason: string
  ) {
    if (fromSeason === toSeason) return;

    setAssignments((prev) => ({
      ...prev,
      [fromSeason]: prev[fromSeason].filter(
        (id) => id !== filmId
      ),
      [toSeason]: [...prev[toSeason], filmId],
    }));
  }

  async function submitAssignments() {
    setSubmitting(true);
    setError(null);

    const filmToSeasonMap: Record<
      string,
      string
    > = {};

    Object.entries(assignments).forEach(
      ([seasonKey, filmIds]) => {
        if (seasonKey === "season_none")
          return;

        filmIds.forEach((filmId) => {
          filmToSeasonMap[filmId] =
            seasonKey;
        });
      }
    );

    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handler: "assign_films_to_seasons",
          cinema_id: cinemaId,
          film_to_season_map:
            filmToSeasonMap,
        }),
      });

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}`
        );
      }

      const json = await res.json();
      console.log(
        "[assign_films_to_seasons] success",
        json
      );
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : String(e)
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="assign-wrapper">
      <button
        className="assign-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open
          ? `Close assign films for ${cinemaId}`
          : `Assign films for ${cinemaId}`}
      </button>

      {open && (
        <>
          {loading ? (
            <div>Loading assignments…</div>
          ) : (
            <>
              <div className="assign-boxes">
                {Object.entries(assignments).map(
                  ([seasonKey, filmIds]) => {
                    const seasonName =
                      seasonKey ===
                      "season_none"
                        ? "Unassigned films"
                        : seasons[seasonKey]
                            ?.name ??
                          seasonKey;

                    return (
                      <div
                        key={seasonKey}
                        className="season-box"
                        onDragOver={(e) =>
                          e.preventDefault()
                        }
                        onDrop={() => {
                          if (!dragging) return;
                          moveFilm(
                            dragging.filmId,
                            dragging.fromSeason,
                            seasonKey
                          );
                          setDragging(null);
                        }}
                      >
                        <h4>{seasonName}</h4>

                        {filmIds.length === 0 && (
                          <div className="empty">
                            Drop films here
                          </div>
                        )}

                        {filmIds.map(
                          (filmId) => {
                            const film =
                              films[filmId];
                            const label =
                              film?.title ??
                              film?.name ??
                              filmId;

                            return (
                              <div
                                key={filmId}
                                className="film-row draggable"
                                draggable
                                onDragStart={() =>
                                  setDragging({
                                    filmId,
                                    fromSeason:
                                      seasonKey,
                                  })
                                }
                                onDragEnd={() =>
                                  setDragging(null)
                                }
                              >
                                {label}
                              </div>
                            );
                          }
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              <button
                className="assign-submit"
                onClick={submitAssignments}
                disabled={submitting}
              >
                {submitting
                  ? "Assigning…"
                  : "Assign films to seasons"}
              </button>

              {error && (
                <div className="assign-error">
                  Error: {error}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
