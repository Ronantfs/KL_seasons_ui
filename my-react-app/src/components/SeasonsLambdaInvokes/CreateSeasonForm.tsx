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

  const [seasonName, setSeasonName] = useState("");
  const [seasonGroupName, setSeasonGroupName] = useState("");
  const [seasonGroupInfo, setSeasonGroupInfo] = useState("{}");

  // season_text is now plain string
  const [seasonText, setSeasonText] = useState("");

  const [programmerName, setProgrammerName] = useState("");
  const [programmerBio, setProgrammerBio] = useState("");

  const [seasonStartDate, setSeasonStartDate] = useState("");
  const [seasonEndDate, setSeasonEndDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const requiredClass = (v: string) =>
    v.trim() ? "required-filled" : "required-empty";

  const endDateClass = () => {
    if (!seasonStartDate || !seasonEndDate) return "required-empty";
    return seasonEndDate >= seasonStartDate
      ? "required-filled"
      : "required-invalid";
  };

  function validate(): boolean {
    if (
      !seasonName ||
      !programmerName ||
      !programmerBio ||
      !seasonStartDate ||
      !seasonEndDate
    ) {
      setError("All required fields must be filled.");
      return false;
    }

    if (seasonEndDate < seasonStartDate) {
      setError("Season end date must be on or after season start date.");
      return false;
    }

    if (seasonGroupInfo.trim()) {
      try {
        JSON.parse(seasonGroupInfo);
      } catch {
        setError("season_group_info must be valid JSON.");
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

            // convert plain string → JSON here
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
      setSeasonGroupInfo("{}");
      setSeasonText("");
      setProgrammerName("");
      setProgrammerBio("");
      setSeasonStartDate("");
      setSeasonEndDate("");
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-season-wrapper">
      <button
        className="toggle-button"
        onClick={() => setOpen((v) => !v)}
      >
        {open
          ? "Close season form"
          : `Create new season for ${cinemaId}`}
      </button>

      {open && (
        <form className="create-season-form" onSubmit={handleSubmit}>
          <p className="form-title">Create New Season</p>

          <div className="cinema-id">
            <strong>Cinema ID:</strong> {cinemaId}
          </div>

          <input
            className={`input ${requiredClass(seasonName)}`}
            placeholder="season name (required)"
            value={seasonName}
            onChange={(e) => setSeasonName(e.target.value)}
          />

          <input
            className="input optional"
            placeholder="season_group_name (optional)"
            value={seasonGroupName}
            onChange={(e) => setSeasonGroupName(e.target.value)}
          />

          <textarea
            className="textarea optional"
            placeholder="season_group_info (JSON, optional)"
            value={seasonGroupInfo}
            onChange={(e) => setSeasonGroupInfo(e.target.value)}
          />

          <textarea
            className="textarea required-filled"
            placeholder="season text (plain text)"
            value={seasonText}
            onChange={(e) => setSeasonText(e.target.value)}
          />

          <input
            className={`input ${requiredClass(programmerName)}`}
            placeholder="programmer_name (required)"
            value={programmerName}
            onChange={(e) => setProgrammerName(e.target.value)}
          />

          <textarea
            className={`textarea ${requiredClass(programmerBio)}`}
            placeholder="programmer_bio (required)"
            value={programmerBio}
            onChange={(e) => setProgrammerBio(e.target.value)}
          />

          <div className="date-range">
            <div className="date-field">
              <label>Season start date</label>
              <input
                type="date"
                className={`input ${requiredClass(seasonStartDate)}`}
                min={MIN_DATE}
                max={MAX_DATE}
                value={seasonStartDate}
                onChange={(e) => setSeasonStartDate(e.target.value)}
              />
            </div>

            <div className="date-field">
              <label>Season end date</label>
              <input
                type="date"
                className={`input ${endDateClass()}`}
                min={MIN_DATE}
                max={MAX_DATE}
                value={seasonEndDate}
                onChange={(e) => setSeasonEndDate(e.target.value)}
              />
            </div>
          </div>

          <button
            className="submit-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating…" : "Create Season"}
          </button>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">Season created.</div>}
        </form>
      )}
    </div>
  );
}
