import React from 'react';

interface SunhouseLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const SunhouseLogo: React.FC<SunhouseLogoProps> = ({ 
  className = "h-8 w-auto", 
  width, 
  height 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 240 130" 
      className={className}
      width={width}
      height={height}
      aria-label="SUNHOUSE Logo"
    >
      {/* Teal background block */}
      <rect x="35" y="10" width="170" height="110" rx="20" fill="#0b7a84" />
      
      {/* Red horizontal pill badge */}
      <rect x="10" y="40" width="220" height="50" rx="25" fill="#dc2626" />
      
      {/* White bold text SUNHOUSE® */}
      <text 
        x="115" 
        y="75" 
        fill="#ffffff" 
        fontSize="28" 
        fontWeight="900" 
        fontFamily="Arial, Helvetica, sans-serif" 
        textAnchor="middle"
        letterSpacing="1.5px"
      >
        SUNHOUSE
      </text>
      <text 
        x="208" 
        y="58" 
        fill="#ffffff" 
        fontSize="12" 
        fontWeight="bold" 
        fontFamily="Arial, Helvetica, sans-serif"
      >
        ®
      </text>
    </svg>
  );
};
