// Minimal inline SVG icon set (lucide-style strokes). Inline keeps the app
// dependency-free and renders identically on every OS, unlike emoji/glyphs.

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function iconProps({ size = 18, className = "", strokeWidth = 1.8 }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export function IconActivity(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export function IconChart(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

export function IconClock(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function IconSettings(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconCamera(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function IconBell(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function IconFlame(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function IconPause(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function IconPlay(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="m6 4 14 8-14 8V4z" />
    </svg>
  );
}

export function IconEye(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export function IconCheck(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconShield(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export function IconTray(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M3 15h18" />
      <path d="M12 8v4" />
      <path d="m9.5 10.5 2.5 2 2.5-2" />
    </svg>
  );
}

export function IconTimer(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M10 2h4" />
      <circle cx="12" cy="14" r="8" />
      <path d="M12 10v4" />
    </svg>
  );
}
