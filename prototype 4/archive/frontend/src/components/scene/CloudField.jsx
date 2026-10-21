import React from "react";

/**
 * CloudField
 * SVG-based soft, layered volumetric clouds that drift slowly across the sky.
 * Multiple layers with different blur/opacity/drift speed for parallax depth.
 */

const Cloud = ({ cx, cy, scale = 1, opacity = 0.9, tint = "#fff" }) => (
  <g transform={`translate(${cx} ${cy}) scale(${scale})`} opacity={opacity}>
    <ellipse cx="0" cy="0" rx="120" ry="42" fill={tint} />
    <ellipse cx="-70" cy="10" rx="70" ry="30" fill={tint} />
    <ellipse cx="70" cy="8" rx="80" ry="34" fill={tint} />
    <ellipse cx="-30" cy="-22" rx="55" ry="28" fill={tint} />
    <ellipse cx="40" cy="-18" rx="60" ry="30" fill={tint} />
    <ellipse cx="-110" cy="20" rx="40" ry="18" fill={tint} />
    <ellipse cx="110" cy="18" rx="46" ry="20" fill={tint} />
  </g>
);

export default function CloudField({ variant = "back" }) {
  // variant: 'back' | 'mid' | 'front'
  const cfg = {
    back: { blur: 6, opacity: 0.55, drift: "cloudDriftL 90s ease-in-out infinite alternate" },
    mid: { blur: 14, opacity: 0.75, drift: "cloudDriftR 60s ease-in-out infinite alternate" },
    front: { blur: 30, opacity: 0.85, drift: "cloudDriftL 40s ease-in-out infinite alternate" },
  }[variant];

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ filter: `blur(${cfg.blur}px)`, opacity: cfg.opacity, animation: cfg.drift }}
    >
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <radialGradient id={`cg-${variant}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8ea" stopOpacity="1" />
            <stop offset="60%" stopColor="#f6ead0" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#e8d9b5" stopOpacity="0" />
          </radialGradient>
        </defs>

        {variant === "back" && (
          <>
            <Cloud cx={200} cy={140} scale={1.6} opacity={0.75} tint={`url(#cg-${variant})`} />
            <Cloud cx={780} cy={90} scale={1.9} opacity={0.65} tint={`url(#cg-${variant})`} />
            <Cloud cx={1380} cy={160} scale={1.7} opacity={0.7} tint={`url(#cg-${variant})`} />
            <Cloud cx={520} cy={220} scale={1.4} opacity={0.55} tint={`url(#cg-${variant})`} />
            <Cloud cx={1120} cy={260} scale={1.5} opacity={0.6} tint={`url(#cg-${variant})`} />
          </>
        )}
        {variant === "mid" && (
          <>
            <Cloud cx={140} cy={380} scale={2.1} opacity={0.85} tint="#ffffff" />
            <Cloud cx={1500} cy={360} scale={2.3} opacity={0.9} tint="#ffffff" />
            <Cloud cx={-40} cy={640} scale={2.6} opacity={0.9} tint="#f7ecd6" />
            <Cloud cx={1640} cy={620} scale={2.4} opacity={0.9} tint="#f7ecd6" />
            <Cloud cx={880} cy={470} scale={1.3} opacity={0.45} tint="#ffffff" />
          </>
        )}
        {variant === "front" && (
          <>
            <Cloud cx={-100} cy={780} scale={3.2} opacity={0.95} tint="#ffffff" />
            <Cloud cx={1700} cy={760} scale={3.0} opacity={0.95} tint="#ffffff" />
            <Cloud cx={280} cy={860} scale={2.4} opacity={0.9} tint="#ffffff" />
            <Cloud cx={1320} cy={850} scale={2.6} opacity={0.9} tint="#ffffff" />
            {/* Center-bottom mist band to fill the negative gap between side clouds */}
            <Cloud cx={800} cy={880} scale={2.8} opacity={0.85} tint="#f8f0dc" />
            <Cloud cx={560} cy={900} scale={2.2} opacity={0.75} tint="#f6ebd0" />
            <Cloud cx={1080} cy={890} scale={2.4} opacity={0.8} tint="#f6ebd0" />
          </>
        )}
      </svg>
    </div>
  );
}
