type Vector = [number, number, number];
type DuckPart = { center: Vector; radius: Vector; material?: "eye" | "bill" };

// Classic bath-toy proportions: an oversized head seated directly on a squat
// body, a short broad bill, a small raised tail and shallow molded wings.
const parts: DuckPart[] = [
  { center: [-0.25, -0.6, 0], radius: [1.42, 0.92, 1.08] },
  { center: [0.45, 0.72, 0], radius: [0.92, 0.98, 0.88] },
  { center: [1.45, 0.39, 0], radius: [0.49, 0.18, 0.53], material: "bill" },
  { center: [1.43, 0.28, 0], radius: [0.45, 0.12, 0.49], material: "bill" },
  { center: [-1.29, -0.12, 0], radius: [0.48, 0.47, 0.51] },
  { center: [-0.46, -0.56, -0.91], radius: [0.72, 0.38, 0.21] },
  { center: [-0.46, -0.56, 0.91], radius: [0.72, 0.38, 0.21] },
  { center: [0.94, 0.96, -0.76], radius: [0.16, 0.18, 0.075], material: "eye" },
  { center: [0.94, 0.96, 0.76], radius: [0.16, 0.18, 0.075], material: "eye" },
];

export function rasterizeAsciiDuck({
  cols,
  rows,
  centerCol,
  centerRow,
  scale,
  rotateA,
  rotateB,
  lightSkew,
  coverage,
  shades,
}: {
  cols: number;
  rows: number;
  centerCol: number;
  centerRow: number;
  scale: number;
  rotateA: number;
  rotateB: number;
  lightSkew: number;
  coverage: Float32Array;
  shades: Float32Array;
}) {
  const cosA = Math.cos(rotateA);
  const sinA = Math.sin(rotateA);
  const cosB = Math.cos(rotateB);
  const sinB = Math.sin(rotateB);
  const origin: Vector = [0, -5.35 * sinA, -5.35 * cosA];
  const volumes = parts.map(({ center, radius, material }) => {
    const inverseRadius = radius.map((value) => 1 / value);
    const offset = center.map((value, axis) => (origin[axis] - value) * inverseRadius[axis]);
    return {
      inverseRadius,
      offset,
      material,
      c: offset.reduce((sum, value) => sum + value * value, -1),
    };
  });

  coverage.fill(0);
  shades.fill(0);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let hits = 0;
      let shadeSum = 0;
      for (const sy of [-0.25, 0.25]) {
        const dy = -(row + sy - centerRow) / (scale * 0.74);
        for (const sx of [-0.25, 0.25]) {
          const dx = (col + sx - centerCol) / scale;
          // Move the camera ray into the model's coordinates.
          const vx = dx * cosB + dy * sinB;
          const vy = -dx * cosA * sinB + dy * cosA * cosB + sinA;
          const vz = dx * sinA * sinB - dy * sinA * cosB + cosA;
          let closest = Infinity;
          let shade = 0;
          for (const volume of volumes) {
            const [ix, iy, iz] = volume.inverseRadius;
            const [ox, oy, oz] = volume.offset;
            const rx = vx * ix;
            const ry = vy * iy;
            const rz = vz * iz;
            const a = rx * rx + ry * ry + rz * rz;
            const b = ox * rx + oy * ry + oz * rz;
            const discriminant = b * b - a * volume.c;
            if (discriminant < 0) continue;
            const distance = (-b - Math.sqrt(discriminant)) / a;
            if (distance <= 0 || distance >= closest) continue;
            closest = distance;
            const nx = (ox + distance * rx) * ix;
            const ny = (oy + distance * ry) * iy;
            const nz = (oz + distance * rz) * iz;
            const length = Math.hypot(nx, ny, nz);
            const normalY = (nx * sinB - nz * sinA * cosB + ny * cosA * cosB) / length;
            const normalZ = (nz * cosA + ny * sinA) / length;
            shade = Math.min(1, Math.max(0.12, (normalY - normalZ + 1.1 + lightSkew) / 2.8)) * 0.7;
            if (volume.material === "eye") shade = 0;
            if (volume.material === "bill") shade *= 0.75;
          }
          if (closest < Infinity) {
            hits++;
            shadeSum += shade;
          }
        }
      }
      if (hits > 0) {
        const index = col + row * cols;
        coverage[index] = hits / 4;
        shades[index] = shadeSum / hits;
      }
    }
  }
}
