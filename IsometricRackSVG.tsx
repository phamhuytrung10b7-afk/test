import React from 'react';
import { InventoryItem } from './types';

export interface IsometricRackSVGProps {
  rackId: string;
  rackDisplayName?: string;
  onDoubleClickRackName?: () => void;
  storageType?: 'bins' | 'pallets' | 'cartons';
  tierCount?: number;
  tierList?: number[];
  itemsPerBay?: number;
  tierColors?: { [tier: number]: string };
  bayNumbers?: string[];
  selectedBay?: string;
  selectedTier?: number;
  selectedSlot?: number;
  onSelectSlot?: (bay: string, tier: number, slot: number) => void;
  onDoubleClickLabel?: (bay: string, tier: number, slot: number) => void;
  getSlotLabel?: (bay: string, tier: number, slot: number) => string;
  getSlotItem?: (bay: string, tier: number, slot: number) => InventoryItem | undefined;
  tagFontSize?: number;
}

export const IsometricRackSVG: React.FC<IsometricRackSVGProps> = ({
  rackId = 'A',
  rackDisplayName,
  onDoubleClickRackName,
  storageType = 'pallets',
  tierCount = 3,
  tierList,
  itemsPerBay,
  tierColors,
  bayNumbers,
  selectedBay = '01',
  selectedTier,
  selectedSlot = 1,
  onSelectSlot,
  onDoubleClickLabel,
  getSlotLabel,
  getSlotItem,
  tagFontSize = 14,
}) => {
  // Safe defaults based on tierCount
  const is4Tier = tierCount === 4 || (tierList && tierList.length === 4);
  const effectiveTierCount = is4Tier ? 4 : 3;
  const effectiveTierList = tierList || (is4Tier ? [4, 3, 2, 1] : [3, 2, 1]);
  
  const defaultBays = is4Tier ? ['01', '02', '03'] : ['01', '02', '03', '04', '05'];
  const safeBayNumbers = Array.isArray(bayNumbers) && bayNumbers.length > 0 ? bayNumbers : defaultBays;
  
  const defaultItemsPerBay = is4Tier ? 3 : 2;
  const safeItemsPerBay = Number(itemsPerBay) > 0 ? Number(itemsPerBay) : defaultItemsPerBay;
  
  const safeStorageType = storageType || 'pallets';

  const defaultColors: { [tier: number]: string } = is4Tier
    ? {
        4: '#eab308', // Tầng 4: Vàng (Cao nhất)
        3: '#ea580c', // Tầng 3: Cam
        2: '#2563eb', // Tầng 2: Xanh Dương
        1: '#dc2626', // Tầng 1: Đỏ (Ground)
      }
    : {
        3: '#eab308', // Tầng 3: Vàng / Cam
        2: '#2563eb', // Tầng 2: Xanh Dương
        1: '#dc2626', // Tầng 1: Đỏ (Ground)
      };

  const activeTierColors = tierColors || defaultColors;

  const displayTitle = rackDisplayName || (rackId.toUpperCase().startsWith('KỆ') || rackId.toUpperCase().startsWith('DÃY') ? rackId : `KỆ ${rackId}`);
  const titleBadgeWidth = Math.min(114, Math.max(104, displayTitle.length * 9 + 28));

  // Layout math calculations - Calibrated for 1080x800 (1.35 aspect ratio matching 270x200mm PDF frame)
  const numBays = safeBayNumbers.length;
  const startX = 126;
  const totalRackWidth = 930;
  const baySpacing = totalRackWidth / numBays;
  const usableBayWidth = baySpacing - 14;

  // Upright Posts X coordinates
  const postPositions: number[] = [];
  for (let i = 0; i <= numBays; i++) {
    postPositions.push(startX - 10 + i * baySpacing);
  }

  // Beam and Container Y coordinates (Shifted down to accommodate top title banner)
  const beamYLevels: { [tier: number]: number } = is4Tier
    ? { 4: 204, 3: 334, 2: 464, 1: 594 }
    : { 3: 232, 2: 410, 1: 588 };

  const containerYOffsets: { [tier: number]: number } = is4Tier
    ? { 4: 104, 3: 234, 2: 364, 1: 494 }
    : { 3: 106, 2: 284, 1: 462 };

  // Box heights
  const boxHeight = is4Tier ? 74 : 96;
  const binHeight = is4Tier ? 82 : 106;
  const cartonHeight = is4Tier ? 86 : 112;
  const totalContainerHeight = is4Tier ? 100 : 126;

  return (
    <svg 
      viewBox="0 0 1080 800" 
      className="w-full h-auto select-none"
    >
      <defs>
        {/* Clean Industrial Soft Shadow Filter */}
        <filter id="cadShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="5" stdDeviation="3" floodOpacity="0.18" floodColor="#0f172a" />
        </filter>
        <filter id="targetGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="lightGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ffffff" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* 0. TOP CENTER MAIN BANNER TITLE (BRIGHT & CRISP FOR PRINTING) */}
      <g id="top-center-main-title">
        <rect 
          x="240" 
          y="6" 
          width="600" 
          height="38" 
          rx="8" 
          fill="#ffffff" 
          stroke="#ea580c" 
          strokeWidth="2.5" 
          filter="url(#cadShadow)" 
        />
        {/* Left and Right Orange Accent Tags */}
        <rect x="248" y="12" width="24" height="26" rx="5" fill="#ea580c" />
        <path d="M255,19 L262,25 L255,31" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        <rect x="808" y="12" width="24" height="26" rx="5" fill="#ea580c" />
        <path d="M815,19 L822,25 L815,31" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        <text 
          x="540" 
          y="31" 
          fill="#0f172a" 
          fontSize="18" 
          fontWeight="900" 
          textAnchor="middle" 
          letterSpacing="1.5"
        >
          SƠ ĐỒ VỊ TRÍ {displayTitle.toUpperCase()}
        </text>
      </g>

      {/* 1. GROUND ISOMETRIC 5S SAFETY ZONE & HORIZONTAL DIRECTIONAL FLOW ARROWS */}
      <g id="ground-5s-floor">
        <polygon 
          points="10,642 1070,642 1045,785 5,785" 
          fill="#fef08a" 
          stroke="#ca8a04" 
          strokeWidth="3" 
          strokeDasharray="14 7"
        />
        <text x="540" y="670" fill="#854d0e" fontSize="13" fontWeight="900" letterSpacing="1.5" textAnchor="middle">
          ⚠️ MẶT ĐẤT (TẦNG 1) — VẠCH SƠN AN TOÀN 5S KHO BÌNH DƯƠNG ({displayTitle} • {effectiveTierCount} TẦNG • {numBays} KHOANG)
        </text>

        {/* Continuous Horizontal 5S Directional Flow Arrows (Left to Right) */}
        <g id="floor-directional-flow-arrows">
          {[...Array(12)].map((_, idx) => {
            const arrowX = 40 + idx * 84;
            return (
              <g key={`floor-arrow-${idx}`} transform={`translate(${arrowX}, 706)`}>
                {/* 3D Drop Shadow / Border Base */}
                <polygon 
                  points="0,8 38,8 54,22 38,36 0,36 14,22" 
                  fill="#ca8a04" 
                  stroke="#854d0e" 
                  strokeWidth="1.8" 
                  filter="url(#cadShadow)"
                />
                {/* Vibrant Yellow Top Face */}
                <polygon 
                  points="4,12 36,12 48,22 36,32 4,32 15,22" 
                  fill="#eab308" 
                />
                {/* Bright Highlight Rim */}
                <polyline 
                  points="5,13 35,13 46,22" 
                  fill="none" 
                  stroke="#fef9c3" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                />
              </g>
            );
          })}
        </g>
      </g>

      {/* 2. FLOATING RACK CALLOUT BADGE - TOP-LEFT CORNER (CLEANLY SIZED & POSITIONED) */}
      <g 
        id="floating-rack-badge" 
        transform="translate(6, 50)"
        className="cursor-pointer group/racktitle transition-all"
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (onDoubleClickRackName) onDoubleClickRackName();
        }}
        title="Kích đúp vào đây để đổi tên kệ"
      >
        <rect 
          x="0" 
          y="0" 
          width={titleBadgeWidth} 
          height="42" 
          rx="9" 
          fill="#ea580c" 
          stroke="#ffffff" 
          strokeWidth="2.5" 
          filter="url(#cadShadow)" 
          className="group-hover/racktitle:fill-orange-600 transition-colors"
        />
        <text 
          x={titleBadgeWidth / 2} 
          y="27" 
          fill="#ffffff" 
          fontSize={displayTitle.length > 8 ? "14.5" : "17"} 
          fontWeight="900" 
          textAnchor="middle"
          letterSpacing="0.5"
        >
          {displayTitle}
        </text>
        <circle cx={titleBadgeWidth - 8} cy="9" r="2.5" fill="#ffffff" opacity="0.6" className="group-hover/racktitle:opacity-100" />
      </g>

      {/* 3. TOP BAY HEADERS (KHOANG 01 .. KHOANG 0N) */}
      <g id="bay-column-headers">
        {safeBayNumbers.map((bay, idx) => {
          const bayX = startX + idx * baySpacing;
          const isSelected = selectedBay === bay;
          return (
            <g 
              key={`head-bay-${bay}`} 
              transform={`translate(${bayX}, 50)`} 
              className={onSelectSlot ? "cursor-pointer group/bayhead" : ""} 
              onClick={() => onSelectSlot && selectedTier && selectedSlot && onSelectSlot(bay, selectedTier, selectedSlot)}
            >
              <rect 
                x="0" 
                y="0" 
                width={usableBayWidth} 
                height="42" 
                rx="9" 
                fill={isSelected ? '#0d9488' : '#0f172a'} 
                stroke={isSelected ? '#facc15' : '#475569'} 
                strokeWidth={isSelected ? '3' : '1.5'} 
                filter="url(#cadShadow)"
              />
              <text x={usableBayWidth / 2} y="27" fill={isSelected ? '#ffffff' : '#94a3b8'} fontSize="14.5" fontWeight="900" textAnchor="middle">
                KHOANG {bay}
              </text>
              {isSelected && (
                <polygon points={`${usableBayWidth / 2 - 9},42 ${usableBayWidth / 2 + 9},42 ${usableBayWidth / 2},52`} fill="#0d9488" />
              )}
            </g>
          );
        })}
      </g>

      {/* 4. ROW TIER LABELS ON THE LEFT (FULL FRAME, UNCLIPPED, WITH MARGINS) */}
      <g id="tier-row-headers">
        {effectiveTierList.map((tier) => {
          const isSelected = selectedTier === tier;
          const labelY = is4Tier
            ? (tier === 4 ? 114 : tier === 3 ? 244 : tier === 2 ? 374 : 504)
            : (tier === 3 ? 128 : tier === 2 ? 306 : 484);
          
          let tierName = `TẦNG ${tier}`;
          let tierSub = tier === 1 ? 'MẶT ĐẤT' : tier === effectiveTierCount ? 'Mức A (Cao)' : tier === 3 ? 'Mức B (Trên)' : 'Mức C (Giữa)';
          let bgFill = tier === 1 ? '#fee2e2' : tier === 2 ? '#dbeafe' : tier === 3 ? (is4Tier ? '#ffedd5' : '#fef3c7') : '#fef3c7';
          let borderCol = tier === 1 ? '#dc2626' : tier === 2 ? '#2563eb' : tier === 3 ? (is4Tier ? '#ea580c' : '#d97706') : '#d97706';
          let textCol = tier === 1 ? '#991b1b' : tier === 2 ? '#1e3a8a' : tier === 3 ? (is4Tier ? '#9a3412' : '#78350f') : '#78350f';

          return (
            <g 
              key={`tier-btn-${tier}`}
              transform={`translate(6, ${labelY})`} 
              className={onSelectSlot ? "cursor-pointer group/tier" : ""} 
              onClick={() => onSelectSlot && selectedBay && selectedSlot && onSelectSlot(selectedBay, tier, selectedSlot)}
            >
              <rect 
                x="0" 
                y="0" 
                width="106" 
                height={is4Tier ? "46" : "52"} 
                rx="8" 
                fill={isSelected ? '#0f172a' : bgFill} 
                stroke={isSelected ? '#38bdf8' : borderCol} 
                strokeWidth={isSelected ? '2.5' : '2'} 
                filter="url(#cadShadow)" 
              />
              <text x="53" y={is4Tier ? "18" : "22"} fill={isSelected ? '#38bdf8' : textCol} fontSize="13" fontWeight="900" textAnchor="middle">
                {tierName}
              </text>
              <text x="53" y={is4Tier ? "34" : "41"} fill={isSelected ? '#ffffff' : textCol} fontSize={is4Tier ? "9.5" : "10.5"} fontWeight="800" textAnchor="middle">
                {tierSub}
              </text>
            </g>
          );
        })}
      </g>

      {/* 5. STEEL INDUSTRIAL RACK FRAMEWORK */}
      <g id="steel-rack-structure">
        {/* Rear posts */}
        {postPositions.map((postX, i) => (
          <rect key={`rear-post-${i}`} x={postX - 10} y="90" width="12" height="520" fill="#1e293b" opacity="0.6" />
        ))}

        {/* Rear cross bracing */}
        {postPositions.slice(0, -1).map((px, i) => (
          <g key={`brace-${i}`} opacity="0.45">
            {is4Tier ? (
              <>
                <line x1={px - 10} y1="98" x2={px - 10 + baySpacing} y2="204" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="204" x2={px - 10 + baySpacing} y2="98" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="204" x2={px - 10 + baySpacing} y2="334" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="334" x2={px - 10 + baySpacing} y2="204" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="334" x2={px - 10 + baySpacing} y2="464" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="464" x2={px - 10 + baySpacing} y2="334" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="464" x2={px - 10 + baySpacing} y2="594" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="594" x2={px - 10 + baySpacing} y2="464" stroke="#475569" strokeWidth="2.5" />
              </>
            ) : (
              <>
                <line x1={px - 10} y1="100" x2={px - 10 + baySpacing} y2="232" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="232" x2={px - 10 + baySpacing} y2="100" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="232" x2={px - 10 + baySpacing} y2="410" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="410" x2={px - 10 + baySpacing} y2="232" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="410" x2={px - 10 + baySpacing} y2="588" stroke="#475569" strokeWidth="2.5" />
                <line x1={px - 10} y1="588" x2={px - 10 + baySpacing} y2="410" stroke="#475569" strokeWidth="2.5" />
              </>
            )}
          </g>
        ))}

        {/* Front upright posts */}
        {postPositions.map((postX, i) => (
          <g key={`front-post-${i}`}>
            <polygon points={`${postX},98 ${postX - 10},88 ${postX - 10},600 ${postX},610`} fill="#1e293b" />
            <rect x={postX} y="98" width="16" height="512" fill={safeStorageType === 'bins' ? '#334155' : '#2563eb'} stroke="#1d4ed8" strokeWidth="1.2" filter="url(#cadShadow)" />
            {[...Array(is4Tier ? 32 : 28)].map((_, j) => (
              <circle key={`hole-${j}`} cx={postX + 8} cy={108 + j * 18} r="2" fill="#0f172a" />
            ))}
          </g>
        ))}

        {/* Front Load Beams (Orange Heavy Duty Beams) - Skip Tier 1 (ground level) */}
        {Object.entries(beamYLevels).map(([tierStr, beamY], i) => {
          const tier = Number(tierStr);
          if (tier === 1) return null; // Ground level has no raised beam
          return (
            <g key={`beam-level-${i}`}>
              <polygon points={`${startX - 1},${beamY} ${startX - 11},${beamY - 10} ${startX + totalRackWidth - 1},${beamY - 10} ${startX + totalRackWidth + 9},${beamY}`} fill={safeStorageType === 'bins' ? '#334155' : '#c2410c'} />
              <rect x={startX - 1} y={beamY} width={totalRackWidth + 10} height={is4Tier ? 20 : 24} fill={safeStorageType === 'bins' ? '#475569' : '#ea580c'} stroke="#1e293b" strokeWidth="1.2" filter="url(#cadShadow)" />
            </g>
          );
        })}
      </g>

      {/* 5S RED ANDON SIGNBOARD (FOR PLASTIC BINS) */}
      {safeStorageType === 'bins' && (
        <g id="bin-rack-andon-signboard" transform="translate(68, 190)">
          <rect x="-35" y="0" width="44" height="180" rx="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.8" filter="url(#cadShadow)" />
          <rect x="-33" y="5" width="40" height="22" rx="3" fill="#7f1d1d" />
          <text x="-13" y="20" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">5S ANDON</text>

          {/* 3 Status Lights */}
          <g transform="translate(-13, 48)">
            <circle cx="0" cy="0" r="8.5" fill="#15803d" stroke="#14532d" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="6.5" fill="#22c55e" filter="url(#lightGlow)" />
            <circle cx="-2" cy="-2" r="2.5" fill="#ffffff" opacity="0.8" />
          </g>
          <g transform="translate(-13, 76)">
            <circle cx="0" cy="0" r="8.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="6.5" fill="#f8fafc" />
            <circle cx="-2" cy="-2" r="2.5" fill="#ffffff" opacity="0.9" />
          </g>
          <g transform="translate(-13, 104)">
            <circle cx="0" cy="0" r="8.5" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="6.5" fill="#facc15" filter="url(#lightGlow)" />
            <circle cx="-2" cy="-2" r="2.5" fill="#ffffff" opacity="0.8" />
          </g>

          <line x1="-31" y1="128" x2="5" y2="128" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
          <text x="-13" y="145" fill="#fef08a" fontSize="9" fontWeight="900" textAnchor="middle">{rackId}</text>
          <text x="-13" y="158" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">KHAY LINH KIỆN</text>
          {/* Small Sunhouse Brand Badge on Andon Signboard */}
          <g transform="translate(-25, 163) scale(0.24)">
            <rect x="35" y="10" width="170" height="110" rx="20" fill="#0b7a84" />
            <rect x="10" y="40" width="220" height="50" rx="25" fill="#dc2626" />
            <text x="115" y="75" fill="#ffffff" fontSize="28" fontWeight="900" fontFamily="Arial, sans-serif" textAnchor="middle">SUNHOUSE</text>
          </g>
        </g>
      )}

      {/* 6. 3D PALLETS, BINS & LOCATION LABELS LAYER */}
      <g id="storage-containers-layer">
        {effectiveTierList.map((tier) => {
          const tierYOffset = containerYOffsets[tier] || 90;
          
          // Color shading for boxes
          const tierBaseColor = activeTierColors[tier] || (tier === 4 ? '#eab308' : tier === 3 ? '#ea580c' : tier === 2 ? '#2563eb' : '#dc2626');
          const topFaceColor = tier === 4 ? '#fef08a' : tier === 3 ? (is4Tier ? '#fed7aa' : '#fef08a') : tier === 2 ? '#93c5fd' : '#fca5a5';
          const sideFaceColor = tier === 4 ? '#ca8a04' : tier === 3 ? (is4Tier ? '#c2410c' : '#ca8a04') : tier === 2 ? '#1d4ed8' : '#b91c1c';
          const borderColor = tier === 4 ? '#854d0e' : tier === 3 ? (is4Tier ? '#7c2d12' : '#854d0e') : tier === 2 ? '#172554' : '#7f1d1d';
          
          return safeBayNumbers.map((bay, bIdx) => {
            const bayXOffset = startX + bIdx * baySpacing;
            const gap = 10;
            const containerWidth = safeItemsPerBay > 0 ? (usableBayWidth - (safeItemsPerBay + 1) * gap) / safeItemsPerBay : 74;
            
            return [...Array(safeItemsPerBay)].map((_, slotIdx) => {
              const slotNum = slotIdx + 1;
              const slotX = bayXOffset + gap + slotIdx * (containerWidth + gap);
              const isSlotSelected = selectedBay === bay && selectedTier === tier && selectedSlot === slotNum;
              
              // Safe label string calculation
              let slotLabelText = '';
              if (getSlotLabel) {
                try {
                  slotLabelText = String(getSlotLabel(bay, tier, slotNum) || '');
                } catch {
                  slotLabelText = '';
                }
              }
              if (!slotLabelText) {
                const seq = bIdx * (effectiveTierCount * safeItemsPerBay) + (tier - 1) * safeItemsPerBay + slotNum;
                slotLabelText = `G${seq < 10 ? '0' + seq : seq}`;
              }

              // Location tag badge positioned directly on the front face of the orange beam below each pallet position
              const badgeW = Math.max(52, Math.min(containerWidth, slotLabelText.length * (tagFontSize * 0.78) + 14));
              const badgeH = is4Tier ? 20 : 22;
              const badgeX = containerWidth / 2 - badgeW / 2;
              const badgeY = is4Tier ? 100 : 126;

              return (
                <g 
                  key={`container-${bay}-${tier}-${slotNum}`}
                  transform={`translate(${slotX}, ${tierYOffset})`}
                  className="transition-transform duration-200"
                >
                  {/* SELECTED BOX HIGHLIGHT: CYAN DASHED RECTANGLE */}
                  {isSlotSelected && (
                    <rect 
                      x="-3" 
                      y="-3" 
                      width={containerWidth + 6} 
                      height={is4Tier ? "124" : "152"} 
                      fill="none" 
                      stroke="#06b6d4" 
                      strokeWidth="3.5" 
                      strokeDasharray="7 4" 
                      rx="6" 
                      filter="url(#targetGlow)" 
                    />
                  )}

                  {/* STORAGE TYPE: BINS (THÙNG NHỰA 5S) */}
                  {safeStorageType === 'bins' && (
                    <g 
                      id={`bin-${bay}-${tier}-${slotNum}`}
                      className={onSelectSlot ? "cursor-pointer group/bin" : ""}
                      onClick={() => onSelectSlot && onSelectSlot(bay, tier, slotNum)}
                    >
                      {/* Rear shadow & top opening rim */}
                      <polygon points={`2,22 12,0 ${containerWidth + 8},0 ${containerWidth - 2},22`} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1.2" />
                      <polygon points={`6,19 14,4 ${containerWidth + 4},4 ${containerWidth - 6},19`} fill="#0f172a" fillOpacity="0.35" />
                      
                      {/* Main Front Body */}
                      <rect x="2" y="22" width={containerWidth - 4} height={binHeight} rx="4" fill="#1e40af" stroke="#172554" strokeWidth="1.5" filter="url(#cadShadow)" />
                      
                      {/* Right 3D Side Face */}
                      <polygon points={`${containerWidth - 2},22 ${containerWidth + 8},0 ${containerWidth + 8},${binHeight} ${containerWidth - 2},${binHeight + 22}`} fill="#1d4ed8" stroke="#172554" strokeWidth="1.2" />
                      
                      {/* Molded Hand Grip */}
                      <rect x={containerWidth / 2 - 14} y="30" width="28" height="9" rx="4.5" fill="#0f172a" stroke="#1e3a8a" strokeWidth="1.2" />
                      
                      {/* Structural Ribs */}
                      <line x1="6" y1="46" x2={containerWidth - 6} y2="46" stroke="#172554" strokeWidth="1.6" />
                      <line x1="6" y1={is4Tier ? 64 : 78} x2={containerWidth - 6} y2={is4Tier ? 64 : 78} stroke="#172554" strokeWidth="1.6" />
                      <line x1="6" y1={is4Tier ? 96 : 112} x2={containerWidth - 6} y2={is4Tier ? 96 : 112} stroke="#172554" strokeWidth="2" />
                    </g>
                  )}

                  {/* STORAGE TYPE: PALLETS */}
                  {safeStorageType === 'pallets' && (
                    <g 
                      id={`pallet-${bay}-${tier}-${slotNum}`}
                      className={onSelectSlot ? "cursor-pointer group/pallet" : ""}
                      onClick={() => onSelectSlot && onSelectSlot(bay, tier, slotNum)}
                    >
                      {/* Top oblique slope */}
                      <polygon 
                        points={`2,12 12,0 ${containerWidth + 8},0 ${containerWidth - 2},12`} 
                        fill={topFaceColor} 
                        stroke={borderColor} 
                        strokeWidth="1" 
                      />
                      {/* Main Cargo Box */}
                      <rect 
                        x="2" 
                        y="12" 
                        width={containerWidth - 4} 
                        height={boxHeight} 
                        rx="3" 
                        fill={tierBaseColor} 
                        stroke={borderColor} 
                        strokeWidth="1.4" 
                        filter="url(#cadShadow)" 
                      />
                      {/* Right side oblique slope */}
                      <polygon 
                        points={`${containerWidth - 2},12 ${containerWidth + 8},0 ${containerWidth + 8},${boxHeight} ${containerWidth - 2},${boxHeight + 12}`} 
                        fill={sideFaceColor} 
                        stroke={borderColor} 
                        strokeWidth="1" 
                      />
                      {/* Center vertical yellow strap */}
                      <line 
                        x1={(containerWidth - 4) / 2 + 2} 
                        y1="12" 
                        x2={(containerWidth - 4) / 2 + 2} 
                        y2={boxHeight + 12} 
                        stroke="#fef08a" 
                        strokeWidth="3.5" 
                        opacity="0.9" 
                      />
                      
                      {/* Pallet Wooden Base */}
                      <rect x="0" y={boxHeight + 12} width={containerWidth + 6} height={is4Tier ? "5" : "6"} fill="#b45309" stroke="#78350f" strokeWidth="1" rx="1.5" />
                      <rect x="2" y={boxHeight + (is4Tier ? 17 : 18)} width="9" height={is4Tier ? "6" : "8"} fill="#78350f" />
                      <rect x={containerWidth / 2 - 4.5} y={boxHeight + (is4Tier ? 17 : 18)} width="9" height={is4Tier ? "6" : "8"} fill="#78350f" />
                      <rect x={containerWidth - 6} y={boxHeight + (is4Tier ? 17 : 18)} width="9" height={is4Tier ? "6" : "8"} fill="#78350f" />
                      <rect x="0" y={boxHeight + (is4Tier ? 23 : 26)} width={containerWidth + 6} height={is4Tier ? "3" : "4"} fill="#b45309" stroke="#78350f" />
                    </g>
                  )}

                  {/* STORAGE TYPE: CARTONS */}
                  {safeStorageType === 'cartons' && (
                    <g 
                      id={`carton-${bay}-${tier}-${slotNum}`}
                      className={onSelectSlot ? "cursor-pointer group/carton" : ""}
                      onClick={() => onSelectSlot && onSelectSlot(bay, tier, slotNum)}
                    >
                      <polygon points={`2,12 12,0 ${containerWidth + 8},0 ${containerWidth - 2},12`} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                      <rect x="2" y="12" width={containerWidth - 4} height={cartonHeight} rx="3" fill="#f8fafc" stroke="#64748b" strokeWidth="1.4" filter="url(#cadShadow)" />
                      <polygon points={`${containerWidth - 2},12 ${containerWidth + 8},0 ${containerWidth + 8},${cartonHeight} ${containerWidth - 2},${cartonHeight + 12}`} fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                      <line x1={(containerWidth - 4) / 2 + 2} y1="12" x2={(containerWidth - 4) / 2 + 2} y2={cartonHeight + 12} stroke="#94a3b8" strokeWidth="3" opacity="0.6" strokeDasharray="6 3" />
                    </g>
                  )}

                  {/* POSITION NAME TAG — HIGH CONTRAST WHITE BADGE ON THE ORANGE BEAM */}
                  <g 
                    className={onSelectSlot ? "cursor-pointer group/label" : ""}
                    onDoubleClick={(e) => {
                      if (onDoubleClickLabel) {
                        e.stopPropagation();
                        onDoubleClickLabel(bay, tier, slotNum);
                      }
                    }}
                    onClick={(e) => {
                      if (onSelectSlot) {
                        e.stopPropagation();
                        onSelectSlot(bay, tier, slotNum);
                      }
                    }}
                  >
                    {/* Glow on hover */}
                    <rect 
                      x={badgeX - 2} 
                      y={badgeY - 2} 
                      width={badgeW + 4} 
                      height={badgeH + 4} 
                      rx="5" 
                      fill="#f59e0b" 
                      opacity="0" 
                      className="group-hover/label:opacity-90 transition-opacity" 
                    />
                    {/* Clean High-Contrast Industrial Shelf Label */}
                    <rect 
                      x={badgeX} 
                      y={badgeY} 
                      width={badgeW} 
                      height={badgeH} 
                      rx="4" 
                      fill="#ffffff" 
                      stroke="#0f172a" 
                      strokeWidth="1.8" 
                      filter="url(#cadShadow)" 
                    />
                    {/* Label Text */}
                    <text 
                      x={containerWidth / 2} 
                      y={badgeY + badgeH / 2 + (tagFontSize * 0.36)} 
                      fill="#0f172a" 
                      fontSize={tagFontSize} 
                      fontWeight="900" 
                      textAnchor="middle" 
                      fontFamily="monospace, sans-serif"
                    >
                      {slotLabelText}
                    </text>
                  </g>
                </g>
              );
            });
          });
        })}
      </g>
    </svg>
  );
};

export default IsometricRackSVG;
