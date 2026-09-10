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
  const titleBadgeWidth = Math.min(380, Math.max(90, displayTitle.length * 9.5 + 24));

  // Layout math calculations
  const numBays = safeBayNumbers.length;
  const totalRackWidth = 860;
  const startX = 95;
  const baySpacing = totalRackWidth / numBays;
  const usableBayWidth = baySpacing - 15;

  // Upright Posts X coordinates
  const postPositions: number[] = [];
  for (let i = 0; i <= numBays; i++) {
    postPositions.push(80 + i * baySpacing);
  }

  // Beam and Container Y coordinates
  const beamYLevels: { [tier: number]: number } = is4Tier
    ? { 4: 140, 3: 240, 2: 340, 1: 440 }
    : { 3: 180, 2: 305, 1: 430 };

  const containerYOffsets: { [tier: number]: number } = is4Tier
    ? { 4: 58, 3: 158, 2: 258, 1: 358 }
    : { 3: 84, 2: 209, 1: 334 };

  // Box heights
  const boxHeight = is4Tier ? 54 : 66;
  const binHeight = is4Tier ? 64 : 76;
  const cartonHeight = is4Tier ? 70 : 84;
  const totalContainerHeight = is4Tier ? 82 : 96;

  return (
    <svg 
      viewBox="-40 -45 1110 600" 
      className="w-full h-auto overflow-visible select-none"
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

      {/* 1. GROUND ISOMETRIC 5S SAFETY ZONE & FLOOR BAY MARKERS */}
      <g id="ground-5s-floor">
        <polygon 
          points={`20,${is4Tier ? 470 : 460} 995,${is4Tier ? 470 : 460} 965,${is4Tier ? 535 : 525} -15,${is4Tier ? 535 : 525}`} 
          fill="#fef08a" 
          stroke="#ca8a04" 
          strokeWidth="2.5" 
          strokeDasharray="12 6"
        />
        <text x="490" y={is4Tier ? 485 : 476} fill="#854d0e" fontSize="11" fontWeight="900" letterSpacing="1.5" textAnchor="middle">
          ⚠️ MẶT ĐẤT (TẦNG 1) — VẠCH SƠN AN TOÀN 5S KHO BÌNH DƯƠNG ({displayTitle} • {effectiveTierCount} TẦNG • {numBays} KHOANG)
        </text>

        {/* 5S Yellow Floor Directional Navigation Arrow */}
        <g id="floor-navigation-arrow" transform={`translate(15, ${is4Tier ? 490 : 482})`}>
          <polygon 
            points="0,12 28,12 28,4 48,18 28,32 28,24 0,24" 
            fill="#eab308" 
            stroke="#854d0e" 
            strokeWidth="1.5" 
            filter="url(#cadShadow)"
          />
        </g>

        {safeBayNumbers.map((bay, idx) => {
          const bayCenterX = startX + idx * baySpacing + usableBayWidth / 2;
          return (
            <g key={`floor-badge-bay-${bay}`} transform={`translate(${bayCenterX - 22}, ${is4Tier ? 498 : 490})`}>
              <rect x="0" y="0" width="44" height="22" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" filter="url(#cadShadow)" />
              <text x="22" y="15" fill="#ffffff" fontSize="11.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                {bay}
              </text>
            </g>
          );
        })}
      </g>

      {/* 2. FLOATING RACK CALLOUT BADGE - TOP-LEFT CORNER */}
      <g 
        id="floating-rack-badge" 
        transform="translate(-25, -35)"
        className="cursor-pointer group/racktitle transition-all"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClickRackName?.();
        }}
        title="Kích đúp vào đây để đổi tên kệ"
      >
        <rect 
          x="0" 
          y="0" 
          width={titleBadgeWidth} 
          height="32" 
          rx="9" 
          fill="#ea580c" 
          stroke="#ffffff" 
          strokeWidth="2" 
          filter="url(#cadShadow)" 
          className="group-hover/racktitle:fill-orange-600 transition-colors"
        />
        <text 
          x={titleBadgeWidth / 2} 
          y="21" 
          fill="#ffffff" 
          fontSize="12.5" 
          fontWeight="900" 
          textAnchor="middle"
        >
          {displayTitle}
        </text>
        <circle cx={titleBadgeWidth - 8} cy="8" r="2.5" fill="#ffffff" opacity="0.6" className="group-hover/racktitle:opacity-100" />
      </g>

      {/* 3. TOP BAY HEADERS (KHOANG 01 .. KHOANG 0N) */}
      <g id="bay-column-headers">
        {safeBayNumbers.map((bay, idx) => {
          const bayX = startX + idx * baySpacing;
          const isSelected = selectedBay === bay;
          return (
            <g 
              key={`head-bay-${bay}`} 
              transform={`translate(${bayX}, -35)`} 
              className={onSelectSlot ? "cursor-pointer group/bayhead" : ""} 
              onClick={() => onSelectSlot && selectedTier && selectedSlot && onSelectSlot(bay, selectedTier, selectedSlot)}
            >
              <rect 
                x="0" 
                y="0" 
                width={usableBayWidth} 
                height="32" 
                rx="8" 
                fill={isSelected ? '#0d9488' : '#0f172a'} 
                stroke={isSelected ? '#facc15' : '#475569'} 
                strokeWidth={isSelected ? '3' : '1.5'} 
                filter="url(#cadShadow)"
              />
              <text x={usableBayWidth / 2} y="21" fill={isSelected ? '#ffffff' : '#94a3b8'} fontSize="13" fontWeight="900" textAnchor="middle">
                KHOANG {bay}
              </text>
              {isSelected && (
                <polygon points={`${usableBayWidth / 2 - 8},32 ${usableBayWidth / 2 + 8},32 ${usableBayWidth / 2},41`} fill="#0d9488" />
              )}
            </g>
          );
        })}
      </g>

      {/* 4. ROW TIER LABELS ON THE LEFT */}
      <g id="tier-row-headers">
        {effectiveTierList.map((tier) => {
          const isSelected = selectedTier === tier;
          const beamY = beamYLevels[tier] || 180;
          const labelY = beamY - (is4Tier ? 75 : 85);
          
          let tierName = `TẦNG ${tier}`;
          let tierSub = tier === 1 ? 'MẶT ĐẤT' : tier === effectiveTierCount ? 'Mức A (Cao)' : tier === 3 ? 'Mức B (Trên)' : 'Mức C (Giữa)';
          let bgFill = tier === 1 ? '#fee2e2' : tier === 2 ? '#dbeafe' : tier === 3 ? (is4Tier ? '#ffedd5' : '#fef3c7') : '#fef3c7';
          let borderCol = tier === 1 ? '#dc2626' : tier === 2 ? '#2563eb' : tier === 3 ? (is4Tier ? '#ea580c' : '#d97706') : '#d97706';
          let textCol = tier === 1 ? '#991b1b' : tier === 2 ? '#1e3a8a' : tier === 3 ? (is4Tier ? '#9a3412' : '#78350f') : '#78350f';

          return (
            <g 
              key={`tier-btn-${tier}`}
              transform={`translate(-30, ${labelY})`} 
              className={onSelectSlot ? "cursor-pointer group/tier" : ""} 
              onClick={() => onSelectSlot && selectedBay && selectedSlot && onSelectSlot(selectedBay, tier, selectedSlot)}
            >
              <rect 
                x="0" 
                y="0" 
                width="75" 
                height={is4Tier ? "38" : "42"} 
                rx="8" 
                fill={isSelected ? '#0f172a' : bgFill} 
                stroke={isSelected ? '#38bdf8' : borderCol} 
                strokeWidth={isSelected ? '2.5' : '2'} 
                filter="url(#cadShadow)" 
              />
              <text x="37.5" y={is4Tier ? "16" : "18"} fill={isSelected ? '#38bdf8' : textCol} fontSize="11" fontWeight="900" textAnchor="middle">
                {tierName}
              </text>
              <text x="37.5" y={is4Tier ? "29" : "32"} fill={isSelected ? '#ffffff' : textCol} fontSize={is4Tier ? "8.5" : "9.5"} fontWeight="800" textAnchor="middle">
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
          <rect key={`rear-post-${i}`} x={postX - 10} y={is4Tier ? "35" : "45"} width="10" height={is4Tier ? "415" : "400"} fill="#1e293b" opacity="0.6" />
        ))}

        {/* Rear cross bracing */}
        {postPositions.slice(0, -1).map((px, i) => (
          <g key={`brace-${i}`} opacity="0.45">
            {is4Tier ? (
              <>
                <line x1={px - 10} y1="45" x2={px - 10 + baySpacing} y2="140" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="140" x2={px - 10 + baySpacing} y2="45" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="140" x2={px - 10 + baySpacing} y2="240" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="240" x2={px - 10 + baySpacing} y2="140" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="240" x2={px - 10 + baySpacing} y2="340" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="340" x2={px - 10 + baySpacing} y2="240" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="340" x2={px - 10 + baySpacing} y2="440" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="440" x2={px - 10 + baySpacing} y2="340" stroke="#475569" strokeWidth="2" />
              </>
            ) : (
              <>
                <line x1={px - 10} y1="60" x2={px - 10 + baySpacing} y2="180" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="180" x2={px - 10 + baySpacing} y2="60" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="180" x2={px - 10 + baySpacing} y2="305" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="305" x2={px - 10 + baySpacing} y2="180" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="305" x2={px - 10 + baySpacing} y2="430" stroke="#475569" strokeWidth="2" />
                <line x1={px - 10} y1="430" x2={px - 10 + baySpacing} y2="305" stroke="#475569" strokeWidth="2" />
              </>
            )}
          </g>
        ))}

        {/* Front upright posts */}
        {postPositions.map((postX, i) => (
          <g key={`front-post-${i}`}>
            <polygon points={`${postX},${is4Tier ? 45 : 55} ${postX - 10},${is4Tier ? 35 : 45} ${postX - 10},${is4Tier ? 450 : 445} ${postX},${is4Tier ? 460 : 455}`} fill="#1e293b" />
            <rect x={postX} y={is4Tier ? 45 : 55} width="15" height={is4Tier ? 415 : 400} fill={safeStorageType === 'bins' ? '#334155' : '#2563eb'} stroke="#1d4ed8" strokeWidth="1" filter="url(#cadShadow)" />
            {[...Array(is4Tier ? 28 : 25)].map((_, j) => (
              <circle key={`hole-${j}`} cx={postX + 7.5} cy={(is4Tier ? 55 : 65) + j * 14} r="1.5" fill="#0f172a" />
            ))}
          </g>
        ))}

        {/* Front Load Beams (Orange Heavy Duty Beams) - Skip Tier 1 (ground level) */}
        {Object.entries(beamYLevels).map(([tierStr, beamY], i) => {
          const tier = Number(tierStr);
          if (tier === 1) return null; // Ground level has no raised beam
          return (
            <g key={`beam-level-${i}`}>
              <polygon points={`95,${beamY} 85,${beamY - 10} ${80 + totalRackWidth + 10},${beamY - 10} ${80 + totalRackWidth + 20},${beamY}`} fill={safeStorageType === 'bins' ? '#334155' : '#c2410c'} />
              <rect x="95" y={beamY} width={totalRackWidth} height={is4Tier ? 18 : 20} fill={safeStorageType === 'bins' ? '#475569' : '#ea580c'} stroke="#1e293b" strokeWidth="1" filter="url(#cadShadow)" />
            </g>
          );
        })}
      </g>

      {/* 5S RED ANDON SIGNBOARD (FOR PLASTIC BINS) */}
      {safeStorageType === 'bins' && (
        <g id="bin-rack-andon-signboard" transform={`translate(68, ${is4Tier ? 110 : 140})`}>
          <rect x="-35" y="0" width="42" height="150" rx="4" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" filter="url(#cadShadow)" />
          <rect x="-33" y="4" width="38" height="18" rx="2" fill="#7f1d1d" />
          <text x="-14" y="16" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle">5S ANDON</text>

          {/* 3 Status Lights */}
          <g transform="translate(-14, 38)">
            <circle cx="0" cy="0" r="7.5" fill="#15803d" stroke="#14532d" strokeWidth="1" />
            <circle cx="0" cy="0" r="5.5" fill="#22c55e" filter="url(#lightGlow)" />
            <circle cx="-2" cy="-2" r="2" fill="#ffffff" opacity="0.8" />
          </g>
          <g transform="translate(-14, 60)">
            <circle cx="0" cy="0" r="7.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="0" cy="0" r="5.5" fill="#f8fafc" />
            <circle cx="-2" cy="-2" r="2" fill="#ffffff" opacity="0.9" />
          </g>
          <g transform="translate(-14, 82)">
            <circle cx="0" cy="0" r="7.5" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            <circle cx="0" cy="0" r="5.5" fill="#facc15" filter="url(#lightGlow)" />
            <circle cx="-2" cy="-2" r="2" fill="#ffffff" opacity="0.8" />
          </g>

          <line x1="-31" y1="102" x2="3" y2="102" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
          <text x="-14" y="116" fill="#fef08a" fontSize="7.5" fontWeight="900" textAnchor="middle">{rackId}</text>
          <text x="-14" y="128" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">KHAY LINH KIỆN</text>
          {/* Small Sunhouse Brand Badge on Andon Signboard */}
          <g transform="translate(-24, 133) scale(0.22)">
            <rect x="35" y="10" width="170" height="110" rx="20" fill="#0b7a84" />
            <rect x="10" y="40" width="220" height="50" rx="25" fill="#dc2626" />
            <text x="115" y="75" fill="#ffffff" fontSize="28" fontWeight="900" fontFamily="Arial, sans-serif" textAnchor="middle">SUNHOUSE</text>
          </g>
        </g>
      )}

      {/* 6. 3D PALLETS, BINS & LOCATION LABELS LAYER */}
      <g id="storage-containers-layer">
        {effectiveTierList.map((tier) => {
          const tierYOffset = containerYOffsets[tier] || 84;
          
          // Color shading for boxes
          const tierBaseColor = activeTierColors[tier] || (tier === 4 ? '#eab308' : tier === 3 ? '#ea580c' : tier === 2 ? '#2563eb' : '#dc2626');
          const topFaceColor = tier === 4 ? '#fef08a' : tier === 3 ? (is4Tier ? '#fed7aa' : '#fef08a') : tier === 2 ? '#93c5fd' : '#fca5a5';
          const sideFaceColor = tier === 4 ? '#ca8a04' : tier === 3 ? (is4Tier ? '#c2410c' : '#ca8a04') : tier === 2 ? '#1d4ed8' : '#b91c1c';
          const borderColor = tier === 4 ? '#854d0e' : tier === 3 ? (is4Tier ? '#7c2d12' : '#854d0e') : tier === 2 ? '#172554' : '#7f1d1d';
          
          return safeBayNumbers.map((bay, bIdx) => {
            const bayXOffset = startX + bIdx * baySpacing;
            const gap = 8;
            const containerWidth = safeItemsPerBay > 0 ? (usableBayWidth - (safeItemsPerBay + 1) * gap) / safeItemsPerBay : 68;
            
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
              const badgeW = Math.max(44, Math.min(containerWidth, slotLabelText.length * (tagFontSize * 0.72) + 12));
              const badgeH = 20;
              const badgeX = containerWidth / 2 - badgeW / 2;
              const badgeY = is4Tier ? 82 : 96;

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
                      height={is4Tier ? "106" : "122"} 
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
                      <polygon points={`2,18 10,0 ${containerWidth + 6},0 ${containerWidth - 2},18`} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1" />
                      <polygon points={`5,16 11,3 ${containerWidth + 3},3 ${containerWidth - 5},16`} fill="#0f172a" fillOpacity="0.35" />
                      
                      {/* Main Front Body */}
                      <rect x="2" y="18" width={containerWidth - 4} height={binHeight} rx="3" fill="#1e40af" stroke="#172554" strokeWidth="1.4" filter="url(#cadShadow)" />
                      
                      {/* Right 3D Side Face */}
                      <polygon points={`${containerWidth - 2},18 ${containerWidth + 6},0 ${containerWidth + 6},${binHeight} ${containerWidth - 2},${binHeight + 18}`} fill="#1d4ed8" stroke="#172554" strokeWidth="1" />
                      
                      {/* Molded Hand Grip */}
                      <rect x={containerWidth / 2 - 12} y="24" width="24" height="7" rx="3.5" fill="#0f172a" stroke="#1e3a8a" strokeWidth="1" />
                      
                      {/* Structural Ribs */}
                      <line x1="6" y1="36" x2={containerWidth - 6} y2="36" stroke="#172554" strokeWidth="1.5" />
                      <line x1="6" y1={is4Tier ? 48 : 56} x2={containerWidth - 6} y2={is4Tier ? 48 : 56} stroke="#172554" strokeWidth="1.5" />
                      <line x1="6" y1={is4Tier ? 72 : 84} x2={containerWidth - 6} y2={is4Tier ? 72 : 84} stroke="#172554" strokeWidth="1.8" />
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
                        points={`2,10 10,0 ${containerWidth + 6},0 ${containerWidth - 2},10`} 
                        fill={topFaceColor} 
                        stroke={borderColor} 
                        strokeWidth="0.9" 
                      />
                      {/* Main Cargo Box */}
                      <rect 
                        x="2" 
                        y="10" 
                        width={containerWidth - 4} 
                        height={boxHeight} 
                        rx="2" 
                        fill={tierBaseColor} 
                        stroke={borderColor} 
                        strokeWidth="1.2" 
                        filter="url(#cadShadow)" 
                      />
                      {/* Right side oblique slope */}
                      <polygon 
                        points={`${containerWidth - 2},10 ${containerWidth + 6},0 ${containerWidth + 6},${boxHeight} ${containerWidth - 2},${boxHeight + 10}`} 
                        fill={sideFaceColor} 
                        stroke={borderColor} 
                        strokeWidth="0.9" 
                      />
                      {/* Center vertical yellow strap */}
                      <line 
                        x1={(containerWidth - 4) / 2 + 2} 
                        y1="10" 
                        x2={(containerWidth - 4) / 2 + 2} 
                        y2={boxHeight + 10} 
                        stroke="#fef08a" 
                        strokeWidth="2.8" 
                        opacity="0.9" 
                      />
                      
                      {/* Pallet Wooden Base */}
                      <rect x="0" y={boxHeight + 10} width={containerWidth + 4} height={is4Tier ? "5" : "6"} fill="#b45309" stroke="#78350f" strokeWidth="1" rx="1" />
                      <rect x="2" y={boxHeight + (is4Tier ? 15 : 16)} width="7" height={is4Tier ? "6" : "8"} fill="#78350f" />
                      <rect x={containerWidth / 2 - 3.5} y={boxHeight + (is4Tier ? 15 : 16)} width="7" height={is4Tier ? "6" : "8"} fill="#78350f" />
                      <rect x={containerWidth - 5} y={boxHeight + (is4Tier ? 15 : 16)} width="7" height={is4Tier ? "6" : "8"} fill="#78350f" />
                      <rect x="0" y={boxHeight + (is4Tier ? 21 : 24)} width={containerWidth + 4} height="4" fill="#b45309" stroke="#78350f" />
                    </g>
                  )}

                  {/* STORAGE TYPE: CARTONS */}
                  {safeStorageType === 'cartons' && (
                    <g 
                      id={`carton-${bay}-${tier}-${slotNum}`}
                      className={onSelectSlot ? "cursor-pointer group/carton" : ""}
                      onClick={() => onSelectSlot && onSelectSlot(bay, tier, slotNum)}
                    >
                      <polygon points={`2,10 10,0 ${containerWidth + 6},0 ${containerWidth - 2},10`} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                      <rect x="2" y="10" width={containerWidth - 4} height={cartonHeight} rx="3" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" filter="url(#cadShadow)" />
                      <polygon points={`${containerWidth - 2},10 ${containerWidth + 6},0 ${containerWidth + 6},${cartonHeight} ${containerWidth - 2},${cartonHeight + 10}`} fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
                      <line x1={(containerWidth - 4) / 2 + 2} y1="10" x2={(containerWidth - 4) / 2 + 2} y2={cartonHeight + 10} stroke="#94a3b8" strokeWidth="2.5" opacity="0.6" strokeDasharray="5 2" />
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
                      rx="3" 
                      fill="#ffffff" 
                      stroke="#0f172a" 
                      strokeWidth="1.6" 
                      filter="url(#cadShadow)" 
                    />
                    {/* Label Text */}
                    <text 
                      x={containerWidth / 2} 
                      y={badgeY + badgeH / 2 + (tagFontSize * 0.35) - 0.5} 
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
