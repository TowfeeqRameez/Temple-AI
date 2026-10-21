import React, { useRef, useEffect } from "react";

/**
 * WaterCanvas
 * Renders a realistic reflection of the temple image at the top of the canvas,
 * then applies per-row horizontal sine displacement to simulate gentle ripples.
 * A vertical opacity gradient makes the reflection fade into deep water,
 * and animated highlight streaks add subtle sparkles.
 */
export default function WaterCanvas({ imageUrl, className = "", intensity = 1 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const imgRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
    };

    // offscreen buffer for the source strip (temple bottom half)
    let start = performance.now();

    const draw = (t) => {
      const time = (t - start) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Deep water base gradient
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, "rgba(180, 175, 160, 0.55)");
      g.addColorStop(0.5, "rgba(70, 78, 82, 0.75)");
      g.addColorStop(1, "rgba(20, 22, 26, 0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      const img = imgRef.current;
      if (img && img.complete) {
        // Sample the temple region above the waterline (sky is faint, only
        // reflected near surface). Aggressive alpha decay = still-pond realism.
        const srcH = img.naturalHeight * 0.7;
        const srcY = img.naturalHeight * 0.02;
        const srcW = img.naturalWidth;

        const reflectMax = height * 0.5;
        const rowStep = 3;
        const srcSliceH = srcH / reflectMax;
        for (let y = 0; y < reflectMax; y += rowStep) {
          const depth = y / reflectMax;
          const wobble =
            Math.sin(time * 1.0 + y * 0.022) * (1.4 + depth * 4) * intensity +
            Math.sin(time * 0.55 + y * 0.009) * (0.7 + depth * 1.8) * intensity;

          // Mirror flip: waterline (y=0) shows the platform (bottom of source)
          const srcRowY = srcY + srcH - (y + rowStep) * srcSliceH;
          const sliceH = rowStep * srcSliceH;
          if (srcRowY < srcY || srcRowY + sliceH > srcY + srcH) continue;

          // Cubic falloff — reflection dissolves rapidly with depth
          const alpha = 0.9 * Math.pow(1 - depth, 2.4);
          if (alpha < 0.01) continue;
          ctx.globalAlpha = alpha;
          ctx.drawImage(
            img,
            0,
            srcRowY,
            srcW,
            sliceH,
            wobble,
            y,
            width,
            rowStep + 1.2
          );
        }
        ctx.globalAlpha = 1;
      }

      // Darken toward bottom with a second overlay for depth
      const g2 = ctx.createLinearGradient(0, 0, 0, height);
      g2.addColorStop(0, "rgba(20, 22, 26, 0)");
      g2.addColorStop(0.45, "rgba(15, 18, 22, 0.55)");
      g2.addColorStop(0.75, "rgba(10, 12, 16, 0.92)");
      g2.addColorStop(1, "rgba(6, 8, 12, 1)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Subtle sparkle highlights - animated horizontal streaks
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 6; i++) {
        const yy = ((i * 47 + time * (20 + i * 4)) % height);
        const alpha = 0.05 + 0.05 * Math.sin(time * 0.8 + i);
        ctx.fillStyle = `rgba(244, 201, 136, ${alpha})`;
        const w = width * (0.4 + 0.3 * Math.sin(time * 0.5 + i));
        const x = (Math.sin(time * 0.3 + i * 1.7) * 0.5 + 0.5) * (width - w);
        ctx.fillRect(x, yy, w, 1);
      }
      ctx.restore();

      // Waterline glow at very top
      const wl = ctx.createLinearGradient(0, 0, 0, 24);
      wl.addColorStop(0, "rgba(255, 230, 190, 0.35)");
      wl.addColorStop(1, "rgba(255, 230, 190, 0)");
      ctx.fillStyle = wl;
      ctx.fillRect(0, 0, width, 24);

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [imageUrl, intensity]);

  return <canvas ref={canvasRef} className={className} />;
}
