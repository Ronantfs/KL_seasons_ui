import { useState } from "react";
import type { CustomList, ListFilm } from "../types/customLists";
import { DeleteListButton } from "./CustomListsInvokes/DeleteListButton";
import { AssignFilmsToList } from "./CustomListsInvokes/AssignFilmsToList";
import "./CustomListCard.css";

interface Props {
  curator: string;
  list: CustomList;
  onDeleted: () => void;
  onFilmsAssigned: () => void;
}

function filmTitle(film: ListFilm): string {
  const cinemas = Object.values(film.cinema_listings);
  for (const cinema of cinemas) {
    const title = cinema._additional_info?.title;
    if (title) return title;
  }
  return `Film #${film.db_id}`;
}

function filmDirectors(film: ListFilm): string | null {
  const cinemas = Object.values(film.cinema_listings);
  for (const cinema of cinemas) {
    const dirs = cinema._additional_info?.directors;
    if (dirs && dirs.length > 0) return dirs.join(", ");
  }
  return null;
}

function filmYear(film: ListFilm): number | null {
  const cinemas = Object.values(film.cinema_listings);
  for (const cinema of cinemas) {
    const yr = cinema._additional_info?.year;
    if (yr) return yr;
  }
  return null;
}

export function CustomListCard({
  curator,
  list,
  onDeleted,
  onFilmsAssigned,
}: Props) {
  const [open, setOpen] = useState(false);

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
                {list.list_films.map((film) => {
                  const title = filmTitle(film);
                  const directors = filmDirectors(film);
                  const year = filmYear(film);
                  const cinemaCount = Object.keys(film.cinema_listings).length;

                  return (
                    <div key={film.db_id} className="cl-film-item">
                      <div className="cl-film-item-main">
                        <span className="cl-film-item-title">{title}</span>
                        <span className="cl-film-item-dbid">
                          #{film.db_id}
                        </span>
                      </div>
                      {(directors || year) && (
                        <div className="cl-film-item-meta">
                          {directors && (
                            <span className="cl-film-item-directors">
                              {directors}
                            </span>
                          )}
                          {year && (
                            <span className="cl-film-item-year">({year})</span>
                          )}
                        </div>
                      )}
                      <div className="cl-film-item-cinemas">
                        {cinemaCount} cinema{cinemaCount !== 1 ? "s" : ""}
                      </div>
                      {film.list_film_caption && (
                        <div className="cl-film-item-caption">
                          {film.list_film_caption}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
