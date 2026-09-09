type Vector = [number, number, number];
type Plane = { normal: Vector; distance: number };

const cubePlanes: Plane[] = [
  { normal: [1, 0, 0], distance: 1.5 },
  { normal: [-1, 0, 0], distance: 1.5 },
  { normal: [0, 1, 0], distance: 1.5 },
  { normal: [0, -1, 0], distance: 1.5 },
  { normal: [0, 0, 1], distance: 1.5 },
  { normal: [0, 0, -1], distance: 1.5 },
];
const pyramidPlanes: Plane[] = [
  { normal: [3.2, 1.5, 0], distance: 2.85 },
  { normal: [-3.2, 1.5, 0], distance: 2.85 },
  { normal: [0, 1.5, 3.2], distance: 2.85 },
  { normal: [0, 1.5, -3.2], distance: 2.85 },
  { normal: [0, -1, 0], distance: 1.3 },
];
const cameraDistance = 5.35;
const samplesPerAxis = 4;

// Intersect each subcell ray with the closed solid. Unlike a rounded point cloud,
// this leaves no sampling holes and gives silhouette cells fractional coverage.
export function rasterizeAsciiSolid({
  shape,
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
  shape: "cube" | "pyramid";
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
  const rotate = ([x, y, z]: Vector): Vector => [
    x * cosB + z * sinA * sinB - y * cosA * sinB,
    x * sinB - z * sinA * cosB + y * cosA * cosB,
    z * cosA + y * sinA,
  ];
  const planes = (shape === "cube" ? cubePlanes : pyramidPlanes).map((plane) => {
    const [x, y, z] = rotate(plane.normal);
    const length = Math.hypot(x, y, z);
    return {
      x,
      y,
      z,
      bound: plane.distance + cameraDistance * z,
      shade: Math.min(1, Math.max(0.12, ((y - z) / length + 1.1 + lightSkew) / 2.8)) * 0.7,
    };
  });

  let minCol = cols;
  let maxCol = 0;
  let minRow = rows;
  let maxRow = 0;
  // Project a bounding box once to keep supersampling local to the shape.
  for (const x of [-1.5, 1.5]) {
    for (const y of shape === "cube" ? [-1.5, 1.5] : [-1.3, 1.9]) {
      for (const z of [-1.5, 1.5]) {
        const [rx, ry, rz] = rotate([x, y, z]);
        const col = centerCol + (scale * rx) / (rz + cameraDistance);
        const row = centerRow - (scale * 0.74 * ry) / (rz + cameraDistance);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
      }
    }
  }

  coverage.fill(0);
  shades.fill(0);
  for (
    let row = Math.max(0, Math.floor(minRow));
    row <= Math.min(rows - 1, Math.ceil(maxRow));
    row++
  ) {
    for (
      let col = Math.max(0, Math.floor(minCol));
      col <= Math.min(cols - 1, Math.ceil(maxCol));
      col++
    ) {
      let hits = 0;
      let shade = 0;
      for (let sy = 0; sy < samplesPerAxis; sy++) {
        const dy = -(row + (sy + 0.5) / samplesPerAxis - 0.5 - centerRow) / (scale * 0.74);
        for (let sx = 0; sx < samplesPerAxis; sx++) {
          const dx = (col + (sx + 0.5) / samplesPerAxis - 0.5 - centerCol) / scale;
          let near = 0;
          let far = Infinity;
          let surfaceShade = 0;
          for (const plane of planes) {
            const denominator = plane.x * dx + plane.y * dy + plane.z;
            if (Math.abs(denominator) < 1e-10) {
              if (plane.bound < 0) {
                far = -1;
                break;
              }
              continue;
            }
            const distance = plane.bound / denominator;
            if (denominator < 0 && distance > near) {
              near = distance;
              surfaceShade = plane.shade;
            } else if (denominator > 0) {
              far = Math.min(far, distance);
            }
            if (near > far) break;
          }
          if (near > 0 && near <= far) {
            hits++;
            shade += surfaceShade;
          }
        }
      }
      if (hits > 0) {
        const index = col + row * cols;
        coverage[index] = hits / (samplesPerAxis * samplesPerAxis);
        shades[index] = shade / hits;
      }
    }
  }
}
