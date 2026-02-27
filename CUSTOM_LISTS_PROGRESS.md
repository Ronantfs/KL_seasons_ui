# Custom Lists Feature — Progress & TODO

## Overview

Added a **Custom Lists** management page to the KL Seasons UI. This page communicates with the `KL_custom_listings_server` Lambda (separate from the seasons Lambda) to manage curated film lists.

**Lambda URL:** `https://b62gakukdi4hlmmcmhx533az3y0fgpqs.lambda-url.eu-north-1.on.aws/`

---

## Completed (MVP)

### Navigation
- [x] Added tab navigation in `App.tsx` to switch between **Seasons** and **Custom Lists**
- [x] Cinema selector only shows when on the Seasons tab
- [x] Tab styling matches the existing dark theme

### Curator Selection
- [x] Auto-loads curators on mount via `get_curators` handler
- [x] Filter/search input to narrow curators
- [x] Click to select a curator — highlights selected
- [x] Loading and error states handled

### Load Custom Lists
- [x] "Load lists" button fetches all lists for the selected curator via `get_custom_lists`
- [x] Displays list count after loading
- [x] Loading and error states handled

### Custom List Cards (expandable)
- [x] Each list shown as an expandable card (matches season card pattern)
- [x] Header shows: list name, date range, film count
- [x] Expanded view shows: caption, films with metadata (title, directors, year, cinema count, db_id)
- [x] Styling matches CinemaSeason cards closely

### Create Custom List
- [x] Toggle form: "+ New list for {curator}"
- [x] Fields: list name*, caption*, start date*, end date* (all required)
- [x] Client-side validation: all fields required, YYYY-MM-DD format, end >= start
- [x] On success, automatically reloads lists
- [x] Error and success feedback banners

### Delete List
- [x] Delete button in each list card toolbar
- [x] Two-step confirmation (click → "Delete {name}?" → "Yes, delete" / "Cancel")
- [x] On success, removes card from UI
- [x] Error handling

### Assign Films to List
- [x] Toggle panel inside each list card: "Assign films to this list"
- [x] Text input for comma-separated `db_id` values (from pan_cinema_listings)
- [x] Shows existing db_ids already in the list
- [x] Client-side validation: positive integers only, warns if all are duplicates
- [x] On success, shows detailed result (added, skipped, not found)
- [x] Auto-reloads list after assignment

### Client-Side Validation
- [x] Create list: all fields required, date format, end >= start
- [x] Assign films: valid positive integer db_ids, duplicate detection
- [x] All forms disable submit while loading

---

## TODO (Post-MVP)

### Update List Metadata
- [ ] Inline editing of list name, caption, start/end dates (like `EditableSeasonField`)
- [ ] Server handler: `update_list` — accepts `curator`, `list_name`, `updates` object
- [ ] Updatable fields: `list_name`, `list_caption`, `start_date`, `end_date`

### Update Film List Captions
- [ ] Inline editable caption per film within a list
- [ ] Server handler: `update_list_film_caption` — accepts `curator`, `list_name`, `db_id`, `new_caption`

### Remove Film from List
- [ ] Delete button per film in the expanded list view
- [ ] Server handler: `remove_film_from_list` — accepts `curator`, `list_name`, `db_id`
- [ ] Confirmation step before removal

### Nice-to-Have Enhancements
- [ ] Drag-and-drop reordering of films within a list
- [ ] Bulk film removal
- [ ] Film search/preview before assigning (show title/directors for a db_id)
- [ ] Create new curator (currently curator must already exist in S3)

---

## Files Created / Modified

### New Files
| File | Purpose |
|------|---------|
| `src/types/customLists.ts` | TypeScript interfaces for custom lists data + API responses |
| `src/components/CustomListsView.tsx` | Main view: curator select, load lists, display |
| `src/components/CustomListsView.css` | Styling for the main view |
| `src/components/CustomListCard.tsx` | Expandable card for each custom list |
| `src/components/CustomListCard.css` | Styling for list cards |
| `src/components/CustomListsInvokes/CreateCustomListForm.tsx` | Create list form |
| `src/components/CustomListsInvokes/CreateCustomListForm.css` | Styling |
| `src/components/CustomListsInvokes/AssignFilmsToList.tsx` | Assign films by db_id |
| `src/components/CustomListsInvokes/AssignFilmsToList.css` | Styling |
| `src/components/CustomListsInvokes/DeleteListButton.tsx` | Delete list with confirmation |
| `src/components/CustomListsInvokes/DeleteListButton.css` | Styling |

### Modified Files
| File | Change |
|------|--------|
| `src/App.tsx` | Added tab navigation (Seasons / Custom Lists), conditional rendering |
| `src/App.css` | Added `.app-tabs` and `.app-tab` styles |

---

## AWS Resources Needed

The Custom Lists Lambda must be deployed and accessible. Required:
- **Lambda function** `kl_custom_listings` deployed in `eu-north-1`
- **Lambda Function URL** enabled with CORS (Allow-Origin: *, Methods: OPTIONS,POST)
- **S3 bucket** `filmfynder` with:
  - `london/filmLists/` prefix (curator folders)
  - `london/cinema-listings/all/pan_cinema_listings.json` (source film data)
- Lambda must have IAM permissions to read/write the S3 bucket

---

## API Handler Reference

| Handler | Required Fields | Purpose |
|---------|----------------|---------|
| `get_curators` | — | List all curator folder names |
| `get_custom_lists` | `curator` | Get all lists for a curator |
| `create_custom_list` | `curator`, `list_name`, `list_caption`, `start_date`, `end_date` | Create a new empty list |
| `assign_films_to_list` | `curator`, `list_name`, `db_ids` (int[]) | Copy films from pan_listings into list |
| `delete_list` | `curator`, `list_name` | Delete entire list |
| `update_list` | `curator`, `list_name`, `updates` | Update list metadata (POST-MVP) |
| `update_list_film_caption` | `curator`, `list_name`, `db_id`, `new_caption` | Update film caption (POST-MVP) |
| `remove_film_from_list` | `curator`, `list_name`, `db_id` | Remove film from list (POST-MVP) |
