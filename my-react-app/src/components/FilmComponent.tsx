import type { RawFilmListing } from "../types/cinemaSeasons";
import "./FilmComponent.css";

interface Props {
  filmName: string;
  film: RawFilmListing;
}

export function FilmComponent({ filmName, film }: Props) {
  return (
    <article className="film">
      <h2 className="film__title">{filmName}</h2>

      {/* Placeholder image */}
      <div className="film__image-placeholder">
        placeholder
      </div>

      <ul className="film__screenings">
        {film.when.map((when) => (
          <li
            key={when.date}
            className="film__screening-day"
          >
            <span className="film__date">
              {when.structured_date_strings.Weekday}{" "}
              {when.structured_date_strings.day_str}{" "}
              {when.structured_date_strings.Month}
            </span>

            <span className="film__times">
              {when.showtimes.map((time) => (
                <span key={time} className="film__time">
                  {time}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
