import assert from "node:assert/strict";
import test from "node:test";
import { rasterizeAsciiDuck } from "../src/components/asciiDuck.ts";

const cols = 80;
const rows = 60;
function render(rotateA = 0, rotateB = 0) {
  const coverage = new Float32Array(cols * rows);
  const shades = new Float32Array(cols * rows);
  rasterizeAsciiDuck({
    cols,
    rows,
    centerCol: 40,
    centerRow: 30,
    scale: 60,
    rotateA,
    rotateB,
    lightSkew: 0,
    coverage,
    shades,
  });
  return { coverage, shades };
}

test("duck profile contains a head, bill, body, tail and a dark eye", () => {
  const { coverage, shades } = render();
  for (const [col, row] of [
    [49, 20],
    [61, 27],
    [36, 36],
    [20, 30],
  ]) {
    assert.ok(coverage[col + row * cols] > 0, `missing duck feature at ${col}, ${row}`);
  }
  assert.ok(coverage.some((value, index) => value === 1 && shades[index] === 0));
});

test("classic duck has a large head, a short bill and no exposed long neck", () => {
  const { coverage } = render();
  const rowWidth = (row: number) =>
    coverage.slice(row * cols, (row + 1) * cols).filter((value) => value > 0).length;
  assert.ok(rowWidth(24) > rowWidth(34) * 0.6, "head must be large relative to the body");
  assert.ok(rowWidth(27) >= rowWidth(24), "head must meet the broad chest without a narrow stalk");
  assert.equal(coverage[65 + 27 * cols], 0, "bill must remain short");
});

test("duck remains a finite, shaded volume from every rotation", () => {
  for (const angle of [0, 0.45, 1.57, 3.14, 4.71]) {
    const { coverage, shades } = render(angle, angle * 0.56);
    assert.ok(coverage.filter((value) => value > 0).length > 300);
    assert.ok(coverage.some((value) => value > 0 && value < 1));
    assert.ok(shades.every((value) => Number.isFinite(value) && value >= 0 && value <= 0.7));
  }
});

test("duck silhouette changes during idle rotation", () => {
  const first = render();
  const later = render(0.25, 0.14);
  const difference = first.coverage.reduce(
    (sum, value, index) => sum + Math.abs(value - later.coverage[index]),
    0,
  );
  assert.ok(difference > 30);
});
