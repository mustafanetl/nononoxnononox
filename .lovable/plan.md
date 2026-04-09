
Goal: make the latest AI reply stay completely hidden until the crafting flow is ready, so users never see raw text, JSON, cards, or the free-trial UI before 100%.

Why this still happens:
- In `src/pages/Chat.tsx`, the last assistant message is only hidden once `isCraftingPlan` becomes true.
- But the response starts streaming before that, so intro text and partial fenced-block data can render first.
- Also, `hasStreamedContent` turns off the typing state as soon as the first chunk arrives, which creates the “flash” window you showed in the screenshot.

Implementation plan:
1. Add one shared guard in `src/pages/Chat.tsx` for the latest assistant reply, e.g. a `hideLatestAssistantResponse` condition.
   - It should be true while the newest assistant message is still streaming.
   - It should also stay true while the crafting animation is active.
   - This will block all early rendering from the current response.

2. Apply that guard to the full assistant message render path.
   - Prevent the latest assistant text from rendering.
   - Prevent inline cards, summary cards, quick replies, preview/paywall cards, and any parsed block output from rendering.
   - Keep the existing free-plan gating as a secondary safety layer.

3. Fix the placeholder logic so the UI shows a loading/crafting state instead of a blank gap.
   - Update the typing/loading condition so it remains visible while the latest assistant response is intentionally hidden.
   - Then transition into the crafting animation once crafting starts.
   - Result: user sees loader/crafting only, never partial content.

4. Verify the specific failure case from your screenshot.
   - No intro paragraph before crafting.
   - No raw `[{ "id": ... }]` JSON before crafting.
   - No flight/hotel/activity cards before crafting.
   - No free-trial CTA before the 100% reveal.

Files to update:
- `src/pages/Chat.tsx`

Technical note:
This is primarily a rendering-state issue, not a backend issue. The parser is designed to tolerate incomplete streamed blocks, so the safest fix is to stop rendering the newest assistant response until it is fully allowed to appear.
