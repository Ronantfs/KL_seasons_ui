import { useState } from "react";

interface EditableSeasonFieldProps {
    label: string;
    field: string;
    value: any;
    cinemaId: string;
    seasonKey: string;
}

const LAMBDA_URL =
    "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

export function EditableSeasonField({
    label,
    field,
    value,
    cinemaId,
    seasonKey,
}: EditableSeasonFieldProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(
        typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value ?? "")
    );
    const [saving, setSaving] = useState(false);

    async function updateField() {
        setSaving(true);

        let parsedValue: any = draft;
        if (typeof value === "object") {
            parsedValue = draft.trim() === "" ? null : JSON.parse(draft);
        }

        await fetch(LAMBDA_URL, {
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

        setSaving(false);
        setEditing(false);
    }

    if (!editing) {
    return (
        <div className="season-field">
            <strong>{label}:</strong>{" "}
            <button
                onClick={() => setEditing(true)}
                style={{
                    backgroundColor: "#facc15", // yellow
                    border: "1px solid #eab308",
                    borderRadius: 4,
                    padding: "2px 6px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                }}
            >
                edit
            </button>{" "}
            {typeof value === "object" ? (
                <pre className="season-json">
                    {JSON.stringify(value, null, 2)}
                </pre>
            ) : (
                String(value ?? "(empty)")
            )}
        </div>
    );
}

    return (
        <div className="season-field">
            <strong>{label}:</strong>
            {typeof value === "object" ? (
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={6}
                />
            ) : (
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                />
            )}
            <button disabled={saving} onClick={updateField}>
                {saving ? "updating…" : "update"}
            </button>
            <button onClick={() => setEditing(false)}>cancel</button>
        </div>
    );
}
