

# Personalized AI: Ask About Past Experiences + Save Preferences

## What Changes

### 1. Remove login requirement from Chat
**File: `src/pages/Chat.tsx`**
- Remove the `Navigate to /auth` redirect (lines 190-192)
- Make `user` optional — render ChatInner directly, show "Sign in" link when not logged in instead of avatar/sign out
- Chat data stays in localStorage via existing `useRzumaChat` hook

### 2. Save user preferences in localStorage (and DB when logged in)
**File: `src/hooks/useRzumaChat.ts`**
- Add a new localStorage key `jolliday-preferences` storing: `{ visitedPlaces: [{name, rating, category}], likedCategories: string[], dislikedCategories: string[] }`
- When user rates a place or says they've been somewhere, update this preferences object
- Expose `preferences` and `updatePreferences` from the hook
- When user is logged in, sync preferences to a new `user_preferences` DB table

### 3. Create user_preferences table
**Migration:**
```sql
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visited_places jsonb DEFAULT '[]',
  liked_categories jsonb DEFAULT '[]',
  disliked_categories jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
-- RLS: users can read/write own preferences
```

### 4. Update system prompt to ask about past experiences
**File: `supabase/functions/rzuma-chat/index.ts`**

Add these rules to the prompt:

- **Before making any plan**, ask the user: "Have you been to [destination] before?" or "What kind of places do you usually enjoy — trendy spots, hidden gems, classic tourist stuff?"
- Use quickreplies: `["Been there before", "First time", "Show me hidden gems", "Classic spots"]`
- If they've been before, ask what they liked/didn't like. Use quickreplies with categories: `["Loved the food scene", "Great nightlife", "Museums were meh", "Outdoors was amazing"]`
- **Remember within conversation**: If user says they don't like museums, never suggest museums. If they loved rooftop bars, lean into that vibe.
- For LOCAL mode, ask travel radius: `["Walking distance", "30 min drive", "Up to 1 hour away"]`
- For DATE mode, ask personality-matching questions: `["Adventurous & outdoorsy", "Chill & cozy", "Foodie vibes", "Surprise me"]`

### 5. Pass preferences context to the AI
**File: `src/hooks/useRzumaChat.ts`**
- When sending messages, include user preferences as a system-level context in the request body
- Edge function injects preferences into the conversation as a hidden context message: "User preferences: visited [X, Y], likes [dining, nightlife], dislikes [museums]"

**File: `supabase/functions/rzuma-chat/index.ts`**
- Accept optional `preferences` field in request body
- Append preferences as a system message before the conversation

### 6. Migrate guest data on login
**File: `src/pages/Chat.tsx`**
- When user logs in (user transitions from null to object), sync localStorage preferences to `user_preferences` table
- On subsequent visits while logged in, load preferences from DB

## Files to Modify
- `src/pages/Chat.tsx` — remove auth gate, handle preference sync on login
- `src/hooks/useRzumaChat.ts` — add preferences storage, pass to API
- `supabase/functions/rzuma-chat/index.ts` — update prompt + accept preferences
- **New migration** — create `user_preferences` table

