import { useState } from "react";
import { CinemaSeasonsView } from "./components/CinemaSeasonsView";
import type { ActiveSupportedCinema } from "./types/cinemaSeasons";
import "./App.css";

export default function App() {
  const [cinema, setCinema] =
    useState<ActiveSupportedCinema>("close_up");

  return (
    <div>
      <div className="app-header">
        <h1 className="app-title">Cinema Seasons</h1>

        <select
          className="cinema-select"
          value={cinema}
          onChange={(e) =>
            setCinema(e.target.value as ActiveSupportedCinema)
          }
        >
          <option value="castle">Castle</option>
          <option value="prince_charles">Prince Charles</option>
          <option value="nickel">Nickel</option>
          <option value="close_up">Close-Up</option>
          <option value="ica">ICA</option>
          <option value="rio">Rio</option>
          <option value="garden_cinema">Garden Cinema</option>
          <option value="regent_street">Regent Street</option>
          <option value="the_cinema_museum">Cinema Museum</option>
          <option value="barbican">Barbican</option>
          <option value="bfi_southbank">BFI Southbank</option>
          <option value="cine_lumiere">Ciné Lumière</option>
        </select>
      </div>

      <CinemaSeasonsView cinemaId={cinema} />
    </div>
  );
}
