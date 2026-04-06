

# AI Review & Enhancement Plan

## Issues Found

### Bugs
1. **Error not cleared on new message** — `setError(null)` is missing from `sendMessage` start in the hook; errors from previous messages persist visually even after sending a new one successfully.
2. **Thinking indicator logic is fragile** — The `isThinking` state uses a timer (800-1400ms) but doesn't account for fast responses. If the AI responds before the timer fires, the thinking dots disappear abruptly, then the timer sets `isThinking = false` redundantly. The condition on line 672 is overly complex and can show thinking dots even when content is already streaming.
3. **Quick reply suggestions don't show on empty state clicks** — When clicking an empty-state suggestion (line 518), `sendMessage` is called directly without setting `isThinking`, so no thinking animation plays.
4. **TripDetail hotel images don't use realImage** — `HotelRow` in TripDetail (line 620) uses `getHotelImage(h.image)` which returns Unsplash stock photos, ignoring `h.realImage` from Xotelo enrichment.
5. **Enrichment cache key includes activity names** — If the AI generates the same destination with slightly different activity names, the cache misses and re-fetches unnecessarily.
6. **`newChat` function creates a conversation immediately** — `clearChat` calls `newChat` which creates an empty conversation entry, cluttering the sidebar with "New chat" entries that have no messages.
7. **Preferences not synced to DB on save** — Settings page saves preferences correctly, but `useRzumaChat` loads preferences from localStorage on mount — if Settings was just saved, the chat hook may have stale data until page refresh.

### UX Improvements
8. **No greeting message** — When opening a new chat, the AI doesn't greet the user. A personalized welcome (using their name if known) would feel much warmer.
9. **No loading skeleton for enrichment** — After the AI responds, there's a gap while Google Places photos load. Activity cards flash from Unsplash to Google images.
10. **Quick replies disappear too fast** — Quick replies only show on the last assistant message when not loading. If a user scrolls up, they can't access earlier quick replies.
11. **No haptic/visual feedback on card interactions** — Clicking activity/hotel cards has no press state animation.
12. **Desktop action bar in TripDetail uses `position: fixed` with `absolute` class** — Line 528 has conflicting positioning (`className="absolute"` + `style={{ position: 'fixed' }}`).

## Plan

### 1. Fix thinking indicator logic
- Remove the timer-based approach. Instead, show thinking dots when `isLoading && !hasStreamedContent`. Track whether any assistant content has arrived for the current response.
- Apply thinking animation on empty-state suggestion clicks too.

### 2. Fix hotel images in TripDetail
- Update `HotelRow` to use `h.realImage || getHotelImage(h.image)` — same pattern as `HotelCard`.

### 3. Fix empty conversation clutter
- Don't create a conversation in `newChat` — just set `activeId` to null. Let `sendMessage` create the conversation on first message (it already does this).

### 4. Add personalized greeting
- When a new chat starts (no messages), show a greeting in the empty state that uses the user's name from preferences: "Hey Sarah, what are we planning?" instead of generic "What are you up to?"

### 5. Add enrichment loading state
- Show a subtle shimmer/skeleton on activity card images while enrichment is in progress (between AI response and enrichment completion).

### 6. Fix TripDetail positioning conflict
- Change the desktop action bar to use proper `fixed` positioning via className only.

### 7. Fix error clearing
- Clear error state at the start of `sendMessage` (it already does `setError(null)` — verify it's working correctly with the retry flow).

### 8. Sync preferences across Settings and Chat
- After saving in Settings, dispatch a custom event or use a shared state approach so useRzumaChat picks up the new preferences without requiring a page refresh.

## Files to Modify
- `src/hooks/useRzumaChat.ts` — Fix newChat empty conversation, improve error handling, add preferences sync listener
- `src/pages/Chat.tsx` — Fix thinking indicator, add personalized greeting, add enrichment loading state, fix suggestion click animation
- `src/pages/TripDetail.tsx` — Fix hotel realImage usage, fix desktop action bar positioning
- `src/index.css` — Add shimmer animation for enrichment loading

