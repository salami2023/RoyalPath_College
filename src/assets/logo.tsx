import React from 'react';

/**
 * High-definition Vector & Data URL representation of RoyalPath College Crest Logo:
 * - Shield with Navy and Gold borders
 * - Graduation Cap (Mortarboard) with Gold Tassel
 * - Stack of Books & Red Pencil
 * - "ROYALPATH COLLEGE" Typography
 * - Heraldic Crimson Ribbon Banner with "IN GOD WE TRUST"
 */

export const ROYALPATH_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <!-- Gradients -->
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#edf2f7"/>
    </linearGradient>
    <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="50%" stop-color="#b91c1c"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
    <linearGradient id="goldRibbonBorder" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="redBookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b91c1c"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>
    <linearGradient id="yellowBookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="navyBookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <filter id="shadowEffect" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Outer Shield Shadow -->
  <path d="M 120 110 L 380 110 L 380 270 Q 380 375 250 420 Q 120 375 120 270 Z" 
        fill="none" filter="url(#shadowEffect)"/>

  <!-- Outer Navy Shield Border -->
  <path d="M 115 105 L 385 105 L 385 272 Q 385 382 250 428 Q 115 382 115 272 Z" 
        fill="url(#shieldBorder)" stroke="#d97706" stroke-width="4" stroke-linejoin="round"/>

  <!-- Inner Orange/Gold Trim -->
  <path d="M 125 115 L 375 115 L 375 270 Q 375 370 250 415 Q 125 370 125 270 Z" 
        fill="#f97316"/>

  <!-- White Crest Inner Field -->
  <path d="M 131 121 L 369 121 L 369 268 Q 369 362 250 407 Q 131 362 131 268 Z" 
        fill="url(#shieldGrad)"/>

  <!-- Center Shield subtle vertical split fold -->
  <path d="M 250 121 L 369 121 L 369 268 Q 369 362 250 407 Z" 
        fill="#000000" fill-opacity="0.03"/>

  <!-- ==================== BOOKS STACK ==================== -->
  <g transform="translate(0, -10)">
    <!-- Bottom Book (Blue/Black) -->
    <path d="M 180 235 L 310 195 L 330 203 L 200 244 Z" fill="#334155"/>
    <path d="M 180 235 L 200 244 L 200 254 L 180 245 Z" fill="#1e293b"/>
    <path d="M 200 244 L 330 203 L 330 212 L 200 254 Z" fill="#e2e8f0"/>

    <!-- Middle Book (Yellow/Gold) -->
    <path d="M 185 205 L 305 170 L 325 178 L 205 214 Z" fill="url(#yellowBookGrad)"/>
    <path d="M 185 205 L 205 214 L 205 224 L 185 215 Z" fill="#b45309"/>
    <path d="M 205 214 L 325 178 L 325 187 L 205 224 Z" fill="#f8fafc"/>
    <path d="M 190 207 L 197 217" stroke="#ffffff" stroke-width="2"/>

    <!-- Top Book (Red) -->
    <path d="M 188 175 L 308 140 L 325 147 L 205 183 Z" fill="url(#redBookGrad)"/>
    <path d="M 188 175 L 205 183 L 205 194 L 188 185 Z" fill="#991b1b"/>
    <path d="M 205 183 L 325 147 L 325 156 L 205 194 Z" fill="#f1f5f9"/>
    <path d="M 193 177 L 200 187" stroke="#fef08a" stroke-width="2.5"/>

    <!-- Diagonal Red Pencil -->
    <g transform="rotate(-28 260 215)">
      <!-- Pencil Body -->
      <rect x="180" y="210" width="135" height="15" rx="3" fill="#dc2626"/>
      <rect x="180" y="210" width="135" height="4" fill="#ef4444"/>
      <rect x="180" y="221" width="135" height="4" fill="#b91c1c"/>
      <!-- Ferrule & Eraser -->
      <rect x="305" y="210" width="8" height="15" fill="#cbd5e1"/>
      <rect x="313" y="210" width="10" height="15" rx="2" fill="#fda4af"/>
      <!-- Sharpened Tip -->
      <polygon points="180,210 160,217.5 180,225" fill="#fde68a"/>
      <polygon points="166,215 160,217.5 166,220" fill="#1e293b"/>
    </g>
  </g>

  <!-- ==================== GRADUATION CAP ==================== -->
  <g transform="translate(0, -15)">
    <!-- Skullcap Base -->
    <path d="M 200 145 Q 250 170 300 145 L 300 165 Q 250 190 200 165 Z" fill="#0f172a"/>
    <path d="M 200 165 Q 250 190 300 165" stroke="#f59e0b" stroke-width="2" fill="none"/>

    <!-- Mortarboard Diamond Top -->
    <polygon points="250,85 365,130 250,175 135,130" fill="url(#capGrad)" stroke="#334155" stroke-width="2"/>
    <polygon points="250,88 360,130 250,172 140,130" fill="none" stroke="#475569" stroke-width="1"/>

    <!-- Center Button -->
    <ellipse cx="250" cy="130" rx="6" ry="4" fill="#f59e0b"/>

    <!-- Golden Tassel Cord & Brush -->
    <path d="M 250 130 Q 305 135 320 165 L 328 200" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
    <!-- Tassel Ring -->
    <rect x="323" y="196" width="10" height="4" rx="1" fill="#d97706"/>
    <!-- Tassel Brush -->
    <polygon points="323,200 333,200 338,225 318,225" fill="url(#goldAccent)"/>
    <line x1="324" y1="200" x2="321" y2="225" stroke="#b45309" stroke-width="1"/>
    <line x1="332" y1="200" x2="335" y2="225" stroke="#b45309" stroke-width="1"/>
  </g>

  <!-- ==================== ROYALPATH TYPOGRAPHY ==================== -->
  <!-- "ROYALPATH" Title -->
  <text x="250" y="295" 
        font-family="'Playfair Display', 'Cinzel', 'Times New Roman', Georgia, serif" 
        font-size="36" 
        font-weight="900" 
        letter-spacing="2"
        text-anchor="middle" 
        fill="#1e3a8a"
        stroke="#ffffff"
        stroke-width="1.5"
        paint-order="stroke fill">
    ROYALPATH
  </text>

  <!-- Decorative Underline Divider -->
  <line x1="160" y1="308" x2="340" y2="308" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="250" cy="308" r="3.5" fill="#1e3a8a"/>

  <!-- "COLLEGE" Subtitle -->
  <text x="250" y="338" 
        font-family="'Cinzel', 'Montserrat', 'Trajan Pro', serif, sans-serif" 
        font-size="24" 
        font-weight="800" 
        letter-spacing="6" 
        text-anchor="middle" 
        fill="#1e3a8a">
    COLLEGE
  </text>

  <!-- ==================== HERALDIC RIBBON BANNER ==================== -->
  <g transform="translate(0, 15)">
    <!-- Ribbon Left Fold / Shadow -->
    <polygon points="85,395 130,370 130,420 85,445" fill="#7f1d1d"/>
    <polygon points="85,445 110,420 85,395" fill="#581c1c"/>

    <!-- Ribbon Right Fold / Shadow -->
    <polygon points="415,395 370,370 370,420 415,445" fill="#7f1d1d"/>
    <polygon points="415,445 390,420 415,395" fill="#581c1c"/>

    <!-- Ribbon Main Curved Body -->
    <path d="M 105 385 Q 250 435 395 385 L 390 435 Q 250 485 110 435 Z" 
          fill="url(#ribbonGrad)" 
          stroke="url(#goldRibbonBorder)" 
          stroke-width="3" 
          filter="url(#shadowEffect)"/>

    <!-- Upper Gold Trim Line -->
    <path d="M 112 391 Q 250 440 388 391" fill="none" stroke="#fde047" stroke-width="1.5"/>
    <!-- Lower Gold Trim Line -->
    <path d="M 116 429 Q 250 478 384 429" fill="none" stroke="#fde047" stroke-width="1.5"/>

    <!-- Motto Text Along Curve Path -->
    <path id="textRibbonPath" d="M 115 425 Q 250 470 385 425" fill="none" stroke="none"/>
    <text font-family="'Playfair Display', 'Cinzel', serif" 
          font-size="19" 
          font-weight="900" 
          letter-spacing="2.5" 
          fill="#ffffff">
      <textPath href="#textRibbonPath" startOffset="50%" text-anchor="middle">
        IN GOD WE TRUST
      </textPath>
    </text>
  </g>
</svg>`;

export const ROYALPATH_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(ROYALPATH_LOGO_SVG)}`;

/**
 * Universal SchoolLogo React component that supports both the official RoyalPath College Crest
 * and custom uploaded logos from Settings, with responsive sizing and elegant fallbacks.
 */
interface SchoolLogoProps {
  src?: string | null;
  className?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  showText?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  src,
  className = 'w-full h-full object-contain',
  alt = 'RoyalPath College Crest',
  size = 'auto',
  showText = false
}) => {
  // If a valid custom logo URL exists (data: or http), render image tag
  const effectiveSrc = src || localStorage.getItem('settings_school_logo') || ROYALPATH_LOGO_DATA_URL;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    auto: ''
  }[size];

  return (
    <div className={`inline-flex items-center justify-center ${sizeClasses}`}>
      <img
        src={effectiveSrc}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // If custom image link fails, fallback directly to the official RoyalPath College vector crest
          const target = e.currentTarget;
          if (target.src !== ROYALPATH_LOGO_DATA_URL) {
            target.src = ROYALPATH_LOGO_DATA_URL;
          }
        }}
      />
      {showText && (
        <span className="font-extrabold text-slate-800 tracking-tight ml-2">RoyalPath College</span>
      )}
    </div>
  );
};

export default SchoolLogo;
