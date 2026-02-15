import type {
  ActiveSupportedCinema,
  RawFilmListing,
  Season,
  SeasonInfo,
} from "../types/cinemaSeasons";
import { FilmComponent } from "./FilmComponent";
import "./CinemaSeason.css";
import { DeleteSeasonButton } from "./SeasonsLambdaInvokes/DeleteSeasonButton";
import { EditableSeasonField } from "./SeasonsLambdaInvokes/EditableSeasonField";

interface CinemaSeasonProps {
  cinemaId: ActiveSupportedCinema;
  seasonKey: string;
  season: Season;
}

export function CinemaSeason({
  cinemaId,
  seasonKey,
  season,
}: CinemaSeasonProps) {
  const info: SeasonInfo = season.season_info;
  const films: Record<string, RawFilmListing> = season.films;
  const filmEntries = Object.entries(films);

  const displayName = info.season_name || seasonKey;

  return (
    <section className="cinema-season">
      {/* ── Header ──────────────────────────── */}
      <div className="season-header">
        <div className="season-header-left">
          <h2 className="season-title">{displayName}</h2>
          {info.season_date_range && (
            <span className="season-date-badge">
              {info.season_date_range}
            </span>
          )}
        </div>
        <DeleteSeasonButton cinemaId={cinemaId} seasonKey={seasonKey} />
      </div>

      {/* ── Season details ──────────────────── */}
      <div className="season-section">
        <span className="season-section-label">Season details</span>

        <EditableSeasonField
          label="season_name"
          field="season_name"
          value={info.season_name}
          cinemaId={cinemaId}
          seasonKey={seasonKey}
        />

        <EditableSeasonField
          label="season_text"
          field="season_text"
          value={info.season_text}
          cinemaId={cinemaId}
          seasonKey={seasonKey}
        />

        <EditableSeasonField
          label="season_date_range"
          field="season_date_range"
          value={info.season_date_range}
          cinemaId={cinemaId}
          seasonKey={seasonKey}
        />
      </div>

      {/* ── Programmer ──────────────────────── */}
      <div className="season-section">
        <span className="season-section-label">Programmer</span>

        <EditableSeasonField
          label="programmer_name"
          field="programmer_name"
          value={info.programmer_name}
          cinemaId={cinemaId}
          seasonKey={seasonKey}
        />

        <EditableSeasonField
          label="programmer_bio"
          field="programmer_bio"
          value={info.programmer_bio}
          cinemaId={cinemaId}
          seasonKey={seasonKey}
        />
      </div>

      {/* ── Grouping ────────────────────────── */}
      <div className="season-section">
        <span className="season-section-label">Grouping</span>

        <EditableSeasonField
          label="season_group_name"
          field="season_group_name"
          value={info.season_group_name}
          cinemaId={cinemaId}
          seasonKey={seasonKey}
        />

        <EditableSeasonField
          label="season_group_info"
          field="season_group_info"
          value={info.season_group_info}
          cinemaId={cinemaId}
          seasonKey={seasonKey}
        />
      </div>

      {/* ── Images ──────────────────────────── */}
      <div className="season-section">
        <span className="season-section-label">Images</span>

        <EditableSeasonField
          label="season_images"
          field="season_images"
          value={info.season_images}
          cinemaId={cinemaId}
          seasonKey={seasonKey}
        />
      </div>

      {/* ── Films ───────────────────────────── */}
      <div className="season-section">
        <div className="films-header">
          <h4 className="films-title">Films</h4>
          <span className="films-count-badge">{filmEntries.length}</span>
        </div>

        {filmEntries.length === 0 ? (
          <div className="no-films">No films assigned to this season</div>
        ) : (
          <ul className="films-grid">
            {filmEntries.map(([filmName, film]) => (
              <FilmComponent
                key={film.url}
                filmName={filmName}
                film={film}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
