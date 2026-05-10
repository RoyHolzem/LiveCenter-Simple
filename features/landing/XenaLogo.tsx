import type { CSSProperties } from 'react';

interface XenaLogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function XenaLogo({ size = 44, withWordmark = true, className, style }: XenaLogoProps) {
  const viewWidth = withWordmark ? 368 : 64;
  const width = Math.round(size * (viewWidth / 64));

  return (
    <svg
      className={className}
      style={style}
      width={width}
      height={size}
      viewBox={`0 0 ${viewWidth} 64`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Xena"
    >
      <defs>
        <linearGradient id="xenaBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22B7FF" />
          <stop offset="100%" stopColor="#008FE8" />
        </linearGradient>
        <linearGradient id="xenaRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF1E32" />
          <stop offset="100%" stopColor="#D90016" />
        </linearGradient>
        <linearGradient id="xenaInk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#19324A" />
          <stop offset="100%" stopColor="#07172A" />
        </linearGradient>
        <filter id="xenaSoftShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#061527" floodOpacity="0.22" />
        </filter>
      </defs>

      <g filter="url(#xenaSoftShadow)">
        <path d="M4 4H18.5C20.1 4 21.6 4.65 22.75 5.8L30 13.05V28H15.05L5.8 18.75C4.65 17.6 4 16.1 4 14.5V4Z" fill="url(#xenaRed)" />
        <path d="M40.95 4H56V18.5C56 20.1 55.35 21.6 54.2 22.75L46.95 30H32V15.05L40.95 4Z" fill="url(#xenaBlue)" />
        <path d="M4 56V41.5C4 39.9 4.65 38.4 5.8 37.25L13.05 30H28V44.95L19.05 56H4Z" fill="url(#xenaBlue)" />
        <path d="M32 32H46.95L54.2 39.25C55.35 40.4 56 41.9 56 43.5V56H41.5C39.9 56 38.4 55.35 37.25 54.2L32 48.95V32Z" fill="url(#xenaRed)" />
      </g>

      {withWordmark && (
        <g transform="translate(80 8)" fill="url(#xenaInk)">
          <path d="M0 0H13.5L31 17.2L48.3 0H62L37.8 23.7L63.7 49H49.8L31 30.4L12.1 49H-1.4L24.3 23.7L0 0Z" />
          <path d="M82 0H129.5C128.6 7 123.1 11.8 115.2 11.8H94.7L91.1 17.6H125.2C124.1 24.3 118.8 28.7 111.2 28.7H84.2L80.4 35.1H129.8C128.8 43.2 122.8 49 113.9 49H66.2L82 0Z" />
          <path d="M151 0H164.3L195.2 31.4V0H207.5V49H195.2L163.4 16.7V49H151V0Z" />
          <path d="M245.9 0H260.6L287.8 49H273.3L268.8 40.7H237.7L233.3 49H218.9L245.9 0ZM243.8 29.4H262.7L253.3 11.9L243.8 29.4Z" />
          <path d="M263.7 37.2H283.1L287.8 49H257.8L263.7 37.2Z" fill="url(#xenaRed)" />
          <path d="M86.4 23.9H122.5C120.9 30.2 116.2 33.9 109.3 33.9H83.3L86.4 23.9Z" fill="url(#xenaBlue)" />
        </g>
      )}
    </svg>
  );
}
