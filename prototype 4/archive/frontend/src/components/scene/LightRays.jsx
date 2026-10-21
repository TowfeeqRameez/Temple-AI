import React from "react";

/**
 * LightRays - god rays / volumetric sun light emanating from behind the temple.
 * Pure SVG with radial-cone gradients + subtle shimmer animation.
 */
export default function LightRays() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{ animation: "rayShimmer 7s ease-in-out infinite", mixBlendMode: "screen" }}
      >
        <defs>
          <linearGradient id="ray" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fff2cf" stopOpacity="0.65" />
            <stop offset="60%" stopColor="#f4c988" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f4c988" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="30%" r="30%">
            <stop offset="0%" stopColor="#fff6de" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#f6d29a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f6d29a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="1600" height="900" fill="url(#sun)" />

        {/* rays fanning down from behind the gopuram */}
        <g transform="translate(800 220)">
          {[-30, -20, -10, 0, 10, 20, 30].map((deg, i) => (
            <polygon
              key={i}
              points="-40,0 40,0 220,900 -220,900"
              transform={`rotate(${deg})`}
              fill="url(#ray)"
              opacity={0.55 - Math.abs(deg) * 0.012}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
