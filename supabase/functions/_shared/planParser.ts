/**
 * Deno-side parser for Jolliday's AI-generated trip plans.
 *
 * Mirrors src/utils/planParser.ts — both files must be kept in sync. We
 * duplicate the source rather than importing cross-boundary because Deno
 * edge functions and the Vite browser bundle live in separate build
 * pipelines and import resolution.
 *
 * Used by: supabase/functions/review-trip-plan.
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
 * Extract every ```{type}\n...\n``` block, respecting JSON string context so
 * backticks inside strings can't prematurely terminate a fence.
 */
export function extractFencedBlocks(text: string, type: string): PlanBlockRange[] {
  const results: PlanBlockRange[] = [];
  const openFence = "```" + type;
  let cursor = 0;

  while (cursor < text.length) {
    const openAt = text.indexOf(openFence, cursor);
    if (openAt === -1) break;

    const prev = openAt > 0 ? text[openAt - 1] : "\n";
    if (prev !== "\n") {
      cursor = openAt + openFence.length;
      continue;
    }

    const afterOpenIdx = openAt + openFence.length;
    const afterOpenChar = text[afterOpenIdx];
    if (afterOpenChar && afterOpenChar !== "\n" && afterOpenChar !== "\r" && !/\s/.test(afterOpenChar)) {
      cursor = afterOpenIdx;
      continue;
    }

    const contentStart = text.indexOf("\n", afterOpenIdx);
    if (contentStart === -1) {
      const raw = text.slice(afterOpenIdx).trim();
      results.push({ raw, range: [openAt, text.length] });
      break;
    }

    let i = contentStart + 1;
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
        const atLineStart = i === contentStart + 1 || text[i - 1] === "\n";
        if (atLineStart && ch === "`" && text[i + 1] === "`" && text[i + 2] === "`") {
          closeAt = i;
          break;
        }
      }
      i++;
    }

    const rawEndExclusive = closeAt === -1 ? text.length : closeAt;
    const raw = text.slice(contentStart + 1, rawEndExclusive).replace(/\s+$/, "").trim();
    const fullEndExclusive = closeAt === -1 ? text.length : closeAt + 3;

    results.push({ raw, range: [openAt, fullEndExclusive] });
    cursor = fullEndExclusive;
  }

  return results;
}

function parsePartialJson(raw: string): any | null {
  const trimmed = raw.replace(/,\s*$/, "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
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

/** Extract blocks AND keep the original raw+fullMatch so callers that need
 *  to rewrite them (like review-trip-plan's enrichedPlan) can splice back in. */
export function extractBlocksWithRaw(
  text: string,
  type: string,
): { raw: string; json: any; fullMatch: string }[] {
  const blocks = extractFencedBlocks(text, type);
  const out: { raw: string; json: any; fullMatch: string }[] = [];
  for (const b of blocks) {
    const parsed = parsePartialJson(b.raw);
    if (parsed === null) continue;
    out.push({ raw: b.raw, json: parsed, fullMatch: text.slice(b.range[0], b.range[1]) });
  }
  return out;
}

export { BLOCK_TYPES };
