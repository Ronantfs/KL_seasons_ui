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

export interface CinemaListing {
  description: string;
  screen: string | null;
  screeningType: string;
  url: string | null;
  when: FilmWhen[];
  image_to_download: string | null;
  isImageGood: boolean;
  s3ImageURL: string;
  _additional_info?: {
    title?: string | null;
    directors?: string[] | null;
    cast?: string[] | null;
    countries?: string[] | null;
    year?: number | null;
    runtime_mins?: number | null;
    screening_medium?: string | null;
    age_rating?: number | null;
    db_id?: number | null;
    original_raw_titles?: string[];
  };
}

export interface ListFilm {
  db_id: number;
  cinema_listings: Record<string, CinemaListing>;
  list_film_caption: string;
}

export interface CustomList {
  list_curator: string;
  list_name: string;
  list_caption: string;
  start_date: string;
  end_date: string;
  list_films: ListFilm[];
}

export interface GetCuratorsResponse {
  status: string;
  curators: string[];
}

export interface GetCustomListsResponse {
  status: string;
  curator: string;
  lists_count: number;
  film_lists: CustomList[];
}

export interface CreateCustomListResponse {
  status: string;
  curator: string;
  list_name: string;
  lists_total: number;
  output_uri: string;
}

export interface AssignFilmsResponse {
  status: string;
  curator: string;
  list_name: string;
  films_added: number[];
  films_skipped_already_in_list: number[];
  films_not_found_in_pan_listings: number[];
  total_list_films: number;
  output_uri: string;
}

export interface DeleteListResponse {
  status: string;
  curator: string;
  deleted_list: string;
  remaining_lists: number;
  output_uri: string;
}

export interface CinemaShowing {
  date: string;
  showtimes: string[];
}

export interface AvailableFilmSummary {
  title: string;
  directors: string[];
  year: number | null;
  cinema_count: number;
  cinemas: string[];
  cinema_showings: Record<string, CinemaShowing[]>;
}

export interface GetAvailableFilmsResponse {
  status: string;
  film_count: number;
  films: Record<string, AvailableFilmSummary>;
}
