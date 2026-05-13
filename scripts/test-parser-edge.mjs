// Edge case smoke test for the plan parser
import { extractBlock, extractFencedBlocks, stripFencedBlocks } from '../src/utils/planParser.ts';

let pass = 0;
let fail = 0;
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else      { fail++; console.log(`  ✗ ${name}  ${detail}`); }
}

console.log("\n1. Same-line JSON body (no separator)");
{
  const t = 'intro\n```flights[{"id":"1","airline":"KLM"}]\n```\nend';
  const { items, ranges } = extractBlock(t, 'flights');
  assert('extracts 1 item', items.length === 1);
  assert('item is object with id', items[0]?.id === '1');
  assert('range encompasses full fence', t.slice(ranges[0][0], ranges[0][1]).startsWith('```flights'));
  assert('range end at close fence', t.slice(ranges[0][0], ranges[0][1]).endsWith('```'));
}

console.log("\n2. Same-line JSON with leading space");
{
  const t = 'hi\n```flights [{"id":"2"}]\n```\n';
  const { items } = extractBlock(t, 'flights');
  assert('extracts 1 item', items.length === 1 && items[0]?.id === '2');
}

console.log("\n3. Backticks inside JSON string values");
{
  const raw = [
    'preamble',
    '```activities',
    '[{"id":"1","name":"Code review","description":"Use ``` to fence code. Nested ` and ```lol```"}]',
    '```',
  ].join('\n');
  const { items } = extractBlock(raw, 'activities');
  assert('extracts 1 activity', items.length === 1);
  assert('description contains fences', typeof items[0]?.description === 'string' && items[0].description.includes('```lol```'));
}

console.log("\n4. Fence inside prose (no preceding newline) is ignored");
{
  const t = 'not a fence ```flights\n[{"id":"x"}]\n```\n';
  const { items } = extractBlock(t, 'flights');
  assert('nothing extracted (fence must be line-start)', items.length === 0);
}

console.log("\n5. Fence at start of text (index 0) is recognized");
{
  const t = '```flights\n[{"id":"top"}]\n```\n';
  const { items } = extractBlock(t, 'flights');
  assert('extracts 1 item at start of text', items.length === 1 && items[0]?.id === 'top');
}

console.log("\n6. Streaming: no closing fence");
{
  const t = 'hi\n```activities\n[{"id":"1"},{"id":"2"';
  const { items, ranges } = extractBlock(t, 'activities');
  assert('partial parse yields some items', items.length >= 1);
  assert('range extends to end of text', ranges[0][1] === t.length);
}

console.log("\n7. Truncated at arbitrary offset never throws");
{
  const full = 'a\n```flights\n[{"id":"1","airline":"KLM"},{"id":"2","airline":"Delta"}]\n```\n';
  for (let i = 0; i <= full.length; i++) {
    const slice = full.slice(0, i);
    try {
      extractBlock(slice, 'flights');
    } catch (e) {
      fail++;
      console.log(`  ✗ threw at offset ${i}: ${e.message}`);
      break;
    }
  }
  pass++;
  console.log('  ✓ no throw across all truncation offsets');
}

console.log("\n8. Invalid JSON returns empty items, no throw");
{
  const t = '```flights\n{"broken": "no closing brace"\n```\n';
  const { items } = extractBlock(t, 'flights');
  // auto-close may salvage this; either salvaged or empty is fine, as long as no throw
  assert('does not throw, returns array', Array.isArray(items));
}

console.log("\n9. stripFencedBlocks removes all ranges");
{
  const t = 'before\n```flights\n[{"id":"1"}]\n```\nmiddle\n```hotels\n[{"id":"h1"}]\n```\nafter';
  const f = extractBlock(t, 'flights');
  const h = extractBlock(t, 'hotels');
  const prose = stripFencedBlocks(t, [...f.ranges, ...h.ranges]);
  assert('strips flights fence', !prose.includes('```flights'));
  assert('strips hotels fence', !prose.includes('```hotels'));
  assert('keeps prose', prose.includes('before') && prose.includes('middle') && prose.includes('after'));
}

console.log("\n10. Plan parser round-trip (arrays are spread, objects pushed)");
{
  const obj = { id: 'x', tags: ['a', 'b'] };
  const arr = [{ id: '1' }, { id: '2' }];
  const t1 = '```places\n' + JSON.stringify(obj) + '\n```';
  const t2 = '```places\n' + JSON.stringify(arr) + '\n```';
  const r1 = extractBlock(t1, 'places');
  const r2 = extractBlock(t2, 'places');
  assert('object block → 1 item', r1.items.length === 1);
  assert('object item deep-equal', JSON.stringify(r1.items[0]) === JSON.stringify(obj));
  assert('array block → spread items', r2.items.length === 2);
  assert('array items deep-equal', JSON.stringify(r2.items) === JSON.stringify(arr));
  // Range covers full fence
  assert('range round-trip', t1.slice(r1.ranges[0][0], r1.ranges[0][1]).startsWith('```places') && t1.slice(r1.ranges[0][0], r1.ranges[0][1]).endsWith('```'));
}

console.log("\n11. Unknown-word fence (```flights_summary) should NOT match type=flights");
{
  const t = '\n```flights_summary\n[{"id":"1"}]\n```\n';
  const { items } = extractBlock(t, 'flights');
  assert('no match for prefix word', items.length === 0);
}

console.log(`\nResult: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
