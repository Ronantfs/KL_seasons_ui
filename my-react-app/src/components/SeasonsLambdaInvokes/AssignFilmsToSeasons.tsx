import { useEffect, useState, useMemo } from "react";
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

type Step = "season" | "films" | "review";

export function AssignFilmsToSeasons({ cinemaId }: Props) {
  const [open, setOpen] = useState(false);

  // data
  const [films, setFilms] = useState<Record<string, Film>>({});
  const [seasons, setSeasons] = useState<Record<string, Season>>({});

  // assignments: seasonKey -> filmId[]
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  // flow
  const [step, setStep] = useState<Step>("season");
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // async state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // seasons excluding season_none
  const seasonKeys = useMemo(
    () => Object.keys(seasons).filter((k) => k !== "season_none"),
    [seasons]
  );

  // reverse lookup: filmId -> seasonKey (or null)
  const filmOwner = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [seasonKey, filmIds] of Object.entries(assignments)) {
      if (seasonKey === "season_none") continue;
      for (const id of filmIds) {
        map[id] = seasonKey;
      }
    }
    return map;
  }, [assignments]);

  // all film ids
  const allFilmIds = useMemo(() => Object.keys(films), [films]);

  // filtered film ids for search
  const filteredFilmIds = useMemo(() => {
    if (!search.trim()) return allFilmIds;
    const q = search.toLowerCase();
    return allFilmIds.filter((id) => {
      const f = films[id];
      const label = f?.title ?? f?.name ?? id;
      return label.toLowerCase().includes(q) || id.toLowerCase().includes(q);
    });
  }, [allFilmIds, films, search]);

  // count assigned films per season
  const assignedCount = (seasonKey: string) =>
    (assignments[seasonKey] ?? []).length;

  // total assigned (not in season_none)
  const totalAssigned = useMemo(
    () => Object.values(filmOwner).length,
    [filmOwner]
  );

  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [filmsRes, seasonsRes] = await Promise.all([
          fetch(LAMBDA_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              handler: "get_cinemas_active_listings",
              cinema_id: cinemaId,
            }),
          }),
          fetch(LAMBDA_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              handler: "get_seasons_for_cinema",
              cinema_id: cinemaId,
            }),
          }),
        ]);

        const filmsJson = await filmsRes.json();
        const seasonsJson = await seasonsRes.json();

        const filmsData: Record<string, Film> = filmsJson.active_listings;
        const seasonsData: Record<string, Season> = seasonsJson.seasons;

        // initialise assignments: every season gets an empty array,
        // all films start in season_none
        const initial: Record<string, string[]> = {
          season_none: Object.keys(filmsData),
        };
        for (const key of Object.keys(seasonsData)) {
          if (key !== "season_none") {
            initial[key] = [];
          }
        }

        setFilms(filmsData);
        setSeasons(seasonsData);
        setAssignments(initial);
        setStep("season");
        setSelectedSeason(null);
        setSearch("");
        setSuccess(false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, cinemaId]);

  function toggleFilm(filmId: string) {
    if (!selectedSeason) return;

    setAssignments((prev) => {
      const current = prev[selectedSeason] ?? [];
      const isSelected = current.includes(filmId);

      // find which season currently owns this film
      const currentOwner = filmOwner[filmId];

      if (isSelected) {
        // unassign: move back to season_none
        return {
          ...prev,
          [selectedSeason]: current.filter((id) => id !== filmId),
          season_none: [...prev.season_none, filmId],
        };
      } else {
        // assign to selected season, remove from previous owner
        const fromSeason = currentOwner ?? "season_none";
        return {
          ...prev,
          [fromSeason]: (prev[fromSeason] ?? []).filter((id) => id !== filmId),
          [selectedSeason]: [...current, filmId],
        };
      }
    });
  }

  async function submitAssignments() {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const filmToSeasonMap: Record<string, string> = {};
    for (const [seasonKey, filmIds] of Object.entries(assignments)) {
      if (seasonKey === "season_none") continue;
      for (const filmId of filmIds) {
        filmToSeasonMap[filmId] = seasonKey;
      }
    }

    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "assign_films_to_seasons",
          cinema_id: cinemaId,
          film_to_season_map: filmToSeasonMap,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  function filmLabel(filmId: string): string {
    const f = films[filmId];
    return f?.title ?? f?.name ?? filmId;
  }

  function seasonDisplayName(key: string): string {
    return seasons[key]?.season_info?.season_name ?? key;
  }

  function seasonDateRange(key: string): string {
    return seasons[key]?.season_info?.season_date_range ?? "";
  }

  // ── step indicator ──────────────────────────────

  const steps: { key: Step; label: string }[] = [
    { key: "season", label: "Choose season" },
    { key: "films", label: "Select films" },
    { key: "review", label: "Review & confirm" },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  function renderStepIndicator() {
    return (
      <div className="step-indicator">
        {steps.map((s, i) => (
          <div key={s.key} style={{ display: "contents" }}>
            <div
              className={`step-dot ${
                i === stepIndex
                  ? "active"
                  : i < stepIndex
                    ? "completed"
                    : ""
              }`}
            >
              <span className="step-number">
                {i < stepIndex ? "\u2713" : i + 1}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`step-connector ${i < stepIndex ? "completed" : ""}`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── render ──────────────────────────────────────

  return (
    <div className="assign-wrapper">
      <button
        className={`assign-toggle${open ? " open" : ""}`}
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
          setSuccess(false);
        }}
      >
        {open ? "Cancel" : `Assign films for ${cinemaId}`}
      </button>

      {open && (
        <div className="assign-panel">
          {loading ? (
            <div className="assign-loading">
              <div className="assign-spinner" />
              <div>Loading films and seasons...</div>
            </div>
          ) : (
            <>
              {renderStepIndicator()}

              {/* ── Step 1: Pick a season ─────────── */}
              {step === "season" && (
                <>
                  <p className="step-title">
                    Which season do you want to assign films to?
                  </p>

                  <div className="season-picker-grid">
                    {seasonKeys.map((key) => (
                      <div
                        key={key}
                        className={`season-pick-card${
                          selectedSeason === key ? " selected" : ""
                        }`}
                        onClick={() => setSelectedSeason(key)}
                      >
                        <div className="season-pick-name">
                          {seasonDisplayName(key)}
                        </div>
                        <div className="season-pick-dates">
                          {seasonDateRange(key)}
                        </div>
                        <div className="season-pick-count">
                          {assignedCount(key)} film
                          {assignedCount(key) !== 1 ? "s" : ""} assigned
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="assign-nav">
                    <span />
                    <button
                      className="btn-next"
                      disabled={!selectedSeason}
                      onClick={() => {
                        setSearch("");
                        setStep("films");
                      }}
                    >
                      Next: Select films
                    </button>
                  </div>
                </>
              )}

              {/* ── Step 2: Select films ─────────── */}
              {step === "films" && selectedSeason && (
                <>
                  <div className="film-selector-header">
                    <p className="step-title" style={{ margin: 0 }}>
                      Select films
                    </p>
                    <span className="selected-season-badge">
                      {seasonDisplayName(selectedSeason)}
                    </span>
                  </div>

                  <input
                    className="film-search"
                    placeholder="Search films..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />

                  <div className="film-grid">
                    {filteredFilmIds.length === 0 ? (
                      <div className="no-films-match">
                        No films match your search
                      </div>
                    ) : (
                      filteredFilmIds.map((filmId) => {
                        const owner = filmOwner[filmId];
                        const isSelected = owner === selectedSeason;
                        const isElsewhere =
                          !!owner && owner !== selectedSeason;

                        return (
                          <div
                            key={filmId}
                            className={`film-card${
                              isSelected ? " selected-for-current" : ""
                            }${isElsewhere ? " assigned-elsewhere" : ""}`}
                            onClick={() => toggleFilm(filmId)}
                          >
                            <div className="film-checkbox">
                              {isSelected ? "\u2713" : ""}
                            </div>
                            <div className="film-card-info">
                              <div className="film-card-title">
                                {filmLabel(filmId)}
                              </div>
                              {isElsewhere && (
                                <div className="film-card-owner">
                                  In: {seasonDisplayName(owner)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="assign-nav">
                    <button
                      className="btn-back"
                      onClick={() => setStep("season")}
                    >
                      Back
                    </button>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="btn-back"
                        onClick={() => {
                          setStep("season");
                          setSelectedSeason(null);
                        }}
                      >
                        Pick another season
                      </button>
                      <button
                        className="btn-next"
                        onClick={() => setStep("review")}
                      >
                        Review assignments
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 3: Review & confirm ─────── */}
              {step === "review" && (
                <>
                  <p className="step-title">Review assignments</p>

                  <div className="review-summary">
                    {seasonKeys.map((key) => {
                      const filmIds = assignments[key] ?? [];
                      return (
                        <div key={key} className="review-season-block">
                          <div className="review-season-header">
                            <span className="review-season-name">
                              {seasonDisplayName(key)}
                            </span>
                            <span className="review-film-count">
                              {filmIds.length} film
                              {filmIds.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {filmIds.length > 0 ? (
                            <div className="review-film-list">
                              {filmIds.map((id) => (
                                <span key={id} className="review-film-tag">
                                  {filmLabel(id)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="review-empty">
                              No films assigned
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {allFilmIds.length - totalAssigned > 0 && (
                      <div className="review-unassigned-note">
                        {allFilmIds.length - totalAssigned} film
                        {allFilmIds.length - totalAssigned !== 1
                          ? "s"
                          : ""}{" "}
                        will remain unassigned
                      </div>
                    )}
                  </div>

                  <div className="assign-nav">
                    <button
                      className="btn-back"
                      onClick={() => setStep("season")}
                    >
                      Back to seasons
                    </button>
                    <button
                      className="btn-confirm"
                      onClick={submitAssignments}
                      disabled={submitting}
                    >
                      {submitting
                        ? "Assigning..."
                        : "Confirm & assign films"}
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="assign-feedback error">{error}</div>
              )}
              {success && (
                <div className="assign-feedback success">
                  Films assigned successfully!
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
