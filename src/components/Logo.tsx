import React from 'react';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'horizontal' | 'icon' | 'text';
  theme?: 'auto' | 'light' | 'dark';
  className?: string;
  showTagline?: boolean;
}

/**
 * Official WEALTHERA Brand Logo Component
 * Matches the official Wealthera visual identity with:
 * - Deep emerald gradient squircle app icon
 * - 3D white geometric 'W' with rising mint-to-orange growth arrow
 * - Custom WEALTHERA geometric wordmark with orange triangle in terminal 'A'
 * - "INVEST TODAY • GROW TOMORROW" brand tagline
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'icon',
  theme = 'auto',
  className = '',
  showTagline = true,
}) => {
  // Icon pixel sizing
  const iconSizes: Record<string, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  };

  const isDark = theme === 'dark';

  // Official SVG App Icon (using /logo.svg directly as requested)
  const renderIcon = (customSize?: string) => (
    <div
      className={`relative select-none shrink-0 drop-shadow-md flex items-center justify-center ${
        customSize || iconSizes[size] || 'w-10 h-10'
      }`}
    >
      <img
        src="/logo.svg"
        alt="WEALTHERA"
        className="w-full h-full object-contain rounded-2xl select-none"
        referrerPolicy="no-referrer"
        loading="eager"
      />
    </div>
  );

  // Stylized Wordmark: WEALTHERA
  const renderWordmark = (textSizeClass = 'text-2xl') => (
    <div className="flex flex-col items-center select-none">
      <div className={`font-black tracking-tight flex items-center ${textSizeClass} ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {/* W with orange apex accent */}
        <span className="relative text-emerald-600 mr-0.5 inline-flex items-center">
          <span className="relative">W</span>
          <span className="absolute -top-1 right-0 text-[10px] text-peach-500 font-black">▲</span>
        </span>
        <span className="tracking-wide">EALTHER</span>
        {/* Terminal A with orange triangle inner counter */}
        <span className="relative inline-flex items-center justify-center">
          <span>A</span>
          <span className="absolute top-1.5 inset-x-0 flex justify-center text-[7px] text-peach-500 font-black pointer-events-none">
            ▲
          </span>
        </span>
      </div>

      {showTagline && (
        <div className="flex items-center justify-center gap-2 mt-1 w-full text-[9px] font-black uppercase tracking-[0.22em] text-emerald-700/90 dark:text-emerald-400">
          <span className="h-[1px] w-6 bg-emerald-600/40"></span>
          <span>INVEST TODAY</span>
          <span className="text-peach-500 text-xs leading-none">•</span>
          <span>GROW TOMORROW</span>
          <span className="h-[1px] w-6 bg-emerald-600/40"></span>
        </div>
      )}
    </div>
  );

  // Full Variant: Icon on top + Wordmark + Tagline (Hero, Login, Register, Admin Welcome)
  if (variant === 'full') {
    const iconDimension =
      size === 'xl' ? 'w-24 h-24' : size === '2xl' ? 'w-32 h-32' : size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';
    const textDimension =
      size === 'xl' || size === '2xl' ? 'text-3xl' : size === 'lg' ? 'text-2xl' : 'text-xl';

    return (
      <div
        id="wealthera-brand-logo-full"
        className={`flex flex-col items-center justify-center text-center space-y-3 ${className}`}
      >
        {renderIcon(iconDimension)}
        {renderWordmark(textDimension)}
      </div>
    );
  }

  // Horizontal Variant: Icon on left + Brand Text on right (Top Navigation, Admin Header)
  if (variant === 'horizontal') {
    const iconDimension = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
    const textDimension = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

    return (
      <div
        id="wealthera-brand-logo-horizontal"
        className={`inline-flex items-center gap-2.5 select-none ${className}`}
      >
        {renderIcon(iconDimension)}
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-tight flex items-center ${textDimension} ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span className="text-emerald-600 mr-0.5 font-black">W</span>
            <span className="tracking-wide">EALTHER</span>
            <span className="relative inline-flex items-center justify-center">
              <span>A</span>
              <span className="absolute top-1 inset-x-0 flex justify-center text-[6px] text-peach-500 font-black pointer-events-none">
                ▲
              </span>
            </span>
          </div>
          {showTagline && (
            <span className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-emerald-600/90 dark:text-emerald-400">
              INVEST TODAY • GROW TOMORROW
            </span>
          )}
        </div>
      </div>
    );
  }

  // Wordmark Only Variant
  if (variant === 'text') {
    return (
      <div id="wealthera-brand-logo-text" className={className}>
        {renderWordmark(size === 'lg' ? 'text-2xl' : 'text-xl')}
      </div>
    );
  }

  // Default: Icon Only Variant
  return (
    <div id="wealthera-brand-logo-icon" className={`inline-flex items-center justify-center ${className}`}>
      {renderIcon()}
    </div>
  );
};
