'use client';
import { useEffect, useRef } from 'react';

const BackgroundShader = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    const vsSource = `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;

    const fsSource = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif

      uniform vec3 u_colors[8];
      uniform vec4 u_scene;
      uniform vec4 u_shape;
      uniform vec4 u_surface;
      uniform vec4 u_finish;
      uniform vec4 u_transform;
      uniform vec4 u_space;
      uniform vec4 u_cursor;

      #define u_resolution u_scene.xy
      #define u_time u_scene.z
      #define u_colorCount u_scene.w
      #define u_scale u_shape.x
      #define u_intensity u_shape.y
      #define u_paramA u_shape.z
      #define u_warp u_shape.w
      #define u_detail u_surface.x
      #define u_contrast u_surface.y
      #define u_brightness u_surface.z
      #define u_saturation u_surface.w
      #define u_hue u_finish.x
      #define u_vignette u_finish.y
      #define u_blur u_finish.z
      #define u_grain u_finish.w
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      #define u_seed u_transform.x
      #else
      #define u_seed mod(u_transform.x, 31.0)
      #endif
      #define u_rotate u_transform.y
      #define u_drift u_transform.z
      #define u_oklab u_transform.w
      #define u_offset u_space.xy
      #define u_mouse u_space.zw
      #define u_cursorPresence u_cursor.x
      #define u_cursorEffect u_cursor.y
      #define u_cursorStrength u_cursor.z
      #define u_cursorRadius u_cursor.w

      float hash21(vec2 p) {
      #ifndef GL_FRAGMENT_PRECISION_HIGH
        p = mod(p, 31.0);
      #endif
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float grainHash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = p * 2.03 + vec2(17.0, 9.2);
          a *= 0.5;
        }
        return v;
      }

      vec3 srgbToLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
      vec3 linearToSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      
      vec3 mixColour(vec3 a, vec3 b, float t) { return mix(a, b, t); }

      vec3 palette(float x) {
        float n = max(u_colorCount - 1.0, 1.0);
        float f = clamp(x, 0.0, 1.0) * n;
        vec3 col = u_colors[0];
        for (int i = 0; i < 7; i++) {
          if (float(i) < n) col = mixColour(col, u_colors[i + 1], smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
        }
        return col;
      }

      vec3 shade(vec2 uv, vec2 p, float t) {
        float warp = 2.0 + u_intensity * 4.0;
        vec2 q = vec2(fbm(p + t * 0.08), fbm(p + vec2(5.2, 1.3) - t * 0.06));
        vec2 r = vec2(fbm(p + warp * q + vec2(1.7, 9.2)), fbm(p + warp * q + vec2(8.3, 2.8)));
        return palette(fbm(p + 3.0 * r + u_seed));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 screenUv = uv;
        vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        
        uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
        p *= u_scale;
        p += u_offset;
        
        if (u_warp > 0.0) p += u_warp * (vec2(fbm(p * u_detail + u_seed), fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
        
        vec3 col = shade(uv, p, u_time);
        
        if (abs(u_contrast - 1.0) > 0.0001) col = (col - 0.5) * u_contrast + 0.5;
        if (abs(u_saturation - 1.0) > 0.0001) col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, u_saturation);
        
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const locs = {
      colors: gl.getUniformLocation(program, 'u_colors'),
      scene: gl.getUniformLocation(program, 'u_scene'),
      shape: gl.getUniformLocation(program, 'u_shape'),
      surface: gl.getUniformLocation(program, 'u_surface'),
      finish: gl.getUniformLocation(program, 'u_finish'),
      transform: gl.getUniformLocation(program, 'u_transform'),
      space: gl.getUniformLocation(program, 'u_space'),
      cursor: gl.getUniformLocation(program, 'u_cursor'),
    };

    const hexToRgb = (hex: string) => [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255
    ];

    const colorData = new Float32Array([
      ...hexToRgb('#031C26'), ...hexToRgb('#1B6CA8'),
      ...hexToRgb('#5AD2F4'), ...hexToRgb('#EAF9FF'),
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ]);

    let animationFrameId: number;
    let isVisible = true;

    const render = (time: number) => {
      if (!isVisible) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth * dpr;
      const height = canvas.clientHeight * dpr;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }

      gl.uniform3fv(locs.colors, colorData);
      gl.uniform4f(locs.scene, width, height, time * 0.001 * 0.97, 4.0);
      gl.uniform4f(locs.shape, 1.72, 0.60, 0.50, 0.00);
      gl.uniform4f(locs.surface, 2.40, 1.22, 0.00, 1.00);
      gl.uniform4f(locs.transform, 635.0, 0.00, 0.00, 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) animationFrameId = requestAnimationFrame(render);
      else cancelAnimationFrame(animationFrameId);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10 bg-[#031C26]" />;
};

export default BackgroundShader;
