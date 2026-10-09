import React from 'react';

interface BrandLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  subtextClassName?: string;
  variant?: 'full' | 'icon' | 'badge';
  withContainer?: boolean;
}

/**
 * APNI PEHCHAAN Official Brand Logo Component
 * Matches the user's authentic 3D Black & Gold logo:
 * - Obsidian Charcoal & Noir 3D Beveled 'A'
 * - Radiant 3D Metallic Gold 'P'
 * - Dynamic 3D Gold Human Figure (Victorious Leaping / Pehchaan Symbol) connecting them
 * - Premium Gold and Charcoal Typography
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 40,
  className = '',
  showText = false,
  textClassName = '',
  subtextClassName = '',
  variant = 'icon',
  withContainer = false,
}) => {
  const numSize = typeof size === 'number' ? size : parseInt(size) || 40;

  // The 3D Black & Gold Vector Artwork
  const logoSvg = (
    <svg
      width={numSize}
      height={numSize}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-md select-none ${className}`}
      aria-label="APNI PEHCHAAN Logo"
    >
      <defs>
        {/* Rich 3D Warm Gold Gradients */}
        <linearGradient id="apReactGoldBright" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="15%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="90%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        <linearGradient id="apReactGoldLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="25%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="75%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        <linearGradient id="apReactGoldReflect" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="30%" stopColor="#D97706" />
          <stop offset="60%" stopColor="#FCD34D" />
          <stop offset="85%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Glossy Obsidian Noir Gradients */}
        <linearGradient id="apReactBlackDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="30%" stopColor="#1F2937" />
          <stop offset="70%" stopColor="#111827" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>

        <linearGradient id="apReactBlackLight" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#6B7280" />
          <stop offset="25%" stopColor="#4B5563" />
          <stop offset="60%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#0B0F17" />
        </linearGradient>

        {/* Circular Rim Gold Accent */}
        <linearGradient id="apReactGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="25%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="75%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Dark Radial Background */}
        <radialGradient id="apReactBadgeBg" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#1E222D" />
          <stop offset="55%" stopColor="#111319" />
          <stop offset="100%" stopColor="#07080B" />
        </radialGradient>

        {/* Gold Head Sphere 3D Radial */}
        <radialGradient id="apReactGoldHead" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#FDE047" />
          <stop offset="65%" stopColor="#F59E0B" />
          <stop offset="90%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>

        {/* Depth Shadow Filter */}
        <filter id="apReactShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.7" />
        </filter>
      </defs>

      {/* Dark Circular Background Badge */}
      <circle cx="60" cy="60" r="57" fill="url(#apReactBadgeBg)" />
      
      {/* Outer Polished Metallic Gold Rim */}
      <circle cx="60" cy="60" r="56" stroke="url(#apReactGoldRim)" strokeWidth="1.8" fill="none" opacity="0.9" />
      <circle cx="60" cy="60" r="53.5" stroke="#F59E0B" strokeWidth="0.6" strokeDasharray="1.5 2" fill="none" opacity="0.35" />

      {/* Monogram Group */}
      <g filter="url(#apReactShadow)">
        
        {/* ======================================================== */}
        {/* LETTER 'A' - Obsidian Black 3D Beveled Diagonal Leg      */}
        {/* ======================================================== */}
        
        {/* Left Facet of 'A' (Graphite reflection) */}
        <path
          d="M 33 24 
             L 41 24 
             L 24 82 
             L 16 82 
             Z"
          fill="url(#apReactBlackLight)"
        />

        {/* Right Facet of 'A' (Obsidian noir) */}
        <path
          d="M 41 24 
             L 47 24 
             L 31 82 
             L 24 82 
             Z"
          fill="url(#apReactBlackDark)"
        />

        {/* Ridge specular highlight on 'A' */}
        <line
          x1="41"
          y1="24"
          x2="24"
          y2="82"
          stroke="#9CA3AF"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* ======================================================== */}
        {/* LETTER 'P' - 3D Metallic Gold Vertical Stem and Loop    */}
        {/* ======================================================== */}
        
        {/* 'P' Main Vertical Stem in Radiant Gold */}
        <path
          d="M 54 24 
             L 63 24 
             L 63 82 
             L 54 82 
             Z"
          fill="url(#apReactGoldBright)"
        />

        {/* 'P' Stem Left Bevel */}
        <path
          d="M 54 24 
             L 57 24 
             L 57 82 
             L 54 82 
             Z"
          fill="url(#apReactGoldReflect)"
          opacity="0.9"
        />

        {/* 'P' Loop - Outer Smooth 3D Metallic Gold Curve */}
        <path
          d="M 61 24 
             L 84 24 
             C 101 24, 112 34, 112 50 
             C 112 66, 99 76, 82 76 
             L 61 76 
             L 61 65 
             L 81 65 
             C 91 65, 99 58, 99 50 
             C 99 42, 91 35, 81 35 
             L 61 35 
             Z"
          fill="url(#apReactGoldLight)"
        />

        {/* 'P' Loop Upper Bevel Specular Sheen */}
        <path
          d="M 61 24 
             L 84 24 
             C 100 24, 111 34, 111 50 
             L 106 50 
             C 106 37, 95 28, 81 28 
             L 61 28 
             Z"
          fill="url(#apReactGoldBright)"
          opacity="0.85"
        />

        {/* 'P' Loop Specular Edge Glint */}
        <path
          d="M 62 25 C 81 25, 110 28, 110 50"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* ======================================================== */}
        {/* DYNAMIC GOLD HUMAN FIGURE (Empowerment / Pehchaan Symbol)*/}
        {/* ======================================================== */}
        
        {/* Golden Head Sphere (Celebrant / Victorious Pehchaan) */}
        <circle
          cx="49"
          cy="16.5"
          r="5.5"
          fill="url(#apReactGoldHead)"
        />
        {/* Head Specular Spot */}
        <circle
          cx="47.5"
          cy="14.8"
          r="1.6"
          fill="#FFFFFF"
          opacity="0.9"
        />

        {/* Dynamic Curved Torso & Leaping Motion in Brilliant Gold */}
        <path
          d="M 49 23
             C 50 28, 51 34, 48 43
             C 45 52, 37 59, 26 63
             C 19 65, 13 65.5, 8 65.5
             C 14 62.5, 22 60, 30 54
             C 38 48, 42 41, 43 34
             C 44 30, 45 26, 46 23
             Z"
          fill="url(#apReactGoldBright)"
        />

        {/* Golden Crossbar / Dynamic Swoosh Connecting 'A' to 'P' */}
        <path
          d="M 23 57
             C 36 53, 49 50, 64 50
             L 64 57
             C 49 57, 36 60, 23 64
             Z"
          fill="url(#apReactGoldLight)"
        />

        {/* Dynamic Left Arm Reaching Skyward */}
        <path
          d="M 47 24
             C 41 25, 34 29, 29 35
             C 32 32, 38 30, 45 29
             Z"
          fill="url(#apReactGoldReflect)"
        />

        {/* Dynamic Right Arm Uplifting Toward 'P' */}
        <path
          d="M 51 24
             C 57 25, 64 29, 70 36
             C 66 32, 60 29, 52 28.5
             Z"
          fill="url(#apReactGoldBright)"
        />

        {/* Star Flare / Glint Accent */}
        <path
          d="M 49 11 L 50 14 L 53 15 L 50 16 L 49 19 L 48 16 L 45 15 L 48 14 Z"
          fill="#FFFBEB"
          opacity="0.8"
        />

      </g>

      {/* Subtle Arc Divider below Monogram */}
      <path
        d="M 28 88 Q 60 94 92 88"
        stroke="url(#apReactGoldRim)"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* APNI PEHCHAAN Typography on Badge Base */}
      <text
        x="60"
        y="102"
        textAnchor="middle"
        fontFamily="'Montserrat', 'Arial Black', sans-serif"
        fontSize="8.5"
        fontWeight="900"
        letterSpacing="1.8"
        fill="url(#apReactGoldBright)"
      >
        APNI PEHCHAAN
      </text>

      {/* Tagline text */}
      <text
        x="60"
        y="110.5"
        textAnchor="middle"
        fontFamily="'Inter', sans-serif"
        fontSize="4.2"
        fontWeight="600"
        letterSpacing="1.2"
        fill="#CBD5E1"
        opacity="0.8"
      >
        PRODUCT DISCOVERY
      </text>
    </svg>
  );

  if (variant === 'icon' && !showText) {
    return logoSvg;
  }

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 group ${className}`}>
      {logoSvg}
      {(showText || variant === 'full') && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap leading-tight">
            <span
              className={`font-black text-base sm:text-lg tracking-wider bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent uppercase font-sans ${textClassName}`}
            >
              APNI
            </span>
            <span
              className={`font-black text-base sm:text-lg tracking-wider text-slate-900 uppercase font-sans ${textClassName}`}
            >
              PEHCHAAN
            </span>
          </div>
          <p
            className={`text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-tight leading-tight truncate mt-0.5 ${subtextClassName}`}
          >
            Amazon · Flipkart · Meesho Deals
          </p>
        </div>
      )}
    </div>
  );
};
