import { useState, useEffect, useMemo } from "react";
import type {
  CustomList,
  GetCuratorsResponse,
  GetCustomListsResponse,
} from "../types/customLists";
import { CustomListCard } from "./CustomListCard";
import { CreateCustomListForm } from "./CustomListsInvokes/CreateCustomListForm";
import "./CustomListsView.css";

const LAMBDA_URL =
  "https://b62gakukdi4hlmmcmhx533az3y0fgpqs.lambda-url.eu-north-1.on.aws/";

/** Lambda may return {statusCode, body: JSON-string} or the result directly. */
function unwrapLambdaResponse(raw: Record<string, unknown>): Record<string, unknown> {
  if (typeof raw.body === "string") {
    return JSON.parse(raw.body);
  }
  return raw;
}

const CURATOR_NAME_RE = /^[a-z0-9_-]{2,60}$/;

export function CustomListsView() {
  const [curators, setCurators] = useState<string[]>([]);
  const [curatorsLoading, setCuratorsLoading] = useState(false);
  const [curatorsError, setCuratorsError] = useState<string | null>(null);

  const [curatorFilter, setCuratorFilter] = useState("");
  const [selectedCurator, setSelectedCurator] = useState<string | null>(null);

  const [lists, setLists] = useState<CustomList[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);
  const [hasLoadedLists, setHasLoadedLists] = useState(false);

  // create curator
  const [createCuratorOpen, setCreateCuratorOpen] = useState(false);
  const [newCuratorName, setNewCuratorName] = useState("");
  const [createCuratorLoading, setCreateCuratorLoading] = useState(false);
  const [createCuratorError, setCreateCuratorError] = useState<string | null>(null);
  const [createCuratorSuccess, setCreateCuratorSuccess] = useState(false);

  useEffect(() => {
    loadCurators();
  }, []);

  async function loadCurators() {
    setCuratorsLoading(true);
    setCuratorsError(null);
    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handler: "get_curators" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const json = unwrapLambdaResponse(raw) as unknown as GetCuratorsResponse;
      setCurators(json.curators ?? []);
    } catch (e: unknown) {
      setCuratorsError(e instanceof Error ? e.message : String(e));
    } finally {
      setCuratorsLoading(false);
    }
  }

  async function createCurator() {
    const name = newCuratorName.trim().toLowerCase();
    setCreateCuratorError(null);
    setCreateCuratorSuccess(false);

    if (!name) {
      setCreateCuratorError("Curator name is required.");
      return;
    }
    if (!CURATOR_NAME_RE.test(name)) {
      setCreateCuratorError(
        "Must be 2-60 characters: lowercase letters, digits, underscores, or hyphens."
      );
      return;
    }
    if (curators.includes(name)) {
      setCreateCuratorError(`Curator "${name}" already exists.`);
      return;
    }

    setCreateCuratorLoading(true);
    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handler: "create_curator", curator: name }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const json = unwrapLambdaResponse(raw);
      if (json.status === "error") {
        throw new Error((json as { message?: string }).message || "Server error");
      }
      setCreateCuratorSuccess(true);
      setNewCuratorName("");
      loadCurators();
    } catch (e: unknown) {
      setCreateCuratorError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreateCuratorLoading(false);
    }
  }

  const filteredCurators = useMemo(() => {
    if (!curatorFilter.trim()) return curators;
    const q = curatorFilter.toLowerCase();
    return curators.filter((c) => c.toLowerCase().includes(q));
  }, [curators, curatorFilter]);

  function selectCurator(curator: string) {
    setSelectedCurator(curator);
    setLists([]);
    setHasLoadedLists(false);
    setListsError(null);
  }

  async function loadLists() {
    if (!selectedCurator) return;
    setListsLoading(true);
    setListsError(null);
    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "get_custom_lists",
          curator: selectedCurator,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const json = unwrapLambdaResponse(raw) as unknown as GetCustomListsResponse;
      setLists(json.film_lists ?? []);
      setHasLoadedLists(true);
    } catch (e: unknown) {
      setListsError(e instanceof Error ? e.message : String(e));
    } finally {
      setListsLoading(false);
    }
  }

  function handleListDeleted(listName: string) {
    setLists((prev) => prev.filter((l) => l.list_name !== listName));
  }

  function handleListCreated() {
    loadLists();
  }

  function handleFilmsAssigned() {
    loadLists();
  }

  return (
    <div className="cl-view">
      {/* ── Curator selection ─────────────────── */}
      <div className="cl-curator-section">
        <div className="cl-section-header">
          <span className="cl-section-label">Select a curator</span>
          {curatorsLoading && (
            <span className="cl-inline-loading">Loading curators...</span>
          )}
        </div>

        {curatorsError && (
          <div className="cl-error">{curatorsError}</div>
        )}

        {!curatorsLoading && curators.length > 0 && (
          <>
            <input
              className="cl-filter-input"
              placeholder="Filter curators..."
              value={curatorFilter}
              onChange={(e) => setCuratorFilter(e.target.value)}
            />
            <div className="cl-curator-grid">
              {filteredCurators.map((curator) => (
                <div
                  key={curator}
                  className={`cl-curator-card${
                    selectedCurator === curator ? " selected" : ""
                  }`}
                  onClick={() => selectCurator(curator)}
                >
                  {curator}
                </div>
              ))}
              {filteredCurators.length === 0 && (
                <div className="cl-no-match">No curators match filter</div>
              )}
            </div>
          </>
        )}

        {!curatorsLoading && curators.length === 0 && !curatorsError && (
          <div className="cl-empty">No curators found</div>
        )}

        {/* ── Create curator ──────────────────── */}
        <div className="cl-create-curator">
          <button
            className={`cl-create-curator-toggle${createCuratorOpen ? " open" : ""}`}
            onClick={() => {
              setCreateCuratorOpen((v) => !v);
              setCreateCuratorError(null);
              setCreateCuratorSuccess(false);
            }}
          >
            {createCuratorOpen ? "Cancel" : "+ New curator"}
          </button>

          {createCuratorOpen && (
            <div className="cl-create-curator-form">
              <div className="cl-create-curator-row">
                <input
                  className="cl-create-curator-input"
                  placeholder="curator_name"
                  value={newCuratorName}
                  onChange={(e) => setNewCuratorName(e.target.value.toLowerCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") createCurator(); }}
                />
                <button
                  className="cl-create-curator-submit"
                  onClick={createCurator}
                  disabled={createCuratorLoading || !newCuratorName.trim()}
                >
                  {createCuratorLoading ? "Creating..." : "Create"}
                </button>
              </div>
              <span className="cl-create-curator-hint">
                Lowercase letters, digits, underscores, hyphens. 2-60 chars.
              </span>
              {createCuratorError && (
                <div className="cl-error" style={{ marginTop: 8 }}>{createCuratorError}</div>
              )}
              {createCuratorSuccess && (
                <div className="cl-success" style={{ marginTop: 8 }}>Curator created!</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Selected curator actions ──────────── */}
      {selectedCurator && (
        <>
          <CreateCustomListForm
            curator={selectedCurator}
            onCreated={handleListCreated}
          />

          <button
            className="cl-load-button"
            onClick={loadLists}
            disabled={listsLoading}
          >
            {listsLoading
              ? "Loading..."
              : `Load lists for ${selectedCurator}`}
          </button>

          {listsError && <div className="cl-error">{listsError}</div>}

          {hasLoadedLists && (
            <>
              <div className="cl-lists-count">
                {lists.length} list{lists.length !== 1 ? "s" : ""} loaded
              </div>

              {lists.length === 0 ? (
                <div className="cl-empty">
                  No custom lists yet. Create one above.
                </div>
              ) : (
                lists.map((list) => (
                  <CustomListCard
                    key={list.list_name}
                    curator={selectedCurator}
                    list={list}
                    onDeleted={() => handleListDeleted(list.list_name)}
                    onFilmsAssigned={handleFilmsAssigned}
                  />
                ))
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
