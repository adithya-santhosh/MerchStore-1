import { useId } from "react";

interface LogoProps {
  className?: string;
}

/**
 * Custom brand mark: a telemetry/pulse line rising through a dashed
 * gauge ring, rendered as a primary-to-accent gradient. Replaces any
 * generic icon-library placeholder.
 */
export default function Logo({ className }: LogoProps) {
  const gradId = useId();

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="22" x2="24" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <circle
        cx="16"
        cy="16"
        r="13.5"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeDasharray="3.2 3.4"
      />
      <path
        d="M7.5 19.5L12 12.5L15 17L20 7.5L22.5 12"
        stroke={`url(#${gradId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="12" r="2.1" fill={`url(#${gradId})`} />
    </svg>
  );
}
