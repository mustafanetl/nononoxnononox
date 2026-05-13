/**
 * Parser for Jolliday's AI-generated trip plans.
 *
 * AI responses arrive as prose with structured data embedded in fenced code
 * blocks like:
 *
 *   Here is your trip:
 *   ```flights
 *   [{"airline":"KLM", ...}]
 *   ```
 *
 * A naive lazy regex (```\w+\s*([\s\S]*?)```) fails in two ways:
 *
 *   1. A JSON string value that contains backticks ("desc": "use the ``` fence")
 *      closes the fence early, silently truncating the block.
 *   2. Patterns inside prose like `Day 2 activities: ...` could spuriously
 *      match a fence even when the AI didn't emit one.
 *
 * This parser scans character-by-character, tracks JSON string context
 * (including escape sequences), and requires fence openings to sit at the
 * start of a line. It also tolerates streaming input — incomplete JSON,
 * trailing commas, and missing closing fences all yield either a valid
 * partial parse or an empty result, never a throw.
 *
 * Design contract: see design.md → "Plan Parser Interface".
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
 * Return every `\`\`\`{type} ... \`\`\`` block in `text`.
 *
 * The `range` tuple is `[start, end)` — start is the index of the opening
 * backtick, end is exclusive and points just past the closing backticks
 * (or to `text.length` if the block is unterminated). `text.slice(start, end)`
 * therefore yields the whole fence including both delimiters.
 *
 * `raw` is the trimmed body between the fences.
 */
export function extractFencedBlocks(text: string, type: string): PlanBlockRange[] {
  const results: PlanBlockRange[] = [];
  const openFence = "```" + type;
  let cursor = 0;

  while (cursor < text.length) {
    const openAt = text.indexOf(openFence, cursor);
    if (openAt === -1) break;

    // The fence must be at the start of the text or preceded by a newline.
    // Prevents matching `surprises``flights` inside prose.
    const prev = openAt > 0 ? text[openAt - 1] : "\n";
    if (prev !== "\n") {
      cursor = openAt + openFence.length;
      continue;
    }

    const afterOpenIdx = openAt + openFence.length;
    const afterOpenChar = text[afterOpenIdx];

    // Three things are allowed right after the fence name:
    //   • whitespace / newline → standard multi-line block or same-line with leading space
    //   • `[` or `{` directly → same-line JSON body with no separator (req 6.9)
    //   • end of text → streaming fence with no body yet
    // Anything else means the word after ``` isn't actually `type`
    // (e.g. ```flights_summary should NOT match type="flights").
    const isJsonDelim = afterOpenChar === "[" || afterOpenChar === "{";
    const isWsOrEof =
      afterOpenChar === undefined ||
      afterOpenChar === "\n" ||
      afterOpenChar === "\r" ||
      afterOpenChar === " " ||
      afterOpenChar === "\t";
    if (!isJsonDelim && !isWsOrEof) {
      cursor = afterOpenIdx;
      continue;
    }

    // Figure out where the block body begins.
    let rawStart: number;
    if (isJsonDelim) {
      // Body starts immediately (e.g. ```flights[{"id":"1"}]).
      rawStart = afterOpenIdx;
    } else if (afterOpenChar === undefined) {
      // Streaming: fence name at EOF, no body yet.
      results.push({ raw: "", range: [openAt, text.length] });
      break;
    } else {
      // Whitespace after fence name. Look for a same-line JSON body first.
      const nlIdx = text.indexOf("\n", afterOpenIdx);
      const lineEnd = nlIdx === -1 ? text.length : nlIdx;
      const sameLineRaw = text.slice(afterOpenIdx, lineEnd);
      const sameLineTrimmed = sameLineRaw.trim();
      if (
        sameLineTrimmed.length > 0 &&
        (sameLineTrimmed[0] === "[" || sameLineTrimmed[0] === "{")
      ) {
        // Same-line JSON starting after some whitespace (e.g. ```flights [...]).
        rawStart = afterOpenIdx + sameLineRaw.indexOf(sameLineTrimmed[0]);
      } else if (nlIdx === -1) {
        // Fence followed only by whitespace until EOF (streaming).
        results.push({ raw: "", range: [openAt, text.length] });
        break;
      } else {
        // Standard multi-line block: body starts on the next line.
        rawStart = nlIdx + 1;
      }
    }

    // Scan forward for the closing ``` at the start of a line, tracking JSON
    // string context so backticks inside string values don't close the fence.
    let i = rawStart;
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
      if (inString && ch === "\\") {
        escape = true;
        i++;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        i++;
        continue;
      }
      if (!inString && ch === "`" && text[i + 1] === "`" && text[i + 2] === "`") {
        // Closing fence is only recognized at the start of a line.
        const atLineStart = i === 0 || text[i - 1] === "\n";
        if (atLineStart) {
          closeAt = i;
          break;
        }
      }
      i++;
    }

    let rawEnd: number;
    let fullEnd: number;
    if (closeAt === -1) {
      // Streaming: no closing fence found. Use end of text as the boundary.
      // If the raw body ends with ``` on the same line (rare but possible),
      // strip it before parsing. The range still covers through text.length.
      rawEnd = text.length;
      fullEnd = text.length;
    } else {
      rawEnd = closeAt;
      fullEnd = closeAt + 3;
    }

    let raw = text.slice(rawStart, rawEnd).trim();
    if (closeAt === -1) {
      // Same-line close on streaming EOF: `...}]` or `...}]```. Strip the trailing fence.
      raw = raw.replace(/```\s*$/, "").trim();
    }

    results.push({ raw, range: [openAt, fullEnd] });
    cursor = fullEnd;
  }

  return results;
}

/**
 * Strip JSON trailing commas that appear outside string literals — both the
 * `[1,2,]` / `{"a":1,}` variety and any dangling `,` at end-of-string. We walk
 * the input character-by-character so commas inside `"..."` values are left
 * alone. The LLM emits trailing commas all the time while streaming, and
 * JSON.parse is strict, so this is a prerequisite for the auto-close pass.
 */
function stripTrailingCommas(input: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (escape) {
      out += ch;
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") {
        out += ch;
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      out += ch;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === ",") {
      // Look past whitespace for the next non-whitespace char. If it's a
      // closer or end-of-input, drop the comma.
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j])) j++;
      const next = input[j];
      if (next === undefined || next === "]" || next === "}") {
        continue; // swallow the trailing comma
      }
    }
    out += ch;
  }
  return out;
}

/**
 * Parse possibly-incomplete JSON. Returns the parsed value or `null` if the
 * input is empty, whitespace, or unrecoverable. Strips trailing commas and
 * auto-closes unbalanced braces/brackets to tolerate streaming input.
 */
function parsePartialJson(raw: string): any | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Fast path: valid JSON as-is.
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through to repair pipeline */
  }

  // Repair pipeline: strip trailing commas, then auto-close any unbalanced
  // braces/brackets we opened while streaming.
  let fixed = stripTrailingCommas(trimmed);

  try {
    return JSON.parse(fixed);
  } catch {
    /* still broken — try to close dangling structures */
  }

  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;
  for (let k = 0; k < fixed.length; k++) {
    const ch = fixed[k];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString && ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") openBraces++;
    else if (ch === "}") openBraces--;
    else if (ch === "[") openBrackets++;
    else if (ch === "]") openBrackets--;
  }

  // If we're mid-string, close it first so the next comma strip doesn't run
  // through string content.
  if (inString) fixed += '"';
  // A dangling string close may have revealed a new trailing comma; strip it.
  fixed = stripTrailingCommas(fixed);
  while (openBraces-- > 0) fixed += "}";
  while (openBrackets-- > 0) fixed += "]";

  try {
    return JSON.parse(fixed);
  } catch {
    return null;
  }
}

/**
 * Parse every fenced block of `type` and return a flat items array plus the
 * character range of each block (so callers can strip them from the prose).
 *
 * JSON arrays are spread into the items array (one item per element) and
 * objects are pushed as a single item. Malformed blocks are silently dropped.
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
    if (parsed === null || parsed === undefined) continue;
    if (Array.isArray(parsed)) items.push(...parsed);
    else items.push(parsed);
  }
  return { items, ranges };
}

/**
 * Remove fenced code blocks at the given ranges and return the remaining
 * prose. `ranges` may come from multiple `extractBlock` calls combined.
 *
 * Also removes any dangling open-fence-without-close for known block types,
 * which happens when a stream is cut mid-block.
 */
export function stripFencedBlocks(text: string, ranges: [number, number][]): string {
  if (!text) return "";
  let out = text;

  if (ranges.length > 0) {
    // Sort descending so splicing doesn't shift the remaining indices.
    const sorted = [...ranges]
      .filter(([s, e]) => s >= 0 && e >= s && e <= text.length)
      .sort((a, b) => b[0] - a[0]);
    for (const [start, end] of sorted) {
      out = out.slice(0, start) + out.slice(end);
    }
  }

  // Scrub any open fence whose close never arrived (in-progress streaming).
  for (const type of BLOCK_TYPES) {
    const openPattern = new RegExp("```" + type + "[\\s\\S]*$");
    const openMatch = out.match(openPattern);
    if (!openMatch) continue;
    const closePattern = new RegExp("```" + type + "[\\s\\S]*?```");
    if (!closePattern.test(out)) {
      out = out.replace(openPattern, "");
    }
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export { BLOCK_TYPES };
