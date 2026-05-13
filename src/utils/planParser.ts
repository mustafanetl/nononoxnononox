/**
 * Parser for Jolliday's AI-generated trip plans.
 *
 * Before this util existed, ~4 places hand-rolled a regex like
 * /```{type}\s*([\s\S]*?)```/g
 *
 * Two problems with that approach:
 *   1. Lazy matching means a single ``` appearing inside a JSON string value
 *      (rare but it happens when the AI quotes backticks) terminates the
 *      block early and silently drops the rest of the plan.
 *   2. The unfenced fallback — "if we see `activities\n[...]` on its own
 *      line, treat it as a block" — could match anywhere in the AI's prose
 *      (e.g. "Day 2 activities include…" followed by an array later).
 *
 * This parser scans character-by-character and tracks JSON string context,
 * so backticks inside strings can never break a fence. The unfenced
 * fallback is removed entirely — if the AI drops the fences we'd rather
 * fall through than hallucinate a block from prose.
 */

export type PlanBlockRange = { raw: string; range: [number, number] };

const BLOCK_TYPES = [
  "flights",
  "activities",
  "hotels",
  "itinerary",
  "timeline",
  "destination_enrich",
  "travelinfo",
  "weather",
  "quickreplies",
  "places",
] as const;

/**
 * Extract every ```{type}\n...\n``` block, honoring JSON string context so
 * backticks inside string values can't prematurely close the fence.
 *
 * Returns the raw inner text + the absolute range in `text` (so callers can
 * strip blocks from the prose shown in the UI).
 */
export function extractFencedBlocks(text: string, type: string): PlanBlockRange[] {
  const results: PlanBlockRange[] = [];
  const openFence = "```" + type;
  let cursor = 0;

  while (cursor < text.length) {
    const openAt = text.indexOf(openFence, cursor);
    if (openAt === -1) break;

    // The fence must be at the start of the string or preceded by a newline.
    // Prevents matching ```activitie in the middle of prose.
    const prev = openAt > 0 ? text[openAt - 1] : "\n";
    if (prev !== "\n") {
      cursor = openAt + openFence.length;
      continue;
    }

    // After the fence, only whitespace until newline is allowed.
    const afterOpenIdx = openAt + openFence.length;
    const afterOpenChar = text[afterOpenIdx];
    if (afterOpenChar && afterOpenChar !== "\n" && afterOpenChar !== "\r" && !/\s/.test(afterOpenChar)) {
      cursor = afterOpenIdx;
      continue;
    }

    const contentStart = text.indexOf("\n", afterOpenIdx);
    if (contentStart === -1) {
      // No newline after the fence — either unterminated streaming block or
      // the AI put the JSON on the same line as the fence (e.g. ```itinerary[...]).
      // Treat everything after the fence as raw content.
      const raw = text.slice(afterOpenIdx).replace(/```\s*$/, "").trim();
      results.push({ raw, range: [openAt, text.length] });
      break;
    }

    // Support same-line format: ```itinerary[{...}]```
    // If there's content between the fence name and the first newline that
    // looks like JSON, use it directly instead of skipping to the next line.
    const sameLine = text.slice(afterOpenIdx, contentStart).trim();
    let actualContentStart = contentStart;
    let useSameLine = false;
    if (sameLine.length > 0 && (sameLine.startsWith("[") || sameLine.startsWith("{"))) {
      useSameLine = true;
    }

    // Scan for closing ``` at the start of a line, respecting JSON string state.
    let i = useSameLine ? afterOpenIdx : contentStart + 1;
    let inString = false;
    let escape = false;
    let closeAt = -1;

    while (i <= text.length - 3) {
      const ch = text[i];
      if (escape) {
        escape = false;
        i++;
        continue;
      }
      if (ch === "\\" && inString) {
        escape = true;
        i++;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        i++;
        continue;
      }
      if (!inString) {
        // Close fence must be at the start of a line (preceded by \n OR at very start of scan).
        const atLineStart = i === contentStart + 1 || text[i - 1] === "\n";
        if (atLineStart && ch === "`" && text[i + 1] === "`" && text[i + 2] === "`") {
          closeAt = i;
          break;
        }
      }
      i++;
    }

    const rawEndExclusive = closeAt === -1 ? text.length : closeAt;
    const rawStart = useSameLine ? afterOpenIdx : contentStart + 1;
    const raw = text.slice(rawStart, rawEndExclusive).replace(/\s+$/, "").trim();
    const fullEndExclusive = closeAt === -1 ? text.length : closeAt + 3;

    results.push({ raw, range: [openAt, fullEndExclusive] });
    cursor = fullEndExclusive;
  }

  return results;
}

/** Attempt to parse streaming JSON by auto-closing unbalanced braces/brackets. */
function parsePartialJson(raw: string): any | null {
  const trimmed = raw.replace(/,\s*$/, "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Auto-close unbalanced braces/brackets (streaming fallback).
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escape = false;
    for (const ch of trimmed) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\" && inString) {
        escape = true;
        continue;
      }
      if (ch === '"') inString = !inString;
      if (inString) continue;
      if (ch === "{") openBraces++;
      else if (ch === "}") openBraces--;
      else if (ch === "[") openBrackets++;
      else if (ch === "]") openBrackets--;
    }
    let fixed = trimmed;
    while (openBraces-- > 0) fixed += "}";
    while (openBrackets-- > 0) fixed += "]";
    try {
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

/**
 * Extract and parse JSON for every fenced block of `type`. Returns a flat
 * array (arrays are spread) plus the ranges of every fence so the caller
 * can remove them from the prose shown to users.
 */
export function extractBlock(
  text: string,
  type: string,
): { items: any[]; ranges: [number, number][] } {
  const blocks = extractFencedBlocks(text, type);
  const items: any[] = [];
  const ranges: [number, number][] = [];
  for (const b of blocks) {
    ranges.push(b.range);
    const parsed = parsePartialJson(b.raw);
    if (parsed === null) continue;
    if (Array.isArray(parsed)) items.push(...parsed);
    else items.push(parsed);
  }
  return { items, ranges };
}

/**
 * Remove all fenced code blocks of any known type from the text, returning
 * just the prose the user should see. Call with the result of multiple
 * extractBlock() calls combined.
 */
export function stripFencedBlocks(text: string, ranges: [number, number][]): string {
  if (!text || ranges.length === 0) return text || "";
  // Sort descending so we can splice from the end without shifting indices.
  const sorted = [...ranges]
    .filter(([s, e]) => s >= 0 && e >= s && e <= text.length)
    .sort((a, b) => b[0] - a[0]);
  let out = text;
  for (const [start, end] of sorted) {
    out = out.slice(0, start) + out.slice(end);
  }
  // Also clean up any dangling open fence (streaming — block arrives before close).
  for (const type of BLOCK_TYPES) {
    const openPattern = new RegExp("```" + type + "[\\s\\S]*$");
    const openMatch = out.match(openPattern);
    if (openMatch) {
      const closePattern = new RegExp("```" + type + "[\\s\\S]*?```");
      if (!closePattern.test(out)) {
        out = out.replace(openPattern, "");
      }
    }
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
}
