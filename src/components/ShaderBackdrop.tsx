import { useEffect, useRef } from "react";
import { rasterizeAsciiSolid } from "./asciiPolyhedra";
import { rasterizeAsciiDuck } from "./asciiDuck";

export type BackdropVariant = "signal" | "topography" | "radar";
export type BackdropTheme = "acid" | "plasma" | "ice";
export type BackdropShape = "torus" | "cube" | "pyramid" | "duck";

type Point = {
  x: number;
  y: number;
};

type Rgb = [number, number, number];

type Palette = {
  bg: Rgb;
  deep: Rgb;
  primary: Rgb;
  accent: Rgb;
  warm: Rgb;
  ink: Rgb;
};

type AsciiBuffers = {
  cols: number;
  rows: number;
  depthBuffer: Float32Array;
  glyphBuffer: Array<string>;
  shadeBuffer: Float32Array;
  coverageBuffer: Float32Array;
};

type ShaderBackdropProps = {
  variant: BackdropVariant;
  theme: BackdropTheme;
  shape?: BackdropShape;
};

const palettes: Record<BackdropTheme, Palette> = {
  acid: {
    bg: [1, 8, 6],
    deep: [0, 28, 21],
    primary: [38, 247, 215],
    accent: [216, 255, 61],
    warm: [255, 157, 46],
    ink: [255, 248, 223],
  },
  plasma: {
    bg: [247, 239, 40],
    deep: [255, 251, 218],
    primary: [0, 87, 255],
    accent: [255, 61, 127],
    warm: [0, 184, 112],
    ink: [8, 8, 8],
  },
  ice: {
    bg: [0, 5, 12],
    deep: [1, 12, 25],
    primary: [70, 158, 205],
    accent: [142, 211, 224],
    warm: [21, 48, 112],
    ink: [245, 252, 255],
  },
};

const torusGlyphs = " .,:;irsXA253hMHGS#9B&@";
const ambientGlyphs = ".:-+*";
const torusRingCount = 4;
const lowPowerFrameMsByVariant: Record<BackdropVariant, number> = {
  signal: 1000 / 60,
  topography: 125,
  radar: 125,
};
const tau = Math.PI * 2;

function hash(value: number) {
  const projected = Math.sin(value * 12.9898) * 43758.5453;
  return projected - Math.floor(projected);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rgba(rgb: Rgb, alpha: number) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(mix(a[0], b[0], t)),
    Math.round(mix(a[1], b[1], t)),
    Math.round(mix(a[2], b[2], t)),
  ];
}

function ensureAsciiBuffers(
  existing: AsciiBuffers | null,
  width: number,
  height: number,
): AsciiBuffers {
  const fontSize = clamp(width / 112, 10, 17);
  const lineHeight = fontSize * 1.12;
  const cols = Math.ceil(width / fontSize);
  const rows = Math.ceil(height / lineHeight);
  const bufferLength = cols * rows;

  const next =
    existing &&
    existing.cols === cols &&
    existing.rows === rows &&
    existing.depthBuffer.length === bufferLength
      ? existing
      : {
          cols,
          rows,
          depthBuffer: new Float32Array(bufferLength),
          glyphBuffer: new Array<string>(bufferLength),
          shadeBuffer: new Float32Array(bufferLength),
          coverageBuffer: new Float32Array(bufferLength),
        };

  next.depthBuffer.fill(-Infinity);
  next.glyphBuffer.fill("");
  next.shadeBuffer.fill(0);

  return next;
}

function drawBase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: Palette,
  variant: BackdropVariant,
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, rgba(palette.deep, 1));
  gradient.addColorStop(variant === "topography" ? 0.44 : 0.58, rgba(palette.bg, 1));
  gradient.addColorStop(
    1,
    rgba(mixRgb(palette.bg, [0, 0, 0], variant === "topography" ? 0.08 : 0.54), 1),
  );
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glowA = ctx.createRadialGradient(
    width * 0.72,
    height * 0.22,
    0,
    width * 0.72,
    height * 0.22,
    width * 0.68,
  );
  glowA.addColorStop(0, rgba(palette.primary, variant === "topography" ? 0.24 : 0.2));
  glowA.addColorStop(1, rgba(palette.primary, 0));
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, width, height);

  const glowB = ctx.createRadialGradient(
    width * 0.15,
    height * 0.82,
    0,
    width * 0.15,
    height * 0.82,
    width * 0.72,
  );
  glowB.addColorStop(0, rgba(palette.accent, variant === "radar" ? 0.2 : 0.16));
  glowB.addColorStop(1, rgba(palette.accent, 0));
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, width, height);
}

function drawTorusAmbient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  palette: Palette,
) {
  const fontSize = clamp(width / 138, 8, 13);
  const columns = Math.ceil(width / (fontSize * 1.38));
  const rows = Math.ceil(height / (fontSize * 1.7));

  ctx.save();
  ctx.font = `${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const seed = hash(x * 23.7 + y * 91.2);
      if (seed < 0.78) {
        continue;
      }

      const drift = Math.sin(time * 0.12 + seed * tau) * fontSize * 0.32;
      const glyph = ambientGlyphs[Math.floor(seed * ambientGlyphs.length) % ambientGlyphs.length];
      ctx.fillStyle = rgba(seed > 0.93 ? palette.primary : palette.accent, 0.045 + seed * 0.04);
      ctx.fillText(glyph, x * fontSize * 1.38 + drift, y * fontSize * 1.7);
    }
  }

  ctx.restore();
}

function drawAsciiShape(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  scroll: number,
  pointer: Point,
  palette: Palette,
  reducedMotion: boolean,
  buffers: AsciiBuffers,
  shape: BackdropShape,
) {
  drawBase(ctx, width, height, palette, "signal");
  drawTorusAmbient(ctx, width, height, reducedMotion ? 0 : time, palette);

  const fontSize = clamp(width / 112, 10, 17);
  const lineHeight = fontSize * 1.12;
  const cols = Math.ceil(width / fontSize);
  const rows = Math.ceil(height / lineHeight);
  const { depthBuffer, glyphBuffer, shadeBuffer, coverageBuffer } = buffers;
  const bufferLength = depthBuffer.length;
  const isSolid = shape !== "torus";

  const scrollTurn = scroll * tau * 2.15;
  const idle = reducedMotion ? 0 : time;
  const rotateA = scrollTurn + idle * 0.025;
  const rotateB = scroll * tau * 1.28 + idle * 0.014;
  const centerCol = cols * (shape === "duck" ? 0.52 : width < 760 ? 0.74 : 0.61);
  const centerRow = rows * (width < 760 ? 0.38 : 0.46);
  const scale = Math.min(cols, rows) * (width < 760 ? 1.38 : 1.94);
  const lightSkew = (pointer.x - 0.5) * 0.22 + (0.5 - pointer.y) * 0.12;
  const ringRadius = 1.72;
  const tubeRadius = 0.66;
  const cosA = Math.cos(rotateA);
  const sinA = Math.sin(rotateA);
  const cosB = Math.cos(rotateB);
  const sinB = Math.sin(rotateB);

  if (shape === "cube" || shape === "pyramid") {
    rasterizeAsciiSolid({
      shape,
      cols,
      rows,
      centerCol,
      centerRow,
      scale,
      rotateA,
      rotateB,
      lightSkew,
      coverage: coverageBuffer,
      shades: shadeBuffer,
    });
  }

  if (shape === "duck") {
    rasterizeAsciiDuck({
      cols,
      rows,
      centerCol,
      centerRow,
      scale,
      rotateA,
      rotateB,
      lightSkew,
      coverage: coverageBuffer,
      shades: shadeBuffer,
    });
  }
  for (let ring = 0; shape === "torus" && ring < torusRingCount; ring += 1) {
    const ringRatio = ring / Math.max(torusRingCount - 1, 1);
    const layerStrength = 0.64 - ringRatio * 0.14;
    const thetaPhase = ring * 0.029;
    const phiPhase = ring * 0.041;

    for (let theta = thetaPhase; theta < tau + thetaPhase; theta += 0.118) {
      const costheta = Math.cos(theta);
      const sintheta = Math.sin(theta);

      for (let phi = phiPhase; phi < tau + phiPhase; phi += 0.178) {
        const cosphi = Math.cos(phi);
        const sinphi = Math.sin(phi);
        const circleX = ringRadius + tubeRadius * costheta;
        const circleY = tubeRadius * sintheta;
        const x = circleX * (cosB * cosphi + sinA * sinB * sinphi) - circleY * cosA * sinB;
        const y = circleX * (sinB * cosphi - sinA * cosB * sinphi) + circleY * cosA * cosB;
        const z = cosA * circleX * sinphi + circleY * sinA;
        const invZ = 1 / (z + 5.35);
        const col = Math.round(centerCol + scale * invZ * x);
        const row = Math.round(centerRow - scale * 0.74 * invZ * y);
        const index = col + row * cols;

        if (row < 0 || row >= rows || col < 0 || col >= cols || invZ <= depthBuffer[index]) {
          continue;
        }

        const luminance =
          cosphi * costheta * sinB -
          cosA * costheta * sinphi -
          sinA * sintheta +
          cosB * (cosA * sintheta - costheta * sinA * sinphi) +
          lightSkew;
        const shade = clamp((luminance + 0.92) / 1.92, 0, 1) * layerStrength;

        if (shade < 0.07) {
          continue;
        }

        depthBuffer[index] = invZ;
        glyphBuffer[index] = torusGlyphs[Math.floor(shade * (torusGlyphs.length - 1))];
        shadeBuffer[index] = shade;
      }
    }
  }

  ctx.save();
  ctx.font = `${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 10;
  ctx.shadowColor = rgba(palette.primary, 0.24);

  // All shapes use the torus text renderer: a discrete glyph in each cell,
  // with identical font rasterization, glow, color and opacity.
  for (let index = 0; index < bufferLength; index += 1) {
    if (isSolid) {
      const shade = shadeBuffer[index];
      if (coverageBuffer[index] < 0.5 || shade < 0.07) continue;
      glyphBuffer[index] = torusGlyphs[Math.floor(shade * (torusGlyphs.length - 1))];
    }
    const glyph = glyphBuffer[index];
    if (!glyph) {
      continue;
    }

    const col = index % cols;
    const row = Math.floor(index / cols);
    const shade = shadeBuffer[index];
    const color = shade > 0.62 ? palette.ink : shade > 0.38 ? palette.accent : palette.primary;
    const alpha = width < 760 ? 0.08 + shade * 0.28 : 0.12 + shade * 0.4;
    ctx.fillStyle = rgba(color, alpha);
    ctx.fillText(glyph, col * fontSize, row * lineHeight);
  }

  ctx.restore();

  const halo = ctx.createRadialGradient(
    width * 0.61,
    height * 0.47,
    0,
    width * 0.61,
    height * 0.47,
    width * 0.42,
  );
  halo.addColorStop(0, rgba(palette.primary, 0.045));
  halo.addColorStop(0.62, rgba(palette.accent, 0.02));
  halo.addColorStop(1, rgba(palette.primary, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);
}

function drawWaveLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  scroll: number,
  pointer: Point,
  palette: Palette,
  reducedMotion: boolean,
) {
  drawBase(ctx, width, height, palette, "topography");

  const activeTime = reducedMotion ? time * 0.45 : time;
  const flowTime = activeTime * 1.35;
  const spacing = clamp(height / 112, 6.2, 9.4);
  const sharedAmplitude = spacing * 1.28;
  const localLimit = spacing * 0.31;
  const mouseX = pointer.x * width;
  const mouseY = pointer.y * height;
  const lineCount = Math.ceil(height / spacing) + 18;

  const cursorGlow = ctx.createRadialGradient(
    mouseX,
    mouseY,
    0,
    mouseX,
    mouseY,
    Math.min(width, height) * 0.42,
  );
  cursorGlow.addColorStop(0, rgba(palette.accent, 0.18));
  cursorGlow.addColorStop(1, rgba(palette.accent, 0));
  ctx.fillStyle = cursorGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = -9; i < lineCount; i += 1) {
    const phase = i * 0.618 + hash(i * 2.71) * tau;
    const chaosA = hash(i * 4.17);
    const chaosB = hash(i * 7.83);
    const chaosC = hash(i * 13.91);
    const baseY = i * spacing - ((scroll * height * 0.16) % spacing);
    const depth = clamp(baseY / height, 0, 1);
    const alpha = 0.13 + depth * 0.23;
    const tone = i % 3 === 0 ? palette.primary : i % 3 === 1 ? palette.accent : palette.ink;
    const lineWidth = 0.42 + depth * 0.56;

    ctx.beginPath();
    for (let x = -40; x <= width + 40; x += 16) {
      const dx = (x - mouseX) / width;
      const cursorForce = Math.exp(-(dx * dx * 16));
      const sharedWave =
        Math.sin(x * 0.014 - flowTime * 2.65 + scroll * 2.4) * sharedAmplitude +
        Math.sin(x * 0.031 + flowTime * 1.92 + scroll * 3.1) * sharedAmplitude * 0.46 +
        Math.sin((x - flowTime * 90) * 0.006 + Math.sin(flowTime * 0.62) * 1.7) *
          sharedAmplitude *
          0.34;
      const cursorWave =
        cursorForce *
        Math.sin(dx * 18 - flowTime * 3.4) *
        sharedAmplitude *
        (0.35 + pointer.y * 0.32);
      const localChaos = clamp(
        Math.sin(x * (0.038 + chaosA * 0.018) + flowTime * (2.2 + chaosB) + phase) *
          localLimit *
          0.58 +
          Math.sin(x * (0.071 + chaosC * 0.022) - flowTime * (1.3 + chaosA) + phase * 1.7) *
            localLimit *
            0.42,
        -localLimit,
        localLimit,
      );
      const y = baseY + sharedWave + cursorWave + localChaos;

      if (x === -40) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = rgba(tone, alpha);
    ctx.shadowBlur = i % 9 === 0 ? 5 + depth * 4 : 0;
    ctx.shadowColor = rgba(tone, 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDots(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  scroll: number,
  pointer: Point,
  palette: Palette,
  reducedMotion: boolean,
) {
  drawBase(ctx, width, height, palette, "radar");
  ctx.fillStyle = "rgba(0, 3, 10, 0.34)";
  ctx.fillRect(0, 0, width, height);

  const activeTime = reducedMotion ? time * 0.18 : time;
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const spacing = clamp(Math.min(width, height) / 14, 34, 62);
  const columns = Math.ceil(width / spacing) + 8;
  const rows = Math.ceil(height / spacing) + 8;
  const driftX = (activeTime * 18) % spacing;
  const driftY = (activeTime * 9) % spacing;
  const pointerX = pointer.x * width;
  const pointerY = pointer.y * height;
  const cameraX = (pointer.x - 0.5) * 0.22;
  const cameraY = (pointer.y - 0.5) * 0.18;
  const horizonGlow = ctx.createRadialGradient(
    pointerX,
    pointerY,
    0,
    pointerX,
    pointerY,
    Math.min(width, height) * 0.58,
  );

  horizonGlow.addColorStop(0, rgba(palette.accent, 0.12));
  horizonGlow.addColorStop(1, rgba(palette.primary, 0));
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowBlur = 0;

  for (let row = -4; row < rows; row += 1) {
    for (let col = -4; col < columns; col += 1) {
      const gridX = (col - columns / 2) * spacing + driftX;
      const gridY = (row - rows / 2) * spacing + driftY + scroll * height * 0.18;
      const wave =
        Math.sin(gridX * 0.012 + activeTime * 1.1) * 54 +
        Math.cos(gridY * 0.015 - activeTime * 0.82) * 38 +
        Math.sin((gridX + gridY) * 0.006 + activeTime * 1.45) * 42;
      const pointerDx = gridX + centerX - pointerX;
      const pointerDy = gridY + centerY - pointerY;
      const pointerDistanceSq = pointerDx * pointerDx + pointerDy * pointerDy;
      const pointerLift = Math.exp(-pointerDistanceSq / (width * width * 0.06)) * 96;
      const z = wave + pointerLift + Math.sin(activeTime * 0.7 + row * 0.4 + col * 0.23) * 22;
      const perspective = 620 / (620 + z);
      const x = centerX + (gridX + cameraX * z * 1.8) * perspective;
      const y = centerY + (gridY + cameraY * z * 1.5) * perspective;

      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) {
        continue;
      }

      const depth = clamp((z + 160) / 320, 0, 1);
      const shimmer = 0.5 + Math.sin(activeTime * 2.2 + row * 0.51 + col * 0.37) * 0.5;
      const radius = (1.1 + depth * 2.6 + shimmer * 0.72) * perspective;
      const color = depth > 0.68 ? palette.accent : row % 3 === 0 ? palette.primary : palette.ink;

      ctx.beginPath();
      ctx.fillStyle = rgba(color, 0.28 + depth * 0.42);
      ctx.arc(x, y, radius, 0, tau);
      ctx.fill();

      if ((row + col) % 11 === 0 && depth > 0.72) {
        ctx.beginPath();
        ctx.fillStyle = rgba(palette.accent, 0.08 + depth * 0.1);
        ctx.arc(x, y, radius * 2.4, 0, tau);
        ctx.fill();
      }
    }
  }

  ctx.restore();

  const vignette = ctx.createRadialGradient(
    centerX,
    centerY * 0.82,
    0,
    centerX,
    centerY,
    width * 0.86,
  );
  vignette.addColorStop(0, "rgba(0, 5, 14, 0)");
  vignette.addColorStop(1, "rgba(0, 3, 10, 0.58)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  palette: Palette,
) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = rgba(palette.ink, 0.35);

  for (let i = 0; i < 180; i += 1) {
    const seed = hash(i * 7.77 + Math.floor(time * 8) * 0.13);
    const x = hash(seed * 91.1 + i) * width;
    const y = hash(seed * 41.3 + i * 3.1) * height;
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.restore();
}

export function ShaderBackdrop({ variant, theme, shape = "torus" }: ShaderBackdropProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const pointerRef = useRef<Point>({ x: 0.58, y: 0.42 });
  const pointerTargetRef = useRef<Point>({ x: 0.58, y: 0.42 });
  const scrollRef = useRef(0);
  const scrollTargetRef = useRef(0);
  const asciiBuffersRef = useRef<AsciiBuffers | null>(null);
  const variantRef = useRef(variant);
  const themeRef = useRef(theme);
  const shapeRef = useRef(shape);
  const reducedMotionRef = useRef(false);
  const lowPowerTimerRef = useRef<number | null>(null);
  const redrawLowPowerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    variantRef.current = variant;
    themeRef.current = theme;
    shapeRef.current = shape;
    if (reducedMotionRef.current) {
      redrawLowPowerRef.current?.();
    }
  }, [theme, variant, shape]);

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    const setFallback = (next: boolean) => {
      if (shell) {
        if (next) {
          shell.setAttribute("data-fallback", "true");
        } else {
          shell.removeAttribute("data-fallback");
        }
      }
    };

    if (!shell || !canvas) {
      setFallback(true);
      return undefined;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      setFallback(true);
      return undefined;
    }

    setFallback(false);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationClock = 0;
    let previousFrameTime = performance.now();

    const updateReducedMotion = () => {
      reducedMotionRef.current = motionQuery.matches;
    };

    const syncCssParallax = () => {
      const scroll = scrollRef.current;
      const x = pointerRef.current.x;
      const y = pointerRef.current.y;

      shell.style.setProperty("--pointer-x", `${x}`);
      shell.style.setProperty("--pointer-y", `${y}`);
      shell.style.setProperty("--canvas-x", "0px");
      shell.style.setProperty("--canvas-y", `${scroll * -28}px`);
      shell.style.setProperty("--layer-near-x", "0px");
      shell.style.setProperty("--layer-near-y", `${scroll * 74}px`);
      shell.style.setProperty("--layer-mid-x", "0px");
      shell.style.setProperty("--layer-mid-y", `${scroll * -42}px`);
      shell.style.setProperty("--layer-far-x", "0px");
      shell.style.setProperty("--layer-far-y", `${scroll * 26}px`);
    };

    const drawFrame = (now: number) => {
      const { width, height, dpr } = dimensionsRef.current;
      const target = pointerTargetRef.current;
      const pointer = pointerRef.current;
      const isReducedMotion = reducedMotionRef.current;
      const activeVariant = variantRef.current;
      const isSignal = activeVariant === "signal";
      const renderReducedMotion = isReducedMotion && !isSignal;
      const easing = renderReducedMotion ? 1 : 0.09;
      const elapsed = Math.max(0, now - previousFrameTime);

      previousFrameTime = now;
      const lowPowerFrameMs = lowPowerFrameMsByVariant[activeVariant];
      animationClock +=
        Math.min(elapsed, renderReducedMotion ? lowPowerFrameMs : 48) *
        (renderReducedMotion ? 0.00022 : 0.001);

      pointer.x += (target.x - pointer.x) * easing;
      pointer.y += (target.y - pointer.y) * easing;
      scrollRef.current +=
        (scrollTargetRef.current - scrollRef.current) * (renderReducedMotion ? 1 : 0.08);
      syncCssParallax();

      if (width > 0 && height > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const activeTheme = themeRef.current;
        const palette = palettes[activeTheme];
        const time = animationClock;
        const scroll = scrollRef.current;

        if (activeVariant === "signal") {
          const asciiBuffers = ensureAsciiBuffers(asciiBuffersRef.current, width, height);
          asciiBuffersRef.current = asciiBuffers;
          drawAsciiShape(
            ctx,
            width,
            height,
            time,
            scroll,
            pointer,
            palette,
            renderReducedMotion,
            asciiBuffers,
            shapeRef.current,
          );
        } else if (activeVariant === "topography") {
          drawWaveLines(ctx, width, height, time, scroll, pointer, palette, renderReducedMotion);
        } else {
          drawDots(ctx, width, height, time, scroll, pointer, palette, renderReducedMotion);
        }

        drawGrain(ctx, width, height, time, palette);
      }
    };

    const stopFrame = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const stopLowPowerTimer = () => {
      if (lowPowerTimerRef.current !== null) {
        window.clearTimeout(lowPowerTimerRef.current);
        lowPowerTimerRef.current = null;
      }
    };

    const stopRendering = () => {
      stopFrame();
      stopLowPowerTimer();
    };

    const shouldRenderEveryFrame = () =>
      !document.hidden && (!reducedMotionRef.current || variantRef.current === "signal");

    const drawImmediateFrame = () => {
      stopFrame();
      drawFrame(performance.now());
    };

    const runLowPowerFrame = (now: number) => {
      frameRef.current = null;
      drawFrame(now);
      startLowPowerAnimation();
    };

    const draw = (now: number) => {
      frameRef.current = null;
      drawFrame(now);

      if (!shouldRenderEveryFrame()) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(draw);
    };

    const startAnimation = () => {
      if (shouldRenderEveryFrame() && frameRef.current === null) {
        stopLowPowerTimer();
        frameRef.current = window.requestAnimationFrame(draw);
      }
    };

    function startLowPowerAnimation() {
      const lowPowerFrameMs = lowPowerFrameMsByVariant[variantRef.current];

      if (
        !reducedMotionRef.current ||
        document.hidden ||
        variantRef.current === "signal" ||
        frameRef.current !== null ||
        lowPowerTimerRef.current !== null
      ) {
        if (variantRef.current === "signal") {
          startAnimation();
        }

        return;
      }

      lowPowerTimerRef.current = window.setTimeout(() => {
        lowPowerTimerRef.current = null;

        if (!reducedMotionRef.current || document.hidden || frameRef.current !== null) {
          return;
        }

        frameRef.current = window.requestAnimationFrame(runLowPowerFrame);
      }, lowPowerFrameMs);
    }

    const redrawLowPower = () => {
      if (!reducedMotionRef.current) {
        return;
      }

      drawImmediateFrame();
      startLowPowerAnimation();
    };

    redrawLowPowerRef.current = redrawLowPower;

    const resize = () => {
      const dpr =
        reducedMotionRef.current && variantRef.current !== "signal"
          ? 1
          : Math.min(window.devicePixelRatio || 1, 1.75);
      const width = window.innerWidth;
      const height = window.innerHeight;
      dimensionsRef.current = { width, height, dpr };
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redrawLowPower();
    };

    const updateScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollTargetRef.current = clamp(window.scrollY / maxScroll, 0, 1);
      redrawLowPower();
    };

    const updatePointer = (event: PointerEvent) => {
      if (reducedMotionRef.current && variantRef.current !== "signal") {
        return;
      }

      pointerTargetRef.current = {
        x: clamp(event.clientX / Math.max(window.innerWidth, 1), 0, 1),
        y: clamp(event.clientY / Math.max(window.innerHeight, 1), 0, 1),
      };
    };

    const handleMotionChange = () => {
      updateReducedMotion();
      stopRendering();
      resize();

      if (reducedMotionRef.current) {
        redrawLowPower();
      } else {
        drawFrame(performance.now());
        startAnimation();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRendering();
        return;
      }

      drawFrame(performance.now());

      if (reducedMotionRef.current) {
        startLowPowerAnimation();
      } else {
        startAnimation();
      }
    };

    updateReducedMotion();
    resize();
    updateScroll();
    syncCssParallax();

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionQuery.addEventListener("change", handleMotionChange);
    drawFrame(performance.now());
    if (reducedMotionRef.current) {
      startLowPowerAnimation();
    } else {
      startAnimation();
    }

    return () => {
      redrawLowPowerRef.current = null;
      stopRendering();
      setFallback(false);

      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pointermove", updatePointer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="shader-shell"
      aria-hidden="true"
      data-variant={variant}
      data-theme={theme}
      data-shape={shape}
    >
      <div className="shader-static" aria-hidden="true" />
      <canvas ref={canvasRef} className="shader-canvas" />
    </div>
  );
}
