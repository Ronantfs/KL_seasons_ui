import { useState } from "react";
import "./DeleteListButton.css";

const LAMBDA_URL =
  "https://b62gakukdi4hlmmcmhx533az3y0fgpqs.lambda-url.eu-north-1.on.aws/";

interface Props {
  curator: string;
  listName: string;
  onDeleted: () => void;
}

export function DeleteListButton({ curator, listName, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "delete_list",
          curator,
          list_name: listName,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      const json = typeof raw.body === "string" ? JSON.parse(raw.body) : raw;
      if (json.status === "error") {
        throw new Error(json.message || "Server error");
      }

      onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="dlb-confirm">
        <span className="dlb-confirm-text">
          Delete &ldquo;{listName}&rdquo;?
        </span>
        <div className="dlb-confirm-buttons">
          <button
            className="dlb-cancel"
            onClick={() => setConfirming(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="dlb-delete"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
        {error && <div className="dlb-error">{error}</div>}
      </div>
    );
  }

  return (
    <button className="dlb-trigger" onClick={() => setConfirming(true)}>
      Delete list
    </button>
  );
}
