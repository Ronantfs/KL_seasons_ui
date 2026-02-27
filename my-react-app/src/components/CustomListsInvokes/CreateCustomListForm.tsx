import { useState } from "react";
import "./CreateCustomListForm.css";

const LAMBDA_URL =
  "https://b62gakukdi4hlmmcmhx533az3y0fgpqs.lambda-url.eu-north-1.on.aws/";

interface Props {
  curator: string;
  onCreated: () => void;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

const NOW = new Date();
const MIN_DATE = iso(new Date(NOW.getFullYear(), 0, 1));
const MAX_DATE = iso(new Date(NOW.getFullYear() + 1, 11, 31));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function CreateCustomListForm({ curator, onCreated }: Props) {
  const [open, setOpen] = useState(false);

  const [listName, setListName] = useState("");
  const [listCaption, setListCaption] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const filledClass = (v: string) => (v.trim() ? "filled" : "");

  const endDateValidClass = () => {
    if (!startDate || !endDate) return "";
    return endDate >= startDate ? "filled" : "invalid";
  };

  function validate(): boolean {
    if (!listName.trim()) {
      setError("List name is required.");
      return false;
    }
    if (!listCaption.trim()) {
      setError("List caption is required.");
      return false;
    }
    if (!startDate) {
      setError("Start date is required.");
      return false;
    }
    if (!endDate) {
      setError("End date is required.");
      return false;
    }
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      setError("Dates must be in YYYY-MM-DD format.");
      return false;
    }
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return false;
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
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "create_custom_list",
          curator,
          list_name: listName.trim(),
          list_caption: listCaption.trim(),
          start_date: startDate,
          end_date: endDate,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      const json = typeof raw.body === "string" ? JSON.parse(raw.body) : raw;
      if (json.status === "error") {
        throw new Error(json.message || "Server error");
      }

      setSuccess(true);
      setListName("");
      setListCaption("");
      setStartDate("");
      setEndDate("");
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ccl-wrapper">
      <button
        className={`ccl-toggle${open ? " open" : ""}`}
        onClick={() => {
          setOpen((v) => !v);
          setSuccess(false);
          setError(null);
        }}
      >
        {open ? "Cancel" : `+ New list for ${curator}`}
      </button>

      {open && (
        <form className="ccl-form" onSubmit={handleSubmit}>
          <div className="ccl-form-header">
            <p className="ccl-form-title">Create Custom List</p>
            <span className="ccl-curator-badge">{curator}</span>
          </div>

          {/* List details */}
          <div className="ccl-form-section">
            <span className="ccl-section-label">List details</span>

            <div className="ccl-field-group">
              <label className="ccl-field-label">
                List name <span className="ccl-req">*</span>
              </label>
              <input
                className={`ccl-input ${filledClass(listName)}`}
                placeholder="e.g. Best of 2026"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>

            <div className="ccl-field-group">
              <label className="ccl-field-label">
                Caption <span className="ccl-req">*</span>
              </label>
              <textarea
                className={`ccl-textarea ${filledClass(listCaption)}`}
                placeholder="Describe this list..."
                value={listCaption}
                onChange={(e) => setListCaption(e.target.value)}
              />
            </div>
          </div>

          {/* Date range */}
          <div className="ccl-form-section">
            <span className="ccl-section-label">Date range</span>

            <div className="ccl-date-range">
              <div className="ccl-date-field">
                <label className="ccl-field-label">
                  Start date <span className="ccl-req">*</span>
                </label>
                <input
                  type="date"
                  className={`ccl-input ${filledClass(startDate)}`}
                  min={MIN_DATE}
                  max={MAX_DATE}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="ccl-date-field">
                <label className="ccl-field-label">
                  End date <span className="ccl-req">*</span>
                </label>
                <input
                  type="date"
                  className={`ccl-input ${endDateValidClass()}`}
                  min={startDate || MIN_DATE}
                  max={MAX_DATE}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button className="ccl-submit" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create List"}
          </button>

          {error && <div className="ccl-feedback error">{error}</div>}
          {success && (
            <div className="ccl-feedback success">
              List created successfully!
            </div>
          )}
        </form>
      )}
    </div>
  );
}
