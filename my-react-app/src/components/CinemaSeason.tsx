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

    return (
        <section className="cinema-season">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 className="season-title">{seasonKey}</h2>

                <DeleteSeasonButton
                    cinemaId={cinemaId}
                    seasonKey={seasonKey}
                />
            </div>

            <h3 className="season-subtitle">Season Info:</h3>

            <EditableSeasonField
                label="season_name"
                field="season_name"
                value={info.season_name}
                cinemaId={cinemaId}
                seasonKey={seasonKey}
            />

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

            <EditableSeasonField
                label="season_text"
                field="season_text"
                value={info.season_text}
                cinemaId={cinemaId}
                seasonKey={seasonKey}
            />

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

            <EditableSeasonField
                label="season_date_range"
                field="season_date_range"
                value={info.season_date_range}
                cinemaId={cinemaId}
                seasonKey={seasonKey}
            />

            <EditableSeasonField
                label="season_images"
                field="season_images"
                value={info.season_images}
                cinemaId={cinemaId}
                seasonKey={seasonKey}
            />

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
