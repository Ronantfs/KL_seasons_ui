import { useState } from "react";
import type { CustomList } from "../types/customLists";
import { DeleteListButton } from "./CustomListsInvokes/DeleteListButton";
import { AssignFilmsToList } from "./CustomListsInvokes/AssignFilmsToList";
import { SingleCustomListFilmSummary } from "./SingleCustomListFilmSummary";
import "./CustomListCard.css";

interface Props {
  curator: string;
  list: CustomList;
  onDeleted: () => void;
  onFilmsAssigned: () => void;
}

export function CustomListCard({
  curator,
  list,
  onDeleted,
  onFilmsAssigned,
}: Props) {
  const [open, setOpen] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);

  const filmCount = list.list_films.length;

  return (
    <section className={`cl-card${open ? " expanded" : ""}`}>
      {/* ── Header (always visible) ── */}
      <div className="cl-card-header" onClick={() => setOpen((v) => !v)}>
        <div className="cl-card-header-left">
          <h2 className="cl-card-title">{list.list_name}</h2>
          <span className="cl-card-dates">
            {list.start_date} &mdash; {list.end_date}
          </span>
        </div>

        <div className="cl-card-header-right">
          <span className="cl-card-film-count">
            {filmCount} film{filmCount !== 1 ? "s" : ""}
          </span>
          <span className={`cl-card-chevron${open ? " open" : ""}`}>
            &#9662;
          </span>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div className="cl-card-body">
          <div className="cl-card-toolbar">
            <DeleteListButton
              curator={curator}
              listName={list.list_name}
              onDeleted={onDeleted}
            />
          </div>

          {/* Caption */}
          <div className="cl-card-section">
            <span className="cl-card-section-label">Caption</span>
            <p className="cl-card-caption">
              {list.list_caption || <em style={{ color: "#666" }}>No caption</em>}
            </p>
          </div>

          {/* Assign films */}
          <div className="cl-card-section">
            <AssignFilmsToList
              curator={curator}
              listName={list.list_name}
              existingDbIds={list.list_films.map((f) => f.db_id)}
              startDate={list.start_date}
              endDate={list.end_date}
              onAssigned={onFilmsAssigned}
            />
          </div>

          {/* Films */}
          <div className="cl-card-section">
            <div className="cl-films-header">
              <h4 className="cl-films-title">Films</h4>
              <span className="cl-films-count-badge">{filmCount}</span>
            </div>

            {filmCount === 0 ? (
              <div className="cl-no-films">No films assigned to this list</div>
            ) : (
              <div className="cl-films-grid">
                {list.list_films.map((film) => (
                  <SingleCustomListFilmSummary key={film.db_id} film={film} />
                ))}
              </div>
            )}
          </div>

          {/* Raw JSON */}
          <div className="cl-card-section">
            <button
              className="cl-json-toggle"
              onClick={() => setJsonOpen((v) => !v)}
            >
              {jsonOpen ? "Hide" : "Show"} raw JSON
            </button>
            {jsonOpen && (
              <pre className="cl-json-block">
                <code>{JSON.stringify(list, null, 2)}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
