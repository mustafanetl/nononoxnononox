

# AI Chat Testing & Improvement Plan

## Issues Found

### 1. System Prompt Issues (rzuma-chat)
- **CORS headers incomplete** — missing newer Supabase client headers (`x-supabase-client-platform`, etc.), which can cause CORS failures on some browsers
- **No input validation** — `messages` is taken from `req.json()` without any validation; could crash on malformed input
- **System prompt is extremely long** (~4000 tokens) — uses significant context window, increases latency and cost per request
- **Prompt asks AI to generate estimated prices but labels them inconsistently** — sometimes "prices are estimates", sometimes just the badge on the card; the text disclaimer often gets buried

### 2. Streaming / Parsing Issues (Chat.tsx)
- **`parseMessageContent` runs on every render for every message** — it does regex parsing + JSON.parse on each message during each render cycle; should be memoized
- **Enrichment `useEffect` has `messages` as dependency but no `enrichedData`** — can cause stale closure issues; also re-triggers on every streaming token since messages updates frequently
- **Quick replies parse as nested arrays** — `qrArr[0]` can be a flat array or a nested one; line 106 handles this but inconsistently (if AI returns `["a","b"]` it works, but `[["a","b"]]` gets flattened differently)

### 3. UX / Visual Issues
- **Loading dots only show when last message is from user** (line 539) — if the AI starts streaming, the dots disappear but there's no indication the response is still loading if the first token hasn't arrived yet
- **No error retry button** — error message shows but user must retype their message
- **TripSummaryCard is gated by paywall** — `isPremium` check blocks "View Full Plan" with a paywall modal, but the paywall/subscription system may not be configured, blocking all users
- **Enrichment fires during streaming** — as the AI streams tokens, `parseMessageContent` finds a `destination_enrich` block mid-stream and fires the enrichment API call, potentially multiple times before the block is complete

### 4. Data Flow Issues
- **Wikimedia cache is in-memory only** — lost on page refresh; `TripDetail` restores from `enrichedImages` in sessionStorage, but Chat.tsx doesn't restore on refresh
- **`enrichedData` state in Chat.tsx is never cleared between conversations** — switching chats keeps stale enrichment data from previous destinations

### 5. Edge Function Issues
- **`enrich-destination` makes sequential call for exchange rate** after parallel calls — `getExchangeRate` is called after `Promise.all`, adding latency; should be included in the parallel batch
- **No timeout on external API calls** — if Nominatim or Open-Meteo is slow/down, the function hangs until the default timeout

## Improvement Plan

### Step 1: Fix CORS headers in rzuma-chat
Update `corsHeaders` to include the full set of Supabase client headers.

### Step 2: Add input validation to rzuma-chat
Validate that `messages` is an array and each item has `role` and `content` strings. Return 400 on invalid input.

### Step 3: Optimize system prompt
- Trim redundant examples and verbose instructions
- Remove duplicated formatting rules
- Target ~30% reduction in token count while keeping all functionality

### Step 4: Memoize message parsing in Chat.tsx
- Wrap `parseMessageContent` results in `useMemo` or cache by message content string to avoid re-parsing on every render

### Step 5: Fix enrichment timing
- Only trigger enrichment when a message is complete (not during streaming) — check `!isLoading` before firing enrichment
- Clear `enrichedData` when switching conversations

### Step 6: Add error retry
- When an error occurs, keep the failed user message and show a "Retry" button next to the error banner

### Step 7: Fix enrich-destination parallelism
- Move `getExchangeRate` into the `Promise.all` block (requires extracting currency code from country data first, so use a two-phase approach or fetch USD rates for common currencies)

### Step 8: Add request timeouts to edge functions
- Use `AbortController` with 8-second timeouts on all external API calls in `enrich-destination`

## Files to Modify
- `supabase/functions/rzuma-chat/index.ts` — CORS, validation, prompt optimization
- `supabase/functions/enrich-destination/index.ts` — parallelism fix, timeouts
- `src/pages/Chat.tsx` — memoize parsing, fix enrichment timing, add retry, clear enrichment on conversation switch

