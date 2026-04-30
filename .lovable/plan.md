## Plan: Public shareable trip links with import-to-account

Let users share a trip via a public link. Anyone can view it without logging in. To import, edit, or customize it, they must create an account.

### 1. Database: a separate `shared_trips` table
Add a public, read-only snapshot table (kept separate from private `saved_trips`).

Columns:
- `id uuid primary key default gen_random_uuid()`
- `slug text unique not null` (short token used in the share URL)
- `owner_user_id uuid` (nullable — guests can also share)
- `title text not null`
- `destination text`
- `data_json jsonb not null` (full trip snapshot)
- `view_count int default 0`
- `created_at timestamptz default now()`

RLS:
- SELECT: public (no auth required) — this is the whole point of a share link.
- INSERT: only authenticated users; they must set `owner_user_id = auth.uid()`.
- UPDATE/DELETE: only the owner.

A small SECURITY DEFINER function increments `view_count` so anonymous viewers can bump the counter without write access to the row.

### 2. Share button generates a public link
On the trip detail page:
- Replace the current "Share" (text summary) action with a real "Share link" flow.
- On click: insert into `shared_trips`, get back the `slug`, copy `https://<host>/p/<slug>` to clipboard, toast "Link copied".
- If the user is a guest, allow it but mark `owner_user_id = null`.
- Cache the slug on the in-memory trip so repeated clicks reuse the same link.

### 3. New public viewer route `/p/:slug`
- Loads the snapshot from `shared_trips` by slug, no auth required.
- Renders the same `TripDetail` UI (read-only mode).
- Adds a clear top banner: "Shared trip · Sign up to import & customize".
- Disables: Save, Edit, PDF export-as-mine, Add-to-trip in modals.
- Keeps: scroll, map, photos, lightbox, booking links — all read-only.
- Calls the increment-view function once per session.

### 4. Import flow (account required)
A prominent "Import this trip" button:
- If logged in: copies the snapshot into the user's `saved_trips` (with their `user_id`), then redirects to `/trip/view` with the cloned trip in sessionStorage so they can edit/continue.
- If logged out: redirects to `/auth?next=/p/<slug>?import=1`. After signup/login, returns to the share page and triggers the import automatically.

### 5. UX touches
- Footer/disclaimer on `/p/:slug`: "This is a shared plan. Create a free account to make it yours."
- Show the original creator's display name if `owner_user_id` is set and a profile exists (otherwise "Shared by a Jolliday traveler").
- "Continue planning" CTA after import lands on `/chat` with the imported plan as context.

### 6. Out of scope
- No edit-in-place on the public page.
- No public list of shared trips.
- No comments/likes.

## Technical details
- Migration creates `shared_trips`, RLS, and `increment_shared_trip_views(slug text)` SECURITY DEFINER function.
- Slug generated with `gen_random_bytes` → base32, ~10 chars, retried on collision.
- New route in `src/App.tsx`: `/p/:slug` → `SharedTrip.tsx` page.
- `SharedTrip.tsx` reuses `TripDetail` rendering by passing `readOnly` and `onImport`.
- `TripDetail.tsx` accepts a new `mode: "owner" | "shared"` prop to hide owner-only actions.
- Import handler: `supabase.from("saved_trips").insert({...snapshot, user_id: auth.uid()})` then `navigate("/trip/view")`.
- Auth redirect: `Auth.tsx` already supports redirect; pass `next` query param and resume after sign-in.

If this matches what you want, I'll implement it.