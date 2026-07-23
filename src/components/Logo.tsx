import React from 'react';

interface LogoProps {
  /**
   * Preset size variant:
   * - 'header': small logo in nav bar (w-5 h-6 sm:w-6 sm:h-7)
   * - 'mission': large watermark logo (w-72 h-80 sm:w-80 sm:h-96)
   * - custom: use your own className for sizing
   */
  variant?: 'header' | 'mission';
  /** Custom class names. Overrides variant defaults if provided. */
  className?: string;
  /** Unique gradient prefix to avoid ID conflicts when multiple logos on same page. Default: 'logo' */
  gradientId?: string;
}

const Logo = ({ variant = 'header', className, gradientId = 'logo' }: LogoProps) => {
  const defaultClass = variant === 'mission'
    ? 'w-72 h-80 sm:w-80 sm:h-96'
    : 'w-5 h-6 sm:w-6 sm:h-7 drop-shadow-[0_4px_12px_rgba(188,70,56,0.15)] transition-transform duration-500 ease-out group-hover:scale-110';

  return (
    <svg
      viewBox="0 0 400 480"
      className={className || defaultClass}
    >
      <defs>
        <linearGradient id={`${gradientId}-left-grad`} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="25%" stopColor="#f38b76" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#bc4638" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#80261b" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${gradientId}-right-grad`} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="25%" stopColor="#e28fb1" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#bd5b82" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#803251" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${gradientId}-h-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#bc4638" stopOpacity="0.85" />
          <stop offset="20%" stopColor="#f38b76" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#d57e8c" stopOpacity="0.8" />
          <stop offset="80%" stopColor="#e28fb1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#bd5b82" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <circle cx="102.5" cy="75" r="42.5" fill={`url(#${gradientId}-left-grad)`} />
      <circle cx="297.5" cy="75" r="42.5" fill={`url(#${gradientId}-right-grad)`} />
      <path
        d="M 60,180 A 42.5,42.5 0 0,1 145,180 L 145,220 C 145,236.5 158.5,250 175,250 L 225,250 C 241.5,250 255,236.5 255,220 L 255,180 A 42.5,42.5 0 0,1 340,180 L 340,400 A 42.5,42.5 0 0,1 255,400 L 255,360 C 255,343.5 241.5,330 225,330 L 175,330 C 158.5,330 145,343.5 145,360 L 145,400 A 42.5,42.5 0 0,1 60,400 Z"
        fill={`url(#${gradientId}-h-grad)`}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default Logo;
