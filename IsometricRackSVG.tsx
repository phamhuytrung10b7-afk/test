import React from 'react';
import { InventoryItem } from './types';

export interface IsometricRackSVGProps {
  rackId: string;
  rackDisplayName?: string;
  onDoubleClickRackName?: () => void;
  storageType: 'bins' | 'pallets' | 'cartons';
  itemsPerBay: number;
  tierColors: { [tier: number]: string };
  bayNumbers: string[];
  selectedBay?: string;
  selectedTier?: number;
  selectedSlot?: number;
  onSelectSlot?: (bay: string, tier: number, slot: number) => void;
  onDoubleClickLabel?: (bay: string, tier: number, slot: number) => void;
  getSlotLabel: (bay: string, tier: number, slot: number) => string;
  getSlotItem?: (bay: string, tier: number, slot: number) => InventoryItem | undefined;
  tagFontSize?: number;
}

export const IsometricRackSVG: React.FC<IsometricRackSVGProps> = ({
  rackId,
  rackDisplayName,
  onDoubleClickRackName,
  storageType,
  itemsPerBay,
  tierColors,
  bayNumbers,
  selectedBay,
  selectedTier,
  selectedSlot,
  onSelectSlot,
  onDoubleClickLabel,
  getSlotLabel,
  getSlotItem,
  tagFontSize = 14,
}) => {
  const displayTitle = rackDisplayName || (rackId.toUpperCase().startsWith('KỆ') ? rackId : `KỆ ${rackId}`);
  const titleBadgeWidth = Math.max(72, displayTitle.length * 10.5 + 24);

  return (
    <svg 
      viewBox="-40 -15 1110 560" 
      className="w-full h-auto overflow-visible select-none"
    >
      <defs>
        {/* Clean Industrial Soft Shadow Filter */}
        <filter id="cadShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="5" stdDeviation="3" floodOpacity="0.15" floodColor="#0f172a" />
        </filter>
        <filter id="targetGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="lightGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ffffff" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* 1. GROUND ISOMETRIC 5S SAFETY ZONE & FLOOR BAY MARKERS */}
      <g id="ground-5s-floor">
        <polygon 
          points="20,460 995,460 965,525 -15,525" 
          fill="#fef08a" 
          stroke="#ca8a04" 
          strokeWidth="2.5" 
          strokeDasharray="12 6"
        />
        <text x="490" y="476" fill="#854d0e" fontSize="11" fontWeight="900" letterSpacing="2" textAnchor="middle">
          ⚠️ MẶT ĐẤT (TẦNG 1) — VẠCH SƠN AN TOÀN 5S KHO BÌNH DƯƠNG ({displayTitle})
        </text>

        {/* 5S Yellow Floor Directional Navigation Arrow (như Ảnh 3) */}
        <g id="floor-navigation-arrow" transform="translate(15, 482)">
          <polygon 
            points="0,12 28,12 28,4 48,18 28,32 28,24 0,24" 
            fill="#eab308" 
            stroke="#854d0e" 
            strokeWidth="1.5" 
            filter="url(#cadShadow)"
          />
        </g>

        {bayNumbers.map((bay, idx) => {
          const bayCenterX = 172 + idx * 175;
          return (
            <g key={`floor-badge-bay-${bay}`} transform={`translate(${bayCenterX - 22}, 490)`}>
              <rect x="0" y="0" width="44" height="22" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" filter="url(#cadShadow)" />
              <text x="22" y="15" fill="#ffffff" fontSize="11.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                {bay}
              </text>
            </g>
          );
        })}
      </g>

      {/* FLOATING RACK CALLOUT BADGE (ẢNH 1 + 2) - KÍCH ĐÚP ĐỂ SỬA TÊN KỆ */}
      <g 
        id="floating-rack-badge" 
        transform="translate(10, 10)"
        className="cursor-pointer group/racktitle transition-all"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClickRackName?.();
        }}
        onClick={(e) => {
          // If clicked, also allow opening edit modal if desired
        }}
        title="Kích đúp vào đây để đổi tên kệ (Ảnh 1 & 2)"
      >
        <rect 
          x="0" 
          y="0" 
          width={titleBadgeWidth} 
          height="34" 
          rx="10" 
          fill="#ea580c" 
          stroke="#ffffff" 
          strokeWidth="2.5" 
          filter="url(#cadShadow)" 
          className="group-hover/racktitle:fill-orange-600 transition-colors"
        />
        <text 
          x={titleBadgeWidth / 2} 
          y="22" 
          fill="#ffffff" 
          fontSize="13.5" 
          fontWeight="900" 
          textAnchor="middle"
        >
          {displayTitle}
        </text>
        {/* Subtle Edit hint dot */}
        <circle cx={titleBadgeWidth - 10} cy="10" r="3" fill="#ffffff" opacity="0.6" className="group-hover/racktitle:opacity-100" />
      </g>

      {/* 2. TOP BAY HEADERS */}
      <g id="bay-column-headers">
        {bayNumbers.map((bay, idx) => {
          const bayX = 85 + idx * 175;
          const isSelected = selectedBay === bay;
          return (
            <g 
              key={`head-bay-${bay}`} 
              transform={`translate(${bayX}, 10)`} 
              className={onSelectSlot ? "cursor-pointer" : ""} 
              onClick={() => onSelectSlot && selectedTier && selectedSlot && onSelectSlot(bay, selectedTier, selectedSlot)}
            >
              <rect 
                x="0" 
                y="0" 
                width="155" 
                height="34" 
                rx="8" 
                fill={isSelected ? '#0d9488' : '#0f172a'} 
                stroke={isSelected ? '#facc15' : '#475569'} 
                strokeWidth={isSelected ? '3.5' : '1.5'} 
                filter="url(#cadShadow)"
              />
              <text x="77" y="22" fill={isSelected ? '#ffffff' : '#94a3b8'} fontSize="13.5" fontWeight="900" textAnchor="middle">
                KHOANG {bay}
              </text>
              {isSelected && (
                <polygon points="69,34 85,34 77,44" fill="#0d9488" />
              )}
            </g>
          );
        })}
      </g>

      {/* 3. ROW TIER LABELS */}
      <g id="tier-row-headers">
        <g transform="translate(5, 95)" className={onSelectSlot ? "cursor-pointer" : ""} onClick={() => onSelectSlot && selectedBay && selectedSlot && onSelectSlot(selectedBay, 3, selectedSlot)}>
          <rect x="0" y="0" width="72" height="42" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="2" filter="url(#cadShadow)" />
          <text x="36" y="18" fill="#78350f" fontSize="11" fontWeight="900" textAnchor="middle">TẦNG 3</text>
          <text x="36" y="32" fill="#92400e" fontSize="9.5" fontWeight="800" textAnchor="middle">Mức A (Cao)</text>
        </g>
        <g transform="translate(5, 220)" className={onSelectSlot ? "cursor-pointer" : ""} onClick={() => onSelectSlot && selectedBay && selectedSlot && onSelectSlot(selectedBay, 2, selectedSlot)}>
          <rect x="0" y="0" width="72" height="42" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" filter="url(#cadShadow)" />
          <text x="36" y="18" fill="#1e3a8a" fontSize="11" fontWeight="900" textAnchor="middle">TẦNG 2</text>
          <text x="36" y="32" fill="#1d4ed8" fontSize="9.5" fontWeight="800" textAnchor="middle">Mức B (Giữa)</text>
        </g>
        <g transform="translate(5, 345)" className={onSelectSlot ? "cursor-pointer" : ""} onClick={() => onSelectSlot && selectedBay && selectedSlot && onSelectSlot(selectedBay, 1, selectedSlot)}>
          <rect x="0" y="0" width="72" height="42" rx="8" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" filter="url(#cadShadow)" />
          <text x="36" y="18" fill="#7f1d1d" fontSize="11" fontWeight="900" textAnchor="middle">TẦNG 1</text>
          <text x="36" y="32" fill="#b91c1c" fontSize="9.5" fontWeight="900" textAnchor="middle">MẶT ĐẤT</text>
        </g>
      </g>

      {/* 4. STEEL FRAME RACK STRUCTURE */}
      <g id="steel-rack-framework">
        {[90, 265, 440, 615, 790, 965].map((px, i) => (
          <line key={`rear-post-${i}`} x1={px - 12} y1="58" x2={px - 12} y2="442" stroke="#94a3b8" strokeWidth="6" opacity="0.6" />
        ))}
        {[90, 265, 440, 615, 790].map((px, i) => (
          <g key={`bracing-${i}`} opacity="0.35">
            <line x1={px} y1="70" x2={px + 175} y2="190" stroke="#475569" strokeWidth="2" />
            <line x1={px + 175} y1="190" x2={px} y2="310" stroke="#475569" strokeWidth="2" />
            <line x1={px} y1="310" x2={px + 175} y2="430" stroke="#475569" strokeWidth="2" />
          </g>
        ))}
        {[80, 255, 430, 605, 780, 955].map((postX, i) => (
          <g key={`front-post-${i}`}>
            <polygon points={`${postX},55 ${postX - 10},45 ${postX - 10},445 ${postX},455`} fill="#1e293b" />
            <rect x={postX} y="55" width="15" height="400" fill={storageType === 'bins' ? '#334155' : '#2563eb'} stroke="#1d4ed8" strokeWidth="1" filter="url(#cadShadow)" />
            {[...Array(25)].map((_, j) => (
              <circle key={`hole-${j}`} cx={postX + 7.5} cy={65 + j * 15} r="1.5" fill="#0f172a" />
            ))}
          </g>
        ))}
        {[180, 305, 430].map((beamY, i) => (
          <g key={`beam-level-${i}`}>
            <polygon points={`95,${beamY} 85,${beamY - 10} 960,${beamY - 10} 970,${beamY}`} fill={storageType === 'bins' ? '#334155' : '#c2410c'} />
            <rect x="95" y={beamY} width="860" height="20" fill={storageType === 'bins' ? '#475569' : '#ea580c'} stroke="#1e293b" strokeWidth="1" filter="url(#cadShadow)" />
          </g>
        ))}
      </g>

      {/* 5S RED ANDON / VISUAL MANAGEMENT HEAD SIGNBOARD (ẢNH 3 - ĐẦU KỆ THÙNG NHỰA) */}
      {storageType === 'bins' && (
        <g id="bin-rack-andon-signboard" transform="translate(68, 140)">
          {/* Main Red Andon Board */}
          <rect x="-35" y="0" width="42" height="150" rx="4" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" filter="url(#cadShadow)" />
          {/* Header Bar */}
          <rect x="-33" y="4" width="38" height="18" rx="2" fill="#7f1d1d" />
          <text x="-14" y="16" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle">5S ANDON</text>

          {/* 3 Status Signal Indicator Lights (Đèn Xanh 🟢, Trắng ⚪, Vàng 🟡 như Ảnh 3) */}
          {/* Green Light 🟢 */}
          <g transform="translate(-14, 38)">
            <circle cx="0" cy="0" r="7.5" fill="#15803d" stroke="#14532d" strokeWidth="1" />
            <circle cx="0" cy="0" r="5.5" fill="#22c55e" filter="url(#lightGlow)" />
            <circle cx="-2" cy="-2" r="2" fill="#ffffff" opacity="0.8" />
          </g>
          {/* White Light ⚪ */}
          <g transform="translate(-14, 60)">
            <circle cx="0" cy="0" r="7.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="0" cy="0" r="5.5" fill="#f8fafc" />
            <circle cx="-2" cy="-2" r="2" fill="#ffffff" opacity="0.9" />
          </g>
          {/* Yellow Light 🟡 */}
          <g transform="translate(-14, 82)">
            <circle cx="0" cy="0" r="7.5" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            <circle cx="0" cy="0" r="5.5" fill="#facc15" filter="url(#lightGlow)" />
            <circle cx="-2" cy="-2" r="2" fill="#ffffff" opacity="0.8" />
          </g>

          {/* Label lines on the Red Board */}
          <line x1="-31" y1="102" x2="3" y2="102" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
          <text x="-14" y="116" fill="#fef08a" fontSize="7.5" fontWeight="900" textAnchor="middle">{rackId}</text>
          <text x="-14" y="128" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">KHAY LINH KIỆN</text>
          <text x="-14" y="139" fill="#fecaca" fontSize="6" fontWeight="bold" textAnchor="middle">SUNHOUSE</text>
        </g>
      )}

      {/* 5. 3D CONTAINERS & ITEMS LOGIC */}
      <g id="storage-containers-layer">
        {[3, 2, 1].map((tier) => {
          // Pallet bottom is at y=94. Beam tops are at y=180, 305, 430.
          // Setting offsets so pallet sits flush directly on the top surface of the orange beam
          const tierYOffset = tier === 3 ? 84 : tier === 2 ? 209 : 334;
          const customTierHex = tierColors[tier] || (tier === 3 ? '#eab308' : tier === 2 ? '#2563eb' : '#dc2626');
          
          return bayNumbers.map((bay, bIdx) => {
            const bayXOffset = 95 + bIdx * 175;
            const usableWidth = 160;
            const containerWidth = itemsPerBay > 0 ? (usableWidth - (itemsPerBay + 1) * 6) / itemsPerBay : usableWidth;
            
            return [...Array(itemsPerBay)].map((_, slotIdx) => {
              const slotNum = slotIdx + 1;
              const slotX = bayXOffset + 6 + slotIdx * (containerWidth + 6);
              const isSlotSelected = selectedBay === bay && selectedTier === tier && selectedSlot === slotNum;
              
              const item = getSlotItem ? getSlotItem(bay, tier, slotNum) : undefined;
              const slotLabelText = getSlotLabel(bay, tier, slotNum);

              // Location tag badge positioned directly on the front face of the orange beam below each pallet position
              const badgeW = Math.max(46, Math.min(containerWidth - 4, slotLabelText.length * (tagFontSize * 0.72) + 14));
              const badgeH = 19;
              const badgeX = containerWidth / 2 - badgeW / 2;
              // Beam front face is at local y = 96..116
              const badgeY = 97;

              return (
                <g 
                  key={`container-${bay}-${tier}-${slotNum}`}
                  transform={`translate(${slotX}, ${tierYOffset})`}
                  className="transition-transform duration-300"
                >
                  {isSlotSelected && (
                    <rect x="-4" y="-4" width={containerWidth + 8} height="124" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="6 4" rx="6" filter="url(#targetGlow)" />
                  )}

                  {/* STORAGE TYPE: BINS (THÙNG NHỰA XANH 5S NHƯ ẢNH 3) */}
                  {storageType === 'bins' && (
                    <g 
                      id={`bin-${bay}-${tier}-${slotNum}`}
                      className={onSelectSlot ? "cursor-pointer" : ""}
                      onClick={() => onSelectSlot && onSelectSlot(bay, tier, slotNum)}
                    >
                      {/* Rear shadow & top opening rim */}
                      <polygon points={`2,18 12,0 ${containerWidth + 8},0 ${containerWidth - 2},18`} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1" />
                      <polygon points={`6,16 13,3 ${containerWidth + 3},3 ${containerWidth - 6},16`} fill="#0f172a" fillOpacity="0.35" />
                      
                      {/* Main Front Body of Navy Blue Plastic Bin */}
                      <rect x="2" y="18" width={containerWidth - 4} height="76" rx="3" fill="#1e40af" stroke="#172554" strokeWidth="1.4" filter="url(#cadShadow)" />
                      
                      {/* Right 3D Side Face */}
                      <polygon points={`${containerWidth - 2},18 ${containerWidth + 8},0 ${containerWidth + 8},76 ${containerWidth - 2},94`} fill="#1d4ed8" stroke="#172554" strokeWidth="1" />
                      
                      {/* Molded Hand Grip / Pocket Slot (Quai xách tay cầm) */}
                      <rect x={containerWidth / 2 - 12} y="26" width="24" height="8" rx="4" fill="#0f172a" stroke="#1e3a8a" strokeWidth="1" />
                      
                      {/* Horizontal & Vertical Structural Ribs on Front Face */}
                      <line x1="6" y1="42" x2={containerWidth - 6} y2="42" stroke="#172554" strokeWidth="1.5" />
                      <line x1="6" y1="62" x2={containerWidth - 6} y2="62" stroke="#172554" strokeWidth="1.5" />
                      <line x1="6" y1="84" x2={containerWidth - 6} y2="84" stroke="#172554" strokeWidth="1.8" />
                      
                      {/* White 5S Barcode Tag on Front of Bin */}
                      <rect x={containerWidth / 2 - 16} y="47" width="32" height="11" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="0.8" />
                      <line x1={containerWidth / 2 - 12} y1="52" x2={containerWidth / 2 + 12} y2="52" stroke="#0f172a" strokeWidth="1" strokeDasharray="1.5 1" />

                      {containerWidth >= 35 && item && (
                        <g transform={`translate(${containerWidth / 2}, 74)`}>
                          <rect x={-Math.min(containerWidth / 2 - 4, 34)} y="-9" width={Math.min(containerWidth - 8, 68)} height="18" rx="3" fill="#0f172a" fillOpacity="0.85" stroke="#38bdf8" strokeWidth="0.8" />
                          <text x="0" y="4" fill="#67e8f9" fontSize="9.5" fontWeight="900" textAnchor="middle">
                            {item.quantity} {item.unit || 'cái'}
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* STORAGE TYPE: PALLETS (ẢNH 2) */}
                  {storageType === 'pallets' && (
                    <g 
                      id={`pallet-${bay}-${tier}-${slotNum}`}
                      className={onSelectSlot ? "cursor-pointer" : ""}
                      onClick={() => onSelectSlot && onSelectSlot(bay, tier, slotNum)}
                    >
                      {/* Top oblique slope */}
                      <polygon points={`2,10 10,0 ${containerWidth + 6},0 ${containerWidth - 2},10`} fill="#f3d5a5" stroke="#b45309" strokeWidth="0.8" />
                      {/* Main Cargo Box */}
                      <rect x="2" y="10" width={containerWidth - 4} height="66" rx="2" fill={customTierHex} stroke="#92400e" strokeWidth="1.2" filter="url(#cadShadow)" />
                      {/* Right side oblique slope */}
                      <polygon points={`${containerWidth - 2},10 ${containerWidth + 6},0 ${containerWidth + 6},66 ${containerWidth - 2},76`} fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
                      {/* Center packing tape */}
                      <line x1={(containerWidth - 4) / 2 + 2} y1="10" x2={(containerWidth - 4) / 2 + 2} y2="76" stroke="#fef08a" strokeWidth="2.5" opacity="0.85" />
                      
                      {/* Pallet Wooden Base (rests flush onto the orange beam at y=94) */}
                      <rect x="0" y="76" width={containerWidth + 4} height="6" fill="#b45309" stroke="#78350f" strokeWidth="1" rx="1" />
                      <rect x="3" y="82" width="8" height="8" fill="#78350f" />
                      <rect x={containerWidth / 2 - 4} y="82" width="8" height="8" fill="#78350f" />
                      <rect x={containerWidth - 7} y="82" width="8" height="8" fill="#78350f" />
                      <rect x="0" y="90" width={containerWidth + 4} height="4" fill="#b45309" stroke="#78350f" />

                      {/* Stored Item / Quantity Info on the Box Body */}
                      {containerWidth >= 36 && item && (
                        <g transform={`translate(${containerWidth / 2}, 42)`}>
                          <rect x={-Math.min(containerWidth / 2 - 4, 36)} y="-10" width={Math.min(containerWidth - 8, 72)} height="20" rx="4" fill="#0f172a" fillOpacity="0.75" stroke="#ffffff" strokeWidth="0.8" />
                          <text x="0" y="3.5" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">
                            {item.quantity} {item.unit || 'cái'}
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* STORAGE TYPE: CARTONS */}
                  {storageType === 'cartons' && (
                    <g 
                      id={`carton-${bay}-${tier}-${slotNum}`}
                      className={onSelectSlot ? "cursor-pointer" : ""}
                      onClick={() => onSelectSlot && onSelectSlot(bay, tier, slotNum)}
                    >
                      <polygon points={`2,10 10,0 ${containerWidth + 6},0 ${containerWidth - 2},10`} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                      <rect x="2" y="10" width={containerWidth - 4} height="84" rx="3" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" filter="url(#cadShadow)" />
                      <polygon points={`${containerWidth - 2},10 ${containerWidth + 6},0 ${containerWidth + 6},84 ${containerWidth - 2},94`} fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
                      <line x1={(containerWidth - 4) / 2 + 2} y1="10" x2={(containerWidth - 4) / 2 + 2} y2="94" stroke="#94a3b8" strokeWidth="2.5" opacity="0.6" strokeDasharray="5 2" />
                      
                      <rect x="15" y="25" width={containerWidth - 30} height="36" fill={customTierHex} stroke="#ffffff" strokeWidth="2" filter="url(#cadShadow)" opacity="0.8" />
                      
                      {containerWidth >= 35 && item && (
                        <g transform={`translate(${containerWidth / 2}, 65)`}>
                          <rect x={-Math.min(containerWidth / 2 - 4, 34)} y="-9" width={Math.min(containerWidth - 8, 68)} height="18" rx="3" fill="#0f172a" fillOpacity="0.75" />
                          <text x="0" y="4" fill="#38bdf8" fontSize="9.5" fontWeight="900" textAnchor="middle">
                            {item.quantity} {item.unit || 'cái'}
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* POSITION NAME TAG (TÊN VỊ TRÍ) — ON THE ORANGE BEAM BELOW EACH CONTAINER */}
                  {containerWidth >= 20 && (
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
                      {/* Clean High-Contrast Industrial Magnetic / Barcode Shelf Label */}
                      <rect 
                        x={badgeX} 
                        y={badgeY} 
                        width={badgeW} 
                        height={badgeH} 
                        rx="3.5" 
                        fill="#ffffff" 
                        stroke="#0f172a" 
                        strokeWidth="1.4" 
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
                  )}
                </g>
              );
            });
          });
        })}
      </g>
    </svg>
  );
};
