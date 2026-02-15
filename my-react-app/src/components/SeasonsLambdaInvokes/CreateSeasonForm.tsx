import { useState } from "react";
import type { ActiveSupportedCinema } from "../../types/cinemaSeasons";
import "./CreateSeasonForm.css";

const LAMBDA_URL =
  "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

interface Props {
  cinemaId: ActiveSupportedCinema;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

const NOW = new Date();
const MIN_DATE = iso(new Date(NOW.getFullYear(), 0, 1));
const MAX_DATE = iso(new Date(NOW.getFullYear() + 1, 11, 31));

export function CreateSeasonForm({ cinemaId }: Props) {
  const [open, setOpen] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const [seasonName, setSeasonName] = useState("");
  const [seasonGroupName, setSeasonGroupName] = useState("");
  const [seasonGroupInfo, setSeasonGroupInfo] = useState("");

  const [seasonText, setSeasonText] = useState("");

  const [programmerName, setProgrammerName] = useState("");
  const [programmerBio, setProgrammerBio] = useState("");

  const [seasonStartDate, setSeasonStartDate] = useState("");
  const [seasonEndDate, setSeasonEndDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const filledClass = (v: string) => (v.trim() ? "filled" : "");

  const endDateValidClass = () => {
    if (!seasonStartDate || !seasonEndDate) return "";
    return seasonEndDate >= seasonStartDate ? "filled" : "invalid";
  };

  function validate(): boolean {
    if (
      !seasonName.trim() ||
      !programmerName.trim() ||
      !programmerBio.trim() ||
      !seasonStartDate ||
      !seasonEndDate
    ) {
      setError("Please fill in all required fields.");
      return false;
    }

    if (seasonEndDate < seasonStartDate) {
      setError("End date must be on or after the start date.");
      return false;
    }

    if (seasonGroupInfo.trim()) {
      try {
        JSON.parse(seasonGroupInfo);
      } catch {
        setError("Group info must be valid JSON.");
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        handler: "add_season_to_cinema",
        cinema_id: cinemaId,
        season_definitions: {
          [seasonName]: {
            season_group_name: seasonGroupName || undefined,
            season_group_info: seasonGroupInfo
              ? JSON.parse(seasonGroupInfo)
              : undefined,
            season_name: seasonName,
            season_text: {
              text: seasonText,
            },
            programmer_name: programmerName,
            programmer_bio: programmerBio,
            season_date_range: `${seasonStartDate},${seasonEndDate}`,
            season_images: [],
          },
        },
      };

      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setSuccess(true);
      setSeasonName("");
      setSeasonGroupName("");
      setSeasonGroupInfo("");
      setSeasonText("");
      setProgrammerName("");
      setProgrammerBio("");
      setSeasonStartDate("");
      setSeasonEndDate("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-season-wrapper">
      <button
        className={`toggle-button${open ? " open" : ""}`}
        onClick={() => {
          setOpen((v) => !v);
          setSuccess(false);
          setError(null);
        }}
      >
        {open ? "Cancel" : `+ New season for ${cinemaId}`}
      </button>

      {open && (
        <form className="create-season-form" onSubmit={handleSubmit}>
          {/* header */}
          <div className="form-header">
            <p className="form-title">Create Season</p>
            <span className="cinema-badge">{cinemaId}</span>
          </div>

          {/* ── Season details ──────────────────────── */}
          <div className="form-section">
            <span className="section-label">Season details</span>

            <div className="field-group">
              <label className="field-label">
                Season name <span className="req">*</span>
              </label>
              <input
                className={`input ${filledClass(seasonName)}`}
                placeholder="e.g. Hitchcock Retrospective"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Season description</label>
              <textarea
                className={`textarea ${filledClass(seasonText)}`}
                placeholder="Describe the season for the audience..."
                value={seasonText}
                onChange={(e) => setSeasonText(e.target.value)}
              />
            </div>
          </div>

          {/* ── Date range ──────────────────────────── */}
          <div className="form-section">
            <span className="section-label">Date range</span>

            <div className="date-range">
              <div className="date-field">
                <label className="field-label">
                  Start date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  className={`input ${filledClass(seasonStartDate)}`}
                  min={MIN_DATE}
                  max={MAX_DATE}
                  value={seasonStartDate}
                  onChange={(e) => setSeasonStartDate(e.target.value)}
                />
              </div>

              <div className="date-field">
                <label className="field-label">
                  End date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  className={`input ${endDateValidClass()}`}
                  min={seasonStartDate || MIN_DATE}
                  max={MAX_DATE}
                  value={seasonEndDate}
                  onChange={(e) => setSeasonEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Programmer ──────────────────────────── */}
          <div className="form-section">
            <span className="section-label">Programmer</span>

            <div className="field-group">
              <label className="field-label">
                Name <span className="req">*</span>
              </label>
              <input
                className={`input ${filledClass(programmerName)}`}
                placeholder="e.g. Jane Smith"
                value={programmerName}
                onChange={(e) => setProgrammerName(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">
                Bio <span className="req">*</span>
              </label>
              <textarea
                className={`textarea ${filledClass(programmerBio)}`}
                placeholder="A short bio of the programmer..."
                value={programmerBio}
                onChange={(e) => setProgrammerBio(e.target.value)}
              />
            </div>
          </div>

          {/* ── Optional: grouping ──────────────────── */}
          <div className="form-section">
            <button
              type="button"
              className="optional-toggle"
              onClick={() => setShowOptional((v) => !v)}
            >
              <span
                className={`optional-chevron${showOptional ? " expanded" : ""}`}
              >
                &#9654;
              </span>
              Optional: season grouping
            </button>

            {showOptional && (
              <div className="optional-fields">
                <div className="field-group">
                  <label className="field-label">Group name</label>
                  <input
                    className={`input ${filledClass(seasonGroupName)}`}
                    placeholder="e.g. Summer 2026 Programme"
                    value={seasonGroupName}
                    onChange={(e) => setSeasonGroupName(e.target.value)}
                  />
                  <span className="field-hint">
                    Use this to group related seasons together
                  </span>
                </div>

                <div className="field-group">
                  <label className="field-label">Group info (JSON)</label>
                  <textarea
                    className={`textarea ${filledClass(seasonGroupInfo)}`}
                    placeholder='{"key": "value"}'
                    value={seasonGroupInfo}
                    onChange={(e) => setSeasonGroupInfo(e.target.value)}
                    style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  />
                  <span className="field-hint">
                    Extra metadata for the group, must be valid JSON
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Submit ──────────────────────────────── */}
          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Season"}
          </button>

          {error && <div className="feedback error">{error}</div>}
          {success && (
            <div className="feedback success">
              Season created successfully!
            </div>
          )}
        </form>
      )}
    </div>
  );
}
