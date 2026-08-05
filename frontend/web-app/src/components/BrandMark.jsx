// eslint-disable-next-line no-unused-vars
import React from 'react';

// Small glowing icon mark used next to the Tablé wordmark on the login
// screen and the merchant dashboard sidebar — CSS vars (not Tailwind theme
// colors) so it tracks the same dark/light token swap as everything else.
export default function BrandMark({ size = 34 }) {
  return (
    <div
      className="rounded-[9px] flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(155deg, var(--table-primary), var(--table-primary-hover))',
        boxShadow: '0 0 18px color-mix(in srgb, var(--table-primary) 45%, transparent)',
      }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--table-canvas)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 2v6M11 2v6M7 8a3 3 0 0 0 4 2.83V22M17 2c-1.5 0-3 1.5-3 4v5h3M17 11v11" />
      </svg>
    </div>
  );
}
