import type { RawFilmListing, Season, SeasonInfo } from "../types/cinemaSeasons";
import { FilmComponent } from "./FilmComponent";
import "./CinemaSeason.css";

interface CinemaSeasonProps {
  seasonKey: string;
  season: Season;
}

function renderValue(value: unknown) {
  if (value === null || value === undefined) return "(null)";
  if (typeof value === "string" && value.length === 0) return "(empty)";
  if (Array.isArray(value) && value.length === 0) return "[ ]";
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  )
    return "{ }";

  if (typeof value === "object") {
    return (
      <pre className="season-json">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
}

export function CinemaSeason({ seasonKey, season }: CinemaSeasonProps) {
  const info: SeasonInfo = season.season_info;
  const films: Record<string, RawFilmListing> = season.films;
  const filmEntries = Object.entries(films);

  return (
    <section className="cinema-season">
      <h2 className="season-title">{seasonKey}</h2>

      <h3 className="season-subtitle">Season Info:</h3>

      <div className="season-field">
        <strong>season_name:</strong> {renderValue(info.season_name)}
      </div>

      <div className="season-field">
        <strong>season_group_name:</strong> {renderValue(info.season_group_name)}
      </div>

      <div className="season-field">
        <strong>season_group_info:</strong> {renderValue(info.season_group_info)}
      </div>

      <div className="season-field">
        <strong>season_text:</strong>
        {info.season_text && typeof info.season_text === "object" ? (
          <p className="season-text">
            {Object.entries(info.season_text).map(([key, value]) => (
              <span key={key}>
                <strong>{key}:</strong> {value}{" "}
              </span>
            ))}
          </p>
        ) : (
          "(empty)"
        )}
      </div>

      <div className="season-field">
        <strong>programmer_name:</strong> {renderValue(info.programmer_name)}
      </div>

      <div className="season-field">
        <strong>programmer_bio:</strong> {renderValue(info.programmer_bio)}
      </div>

      <div className="season-field">
        <strong>season_date_range:</strong> {renderValue(info.season_date_range)}
      </div>

      <div className="season-field">
        <strong>season_images:</strong> {renderValue(info.season_images)}
      </div>

      <h4 className="films-title">
        films ({filmEntries.length})
      </h4>

      {filmEntries.length === 0 ? (
        <div className="no-films">(no films)</div>
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
    </section>
  );
}
