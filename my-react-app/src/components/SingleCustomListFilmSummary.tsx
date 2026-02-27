import type { ListFilm, CinemaListing, FilmWhen } from "../types/customLists";
import "./SingleCustomListFilmSummary.css";

function formatCinemaName(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatShowingDate(w: FilmWhen): string {
  const s = w.structured_date_strings;
  return `${s.Weekday} ${s.day_str} ${s.Month}`;
}

function getFilmTitle(film: ListFilm): string {
  for (const listing of Object.values(film.cinema_listings)) {
    const title = listing._additional_info?.title;
    if (title) return title;
  }
  return `Film #${film.db_id}`;
}

function getFilmImage(film: ListFilm): string | null {
  for (const listing of Object.values(film.cinema_listings)) {
    if (listing.s3ImageURL) return listing.s3ImageURL;
    if (listing.image_to_download) return listing.image_to_download;
  }
  return null;
}

interface Props {
  film: ListFilm;
}

export function SingleCustomListFilmSummary({ film }: Props) {
  const title = getFilmTitle(film);
  const image = getFilmImage(film);
  const caption = film.list_film_caption;
  const cinemaEntries = Object.entries(film.cinema_listings);

  return (
    <div className="clfs-card">
      <div className="clfs-top">
        {image && (
          <img className="clfs-image" src={image} alt={title} />
        )}
        <div className="clfs-header">
          <div className="clfs-title">{title}</div>
          <div className="clfs-dbid">#{film.db_id}</div>
          <div className={`clfs-caption${caption ? "" : " empty"}`}>
            {caption || "EMPTY"}
          </div>
        </div>
      </div>

      <div className="clfs-screenings">
        {cinemaEntries.map(([cinemaName, listing]) => (
          <CinemaScreenings
            key={cinemaName}
            cinemaName={cinemaName}
            listing={listing}
          />
        ))}
      </div>
    </div>
  );
}

function CinemaScreenings({
  cinemaName,
  listing,
}: {
  cinemaName: string;
  listing: CinemaListing;
}) {
  const when = listing.when ?? [];

  return (
    <div className="clfs-cinema">
      <div className="clfs-cinema-name">{formatCinemaName(cinemaName)}</div>
      {when.length === 0 ? (
        <div className="clfs-no-dates">No dates listed</div>
      ) : (
        <div className="clfs-dates">
          {when.map((w) => (
            <div key={w.date} className="clfs-date-row">
              <span className="clfs-date-label">{formatShowingDate(w)}:</span>
              <span className="clfs-times">
                {w.showtimes.length > 0 ? w.showtimes.join(", ") : "TBC"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
