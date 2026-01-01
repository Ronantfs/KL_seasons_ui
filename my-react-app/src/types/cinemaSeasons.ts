// mirrors SeasonInfo TypedDict
export interface SeasonInfo {
  season_group_name: string;
  season_group_info: Record<string, unknown>;
  season_name: string;
  season_text: Record<string, string>;
  programmer_name: string;
  programmer_bio: string;
  season_date_range: string;
  season_images: string[];
}

export interface FilmWhen {
  date: string;
  structured_date_strings: {
    Weekday: string;
    Month: string;
    day_str: string;
  };
  year: number;
  month: number;
  day: number;
  showtimes: string[];
}

export interface RawFilmListing {
  description: string;
  screen: string;
  screeningType: string;
  url: string;
  when: FilmWhen[];
  image_to_download: string;
  isImageGood: boolean;
  s3ImageURL: string;

  // allow future optional fields without breaking
  _additional_info?: Record<string, unknown>;
}


// mirrors Season TypedDict
export interface Season {
  films: Record<string, RawFilmListing>; // key = film identifier
  season_info: SeasonInfo;
}

// mirrors CinemaSeasons = Dict[str, Season]
export type CinemaSeasons = Record<string, Season>;



// mirrors ActiveSupportedCinema enum
export type ActiveSupportedCinema =
  | "castle"
  | "prince_charles"
  | "nickel"
  | "close_up"
  | "ica"
  | "rio"
  | "garden_cinema"
  | "regent_street"
  | "the_cinema_museum"
  | "barbican"
  | "bfi_southbank"
  | "cine_lumiere";


  export interface GetSeasonsForCinemaResponse {
  status: "ok" | "error";
  cinema_id: ActiveSupportedCinema;
  seasons: CinemaSeasons;
  seasons_total: number;
}