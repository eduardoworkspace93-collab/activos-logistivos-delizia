import React from 'react';

export function FullLogo({ className = '' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 180 70" 
      className={`h-9 w-auto ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Swoosh */}
      <path 
        d="M 155 20 C 130 6, 50 10, 30 35 C 22 45, 32 39, 45 31 C 65 18, 125 16, 155 20 Z" 
        className="fill-[#13519c] dark:fill-white/85" 
      />
      
      {/* Bottom Swoosh */}
      <path 
        d="M 25 50 C 50 64, 130 60, 150 35 C 158 25, 148 31, 135 39 C 115 52, 55 54, 25 50 Z" 
        className="fill-[#13519c] dark:fill-white/85" 
      />
      
      {/* Brand Text */}
      <text 
        x="90" 
        y="45" 
        textAnchor="middle" 
        className="fill-[#13519c] dark:fill-white" 
        fontFamily="'Trebuchet MS', 'Impact', sans-serif" 
        fontWeight="bold" 
        fontStyle="italic" 
        fontSize="24" 
        letterSpacing="-0.5"
      >
        Delizia
      </text>
    </svg>
  );
}

export function MobileIcon({ className = '' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 60 60" 
      className={`h-8 w-8 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Red swoosh at the top */}
      <path 
        d="M 50 20 C 40 8, 20 10, 12 24 C 8 30, 14 26, 20 21 C 28 14, 42 14, 50 20 Z" 
        fill="#e11d48" 
      />
      
      {/* Blue swoosh at the bottom */}
      <path 
        d="M 10 40 C 20 52, 40 50, 48 36 C 52 30, 46 34, 40 39 C 32 46, 18 46, 10 40 Z" 
        className="fill-[#13519c] dark:fill-sky-400" 
      />
      
      {/* Central italic 'D' */}
      <text 
        x="30" 
        y="39" 
        textAnchor="middle" 
        className="fill-[#13519c] dark:fill-white" 
        fontFamily="'Trebuchet MS', 'Impact', sans-serif" 
        fontWeight="bold" 
        fontStyle="italic" 
        fontSize="26"
      >
        D
      </text>
    </svg>
  );
}
