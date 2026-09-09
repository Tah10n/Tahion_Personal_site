import assert from "node:assert/strict";
import test from "node:test";
import { rasterizeAsciiSolid } from "../src/components/asciiPolyhedra.ts";

const cols = 80;
const rows = 60;
function render(shape: "cube" | "pyramid", rotateA = 0.45, rotateB = 0.35) {
  const coverage = new Float32Array(cols * rows);
  const shades = new Float32Array(cols * rows);
  rasterizeAsciiSolid({
    shape,
    cols,
    rows,
    centerCol: 40,
    centerRow: 30,
    scale: 48,
    rotateA,
    rotateB,
    lightSkew: 0,
    coverage,
    shades,
  });
  return { coverage, shades };
}

test("cube uses the front surface and antialiases its projected silhouette", () => {
  const { coverage, shades } = render("cube", 0, 0);
  assert.equal(coverage[40 + 30 * cols], 1);
  assert.ok(Math.abs(shades[40 + 30 * cols] - 0.525) < 1e-6);
  assert.equal(coverage[60 + 30 * cols], 0);
  assert.ok(coverage[59 + 30 * cols] > 0 && coverage[59 + 30 * cols] < 1);
});

for (const shape of ["cube", "pyramid"] as const) {
  test(`${shape} stays filled across rotation and has fractional edge coverage`, () => {
    for (const angle of [0, 0.45, 1.3, 2.8, 4.5]) {
      const { coverage, shades } = render(shape, angle, angle * 0.56);
      assert.ok(coverage.some((value) => value > 0 && value < 1));
      for (let row = 0; row < rows; row++) {
        const occupied = Array.from(coverage.slice(row * cols, (row + 1) * cols))
          .map((value, col) => (value > 0 ? col : -1))
          .filter((col) => col >= 0);
        if (occupied.length > 0) {
          assert.equal(occupied.length, occupied[occupied.length - 1] - occupied[0] + 1);
        }
      }
      assert.ok(shades.every((shade) => Number.isFinite(shade) && shade >= 0 && shade <= 0.7));
    }
  });

  test(`${shape} changes gradually at the torus idle rotation rate`, () => {
    const first = render(shape);
    const next = render(shape, 0.45 + 0.025 / 60, 0.35 + 0.014 / 60);
    const later = render(shape, 0.45 + 0.025 * 10, 0.35 + 0.014 * 10);
    const difference = (other: Float32Array) =>
      first.coverage.reduce((sum, value, index) => sum + Math.abs(value - other[index]), 0);
    assert.ok(difference(next.coverage) < 3, "a single frame must not jump across the grid");
    assert.ok(difference(later.coverage) > 20, "idle rotation must keep changing the silhouette");
  });
}
