import { useEffect, useState, useMemo } from "react";
import type {
  AssignFilmsResponse,
  AvailableFilmSummary,
} from "../../types/customLists";
import "./AssignFilmsToList.css";

const LAMBDA_URL =
  "https://b62gakukdi4hlmmcmhx533az3y0fgpqs.lambda-url.eu-north-1.on.aws/";

/** Matches ActiveSupportedCinema in KL_seasons/core/types/cinemas.py */
const ACTIVE_CINEMAS = [
  "castle",
  "prince_charles",
  "nickel",
  "close_up",
  "ica",
  "rio",
  "garden_cinema",
  "regent_street",
  "the_cinema_museum",
  "barbican",
  "bfi_southbank",
  "cine_lumiere",
  "arthouse_crouch_end",
] as const;

function formatCinemaName(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface Props {
  curator: string;
  listName: string;
  existingDbIds: number[];
  startDate: string;
  endDate: string;
  onAssigned: () => void;
}

export function AssignFilmsToList({
  curator,
  listName,
  existingDbIds,
  startDate,
  endDate,
  onAssigned,
}: Props) {
  const [open, setOpen] = useState(false);

  // available films from pan_cinema_listings
  const [films, setFilms] = useState<Record<string, AvailableFilmSummary>>({});
  const [loadingFilms, setLoadingFilms] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // selection & filters
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [cinemaFilter, setCinemaFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  // submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssignFilmsResponse | null>(null);

  const existingSet = useMemo(
    () => new Set(existingDbIds.map(String)),
    [existingDbIds]
  );

  const allFilmIds = useMemo(() => Object.keys(films), [films]);

  /** All cinemas a film appears at (union of cinema_showings keys + cinemas array) */
  function filmCinemaSet(f: AvailableFilmSummary): Set<string> {
    const set = new Set<string>(Object.keys(f.cinema_showings ?? {}));
    for (const c of f.cinemas ?? []) set.add(c);
    return set;
  }

  // Count films per cinema so we can flag empty ones
  const filmCountByCinema = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of ACTIVE_CINEMAS) counts[c] = 0;
    for (const f of Object.values(films)) {
      for (const c of filmCinemaSet(f)) {
        if (c in counts) counts[c]++;
      }
    }
    return counts;
  }, [films]);

  const filteredFilmIds = useMemo(() => {
    let ids = allFilmIds;

    // cinema filter
    if (cinemaFilter !== "all") {
      ids = ids.filter((id) => filmCinemaSet(films[id]).has(cinemaFilter));
    }

    // date filter
    if (dateFilter) {
      ids = ids.filter((id) => {
        const showings = films[id].cinema_showings ?? {};
        const entries = cinemaFilter !== "all"
          ? (showings[cinemaFilter] ?? [])
          : Object.values(showings).flat();
        return entries.some((d) => d.date === dateFilter);
      });
    }

    // text search
    if (search.trim()) {
      const q = search.toLowerCase();
      ids = ids.filter((id) => {
        const f = films[id];
        const label = f.title.toLowerCase();
        const dirs = (Array.isArray(f.directors) ? f.directors : [])
          .join(" ")
          .toLowerCase();
        return label.includes(q) || dirs.includes(q) || id.includes(q);
      });
    }

    return ids;
  }, [allFilmIds, films, search, cinemaFilter, dateFilter]);

  // Load available films when panel opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      setLoadingFilms(true);
      setLoadError(null);

      try {
        const res = await fetch(LAMBDA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handler: "get_available_films" }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const raw = await res.json();
        const json =
          typeof raw.body === "string" ? JSON.parse(raw.body) : raw;

        if (!cancelled) {
          setFilms(json.films ?? {});
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoadingFilms(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function toggleFilm(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleAssign() {
    setError(null);
    setResult(null);

    const newIds = [...selectedIds]
      .filter((id) => !existingSet.has(id))
      .map(Number);

    if (newIds.length === 0) {
      setError("No new films selected (all are already in this list).");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "assign_films_to_list",
          curator,
          list_name: listName,
          db_ids: newIds,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      const json = (
        typeof raw.body === "string" ? JSON.parse(raw.body) : raw
      ) as AssignFilmsResponse;

      if (json.status === "error") {
        throw new Error(
          (json as unknown as { message: string }).message || "Server error"
        );
      }

      setResult(json);
      setSelectedIds(new Set());
      onAssigned();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCount = selectedIds.size;
  const newCount = [...selectedIds].filter((id) => !existingSet.has(id)).length;

  return (
    <div className="afl-wrapper">
      <button
        className={`afl-toggle${open ? " open" : ""}`}
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
          setResult(null);
          setSelectedIds(new Set());
          setSearch("");
          setCinemaFilter("all");
          setDateFilter("");
        }}
      >
        {open ? "Cancel" : "Assign films to this list"}
      </button>

      {open && (
        <div className="afl-panel">
          {loadingFilms ? (
            <div className="afl-loading">
              <div className="afl-spinner" />
              <div>Loading available films...</div>
            </div>
          ) : loadError ? (
            <div className="afl-feedback error">{loadError}</div>
          ) : (
            <>
              <div className="afl-date-range-label">
                Showing films for list date range {startDate} &rarr; {endDate}
              </div>

              {/* Cinema filter */}
              <div className="afl-filters-row">
                <select
                  className="afl-cinema-filter"
                  value={cinemaFilter}
                  onChange={(e) => {
                    setCinemaFilter(e.target.value);
                    setDateFilter("");
                  }}
                >
                  <option value="all">All cinemas</option>
                  {ACTIVE_CINEMAS.map((c) => {
                    const count = filmCountByCinema[c] ?? 0;
                    return (
                      <option key={c} value={c}>
                        {formatCinemaName(c)}{count === 0 ? " (no listings)" : ` (${count})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* No listings warning */}
              {cinemaFilter !== "all" && (filmCountByCinema[cinemaFilter] ?? 0) === 0 && (
                <div className="afl-feedback error">
                  No listings found for {formatCinemaName(cinemaFilter)}
                </div>
              )}

              {/* Secondary filters: search + date */}
              <div className="afl-filters-row">
                <input
                  className="afl-search"
                  placeholder="Search by title, director, or db_id..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                <input
                  className="afl-date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  min={startDate}
                  max={endDate}
                />
              </div>

              <div className="afl-film-count-bar">
                <span>
                  {filteredFilmIds.length} of {allFilmIds.length} films
                </span>
                {selectedCount > 0 && (
                  <span className="afl-selection-badge">
                    {newCount} new selected
                  </span>
                )}
              </div>

              <div className="afl-film-grid">
                {filteredFilmIds.length === 0 ? (
                  <div className="afl-no-match">No films match your filters</div>
                ) : (
                  filteredFilmIds.map((id) => {
                    const f = films[id];
                    const isExisting = existingSet.has(id);
                    const isSelected = selectedIds.has(id);
                    const showings = f.cinema_showings ?? {};

                    return (
                      <div
                        key={id}
                        className={`afl-film-card${isSelected ? " selected" : ""}${isExisting ? " already-in-list" : ""}`}
                        onClick={() => {
                          if (!isExisting) toggleFilm(id);
                        }}
                      >
                        <div className="afl-film-checkbox">
                          {isExisting ? "\u2022" : isSelected ? "\u2713" : ""}
                        </div>
                        <div className="afl-film-info">
                          <div className="afl-film-title">{f.title}</div>
                          <div className="afl-film-meta">
                            {Array.isArray(f.directors) && f.directors.length > 0 && (
                              <span>{f.directors.join(", ")}</span>
                            )}
                            {f.year && <span>({f.year})</span>}
                          </div>
                          <div className="afl-film-showings-summary">
                            {Object.entries(showings).map(([cinema, dates]) => (
                              <div key={cinema} className="afl-showing-line">
                                <span className="afl-showing-cinema">
                                  {formatCinemaName(cinema)}:
                                </span>{" "}
                                {dates.map((d, i) => (
                                  <span key={d.date}>
                                    {i > 0 && ", "}
                                    <span className="afl-showing-date">{d.date}</span>
                                    {d.showtimes.length > 0 && (
                                      <span className="afl-showing-times">
                                        {" "}({d.showtimes.join(", ")})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                          {isExisting && (
                            <div className="afl-film-existing-tag">
                              Already in list
                            </div>
                          )}
                        </div>
                        <span className="afl-film-dbid">#{id}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                className="afl-submit"
                onClick={handleAssign}
                disabled={submitting || newCount === 0}
              >
                {submitting
                  ? "Assigning..."
                  : newCount > 0
                    ? `Assign ${newCount} film${newCount !== 1 ? "s" : ""}`
                    : "Select films to assign"}
              </button>

              {error && <div className="afl-feedback error">{error}</div>}

              {result && (
                <div className="afl-feedback success">
                  <div>
                    Added: {result.films_added.length > 0
                      ? result.films_added.join(", ")
                      : "none"}
                  </div>
                  {result.films_skipped_already_in_list.length > 0 && (
                    <div>
                      Skipped (already in list):{" "}
                      {result.films_skipped_already_in_list.join(", ")}
                    </div>
                  )}
                  {result.films_not_found_in_pan_listings.length > 0 && (
                    <div style={{ color: "#f77" }}>
                      Not found in pan_listings:{" "}
                      {result.films_not_found_in_pan_listings.join(", ")}
                    </div>
                  )}
                  <div>Total films in list: {result.total_list_films}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
