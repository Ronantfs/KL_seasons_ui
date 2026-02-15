import { useEffect, useState, useMemo } from "react";
import type {
  ActiveSupportedCinema,
  Season,
} from "../../types/cinemaSeasons";
import "./AssignFilmsToSeasons.css"; // reuse shared styles

const LAMBDA_URL =
  "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

interface Props {
  cinemaId: ActiveSupportedCinema;
}

type Step = "source" | "films" | "destination" | "review";

export function MoveFilmsBetweenSeasons({ cinemaId }: Props) {
  const [open, setOpen] = useState(false);

  const [seasons, setSeasons] = useState<Record<string, Season>>({});

  const [step, setStep] = useState<Step>("source");
  const [sourceSeason, setSourceSeason] = useState<string | null>(null);
  const [selectedFilms, setSelectedFilms] = useState<Set<string>>(new Set());
  const [destSeason, setDestSeason] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // all seasons including season_none
  const allSeasonKeys = useMemo(() => Object.keys(seasons), [seasons]);

  // seasons with at least one film (valid sources)
  const sourceSeasonKeys = useMemo(
    () =>
      allSeasonKeys.filter(
        (k) => Object.keys(seasons[k]?.films ?? {}).length > 0
      ),
    [allSeasonKeys, seasons]
  );

  // destination options: all seasons except the source
  const destSeasonKeys = useMemo(
    () => allSeasonKeys.filter((k) => k !== sourceSeason),
    [allSeasonKeys, sourceSeason]
  );

  // films in the selected source season
  const sourceFilmIds = useMemo(() => {
    if (!sourceSeason) return [];
    return Object.keys(seasons[sourceSeason]?.films ?? {});
  }, [sourceSeason, seasons]);

  // filtered by search
  const filteredFilmIds = useMemo(() => {
    if (!search.trim()) return sourceFilmIds;
    const q = search.toLowerCase();
    return sourceFilmIds.filter((id) => id.toLowerCase().includes(q));
  }, [sourceFilmIds, search]);

  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(LAMBDA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handler: "get_seasons_for_cinema",
            cinema_id: cinemaId,
          }),
        });

        const json = await res.json();
        setSeasons(json.seasons ?? {});
        setStep("source");
        setSourceSeason(null);
        setSelectedFilms(new Set());
        setDestSeason(null);
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

  function seasonDisplayName(key: string): string {
    if (key === "season_none") return "Unassigned";
    return seasons[key]?.season_info?.season_name ?? key;
  }

  function seasonDateRange(key: string): string {
    return seasons[key]?.season_info?.season_date_range ?? "";
  }

  function filmCount(key: string): number {
    return Object.keys(seasons[key]?.films ?? {}).length;
  }

  function toggleFilm(filmId: string) {
    setSelectedFilms((prev) => {
      const next = new Set(prev);
      if (next.has(filmId)) next.delete(filmId);
      else next.add(filmId);
      return next;
    });
  }

  function selectAll() {
    setSelectedFilms(new Set(filteredFilmIds));
  }

  function deselectAll() {
    setSelectedFilms(new Set());
  }

  async function submitMove() {
    if (!sourceSeason || !destSeason || selectedFilms.size === 0) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "move_films_between_seasons",
          cinema_id: cinemaId,
          source_season_key: sourceSeason,
          destination_season_key: destSeason,
          film_keys: [...selectedFilms],
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

  // ── step indicator ──────────────────────────────

  const steps: { key: Step; label: string }[] = [
    { key: "source", label: "From season" },
    { key: "films", label: "Select films" },
    { key: "destination", label: "To season" },
    { key: "review", label: "Confirm" },
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
        {open ? "Cancel" : `Move films between seasons for ${cinemaId}`}
      </button>

      {open && (
        <div className="assign-panel">
          {loading ? (
            <div className="assign-loading">
              <div className="assign-spinner" />
              <div>Loading seasons...</div>
            </div>
          ) : (
            <>
              {renderStepIndicator()}

              {/* ── Step 1: Pick source season ────── */}
              {step === "source" && (
                <>
                  <p className="step-title">
                    Which season do you want to move films from?
                  </p>

                  {sourceSeasonKeys.length === 0 ? (
                    <div className="review-empty">
                      No seasons have films to move
                    </div>
                  ) : (
                    <div className="season-picker-grid">
                      {sourceSeasonKeys.map((key) => (
                        <div
                          key={key}
                          className={`season-pick-card${
                            sourceSeason === key ? " selected" : ""
                          }`}
                          onClick={() => {
                            setSourceSeason(key);
                            setSelectedFilms(new Set());
                          }}
                        >
                          <div className="season-pick-name">
                            {seasonDisplayName(key)}
                          </div>
                          <div className="season-pick-dates">
                            {seasonDateRange(key)}
                          </div>
                          <div className="season-pick-count">
                            {filmCount(key)} film
                            {filmCount(key) !== 1 ? "s" : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="assign-nav">
                    <span />
                    <button
                      className="btn-next"
                      disabled={!sourceSeason}
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

              {/* ── Step 2: Select films to move ──── */}
              {step === "films" && sourceSeason && (
                <>
                  <div className="film-selector-header">
                    <p className="step-title" style={{ margin: 0 }}>
                      Select films to move
                    </p>
                    <span className="selected-season-badge">
                      From: {seasonDisplayName(sourceSeason)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 10,
                      alignItems: "center",
                    }}
                  >
                    <input
                      className="film-search"
                      placeholder="Search films..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ marginBottom: 0, flex: 1 }}
                      autoFocus
                    />
                    <button className="btn-back" onClick={selectAll}>
                      Select all
                    </button>
                    <button className="btn-back" onClick={deselectAll}>
                      Clear
                    </button>
                  </div>

                  <div className="film-grid">
                    {filteredFilmIds.length === 0 ? (
                      <div className="no-films-match">
                        No films match your search
                      </div>
                    ) : (
                      filteredFilmIds.map((filmId) => {
                        const isSelected = selectedFilms.has(filmId);
                        return (
                          <div
                            key={filmId}
                            className={`film-card${
                              isSelected ? " selected-for-current" : ""
                            }`}
                            onClick={() => toggleFilm(filmId)}
                          >
                            <div className="film-checkbox">
                              {isSelected ? "\u2713" : ""}
                            </div>
                            <div className="film-card-info">
                              <div className="film-card-title">{filmId}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="assign-nav">
                    <button
                      className="btn-back"
                      onClick={() => setStep("source")}
                    >
                      Back
                    </button>
                    <button
                      className="btn-next"
                      disabled={selectedFilms.size === 0}
                      onClick={() => {
                        setDestSeason(null);
                        setStep("destination");
                      }}
                    >
                      Next: Choose destination ({selectedFilms.size} selected)
                    </button>
                  </div>
                </>
              )}

              {/* ── Step 3: Pick destination season ── */}
              {step === "destination" && (
                <>
                  <p className="step-title">
                    Which season should these films move to?
                  </p>

                  <div className="season-picker-grid">
                    {destSeasonKeys.map((key) => (
                      <div
                        key={key}
                        className={`season-pick-card${
                          destSeason === key ? " selected" : ""
                        }`}
                        onClick={() => setDestSeason(key)}
                      >
                        <div className="season-pick-name">
                          {seasonDisplayName(key)}
                        </div>
                        <div className="season-pick-dates">
                          {seasonDateRange(key)}
                        </div>
                        <div className="season-pick-count">
                          {filmCount(key)} film
                          {filmCount(key) !== 1 ? "s" : ""} currently
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="assign-nav">
                    <button
                      className="btn-back"
                      onClick={() => setStep("films")}
                    >
                      Back
                    </button>
                    <button
                      className="btn-next"
                      disabled={!destSeason}
                      onClick={() => setStep("review")}
                    >
                      Next: Review
                    </button>
                  </div>
                </>
              )}

              {/* ── Step 4: Review & confirm ──────── */}
              {step === "review" && sourceSeason && destSeason && (
                <>
                  <p className="step-title">Review move</p>

                  <div className="review-summary">
                    <div className="review-season-block">
                      <div className="review-season-header">
                        <span className="review-season-name">
                          From: {seasonDisplayName(sourceSeason)}
                        </span>
                        <span className="review-film-count">
                          {selectedFilms.size} film
                          {selectedFilms.size !== 1 ? "s" : ""} moving out
                        </span>
                      </div>
                      <div className="review-film-list">
                        {[...selectedFilms].map((id) => (
                          <span key={id} className="review-film-tag">
                            {id}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        color: "#7c6aef",
                        fontSize: "1.2rem",
                        padding: "4px 0",
                      }}
                    >
                      &#8595;
                    </div>

                    <div className="review-season-block">
                      <div className="review-season-header">
                        <span className="review-season-name">
                          To: {seasonDisplayName(destSeason)}
                        </span>
                        <span className="review-film-count">
                          {filmCount(destSeason)} film
                          {filmCount(destSeason) !== 1 ? "s" : ""} currently +{" "}
                          {selectedFilms.size} incoming
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="assign-nav">
                    <button
                      className="btn-back"
                      onClick={() => setStep("destination")}
                    >
                      Back
                    </button>
                    <button
                      className="btn-confirm"
                      onClick={submitMove}
                      disabled={submitting}
                    >
                      {submitting
                        ? "Moving..."
                        : `Confirm: move ${selectedFilms.size} film${selectedFilms.size !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="assign-feedback error">{error}</div>
              )}
              {success && (
                <div className="assign-feedback success">
                  Films moved successfully!
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
