"use client";
import { useEffect, useState } from "react";

export default function AnimatedPercentageRing({
  value,
  size = 36,
  strokeWidth = 3,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    // 1. Initial reset then animate stroke-dashoffset
    const timer = setTimeout(() => {
      const clamped = Math.min(100, Math.max(0, value));
      const target = circumference - (clamped / 100) * circumference;
      setOffset(target);
    }, 150);

    // 2. Count-up animation for text
    const duration = 1200; // ms
    const startTime = performance.now();
    const targetValue = Math.min(100, Math.max(0, Math.round(value)));

    let animId: number;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth ease-out cubic curve
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(targetValue * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animId);
    };
  }, [value, circumference]);

  return (
    <div
      className="relative flex items-center justify-center shrink-0 group select-none"
      style={{ width: size, height: size }}
      title={`30-Day Lead Qualification Rate: ${value}%`}
    >
      <svg
        className="transform -rotate-90 filter drop-shadow-2xs"
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id="qualRateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E2A4A" />
            <stop offset="60%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>

        {/* Outer Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#EEF2F6"
          strokeWidth={strokeWidth}
        />

        {/* Animated Active Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={value > 0 ? "url(#qualRateGradient)" : "#94A3B8"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        />
      </svg>

      {/* Centered Animated Number */}
      <span className="absolute flex items-center justify-center text-[10px] font-black tracking-tight text-navy-950 font-sans">
        {displayValue}%
      </span>

      {/* Subtle outer breathing ring when active or live */}
      <span className="absolute inset-0 rounded-full border border-navy/10 animate-pulse pointer-events-none" />
    </div>
  );
}
