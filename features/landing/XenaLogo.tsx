import type { CSSProperties } from 'react';

interface XenaLogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function XenaLogo({ size = 44, withWordmark = true, className, style }: XenaLogoProps) {
  return (
    <img
      className={className}
      style={{ width: size, height: size, ...style }}
      src="/logo.png"
      alt="Xena"
      width={size}
      height={size}
    />
  );
}
