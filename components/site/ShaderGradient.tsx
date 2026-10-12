'use client';

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { useMotion } from '@/components/motion/MotionProvider';

/**
 * Living gradient field: domain-warped noise mixing the brand colours over
 * paper, with film grain baked into the shader. Renders at reduced resolution
 * (it is soft by design). It stops requesting frames off screen and on hidden
 * tabs; with motion off it draws a single still frame (and redraws only when
 * intensity or focus change). Falls back to a static CSS gradient when WebGL
 * is unavailable.
 *
 * `intensity` (0..1) scales how much colour rises out of the paper; sections
 * can drive it from scroll progress. `focus` moves the brightest glow.
 */
export type ShaderPalette = 'dawn' | 'lab' | 'ember';

const PALETTES: Record<ShaderPalette, [number, number, number][]> = {
  // paper, mint, teal, sand, orange
  dawn: [
    [0.973, 0.957, 0.937],
    [0.635, 0.816, 0.745],
    [0.259, 0.569, 0.584],
    [0.902, 0.851, 0.671],
    [0.886, 0.624, 0.216],
  ],
  lab: [
    [0.973, 0.957, 0.937],
    [0.765, 0.875, 0.835],
    [0.259, 0.569, 0.584],
    [0.925, 0.894, 0.788],
    [0.886, 0.624, 0.216],
  ],
  ember: [
    [0.973, 0.957, 0.937],
    [0.902, 0.851, 0.671],
    [0.886, 0.624, 0.216],
    [0.937, 0.788, 0.541],
    [0.259, 0.569, 0.584],
  ],
};

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision mediump float;
uniform vec2 u_res;uniform float u_t;uniform float u_int;uniform vec2 u_focus;uniform vec2 u_mouse;
uniform vec3 c0;uniform vec3 c1;uniform vec3 c2;uniform vec3 c3;uniform vec3 c4;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/u_res;vec2 q=uv;q.x*=u_res.x/u_res.y;
 float t=u_t*.035;
 vec2 w=vec2(fbm(q*1.4+vec2(t,-t)),fbm(q*1.4+vec2(-t*.7,t*.9)+5.2));
 float f=fbm(q*1.1+w*1.8+t*.5);
 vec2 fc=u_focus;fc.x*=u_res.x/u_res.y;vec2 mc=u_mouse;mc.x*=u_res.x/u_res.y;
 float d=distance(q,fc);float glow=smoothstep(1.05,0.,d);
 float md=distance(q,mc);float mg=smoothstep(.55,0.,md)*.35;
 vec3 col=c0;
 col=mix(col,c1,smoothstep(.35,.75,f)*.85);
 col=mix(col,c3,smoothstep(.45,.9,w.y)*.7);
 col=mix(col,c2,smoothstep(.55,.95,f*glow+mg)*.9);
 col=mix(col,c4,smoothstep(.62,1.,w.x*glow+mg*.6)*.95);
 col=mix(c0,col,clamp(u_int*(.35+glow*.9+mg),0.,1.));
 float g=h(gl_FragCoord.xy+fract(u_t)*97.)-.5;col+=g*.06;
 gl_FragColor=vec4(col,1.);
}`;

export default function ShaderGradient({
  palette = 'dawn',
  intensity = 0.8,
  focus = [0.5, 0.25],
  className,
  followPointer = false,
  hold = false,
}: {
  palette?: ShaderPalette;
  intensity?: number;
  /** Glow centre in UV space (0..1, origin bottom left). */
  focus?: [number, number];
  className?: string;
  followPointer?: boolean;
  /** Held by a control on the page (a figure's Pause, WCAG 2.2.2): still, as under reduced motion. */
  hold?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ intensity, focus, mouse: [-2, -2] as [number, number] });
  /** Still: site motion paused (it follows the OS reduced-motion preference), or held. */
  const still = useRef(true);
  /** Requests a frame from the live renderer; a no-op until the context exists. */
  const kick = useRef<() => void>(() => {});
  const { paused } = useMotion();

  useEffect(() => {
    state.current.intensity = intensity;
    state.current.focus = focus;
    kick.current();
  }, [intensity, focus]);

  useEffect(() => {
    // html[data-motion] is set before first paint; `paused` only catches up after mount.
    still.current = hold || paused || document.documentElement.dataset.motion === 'paused';
    kick.current();
  }, [paused, hold]);

  // Set-up runs once per palette: the context and program survive motion changes.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!gl || gl.isContextLost()) {
      el.dataset.fallback = 'true';
      return;
    }
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      el.dataset.fallback = 'true';
      return;
    }
    delete el.dataset.fallback;
    // Indirect call: the React compiler lint reads `gl.useProgram` as a hook call.
    const activate = 'useProgram' as const;
    Reflect.apply(gl[activate], gl, [prog]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u('u_res');
    const uT = u('u_t');
    const uInt = u('u_int');
    const uFocus = u('u_focus');
    const uMouse = u('u_mouse');
    PALETTES[palette].forEach((c, i) => gl.uniform3f(u(`c${i}`), c[0], c[1], c[2]));

    // Shader time in seconds. It only advances while playing, so pausing holds the frame
    // and resuming continues from it.
    let clock = 40;
    let last = -1;
    let frame = 0;
    let visible = false;
    const draw = () => {
      const s = state.current;
      gl.uniform1f(uT, clock);
      gl.uniform1f(uInt, s.intensity);
      gl.uniform2f(uFocus, s.focus[0], s.focus[1]);
      gl.uniform2f(uMouse, s.mouse[0], s.mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const tick = (now: number) => {
      frame = 0;
      // Off screen or on a hidden tab: stop scheduling; the observers restart it.
      if (!visible || document.visibilityState !== 'visible') {
        last = -1;
        return;
      }
      if (still.current) {
        // One frame for the current intensity and focus, then rest.
        last = -1;
        draw();
        return;
      }
      clock += last < 0 ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      draw();
      schedule();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const scale = 0.5;
    const resize = () => {
      const r = el.getBoundingClientRect();
      el.width = Math.max(2, Math.round(r.width * scale));
      el.height = Math.max(2, Math.round(r.height * scale));
      gl.viewport(0, 0, el.width, el.height);
      gl.uniform2f(uRes, el.width, el.height);
      schedule();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) schedule();
      },
      { rootMargin: '10% 0px' },
    );
    io.observe(el);
    document.addEventListener('visibilitychange', schedule);

    const onPointer = (event: PointerEvent) => {
      const r = el.getBoundingClientRect();
      state.current.mouse = [
        (event.clientX - r.left) / r.width,
        1 - (event.clientY - r.top) / r.height,
      ];
    };
    if (followPointer) window.addEventListener('pointermove', onPointer, { passive: true });

    kick.current = schedule;
    return () => {
      kick.current = () => {};
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      window.removeEventListener('pointermove', onPointer);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      // Free the GPU context only once the canvas has really left the page; a re-run on the
      // same canvas (new palette) must find the context alive.
      setTimeout(() => {
        if (!el.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext();
      }, 0);
    };
  }, [palette, followPointer]);

  return (
    <canvas
      ref={canvas}
      className={clsx('s-shader', className)}
      aria-hidden="true"
    />
  );
}
