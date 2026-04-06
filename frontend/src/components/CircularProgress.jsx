import React, { useEffect, useId, useMemo, useState } from 'react';

function clampPercentage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

export default function CircularProgress({
  value = 0,
  size = 180,
  strokeWidth = 16,
  label = 'Overall Placement Chance',
}) {
  const safeValue = clampPercentage(value);
  const [animatedValue, setAnimatedValue] = useState(0);
  const gradientId = useId();

  useEffect(() => {
    let rafId;
    let startTime;
    const durationMs = 1200;

    const startValue = animatedValue;
    const delta = safeValue - startValue;

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(startValue + delta * eased);

      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [safeValue]);

  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const dashOffset = useMemo(
    () => circumference * (1 - animatedValue / 100),
    [circumference, animatedValue]
  );

  return (
    <div className="circular-progress-card" role="img" aria-label={`${safeValue.toFixed(2)} percent ${label}`}>
      <svg width={size} height={size} className="circular-progress-svg">
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={size} y2={size}>
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="circular-progress-track"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="circular-progress-ring"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="circular-progress-center">
        <div className="circular-progress-value">{animatedValue.toFixed(2)}%</div>
        <div className="circular-progress-label">{label}</div>
      </div>
    </div>
  );
}
