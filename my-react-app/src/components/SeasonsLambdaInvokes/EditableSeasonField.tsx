import { useState, useEffect } from "react";
import "./EditableSeasonField.css";

interface EditableSeasonFieldProps {
  label: string;
  field: string;
  value: unknown;
  cinemaId: string;
  seasonKey: string;
}

const LAMBDA_URL =
  "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

/** Human-readable labels for season info fields. */
const FRIENDLY_LABELS: Record<string, string> = {
  season_name: "Season name",
  season_group_name: "Group name",
  season_group_info: "Group info",
  season_text: "Description",
  programmer_name: "Programmer",
  programmer_bio: "Programmer bio",
  season_date_range: "Date range",
  season_images: "Images",
};

function stringify(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

export function EditableSeasonField({
  label,
  field,
  value,
  cinemaId,
  seasonKey,
}: EditableSeasonFieldProps) {
  const isObject = typeof value === "object" && value !== null;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => stringify(value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // reset draft when value changes externally
  useEffect(() => {
    if (!editing) setDraft(stringify(value));
  }, [value, editing]);

  const friendlyLabel = FRIENDLY_LABELS[field] ?? label;

  function startEditing() {
    setDraft(stringify(value));
    setError(null);
    setSuccess(false);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(stringify(value));
    setEditing(false);
    setError(null);
  }

  async function saveField() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    let parsedValue: unknown = draft;
    if (isObject) {
      try {
        parsedValue = draft.trim() === "" ? null : JSON.parse(draft);
      } catch {
        setError("Invalid JSON");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "update_season_info",
          cinema_id: cinemaId,
          season_key: seasonKey,
          season_info_updates: {
            [field]: parsedValue,
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess(true);
      setEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  // ── display mode ────────────────────────────────

  if (!editing) {
    const isEmpty =
      value == null ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" &&
        value !== null &&
        Object.keys(value).length === 0);

    return (
      <div className="esf">
        <div className="esf-display">
          <div style={{ flex: 1 }}>
            <div className="esf-label">{friendlyLabel}</div>
            {isObject ? (
              isEmpty ? (
                <span className="esf-value esf-value-empty">(empty)</span>
              ) : (
                <pre className="esf-value-json">
                  {JSON.stringify(value, null, 2)}
                </pre>
              )
            ) : (
              <span
                className={`esf-value${isEmpty ? " esf-value-empty" : ""}`}
              >
                {isEmpty ? "(empty)" : String(value)}
              </span>
            )}
          </div>
          <button className="esf-edit-btn" onClick={startEditing}>
            Edit
          </button>
        </div>
        {success && <span className="esf-feedback success">Updated</span>}
      </div>
    );
  }

  // ── edit mode ───────────────────────────────────

  const useTextarea = isObject || String(value ?? "").length > 60;

  return (
    <div className="esf esf-editing">
      <div className="esf-label">{friendlyLabel}</div>

      {useTextarea ? (
        <textarea
          className={`esf-textarea${isObject ? " mono" : ""}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={isObject ? 6 : 3}
          autoFocus
        />
      ) : (
        <input
          className="esf-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
      )}

      <div className="esf-actions">
        <button
          className="esf-save-btn"
          disabled={saving}
          onClick={saveField}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button className="esf-cancel-btn" onClick={cancelEditing}>
          Cancel
        </button>
      </div>

      {error && <span className="esf-feedback error">{error}</span>}
    </div>
  );
}
