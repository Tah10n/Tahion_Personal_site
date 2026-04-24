import { useCallback, useEffect, useRef, useState } from "react";

export type BackdropVariant = "signal" | "topography" | "radar";
export type BackdropTheme = "acid" | "plasma" | "ice";

const variantIndex: Record<BackdropVariant, number> = {
  signal: 0,
  topography: 1,
  radar: 2,
};

const themeIndex: Record<BackdropTheme, number> = {
  acid: 0,
  plasma: 1,
  ice: 2,
};

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_scroll;
uniform float u_variant;
uniform float u_theme;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float grid(vec2 uv, float scale, float width) {
  vec2 g = abs(fract(uv * scale) - 0.5);
  float line = min(g.x, g.y);
  return smoothstep(width, 0.0, line);
}

vec3 palette(float theme, float slot) {
  if (theme < 0.5) {
    if (slot < 0.5) return vec3(0.0, 0.95, 0.92);
    if (slot < 1.5) return vec3(0.72, 1.0, 0.06);
    if (slot < 2.5) return vec3(1.0, 0.62, 0.08);
    return vec3(1.0, 0.12, 0.45);
  }

  if (theme < 1.5) {
    if (slot < 0.5) return vec3(1.0, 0.2, 0.76);
    if (slot < 1.5) return vec3(0.48, 0.24, 1.0);
    if (slot < 2.5) return vec3(1.0, 0.37, 0.16);
    return vec3(1.0, 0.8, 0.18);
  }

  if (slot < 0.5) return vec3(0.34, 0.82, 1.0);
  if (slot < 1.5) return vec3(0.86, 1.0, 0.98);
  if (slot < 2.5) return vec3(0.16, 0.46, 1.0);
  return vec3(0.74, 1.0, 0.58);
}

vec3 themeBase(float theme) {
  if (theme < 0.5) return vec3(0.0, 0.045, 0.034);
  if (theme < 1.5) return vec3(0.052, 0.008, 0.058);
  return vec3(0.004, 0.026, 0.052);
}

float signalNode(vec2 p, vec2 pos, float size) {
  return smoothstep(size, 0.0, distance(p, pos));
}

float signalLine(vec2 p, vec2 a, vec2 b, float width) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return smoothstep(width, 0.0, length(pa - ba * h));
}

float brokenArc(vec2 p, float radius, float width, float slices) {
  float angle = atan(p.y, p.x);
  float mask = smoothstep(0.42, 0.88, fract(angle * slices + length(p) * 2.2));
  return smoothstep(width, 0.0, abs(length(p) - radius)) * mask;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  vec2 pointer = u_pointer * 2.0 - 1.0;
  pointer.x *= u_resolution.x / u_resolution.y;
  vec2 parallaxNear = pointer * 0.28 + vec2(0.0, u_scroll * 0.32);
  vec2 parallaxMid = pointer * 0.13 + vec2(0.0, u_scroll * 0.15);
  vec2 parallaxFar = pointer * 0.045 + vec2(0.0, u_scroll * 0.06);
  float pointerGlow = 0.18 / max(distance(p, pointer), 0.05);

  vec3 base = themeBase(u_theme);
  vec3 primary = palette(u_theme, 0.0);
  vec3 accent = palette(u_theme, 1.0);
  vec3 warm = palette(u_theme, 2.0);
  vec3 extra = palette(u_theme, 3.0);

  float depthWash = smoothstep(1.7, 0.1, length(p + parallaxFar * 1.4));
  vec3 color = base + primary * depthWash * 0.055 + accent * (1.0 - uv.y) * 0.035;

  if (u_variant < 0.5) {
    vec2 field = p + parallaxMid + vec2(u_time * 0.018, -u_time * 0.012);
    float deepGrid = grid(field + parallaxFar, 7.0, 0.014) * 0.24;
    float fineGrid = grid(field + parallaxNear, 21.0, 0.006) * 0.12;
    float cloud = noise(field * 2.0) * 0.32 + noise(field * 5.2 + 8.0) * 0.16;

    vec2 n1 = vec2(-0.18, 0.04) + parallaxNear;
    vec2 n2 = vec2(0.42, 0.34) + parallaxMid;
    vec2 n3 = vec2(0.72, -0.18) + parallaxNear * 0.7;
    vec2 n4 = vec2(-0.58, -0.36) + parallaxMid * 1.2;
    vec2 n5 = vec2(0.08, -0.58) + parallaxNear * 0.9;

    float nodes = signalNode(p, n1, 0.045) + signalNode(p, n2, 0.035) + signalNode(p, n3, 0.032) + signalNode(p, n4, 0.038) + signalNode(p, n5, 0.034);
    float lines = signalLine(p, n1, n2, 0.006) + signalLine(p, n2, n3, 0.005) + signalLine(p, n4, n5, 0.005) + signalLine(p, n5, n1, 0.004);
    float pulses = smoothstep(0.96, 1.0, sin((distance(p, n1) * 14.0 - u_time * 2.0))) * 0.32;

    color += primary * (cloud + deepGrid + fineGrid);
    color += accent * (nodes * 1.15 + pointerGlow * 0.13);
    color += warm * (lines * 0.66 + pulses);
    color += extra * fineGrid * 0.2;
  } else if (u_variant < 1.5) {
    vec2 terrain = p + parallaxMid;
    float height = noise(terrain * 2.2 + u_time * 0.04) + noise(terrain * 5.4 - u_time * 0.03) * 0.48;
    float contour = smoothstep(0.05, 0.0, abs(fract(height * 9.5 + u_scroll * 1.9) - 0.5));
    float ridge = smoothstep(0.72, 1.0, sin((terrain.x * 5.6 + terrain.y * 2.4) + height * 4.8));
    float cross = grid(terrain + parallaxNear * 0.65, 12.0, 0.01) * 0.16;
    float light = smoothstep(0.7, 0.0, distance(p, pointer * 0.38 + vec2(0.24, -0.08)));

    color += primary * (height * 0.42 + cross);
    color += accent * contour * 0.58;
    color += warm * ridge * 0.22;
    color += extra * light * 0.2;
  } else {
    vec2 center = p - vec2(0.28, -0.02) - parallaxMid * 0.78;
    float angle = atan(center.y, center.x);
    float sweepAngle = u_time * 0.78 + pointer.x * 0.9;
    float sweep = smoothstep(0.25, 0.0, abs(atan(sin(angle - sweepAngle), cos(angle - sweepAngle)))) * smoothstep(1.12, 0.05, length(center));
    float arcs = brokenArc(center, 0.24, 0.014, 4.5) + brokenArc(center, 0.46, 0.012, 5.7) + brokenArc(center, 0.68, 0.009, 7.2);
    float spokes = smoothstep(0.014, 0.0, abs(sin(angle * 6.0))) * smoothstep(0.98, 0.16, length(center)) * 0.28;
    float blipA = signalNode(p, vec2(0.52, 0.2) + parallaxNear, 0.035);
    float blipB = signalNode(p, vec2(-0.36, -0.34) + parallaxMid, 0.026);
    float blipC = signalNode(p, vec2(0.0, 0.52) + parallaxNear * 0.7, 0.022);
    float scan = smoothstep(0.94, 1.0, sin((uv.y + u_time * 0.08) * 70.0));

    color += primary * (arcs * 0.62 + spokes);
    color += accent * (sweep * 0.58 + pointerGlow * 0.1);
    color += warm * (blipA + blipB + blipC) * 0.92;
    color += extra * scan * 0.12;
  }

  float vignette = smoothstep(1.34, 0.08, length(p));
  color *= vignette + 0.38;
  color += vec3(0.018) * hash(gl_FragCoord.xy + u_time);

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

type ShaderBackdropProps = {
  variant: BackdropVariant;
  theme: BackdropTheme;
};

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function ShaderBackdrop({ variant, theme }: ShaderBackdropProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerTargetRef = useRef({ x: 0.62, y: 0.42 });
  const pointerRef = useRef({ x: 0.62, y: 0.42 });
  const variantRef = useRef(variantIndex[variant]);
  const themeRef = useRef(themeIndex[theme]);
  const scrollTargetRef = useRef(0);
  const scrollRef = useRef(0);
  const redrawRef = useRef<(() => void) | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const syncCssParallax = useCallback(() => {
    const shell = shellRef.current;

    if (!shell) {
      return;
    }

    const pointer = pointerTargetRef.current;
    const x = pointer.x - 0.5;
    const y = pointer.y - 0.5;
    const scroll = scrollTargetRef.current;

    shell.style.setProperty("--canvas-x", `${x * -18}px`);
    shell.style.setProperty("--canvas-y", `${y * -12 + scroll * -14}px`);
    shell.style.setProperty("--layer-near-x", `${x * -44}px`);
    shell.style.setProperty("--layer-near-y", `${y * -32 + scroll * 28}px`);
    shell.style.setProperty("--layer-mid-x", `${x * 26}px`);
    shell.style.setProperty("--layer-mid-y", `${y * 18 + scroll * -18}px`);
    shell.style.setProperty("--layer-far-x", `${x * 14}px`);
    shell.style.setProperty("--layer-far-y", `${y * 10 + scroll * 36}px`);
  }, []);

  useEffect(() => {
    variantRef.current = variantIndex[variant];
    themeRef.current = themeIndex[theme];
    redrawRef.current?.();
  }, [theme, variant]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      setIsFallback(true);
      return;
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      setIsFallback(true);
      return;
    }

    const program = gl.createProgram();

    if (!program) {
      setIsFallback(true);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setIsFallback(true);
      return;
    }

    const buffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const pointerLocation = gl.getUniformLocation(program, "u_pointer");
    const scrollLocation = gl.getUniformLocation(program, "u_scroll");
    const variantLocation = gl.getUniformLocation(program, "u_variant");
    const themeLocation = gl.getUniformLocation(program, "u_theme");

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    let frame = 0;
    const start = performance.now();

    const resize = () => {
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(1, Math.floor(canvas.clientWidth * devicePixelRatio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * devicePixelRatio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
    };

    const draw = (now: number) => {
      const easing = reducedMotion ? 1 : 0.085;
      pointerRef.current.x += (pointerTargetRef.current.x - pointerRef.current.x) * easing;
      pointerRef.current.y += (pointerTargetRef.current.y - pointerRef.current.y) * easing;
      scrollRef.current += (scrollTargetRef.current - scrollRef.current) * easing;

      resize();
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, reducedMotion ? 0.0 : (now - start) / 1000);
      gl.uniform2f(pointerLocation, pointerRef.current.x, 1 - pointerRef.current.y);
      gl.uniform1f(scrollLocation, scrollRef.current);
      gl.uniform1f(variantLocation, variantRef.current);
      gl.uniform1f(themeLocation, themeRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const render = (now: number) => {
      draw(now);
      if (!reducedMotion) {
        frame = window.requestAnimationFrame(render);
      }
    };

    redrawRef.current = () => {
      draw(performance.now());
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerTargetRef.current = {
        x: clampUnit((event.clientX - rect.left) / rect.width),
        y: clampUnit((event.clientY - rect.top) / rect.height),
      };
      syncCssParallax();

      if (reducedMotion) {
        redrawRef.current?.();
      }
    };

    const handleScroll = () => {
      const heroHeight = canvas.parentElement?.clientHeight || window.innerHeight;
      scrollTargetRef.current = Math.min(window.scrollY / Math.max(heroHeight, 1), 1);
      syncCssParallax();

      if (reducedMotion) {
        redrawRef.current?.();
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    syncCssParallax();
    render(start);

    return () => {
      redrawRef.current = null;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [syncCssParallax]);

  return (
    <div
      ref={shellRef}
      className="shader-shell"
      aria-hidden="true"
      data-fallback={isFallback}
      data-variant={variant}
      data-theme={theme}
    >
      <canvas ref={canvasRef} className="shader-canvas" />
      <div className="shader-static" />
      <div className="signal-orbits">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="shader-grid" />
    </div>
  );
}
