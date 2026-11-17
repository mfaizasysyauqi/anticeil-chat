import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface AnticeilLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
  useGradient?: boolean;
}

export const ANTICEIL_LOGO_PATH =
  'M 258.0 116.6 L 376.0 1.0 L 376.0 46.0 L 281.0 140.0 L 309.0 169.0 L 309.0 347.5 L 514.5 147.0 L 514.5 191.0 L 309.0 394.0 L 309.0 438.0 L 514.5 233.0 L 514.5 280.0 L 327.4 467.0 L 514.5 654.0 L 514.5 701.0 L 310.0 498.0 L 310.0 718.0 L 274.0 753.0 L 274.0 180.0 L 258.0 163.1 L 242.0 180.0 L 242.0 753.0 L 206.0 718.0 L 206.0 498.0 L 1.5 701.0 L 1.5 654.0 L 188.6 467.0 L 1.5 280.0 L 1.5 233.0 L 207.0 438.0 L 207.0 394.0 L 1.5 191.0 L 1.5 147.0 L 207.0 347.5 L 207.0 169.0 L 235.0 140.0 L 140.0 46.0 L 140.0 1.0 Z';

/**
 * Anticeil Cyberpunk Geometric Logo
 * - Fully transparent background
 * - Features the signature Electric Blue -> Vibrant Cyan vertical gradient
 */
export function AnticeilLogo({
  className,
  size,
  useGradient = true,
  fill,
  ...props
}: AnticeilLogoProps) {
  const gradId = useId();
  const fillValue = fill || (useGradient ? `url(#${gradId})` : 'currentColor');

  return (
    <svg
      viewBox="0 0 516 756"
      xmlns="http://www.w3.org/2000/svg"
      style={size ? { width: size, height: size } : undefined}
      className={cn(
        'shrink-0 select-none pointer-events-none drop-shadow-[0_2px_10px_rgba(2,111,228,0.3)]',
        className,
      )}
      aria-label="Anticeil Logo"
      {...props}
    >
      {useGradient && !fill && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#004AFF" />
            <stop offset="35%" stopColor="#0064FF" />
            <stop offset="60%" stopColor="#0392FF" />
            <stop offset="85%" stopColor="#00CFFF" />
            <stop offset="100%" stopColor="#08FBFF" />
          </linearGradient>
        </defs>
      )}
      <path d={ANTICEIL_LOGO_PATH} fill={fillValue} fillRule="evenodd" />
    </svg>
  );
}

export default AnticeilLogo;
