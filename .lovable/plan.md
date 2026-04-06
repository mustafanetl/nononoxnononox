

# Fix: Remove Place Images, Streamline Discovery, Better Plan Loading

## 3 Issues to Fix

### 1. Remove `place_images` entirely from discovery
The AI keeps showing place images during chat which feels spammy. Remove it completely — no `place_images` blocks at all. The AI should just chat naturally with quickreplies, keep it short (2-3 exchanges max), then go straight to "let me cook" and generate the plan.

### 2. Don't over-ask questions
The current prompt forces 4+ exchanges which drags. Reduce to 2-3 exchanges max — get the vibe, ask ONE follow-up, then cook.

### 3. Better plan crafting animation
When the AI is generating the plan, show a proper full-screen-ish loading card with percentage that goes from 0→100%, hiding the streaming content underneath. Only reveal the plan (behind paywall) once done.

## Changes

### `supabase/functions/rzuma-chat/index.ts`

- Remove ALL `place_images` references from the prompt — no `place_images` block format, no visual discovery section
- Simplify discovery to 2-3 phases:
  - **Message 1**: React naturally, ask ONE question about vibe/who, end with quickreplies
  - **Message 2-3**: Based on answers, say "okay let me cook 🧑‍🍳" with a teaser
  - **Message 3-4**: Generate the full plan with all blocks
- Keep the FOMO/personal tone but don't drag discovery

### `src/pages/Chat.tsx`

- **Remove `PlaceShowcase` rendering** — remove the `placeImages` rendering block entirely (lines 674-677)
- **Improve crafting animation**: When `isCraftingPlan` is true, DON'T show streamed content — only show the crafting progress card. The plan content stays hidden until streaming completes, then renders as `PlanPreviewGate` for free users.
- Make the crafting card more prominent: larger, centered, with a proper percentage number (e.g., "67%")

## Files

| File | Change |
|------|--------|
| `supabase/functions/rzuma-chat/index.ts` | Remove `place_images`, reduce discovery to 2-3 exchanges, keep personal tone |
| `src/pages/Chat.tsx` | Remove PlaceShowcase rendering, hide streamed content during crafting, show percentage in loading card |

