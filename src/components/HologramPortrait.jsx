import { useEffect, useRef, useState } from 'react';
import { createSurpriseScheduler } from './surpriseScheduler';
import surprisePose from '../assets/images/cyber-surprise-pose.png';

const VERTEX = `
precision mediump float;
attribute vec3 position;
attribute float luminance;
attribute float alpha;
uniform vec2 viewport;
uniform vec2 rotation;
uniform float time;
uniform float signal;
uniform float pixelRatio;
varying float light;
varying float height;
varying float opacity;
void main() {
  vec3 p = position;
  p.z += signal * sin(p.x * 19.0 + p.y * 12.0 + time * .6) * .065;
  float cy = cos(rotation.x), sy = sin(rotation.x);
  float cx = cos(rotation.y), sx = sin(rotation.y);
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
  float perspective = 3.8 / (3.8 - p.z);
  gl_Position = vec4(p.x * perspective / (viewport.x / viewport.y), p.y * perspective, 0., 1.);
  gl_PointSize = pixelRatio * mix(3.0, 2.1, signal) * perspective;
  light = luminance;
  height = position.y;
  opacity = alpha;
}`;
const FRAGMENT = `
precision mediump float;
uniform float time;
uniform float signal;
varying float light;
varying float height;
varying float opacity;
void main() {
  float dotMask = 1.0 - smoothstep(.22, .5, length(gl_PointCoord - .5));
  float scan = .78 + .22 * sin(height * 290.0 - time * 1.8);
  float sweep = pow(max(0., 1.0 - abs(height - (mod(time * .28, 2.2) - 1.1)) * 14.), 2.);
  vec3 color = mix(vec3(.08, .63, .73), vec3(.73, 1., 1.), light);
  color = mix(color, vec3(.36, .65, 1.), signal * .5);
  gl_FragColor = vec4(color + sweep * .25, dotMask * (.45 + light * .8) * scan * opacity);
}`;

export default function HologramPortrait({ models }) {
  const canvasRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const modeRef = useRef(0);
  const pausedRef = useRef(false);
  const surpriseRef = useRef(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [surprise, setSurprise] = useState(false);
  const [poseReady, setPoseReady] = useState(false);
  const model = models[active];
  modeRef.current = model.mode || 0;
  pausedRef.current = paused || reduced;
  surpriseRef.current = surprise && !paused && !reduced;

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || reduced || !poseReady) return;
    let visible = false;
    const scheduler = createSurpriseScheduler({
      show: () => setSurprise(true),
      hide: () => setSurprise(false),
      canShow: () => visible && !document.hidden,
    });
    const activity = () => {
      if (visible && !document.hidden) scheduler.activity();
      else scheduler.suspend();
    };
    const leave = () => {
      if (visible && !document.hidden) scheduler.leave();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .3;
      activity();
    }, { threshold: [0, .3] });
    observer.observe(canvasRef.current);
    const events = ['pointermove', 'pointerdown', 'keydown', 'scroll'];
    events.forEach(event => window.addEventListener(event, activity, { passive: true }));
    document.addEventListener('visibilitychange', activity);
    document.documentElement.addEventListener('pointerleave', leave);
    document.documentElement.addEventListener('pointerenter', activity);
    window.addEventListener('blur', leave);
    window.addEventListener('focus', activity);
    return () => {
      scheduler.dispose();
      observer.disconnect();
      events.forEach(event => window.removeEventListener(event, activity));
      document.removeEventListener('visibilitychange', activity);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.removeEventListener('pointerenter', activity);
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', activity);
    };
  }, [paused, reduced, poseReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
    setReady(false);
    setFailed(false);
    setPoseReady(false);
    if (!gl) { setFailed(true); return; }
    let disposed = false, frame = 0, visible = true, lastTime = 0, elapsed = 0;
    let count = 0, currentX = 0, currentY = 0, currentMode = modeRef.current;
    const shaders = [], buffers = [], uniforms = {};
    const geometries = {};
    let program, linked = false;
    const fail = () => { if (!disposed) { setFailed(true); setReady(false); setPoseReady(false); } };
    const contextLost = event => { event.preventDefault(); cancelAnimationFrame(frame); fail(); };
    canvas.addEventListener('webglcontextlost', contextLost);
    try {
      program = gl.createProgram();
      for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
        const shader = gl.createShader(type);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      linked = true;
      ['viewport', 'rotation', 'time', 'signal', 'pixelRatio'].forEach(name => { uniforms[name] = gl.getUniformLocation(program, name); });
    } catch (error) { console.warn('Hologram unavailable:', error); fail(); }
    const draw = timestamp => {
      frame = 0;
      if (disposed || !count || !visible || document.hidden || gl.isContextLost()) return;
      const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, .05) : 0;
      lastTime = timestamp;
      if (!pausedRef.current) elapsed += delta;
      const easing = 1 - Math.exp(-delta * 7);
      currentX += ((pausedRef.current ? 0 : target.current.x) - currentX) * easing;
      currentY += ((pausedRef.current ? 0 : target.current.y) - currentY) * easing;
      currentMode += (modeRef.current - currentMode) * easing;
      const ratio = Math.min(devicePixelRatio || 1, 1.75);
      const width = Math.round(canvas.clientWidth * ratio), height = Math.round(canvas.clientHeight * ratio);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.uniform2f(uniforms.viewport, width, height);
      gl.uniform2f(uniforms.rotation, currentX + (pausedRef.current ? 0 : Math.sin(elapsed * .4) * .035), currentY);
      gl.uniform1f(uniforms.time, elapsed);
      gl.uniform1f(uniforms.signal, currentMode);
      gl.uniform1f(uniforms.pixelRatio, ratio * Math.max(.8, canvas.clientHeight / 640));
      // Both poses are preloaded GPU geometry; switching never reloads the renderer.
      const geometry = surpriseRef.current && geometries.surprise ? geometries.surprise : geometries.portrait;
      for (const { buffer, location, size } of geometry.attributes) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
      }
      gl.drawArrays(gl.POINTS, 0, geometry.count);
      frame = requestAnimationFrame(draw);
    };
    const start = () => { if (!frame && count && visible && !document.hidden) { lastTime = 0; frame = requestAnimationFrame(draw); } };
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else { cancelAnimationFrame(frame); frame = 0; }
    });
    observer.observe(canvas);
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start(); };
    document.addEventListener('visibilitychange', visibility);
    const images = [];
    const loadGeometry = (src, key) => {
      const image = new Image();
      images.push(image);
      image.onload = () => {
      if (disposed || !linked) return;
      try {
        const sample = document.createElement('canvas');
        sample.height = 640;
        sample.width = Math.round(640 * image.width / image.height);
        const ctx = sample.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, sample.width, sample.height);
        const { data } = ctx.getImageData(0, 0, sample.width, sample.height);
        const positions = [], lights = [], alphas = [];
        for (let y = 0; y < sample.height; y += 2) {
          for (let x = 0; x < sample.width; x += 2) {
            const i = (y * sample.width + x) * 4;
            if (data[i + 3] < 40) continue;
            const light = (data[i] * .2126 + data[i + 1] * .7152 + data[i + 2] * .0722) / 255;
            const px = (x / sample.width - .5) * 1.84 * sample.width / sample.height;
            const py = (.5 - y / sample.height) * 1.84;
            // Image-derived relief, not a reconstructed 360-degree human mesh.
            const depth = Math.sqrt(Math.max(0, 1 - (px / .55) ** 2)) * .19 + light * .065;
            positions.push(px, py, depth);
            lights.push(Math.pow(light, .7));
            alphas.push(data[i + 3] / 255);
          }
        }
        const geometry = { count: lights.length, attributes: [] };
        for (const [name, values, size] of [['position', positions, 3], ['luminance', lights, 1], ['alpha', alphas, 1]]) {
          const buffer = gl.createBuffer();
          buffers.push(buffer);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
          const location = gl.getAttribLocation(program, name);
          geometry.attributes.push({ buffer, location, size });
        }
        geometries[key] = geometry;
        if (key === 'portrait') { count = geometry.count; setReady(true); }
        setPoseReady(Boolean(geometries.portrait && geometries.surprise));
        start();
      } catch (error) {
        console.warn('Hologram geometry could not load:', error);
        if (key === 'portrait') fail(); else setPoseReady(false);
      }
      };
      image.onerror = () => { if (!disposed) { if (key === 'portrait') fail(); else setPoseReady(false); } };
      image.src = src;
    };
    loadGeometry(model.src, 'portrait');
    loadGeometry(surprisePose, 'surprise');
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', contextLost);
      images.forEach(image => { image.onload = null; image.onerror = null; });
      buffers.forEach(buffer => gl.deleteBuffer(buffer));
      shaders.forEach(shader => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
    };
  }, [model.src]);

  const move = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    target.current = { x: ((event.clientX - rect.left) / rect.width - .5) * .65, y: ((event.clientY - rect.top) / rect.height - .5) * .24 };
  };
  return <div className="holo overflow-hidden" data-surprise={surprise && !paused && !reduced}>
    <div className="holo-topline"><span><i /> DIGITAL PRESENCE</span><span>VOL. 001</span></div>
    <div className="holo-stage" onPointerMove={move} onPointerLeave={() => { target.current = { x: 0, y: 0 }; }}>
      <div className="holo-orbit" aria-hidden="true" />
      <div className="holo-axis" aria-hidden="true" />
      <img className={`holo-fallback ${ready ? 'is-hidden' : ''}`} src={model.src} alt="" />
      <canvas ref={canvasRef} className={ready ? 'is-ready' : ''} role="img" aria-label="Interactive cyan hologram of my portrait. Move your pointer or touch to tilt the portrait." />
      <div className="holo-platform" aria-hidden="true" />
      <span className="holo-coordinate" aria-hidden="true">X / 0.00<br />Y / 0.00<br />Z / 0.19</span>
      <span className="holo-caption">{failed ? 'PORTRAIT / STILL' : 'PORTRAIT / DEPTH STUDY'}</span>
    </div>
    {/* <div className="holo-controls">
      <div className="holo-models" aria-label="Hologram appearance">
        {models.map((item, index) => <button key={`${item.label}-${index}`} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>{item.label}</button>)}
      </div>
      <button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Resume' : 'Pause'}</button>
    </div> */}
    <p className="holo-hint">{reduced ? 'Reduced motion enabled' : paused ? 'Motion & surprises paused' : 'Move to interact · A little mischief when you look away'}</p>
  </div>;
}
