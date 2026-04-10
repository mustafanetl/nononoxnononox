

# Plan: Fix Raw JSON Display During Streaming & Pass Premium Status to AI

## Problems

### 1. Raw JSON leaking during streaming
When the AI streams a response, code blocks like ` ```activities [...] ``` ` arrive incrementally. Before the closing ` ``` ` arrives, the regex in `parseMessageContent` doesn't match, so the raw JSON array (e.g. `[{"id":"1","name":"CÉ LA VI Tokyo"...`) is displayed as plain text to the user. Once the closing backticks arrive, it gets parsed correctly — but the user already saw the raw data.

### 2. "Start free trial" suggestion from AI for premium users
The AI doesn't know whether the user is premium. The system prompt always includes trial-related closing text. Premium users see "Start 3-day free trial" suggestions which is wrong.

### 3. Crafting animation skipped for premium users
Line 251: `if (isPremium) return;` — premium users never see the "Crafting your plan" animation. They should also get it.

## Solution

### File: `src/pages/Chat.tsx` — parseMessageContent
- Add logic to detect and **strip incomplete code blocks** during streaming. After all `extractBlock` calls, scan the remaining `text` for any opening ` ```<blocktype> ` that hasn't been closed with ` ``` ` yet. Remove that trailing incomplete block from the displayed text.
- This ensures users never see raw JSON mid-stream.

### File: `src/pages/Chat.tsx` — crafting animation
- Remove the `if (isPremium) return;` guard so premium users also see the crafting animation while a full plan streams in.

### File: `src/hooks/useRzumaChat.ts` — pass premium status
- Accept an `isPremium` parameter in the `sendMessage` call (or via a new option in the hook).
- Include `isPremium: true` in the `preferences` payload sent to the edge function.

### File: `supabase/functions/rzuma-chat/index.ts` — system prompt
- When `preferences.isPremium` is true, add a system message: `"The user is a premium subscriber. Do NOT suggest starting a free trial or mention upgrading. They already have full access."`
- This prevents the AI from generating trial CTAs for paying users.

## Files Modified
| File | Change |
|---|---|
| `src/pages/Chat.tsx` | Strip incomplete code blocks from displayed text; enable crafting animation for premium users |
| `src/hooks/useRzumaChat.ts` | Accept and forward `isPremium` flag in preferences |
| `supabase/functions/rzuma-chat/index.ts` | Add premium-aware system instruction to suppress trial suggestions |

