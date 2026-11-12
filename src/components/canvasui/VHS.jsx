"use client";;
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const canvasDimensionLimits = new WeakMap();

/** Keep the existing DPR budget, then account for browser pinch zoom. */
function getCanvasPixelRatio(element, context) {
  const scale = window.visualViewport?.scale || 1;
  const requested = Math.min(window.devicePixelRatio || 1, 2) * scale;
  const width = Math.max(element.clientWidth, 1);
  const height = Math.max(element.clientHeight, 1);
  let maxDimension = 8192;
  if (context) {
    let limit = canvasDimensionLimits.get(context);
    if (limit === undefined) {
      limit = Math.min(
        maxDimension,
        context.getParameter(context.MAX_TEXTURE_SIZE),
        context.getParameter(context.MAX_RENDERBUFFER_SIZE),
      );
      canvasDimensionLimits.set(context, limit);
    }
    maxDimension = limit;
  }
  // Rendering the full element preserves its CSS position and native input
  // geometry while panning. Bound allocations when zooming large canvases.
  return Math.min(
    requested,
    maxDimension / Math.max(width, height),
    Math.sqrt(16_777_216 / (width * height)),
  );
}

/** Pinch zoom changes visualViewport without resizing the element's CSS box. */
function createCanvasResizeObserver(onResize) {
  const viewport = window.visualViewport;
  let frame = 0;
  let disconnected = false;
  const schedule = () => {
    if (frame || disconnected) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onResize();
    });
  };
  const observer = new ResizeObserver(schedule);
  window.addEventListener("resize", schedule, { passive: true });
  viewport?.addEventListener("resize", schedule, { passive: true });
  return {
    observe(element, options) {
      observer.observe(element, options);
    },
    unobserve(element) {
      observer.unobserve(element);
    },
    disconnect() {
      disconnected = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
    },
  };
}

/**
 * Android can expose the API, but renderer crashes were reported on effect
 * pages (issue #50). A process crash cannot be caught in JavaScript. Keep
 * Android on the DOM/overlay fallback until native capture is validated there.
 * Neither Chrome's flag nor its default-on support (Chrome 157+) may bypass it.
 */
function isHtmlInCanvasBlocked() {
  if (typeof navigator === "undefined") return false;
  const platform = (navigator).userAgentData?.platform;
  return platform === "Android" || /Android/i.test(navigator.userAgent);
}

/** Configure the capture subtree for both generations of the experimental API. */
function prepareHtmlInCanvas(source, content) {
  if ("content" in source) {
    source.setAttribute("content", "drawable");
    content.setAttribute("drawable", "");
  } else {
    source.setAttribute("layoutsubtree", "");
  }
}

/** Capture pixels and keep the native DOM hit-test region aligned with them. */
function drawHtmlInCanvas(
  source,
  context,
  content,
) {
  const transform = (context).drawElementImage(content, 0, 0);
  const canvas = source;
  // Chrome 154 decoupled geometry from drawing before enabling automatic 2D
  // synchronization. Older versions have no update method; newer versions
  // synchronize automatically and return void. Use the returned matrix as-is:
  // drawElementImage already accounts for the canvas's pixel density.
  if (transform && typeof canvas.updateElementGeometry === "function") {
    canvas.updateElementGeometry(content, { canvasTransform: transform });
  }
}

const DEFAULTS = {
  speed: 0.5,
  wave: 1,
  jitter: 0.25,
  crease: 0.1,
  switching: 0.05,
  switchingHeight: 0.02,
  bloom: 0.4,
  aberration: 2,
  acBeat: 1,
  grain: 0.1,
  scanlines: 0.1,
  vignette: 0,
  barrel: 0,
  saturation: 1,
  exposure: 1,
};

const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform vec2 uResolution;
uniform float uTime;
uniform float uWave;
uniform float uJitter;
uniform float uCrease;
uniform float uSwitching;
uniform float uSwitchHeight;
uniform float uBloom;
uniform float uAberration;
uniform float uAcBeat;
uniform float uGrain;
uniform float uScanlines;
uniform float uVignette;
uniform float uSaturation;
uniform float uExposure;
uniform float uFilm;
uniform float uBarrel;
uniform vec3 uBezel;
uniform float uCreaseNoise;
uniform float uMaxX;

#define PI 3.14159265

float hash (vec2 v) {
  return fract(sin(dot(v, vec2(89.44, 19.36))) * 22189.22);
}

float iHash (vec2 v, vec2 r) {
  float h00 = hash(floor(v * r + vec2(0.0, 0.0)) / r);
  float h10 = hash(floor(v * r + vec2(1.0, 0.0)) / r);
  float h01 = hash(floor(v * r + vec2(0.0, 1.0)) / r);
  float h11 = hash(floor(v * r + vec2(1.0, 1.0)) / r);
  vec2 ip = smoothstep(vec2(0.0), vec2(1.0), mod(v * r, 1.0));
  return (h00 * (1.0 - ip.x) + h10 * ip.x) * (1.0 - ip.y)
    + (h01 * (1.0 - ip.x) + h11 * ip.x) * ip.y;
}

float noise (vec2 v) {
  float sum = 0.0;
  float s = 2.0;
  for (int i = 1; i < 7; i++) {
    sum += iHash(v + vec2(i), vec2(2.0 * s)) / s;
    s *= 2.0;
  }
  return sum;
}

vec4 tape (vec2 p) {
  p.x = clamp(p.x, 0.0005, uMaxX - 0.0005);
  p.y = clamp(p.y, 0.0005, 0.9995);
  return texture(uContent, vec2(p.x, 1.0 - p.y));
}

void main () {
  vec2 uv = vUv;
  if (uv.x > uMaxX) {
    outColor = vec4(0.0);
    return;
  }

  float edgeMask = 1.0;
  if (uBarrel > 0.0) {
    vec2 c = vec2(uv.x / uMaxX, uv.y) * 2.0 - 1.0;
    c *= 1.0 + uBarrel * 0.15 * dot(c, c);
    float m = max(abs(c.x), abs(c.y));
    edgeMask = 1.0 - smoothstep(1.0 - 0.12 * uBarrel, 1.0, m);
    if (edgeMask <= 0.0) {
      outColor = vec4(uBezel, 1.0);
      return;
    }
    uv = vec2((c.x * 0.5 + 0.5) * uMaxX, c.y * 0.5 + 0.5);
  }

  vec2 uvn = uv;
  float t = uTime;

  float lineNoise = 0.0;
  if (uJitter + uCrease + uSwitching > 0.0) {
    lineNoise = noise(vec2(uvn.y * 100.0, t * 10.0));
  }

  if (uWave > 0.0) {
    uvn.x += (noise(vec2(uvn.y, t)) - 0.5) * 0.005 * uWave;
  }
  uvn.x += (lineNoise - 0.5) * 0.01 * uJitter;

  float tcPhase = clamp(
    (sin(uvn.y * 8.0 - t * PI * 1.2) - 0.92) * uCreaseNoise,
    0.0, 0.01
  ) * 10.0 * uCrease;
  float tcNoise = max(lineNoise - 0.5, 0.0);
  uvn.x -= tcNoise * tcPhase;

  float snPhase = smoothstep(max(uSwitchHeight, 1e-4), 0.0, uvn.y) * uSwitching;
  uvn.y += snPhase * 0.3;
  uvn.x += snPhase * ((lineNoise - 0.5) * 0.2);

  vec4 base = tape(uvn);
  vec3 col = base.rgb;
  col *= 1.0 - tcPhase;

  col = mix(col, col.yzx, clamp(snPhase, 0.0, 1.0));

  if (uBloom > 0.0) {
    float px = uAberration / max(uResolution.x, 1.0);
    vec3 bloomSum = vec3(0.0);
    for (int i = -8; i <= 2; i++) {
      vec3 s = tape(uvn + vec2(float(i) * px, 0.0)).rgb;
      if (i >= -4) bloomSum.r += s.r;
      if (i >= -6 && i <= 0) bloomSum.g += s.g;
      if (i <= -2) bloomSum.b += s.b;
    }
    bloomSum *= 0.1;

    col = mix(col, (col + bloomSum) / 1.7, clamp(uBloom, 0.0, 1.0));
  }

  if (uAcBeat > 0.0) {
    col *= 1.0 + clamp(
      noise(vec2(0.0, uv.y + t * 0.2)) * 0.6 - 0.25, 0.0, 0.1
    ) * uAcBeat;
  }

  float g = hash(uv * uResolution + fract(t) * vec2(127.1, 311.7)) - 0.5;
  col += g * uGrain;

  float scan = sin(uv.y * uResolution.y * PI) * 0.5;
  col *= 1.0 - uScanlines * 0.35 * scan;

  vec2 vd = (uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  col *= 1.0 - uVignette * smoothstep(0.4, 1.1, length(vd));

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, clamp(uSaturation, 0.0, 2.0));

  col *= uExposure;

  float alpha = max(base.a, clamp(snPhase + tcPhase, 0.0, 1.0));

  if (uFilm > 0.5 && base.a < 0.01) {
    float scanMask = 0.5 + 0.5 * sin(uv.y * uResolution.y * PI);
    float n = hash(uv * uResolution + fract(t) * vec2(127.1, 311.7));
    float waveBand = noise(vec2(uv.y * 3.0, t * 0.35));
    vec3 film = vec3(0.9);
    film -= vec3(uScanlines * 0.55 * scanMask);
    film += vec3((n - 0.5) * uGrain * 1.6);
    film += vec3((waveBand - 0.5) * 0.16 * uWave);
    film.r += 0.035 * min(uAberration, 4.0) * scanMask;
    film.b -= 0.028 * min(uAberration, 4.0) * scanMask;
    film = mix(film, film.yzx, clamp(snPhase, 0.0, 1.0));
    float a = clamp(
      0.18 + uScanlines * 0.5 * scanMask + uGrain * 0.34 + snPhase * 0.6 + tcPhase * 0.45,
      0.0,
      0.82
    );
    outColor = vec4(clamp(film, 0.0, 1.0), a);
    return;
  }

  if (uBarrel > 0.0) {
    col = mix(uBezel, col, edgeMask);
    alpha = 1.0;
  }
  outColor = vec4(col, alpha);
}`;

export function supportsHtmlInCanvas() {
  if (typeof document === "undefined" || isHtmlInCanvasBlocked()) return false;
  const probe = document.createElement("canvas");
  const ctx = probe.getContext("2d");
  return Boolean(
    ctx &&
    typeof ctx.drawElementImage === "function" &&
    typeof probe.requestPaint === "function",
  );
}

export function createVHS(elements, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const { source, content, output } = elements;

  const gl = output.getContext("webgl2", {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
  });
  if (!gl || gl.isContextLost()) return null;

  const sourceCtx = source.getContext("2d");
  const paintable = source;
  const htmlInCanvas = Boolean(
    !isHtmlInCanvasBlocked() &&
    source.contains(content) &&
    sourceCtx &&
    typeof sourceCtx.drawElementImage === "function" &&
    typeof paintable.requestPaint === "function",
  );

  if (htmlInCanvas) prepareHtmlInCanvas(source, content);

  let contentDirty = false;
  let wake = () => {};

  if (htmlInCanvas) {
    paintable.onpaint = () => {
      try {
        sourceCtx.reset();
        drawHtmlInCanvas(source, sourceCtx, content);
        contentDirty = true;
        wake();
      } catch {}
    };
  }

  function compile(type, text) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, text);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("VHS shader error:", gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, VERT);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const contentTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, contentTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );

  let contentMaxX = 1;

  let bezel = [0, 0, 0];
  const bezelProbe = document.createElement("canvas");
  bezelProbe.width = bezelProbe.height = 1;
  const bezelCtx = bezelProbe.getContext("2d", { willReadFrequently: true });

  function syncBezelColor() {
    if (!bezelCtx) return;
    let el = content;
    while (el) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "transparent") {
        bezelCtx.clearRect(0, 0, 1, 1);
        bezelCtx.fillStyle = bg;
        bezelCtx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = bezelCtx.getImageData(0, 0, 1, 1).data;
        if (a > 0) {
          bezel = [r / 255, g / 255, b / 255];
          return;
        }
      }
      el = el.parentElement;
    }
    bezel = [0, 0, 0];
  }

  function syncCanvasSize() {
    const dpr = getCanvasPixelRatio(output, gl);
    const width = Math.max(1, Math.round(output.clientWidth * dpr));
    const height = Math.max(1, Math.round(output.clientHeight * dpr));
    if (output.width !== width || output.height !== height) {
      output.width = width;
      output.height = height;
    }
    contentMaxX = Math.min(
      1,
      Math.max(0.05, content.clientWidth / Math.max(output.clientWidth, 1)),
    );
    if (htmlInCanvas) {
      const sourceWidth = Math.max(1, Math.round(source.clientWidth * dpr));
      const sourceHeight = Math.max(1, Math.round(source.clientHeight * dpr));
      if (source.width !== sourceWidth || source.height !== sourceHeight) {
        source.width = sourceWidth;
        source.height = sourceHeight;
      }
      paintable.requestPaint();
    }
  }

  syncCanvasSize();
  syncBezelColor();

  function uploadContent() {
    if (!htmlInCanvas || !contentDirty) return;
    contentDirty = false;
    syncBezelColor();
    gl.bindTexture(gl.TEXTURE_2D, contentTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      source,
    );
  }

  let time = 0;

  const fract = (x) => x - Math.floor(x);
  const hash2 = (x, y) =>
    fract(Math.sin(x * 89.44 + y * 19.36) * 22189.22);
  const smooth01 = (x) => x * x * (3 - 2 * x);
  function iHashCpu(vx, vy, r) {
    const fx = Math.floor(vx * r);
    const fy = Math.floor(vy * r);
    const h00 = hash2(fx / r, fy / r);
    const h10 = hash2((fx + 1) / r, fy / r);
    const h01 = hash2(fx / r, (fy + 1) / r);
    const h11 = hash2((fx + 1) / r, (fy + 1) / r);
    const ix = smooth01(fract(vx * r));
    const iy = smooth01(fract(vy * r));
    return (
      (h00 * (1 - ix) + h10 * ix) * (1 - iy) + (h01 * (1 - ix) + h11 * ix) * iy
    );
  }
  function noiseCpu(vx, vy) {
    let sum = 0;
    let s = 2;
    for (let i = 1; i < 7; i++) {
      sum += iHashCpu(vx + i, vy + i, 2 * s) / s;
      s *= 2;
    }
    return sum;
  }

  function render() {
    uploadContent();
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, contentTexture);
    gl.uniform1i(uniforms.uContent, 0);
    gl.uniform2f(uniforms.uResolution, output.width, output.height);
    gl.uniform1f(uniforms.uTime, time);
    gl.uniform1f(uniforms.uWave, Math.max(config.wave, 0));
    gl.uniform1f(uniforms.uJitter, Math.max(config.jitter, 0));
    gl.uniform1f(uniforms.uCrease, Math.max(config.crease, 0));
    gl.uniform1f(uniforms.uSwitching, Math.max(config.switching, 0));
    gl.uniform1f(uniforms.uSwitchHeight, Math.max(config.switchingHeight, 0));
    gl.uniform1f(uniforms.uBloom, config.bloom);
    const dpr = output.width / Math.max(output.clientWidth, 1);
    gl.uniform1f(uniforms.uAberration, Math.max(config.aberration, 0) * dpr);
    gl.uniform1f(uniforms.uAcBeat, Math.max(config.acBeat, 0));
    gl.uniform1f(uniforms.uGrain, Math.max(config.grain, 0));
    gl.uniform1f(uniforms.uScanlines, Math.max(config.scanlines, 0));
    gl.uniform1f(uniforms.uVignette, Math.max(config.vignette, 0));
    gl.uniform1f(
      uniforms.uBarrel,
      htmlInCanvas ? Math.max(config.barrel, 0) : 0,
    );
    gl.uniform3f(uniforms.uBezel, bezel[0], bezel[1], bezel[2]);
    gl.uniform1f(uniforms.uCreaseNoise, noiseCpu(time, time));
    gl.uniform1f(uniforms.uSaturation, config.saturation);
    gl.uniform1f(uniforms.uExposure, Math.max(config.exposure, 0));
    gl.uniform1f(uniforms.uFilm, htmlInCanvas ? 0 : 1);
    gl.uniform1f(uniforms.uMaxX, contentMaxX);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, output.width, output.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  let raf = 0;
  let lastTime = performance.now();
  let destroyed = false;
  let running = false;
  let visible = true;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  function frame(now) {
    if (destroyed) return;
    if (!visible) {
      running = false;
      return;
    }
    const delta = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;
    if (!reducedMotion) time += delta * config.speed;
    render();
    if (reducedMotion && !contentDirty) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || running || !visible) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(frame);
  }

  wake = start;
  start();

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    start();
  }
  motionQuery.addEventListener("change", onMotionChange);

  const observer = createCanvasResizeObserver(() => {
    syncCanvasSize();
    start();
  });
  observer.observe(output);
  observer.observe(content);

  const intersection = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
    if (visible) start();
  });
  intersection.observe(output);

  return {
    setOptions(next) {
      if (
        !Object.entries(next).some(
          ([key, value]) => config[key] !== value,
        )
      )
        return;
      Object.assign(config, next);
      start();
    },
    resize() {
      syncCanvasSize();
      start();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      gl.deleteTexture(contentTexture);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(quad);
      if (htmlInCanvas) paintable.onpaint = null;
    },
  };
}

const emptySubscribe = () => () => {};

export function VHS({
  children,
  className,
  style,
  ...options
}) {
  const sourceRef = useRef(null);
  const contentRef = useRef(null);
  const outputRef = useRef(null);
  const instanceRef = useRef(null);
  const [initialOptions] = useState(options);
  const [failed, setFailed] = useState(false);

  const supported = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );
  const native = supported && !failed;

  useEffect(() => {
    const source = sourceRef.current;
    const content = contentRef.current;
    const output = outputRef.current;
    if (!source || !content || !output) return;
    instanceRef.current = createVHS(
      { source, content, output },
      initialOptions,
    );
    if (native && !instanceRef.current) setFailed(true);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [initialOptions, native]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <canvas
        ref={sourceRef}
        // @ts-expect-error experimental html-in-canvas attribute
        layoutsubtree="true"
        suppressHydrationWarning
        style={
          native
            ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
            : { display: "none" }
        }
      >
        {native ? (
          <div
            ref={contentRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
            }}
          >
            {children}
          </div>
        ) : null}
      </canvas>
      {!native ? (
        <div
          ref={contentRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      ) : null}
      <canvas
        ref={outputRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          mixBlendMode: native ? "normal" : "multiply",
        }}
      />
    </div>
  );
}


export default VHS;
