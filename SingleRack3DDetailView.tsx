import React, { useState } from 'react';
import { 
  WarehouseRack, 
  InventoryItem, 
  WarehousePosition 
} from './types';
import { 
  Box, 
  Plus, 
  Minus, 
  Target, 
  Printer, 
  MapPin, 
  Tag, 
  Edit3, 
  X,
  Layers,
  ChevronRight,
  Grid,
  Maximize2,
  Minimize2,
  PackageCheck,
  Palette,
  Sliders,
  Info,
  Check,
  Type
} from 'lucide-react';

interface SingleRack3DDetailViewProps {
  racks: WarehouseRack[];
  selectedRackId: string;
  onSelectRack: (rackId: string, bayId?: string) => void;
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
  currentPosition: WarehousePosition;
  onPositionChange: (pos: WarehousePosition) => void;
  onOpenUpdateModal?: (item?: InventoryItem) => void;
  onOpenPrintModal?: (tab?: 'pdf1' | 'pdf2' | 'pdf3' | 'pdf4') => void;
}

export const SingleRack3DDetailView: React.FC<SingleRack3DDetailViewProps> = ({
  racks,
  selectedRackId,
  onSelectRack,
  items,
  onUpdateItems,
  currentPosition,
  onPositionChange,
  onOpenUpdateModal,
  onOpenPrintModal,
}) => {
  // Find current rack
  const activeRack = racks.find(r => r.id === selectedRackId) || racks[0] || {
    id: 'A',
    name: 'Kệ A - Khu Vực Linh Kiện Chuẩn',
    colorName: 'Màu Vàng / Bu Lông Lục Giác',
    x: 25,
    y: 20,
    color: '#eab308',
  };

  const rackId = activeRack.id;

  // Selected Bay (01 to 05), Tier (1 to 3), and Slot inside Bay (1 to itemsPerBay)
  const [selectedBay, setSelectedBay] = useState<string>('02');
  const [selectedTier, setSelectedTier] = useState<number>(3); // 3: Top (A), 2: Mid (B), 1: Ground (C)
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [editItemModal, setEditItemModal] = useState<InventoryItem | null>(null);

  // Layout & Perspective Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1.1);
  const [isFullWidth, setIsFullWidth] = useState<boolean>(true);

  // Editable Tag Font Size (Default 14px for bold, highly legible text)
  const [tagFontSize, setTagFontSize] = useState<number>(14);

  // Custom Slot Labels map (Key: `${rackId}-${bay}-${tier}-${slot}`)
  const [customSlotLabels, setCustomSlotLabels] = useState<{ [key: string]: string }>({});

  // Modal state for editing slot labels
  const [editLabelModal, setEditLabelModal] = useState<{
    bay: string;
    tier: number;
    slot: number;
    label: string;
  } | null>(null);

  // Storage Type & Number of items per bay
  // User requested: "1 khoang 2 pallet mỗi tầng như ảnh 2. Còn thùng nhựa như ảnh 3 nhé"
  const [storageType, setStorageType] = useState<'bins' | 'pallets' | 'cartons'>('pallets');
  const [itemsPerBay, setItemsPerBay] = useState<number>(2); // Default 2 pallets per bay as in Image 2

  // Color Customization per Tier
  const [tierColors, setTierColors] = useState<{ [tier: number]: string }>({
    3: '#eab308', // Tier 3: Yellow
    2: '#2563eb', // Tier 2: Blue
    1: '#dc2626', // Tier 1: Red (Ground)
  });

  // Preset Color Palette
  const COLOR_PALETTE = [
    { name: 'Đỏ', hex: '#dc2626', bgClass: 'bg-red-600' },
    { name: 'Xanh Dương', hex: '#2563eb', bgClass: 'bg-blue-600' },
    { name: 'Vàng', hex: '#eab308', bgClass: 'bg-yellow-500' },
    { name: 'Xanh Lá', hex: '#16a34a', bgClass: 'bg-green-600' },
    { name: 'Cam', hex: '#ea580c', bgClass: 'bg-orange-600' },
    { name: 'Tím', hex: '#9333ea', bgClass: 'bg-purple-600' },
    { name: 'Gỗ / Nâu', hex: '#b45309', bgClass: 'bg-amber-800' },
    { name: 'Xám Ghi', hex: '#475569', bgClass: 'bg-slate-600' },
  ];

  // Bay numbers: 01, 02, 03, 04, 05
  const bayNumbers = ['01', '02', '03', '04', '05'];
  // Tier numbers: 3 (Top), 2 (Mid), 1 (Ground / Mặt đất)
  const tierNumbers = [3, 2, 1];

  // Switch storage type with default itemsPerBay recommendation
  const handleStorageTypeChange = (type: 'bins' | 'pallets' | 'cartons') => {
    setStorageType(type);
    if (type === 'pallets') {
      setItemsPerBay(2); // 1 khoang 2 pallet mỗi tầng như ảnh 2
    } else if (type === 'bins') {
      setItemsPerBay(3); // 1 khoang 3 thùng nhựa như ảnh 3
    } else {
      setItemsPerBay(3); // 3 cartons per bay
    }
  };

  // Get info for tier
  const getTierInfo = (tier: number) => {
    const customHex = tierColors[tier] || (tier === 3 ? '#eab308' : tier === 2 ? '#2563eb' : '#dc2626');
    switch(tier) {
      case 3:
        return {
          code: 'A',
          name: 'Tầng 3 (Top - Mức A)',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          hex: customHex,
          label: 'Tầng 3 (Cao)'
        };
      case 2:
        return {
          code: 'B',
          name: 'Tầng 2 (Middle - Mức B)',
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
          hex: customHex,
          label: 'Tầng 2 (Giữa)'
        };
      case 1:
      default:
        return {
          code: 'C',
          name: 'Tầng 1 (Ground - Mặt Đất)',
          badgeBg: 'bg-red-100 text-red-900 border-red-300',
          hex: customHex,
          label: 'Tầng 1 (Mặt Đất)'
        };
    }
  };

  // Find item at specified location (bay, tier, slot)
  const getItemAt = (bay: string, tier: number, slot: number = 1) => {
    const locCode = `${rackId}-${bay}-${tier}-${slot}`;
    const locCodeSimple = `${rackId}-${bay}-${tier}`;
    return items.find(i => 
      i.location === locCode ||
      (i.rackId === rackId && i.bayId === bay && i.tier === tier && (i.slot === slot || (!i.slot && slot === 1))) ||
      (slot === 1 && i.location === locCodeSimple)
    );
  };

  // Get slot label (Custom or Default P-1, #1, C-1)
  const getSlotLabel = (bay: string, tier: number, slot: number) => {
    const key = `${rackId}-${bay}-${tier}-${slot}`;
    if (customSlotLabels[key]) return customSlotLabels[key];
    if (storageType === 'pallets') return `P-${slot}`;
    if (storageType === 'bins') return `#${slot}`;
    return `C-${slot}`;
  };

  // Save custom slot label
  const handleSaveCustomLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLabelModal) return;
    const key = `${rackId}-${editLabelModal.bay}-${editLabelModal.tier}-${editLabelModal.slot}`;
    const newText = editLabelModal.label.trim();
    setCustomSlotLabels(prev => ({
      ...prev,
      [key]: newText || (storageType === 'pallets' ? `P-${editLabelModal.slot}` : `#${editLabelModal.slot}`)
    }));
    setEditLabelModal(null);
  };

  // Currently selected item
  const selectedItem = getItemAt(selectedBay, selectedTier, selectedSlot);

  // Handle slot selection
  const handleSelectSlotLocation = (bay: string, tier: number, slot: number = 1) => {
    setSelectedBay(bay);
    setSelectedTier(tier);
    setSelectedSlot(slot);

    // Update current position for system sync
    const bayNum = parseInt(bay, 10);
    const bayLen = activeRack.bayLength || 4.8;
    onPositionChange({
      ...currentPosition,
      rackId,
      bayId: bay,
      tier,
      slot,
      label: `Kệ ${rackId} - Khoang ${bay} - Tầng ${tier} (Vị trí ${slot}/${itemsPerBay})`,
      x: activeRack.x,
      y: activeRack.y + (bayNum - 1) * bayLen,
    });
  };

  // Handle quantity adjustments
  const handleQuantityChange = (item: InventoryItem, delta: number) => {
    const updatedQty = Math.max(0, item.quantity + delta);
    const updatedItems = items.map(i => i.id === item.id ? { ...i, quantity: updatedQty } : i);
    onUpdateItems(updatedItems);
  };

  // Save quick edit item
  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItemModal) return;
    const updated = items.map(i => i.id === editItemModal.id ? editItemModal : i);
    onUpdateItems(updated);
    setEditItemModal(null);
  };

  return (
    <div className="w-full max-w-[1750px] mx-auto flex flex-col gap-4 font-sans text-slate-800">
      
      {/* TOP CONTROL BAR: RACK SELECTOR, STORAGE TYPE & ITEMS-PER-BAY ADJUSTMENT */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Rack Dropdown & Title */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white p-2.5 rounded-xl shadow-sm flex items-center gap-2">
            <Box className="w-6 h-6 text-cyan-300" />
            <span className="font-black text-sm tracking-wide uppercase">SƠ ĐỒ 3D CHI TIẾT KỆ</span>
          </div>

          {/* Rack Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="single-rack-select" className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:inline">CHỌN KỆ:</label>
            <select
              id="single-rack-select"
              value={rackId}
              onChange={(e) => {
                onSelectRack(e.target.value, selectedBay);
              }}
              className="bg-slate-50 border-2 border-teal-600 text-slate-900 font-bold text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
            >
              {racks.map(r => (
                <option key={r.id} value={r.id}>
                  KỆ {r.id} ({r.name || r.colorName || `Kệ ${r.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Storage Type Selector (Thùng nhựa vs Pallet vs Carton) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs font-bold gap-1">
            <span className="text-[11px] text-slate-500 font-semibold px-1 hidden md:inline">LOẠI LƯU TRỮ:</span>
            <button
              type="button"
              onClick={() => handleStorageTypeChange('bins')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                storageType === 'bins'
                  ? 'bg-teal-700 text-white shadow-xs font-black'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Thùng Nhựa 5S</span>
            </button>

            <button
              type="button"
              onClick={() => handleStorageTypeChange('pallets')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                storageType === 'pallets'
                  ? 'bg-teal-700 text-white shadow-xs font-black'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pallet Hàng</span>
            </button>

            <button
              type="button"
              onClick={() => handleStorageTypeChange('cartons')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                storageType === 'cartons'
                  ? 'bg-teal-700 text-white shadow-xs font-black'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Thùng Carton</span>
            </button>
          </div>
        </div>

        {/* Right Controls: Adjust Items per Bay, Layout Width & Zoom */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* USER ADJUSTABLE ITEMS/PALLETS PER BAY SELECTOR */}
          <div className="flex items-center bg-amber-50 p-1.5 rounded-xl border border-amber-300 text-xs font-bold gap-2">
            <Sliders className="w-4 h-4 text-amber-700" />
            <span className="text-[11px] text-amber-900 font-bold uppercase">SỐ VỊ TRÍ:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={`items-per-bay-${num}`}
                  type="button"
                  onClick={() => {
                    setItemsPerBay(num);
                    if (selectedSlot > num) setSelectedSlot(1);
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    itemsPerBay === num
                      ? 'bg-amber-600 text-white shadow-xs scale-105'
                      : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                  title={`Cấu hình ${num} ${storageType === 'pallets' ? 'Pallet' : 'thùng'} trong 1 khoang`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* FONT SIZE SELECTOR FOR SLOT LABELS */}
          <div className="flex items-center bg-indigo-50 p-1.5 rounded-xl border border-indigo-200 text-xs font-bold gap-2">
            <Type className="w-4 h-4 text-indigo-700" />
            <span className="text-[11px] text-indigo-900 font-bold uppercase hidden md:inline">CỠ CHỮ NHÃN:</span>
            <div className="flex items-center gap-1">
              {[12, 14, 16, 18, 20].map(sz => (
                <button
                  key={`font-sz-${sz}`}
                  type="button"
                  onClick={() => setTagFontSize(sz)}
                  className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    tagFontSize === sz
                      ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-1 ring-indigo-400'
                      : 'bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
                  }`}
                  title={`Đổi cỡ chữ nhãn ${sz}px`}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>

          {/* Full Width / Compact Layout Toggle */}
          <button
            onClick={() => setIsFullWidth(!isFullWidth)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isFullWidth ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title={isFullWidth ? "Thu nhỏ layout" : "Mở rộng full màn hình"}
          >
            {isFullWidth ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden lg:inline">{isFullWidth ? "Xem Rọn" : "Mở Rộng Full"}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-300">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.15))}
              className="px-2 py-0.5 text-xs font-black text-slate-700 hover:bg-slate-200 rounded cursor-pointer"
              title="Thu nhỏ"
            >
              -
            </button>
            <span className="text-[11px] font-mono font-bold px-1 text-slate-600">{(zoomLevel * 100).toFixed(0)}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.15))}
              className="px-2 py-0.5 text-xs font-black text-slate-700 hover:bg-slate-200 rounded cursor-pointer"
              title="Phóng to"
            >
              +
            </button>
          </div>

          {/* Print PDF Button */}
          <button
            onClick={() => onOpenPrintModal ? onOpenPrintModal('pdf4') : window.print()}
            className="bg-[#00695c] hover:bg-[#004d40] text-white p-2 px-3 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Xuất file PDF 3D Kệ này (Ảnh 5)"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Xuất PDF 3D (Ảnh 5)</span>
          </button>
        </div>
      </div>

      {/* COLOR CUSTOMIZATION SUB-BAR */}
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-teal-300 uppercase tracking-wider text-[11px]">CẤU HÌNH MÀU SẮC THEO TẦNG:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {tierNumbers.map(tier => {
            const currentHex = tierColors[tier] || '#ea580c';
            return (
              <div key={`color-picker-tier-${tier}`} className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                <span className="font-bold text-slate-300 text-[11px]">Tầng {tier} ({tier === 1 ? 'Đất' : tier === 2 ? 'Giữa' : 'Cao'}):</span>
                <div className="flex items-center gap-1">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={`pal-${tier}-${c.name}`}
                      type="button"
                      onClick={() => setTierColors({ ...tierColors, [tier]: c.hex })}
                      className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 cursor-pointer ${c.bgClass} ${
                        currentHex === c.hex ? 'ring-2 ring-teal-400 ring-offset-1 ring-offset-slate-900 scale-110' : 'border-slate-600 opacity-80'
                      }`}
                      title={`Đổi màu Tầng ${tier} sang ${c.name}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN LAYOUT GRID (SWITCHABLE FULL WIDTH VS 2-COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* CENTER 3D ISOMETRIC RACK DISPLAY CANVAS (CLEAN CAD STYLE ON WHITE CANVAS) */}
        <div className={`${isFullWidth ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden flex flex-col relative`}>
          
          {/* Header Banner */}
          <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-black text-sm uppercase tracking-wider text-teal-300">
                MÔ PHỎNG PHỐI CẢNH 3D KỆ {rackId} — CAD ISOMETRIC (5 KHOANG x 3 TẦNG)
              </h3>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="bg-slate-800 text-amber-300 px-3 py-1 rounded-lg border border-slate-700 font-bold">
                {storageType === 'bins' ? `📦 LOẠI: THÙNG NHỰA 5S (${itemsPerBay} thùng/khoang)` : storageType === 'pallets' ? `🪵 LOẠI: PALLET HÀNG (${itemsPerBay} pallet/khoang)` : `📦 LOẠI: THÙNG CARTON (${itemsPerBay} thùng/khoang)`}
              </span>
            </div>
          </div>

          {/* CANVAS AREA (CLEAN WHITE BACKGROUND, ISOMETRIC 3D CAD MODEL) */}
          <div className="w-full bg-white p-3 sm:p-5 relative overflow-auto flex flex-col items-center justify-center select-none min-h-[600px]">
            
            {/* HIGH-PRECISION ISOMETRIC 3D INDUSTRIAL RACK SVG MODEL */}
            <div 
              className="w-full flex items-center justify-center transition-transform duration-300 my-2"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <svg 
                viewBox="0 0 1050 520" 
                className="w-full max-w-[1300px] h-auto overflow-visible drop-shadow-xl"
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
                </defs>

                {/* 1. GROUND ISOMETRIC 5S SAFETY ZONE & FLOOR BAY MARKERS (ẢNH 2 STYLE) */}
                <g id="ground-5s-floor">
                  {/* Isometric floor projection */}
                  <polygon 
                    points="30,460 990,460 960,510 0,510" 
                    fill="#fef08a" 
                    stroke="#ca8a04" 
                    strokeWidth="2.5" 
                    strokeDasharray="12 6"
                  />
                  <text x="490" y="478" fill="#854d0e" fontSize="11" fontWeight="900" letterSpacing="2" textAnchor="middle">
                    ⚠️ MẶT ĐẤT (TẦNG 1) — VẠCH SƠN AN TOÀN 5S KHO BÌNH DƯƠNG (KỆ {rackId})
                  </text>

                  {/* Floor Bay Pill Markers 01, 02, 03, 04, 05 (Giống hệt Ảnh 2) */}
                  {bayNumbers.map((bay, idx) => {
                    const bayCenterX = 172 + idx * 175;
                    return (
                      <g key={`floor-badge-bay-${bay}`} transform={`translate(${bayCenterX - 22}, 485)`}>
                        <rect x="0" y="0" width="44" height="20" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" filter="url(#cadShadow)" />
                        <text x="22" y="14" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                          {bay}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* FLOATING RACK CALLOUT BADGE (ẢNH 2 STYLE: J, K, L BADGES) */}
                <g id="floating-rack-badge" transform="translate(20, 10)">
                  <rect x="0" y="0" width="65" height="32" rx="10" fill="#ea580c" stroke="#ffffff" strokeWidth="2.5" filter="url(#cadShadow)" />
                  <text x="32.5" y="21" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
                    KỆ {rackId}
                  </text>
                </g>

                {/* 2. TOP BAY HEADERS (KHOANG 01 TO KHOANG 05) */}
                <g id="bay-column-headers">
                  {bayNumbers.map((bay, idx) => {
                    const bayX = 85 + idx * 175;
                    const isSelected = selectedBay === bay;
                    return (
                      <g 
                        key={`head-bay-${bay}`} 
                        transform={`translate(${bayX}, 10)`} 
                        className="cursor-pointer" 
                        onClick={() => handleSelectSlotLocation(bay, selectedTier, selectedSlot)}
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

                {/* 3. ROW TIER LABELS (TẦNG 3, TẦNG 2, TẦNG 1) */}
                <g id="tier-row-headers">
                  {/* Tầng 3 (Top) */}
                  <g transform="translate(5, 80)" className="cursor-pointer" onClick={() => handleSelectSlotLocation(selectedBay, 3, selectedSlot)}>
                    <rect x="0" y="0" width="72" height="42" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="2" filter="url(#cadShadow)" />
                    <text x="36" y="18" fill="#78350f" fontSize="11" fontWeight="900" textAnchor="middle">TẦNG 3</text>
                    <text x="36" y="32" fill="#92400e" fontSize="9.5" fontWeight="800" textAnchor="middle">Mức A (Cao)</text>
                  </g>

                  {/* Tầng 2 (Mid) */}
                  <g transform="translate(5, 205)" className="cursor-pointer" onClick={() => handleSelectSlotLocation(selectedBay, 2, selectedSlot)}>
                    <rect x="0" y="0" width="72" height="42" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" filter="url(#cadShadow)" />
                    <text x="36" y="18" fill="#1e3a8a" fontSize="11" fontWeight="900" textAnchor="middle">TẦNG 2</text>
                    <text x="36" y="32" fill="#1d4ed8" fontSize="9.5" fontWeight="800" textAnchor="middle">Mức B (Giữa)</text>
                  </g>

                  {/* Tầng 1 (Ground) */}
                  <g transform="translate(5, 330)" className="cursor-pointer" onClick={() => handleSelectSlotLocation(selectedBay, 1, selectedSlot)}>
                    <rect x="0" y="0" width="72" height="42" rx="8" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" filter="url(#cadShadow)" />
                    <text x="36" y="18" fill="#7f1d1d" fontSize="11" fontWeight="900" textAnchor="middle">TẦNG 1</text>
                    <text x="36" y="32" fill="#b91c1c" fontSize="9.5" fontWeight="900" textAnchor="middle">MẶT ĐẤT</text>
                  </g>
                </g>

                {/* 4. STEEL FRAME RACK STRUCTURE (BLUE UPRIGHT POSTS & ORANGE BEAMS WITH 3D DEPTH) */}
                <g id="steel-rack-framework">
                  
                  {/* Rear Upright Posts (Isometric Shadow Depth) */}
                  {[90, 265, 440, 615, 790, 965].map((px, i) => (
                    <line key={`rear-post-${i}`} x1={px - 12} y1="58" x2={px - 12} y2="442" stroke="#94a3b8" strokeWidth="6" opacity="0.6" />
                  ))}

                  {/* Diagonal Cross Bracings */}
                  {[90, 265, 440, 615, 790].map((px, i) => (
                    <g key={`bracing-${i}`} opacity="0.35">
                      <line x1={px} y1="70" x2={px + 175} y2="190" stroke="#475569" strokeWidth="2" />
                      <line x1={px + 175} y1="190" x2={px} y2="310" stroke="#475569" strokeWidth="2" />
                      <line x1={px} y1="310" x2={px + 175} y2="430" stroke="#475569" strokeWidth="2" />
                    </g>
                  ))}

                  {/* Front Blue Upright Posts */}
                  {[80, 255, 430, 605, 780, 955].map((postX, i) => (
                    <g key={`front-post-${i}`}>
                      {/* Post 3D Extrusion Side */}
                      <polygon points={`${postX},55 ${postX - 10},45 ${postX - 10},445 ${postX},455`} fill="#1e293b" />
                      {/* Post Front Face */}
                      <rect x={postX} y="55" width="15" height="400" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" filter="url(#cadShadow)" />
                      {/* Bolt Holes */}
                      {Array.from({ length: 15 }).map((_, k) => (
                        <circle key={`hole-${i}-${k}`} cx={postX + 7.5} cy={68 + k * 26} r="1.8" fill="#ffffff" opacity="0.9" />
                      ))}
                    </g>
                  ))}

                  {/* Heavy Duty Orange Beams */}
                  {/* Beam Tầng 3 */}
                  <rect x="75" y="170" width="895" height="14" fill="#ea580c" stroke="#c2410c" strokeWidth="1.5" rx="2" filter="url(#cadShadow)" />
                  {/* Beam Tầng 2 */}
                  <rect x="75" y="295" width="895" height="14" fill="#ea580c" stroke="#c2410c" strokeWidth="1.5" rx="2" filter="url(#cadShadow)" />
                  {/* Beam Tầng 1 (Ground) */}
                  <rect x="75" y="420" width="895" height="14" fill="#ea580c" stroke="#c2410c" strokeWidth="1.5" rx="2" filter="url(#cadShadow)" />

                  {/* Shelf Mesh Decking */}
                  <line x1="75" y1="170" x2="970" y2="170" stroke="#fed7aa" strokeWidth="3" />
                  <line x1="75" y1="295" x2="970" y2="295" stroke="#fed7aa" strokeWidth="3" />
                  <line x1="75" y1="420" x2="970" y2="420" stroke="#fed7aa" strokeWidth="3" />
                </g>

                {/* 5. DYNAMIC CONTAINER MATRIX (EACH BAY HAS EXACTLY `itemsPerBay` CONTAINERS/PALLETS) */}
                <g id="containers-dynamic-matrix">
                  {tierNumbers.map((tier) => {
                    const customTierHex = tierColors[tier];
                    const tierY = tier === 3 ? 72 : tier === 2 ? 197 : 322; // Placement height
                    
                    return bayNumbers.map((bay, bIdx) => {
                      const bayBaseX = 96 + bIdx * 175; // Left edge of the bay
                      const availableBayWidth = 152; // Inner bay width

                      // Calculate container width and gaps depending on itemsPerBay
                      const containerGap = Math.max(3, 12 - itemsPerBay * 2);
                      const containerWidth = Math.floor((availableBayWidth - (itemsPerBay - 1) * containerGap) / itemsPerBay);

                      return Array.from({ length: itemsPerBay }).map((_, slotIdx) => {
                        const slotNum = slotIdx + 1;
                        const containerX = bayBaseX + slotIdx * (containerWidth + containerGap);
                        const isTarget = selectedBay === bay && selectedTier === tier && selectedSlot === slotNum;
                        const item = getItemAt(bay, tier, slotNum);

                        return (
                          <g
                            key={`item-slot-${bay}-${tier}-${slotNum}`}
                            transform={`translate(${containerX}, ${tierY})`}
                            className="cursor-pointer transition-all duration-200 hover:opacity-90"
                            onClick={() => handleSelectSlotLocation(bay, tier, slotNum)}
                          >
                            {/* Target Selection Highlight Frame */}
                            {isTarget && (
                              <rect 
                                x="-4" 
                                y="-6" 
                                width={containerWidth + 8} 
                                height="106" 
                                rx="8" 
                                fill="none" 
                                stroke="#0d9488" 
                                strokeWidth="3.5" 
                                strokeDasharray="6 3"
                                filter="url(#targetGlow)"
                                className="animate-pulse"
                              />
                            )}

                            {/* RENDER BASED ON STORAGE TYPE (BINS vs PALLETS vs CARTONS) */}

                            {/* A. STORAGE TYPE: THÙNG NHỰA 5S (SÓNG NHỰA BÍT CÔNG NGHIỆP - ẢNH 3) */}
                            {storageType === 'bins' && (() => {
                              const binColor = customTierHex || '#1d4ed8'; // Deep blue plastic as in Image 3
                              return (
                                <g id={`bin-${bay}-${tier}-${slotNum}`}>
                                  {/* 3D Top Opening Lip / Rim */}
                                  <polygon 
                                    points={`0,12 10,0 ${containerWidth + 10},0 ${containerWidth},12`} 
                                    fill="#2563eb" 
                                    stroke="#1e40af" 
                                    strokeWidth="1" 
                                  />
                                  <rect 
                                    x="-1" 
                                    y="12" 
                                    width={containerWidth + 2} 
                                    height="6" 
                                    rx="2" 
                                    fill="#3b82f6" 
                                    stroke="#1d4ed8" 
                                    strokeWidth="1" 
                                  />

                                  {/* 3D Front Face Main Body */}
                                  <rect 
                                    x="0" 
                                    y="18" 
                                    width={containerWidth} 
                                    height="76" 
                                    rx="2" 
                                    fill={binColor} 
                                    stroke="#1e3a8a" 
                                    strokeWidth="1.5" 
                                    filter="url(#cadShadow)" 
                                  />

                                  {/* 3D Right Side Face */}
                                  <polygon 
                                    points={`${containerWidth},18 ${containerWidth + 10},6 ${containerWidth + 10},82 ${containerWidth},94`} 
                                    fill="#1e40af" 
                                    stroke="#172554" 
                                    strokeWidth="0.8" 
                                  />

                                  {/* REINFORCING GRID / RIB STRUCTURE ON FRONT WALL (ẢNH 3 STYLE) */}
                                  <g opacity="0.6">
                                    {/* Middle Stacking Ledge Ridge */}
                                    <line x1="2" y1="52" x2={containerWidth - 2} y2="52" stroke="#60a5fa" strokeWidth="2.5" />
                                    
                                    {/* Vertical Rib Lines */}
                                    {Array.from({ length: Math.max(3, Math.floor(containerWidth / 12)) }).map((_, rIdx, arr) => {
                                      const rx = Math.floor((containerWidth / (arr.length + 1)) * (rIdx + 1));
                                      return (
                                        <line key={`vrib-${rIdx}`} x1={rx} y1="20" x2={rx} y2="92" stroke="#1e3a8a" strokeWidth="1.2" />
                                      );
                                    })}

                                    {/* Horizontal Rib Lines */}
                                    <line x1="3" y1="34" x2={containerWidth - 3} y2="34" stroke="#1e3a8a" strokeWidth="1" />
                                    <line x1="3" y1="70" x2={containerWidth - 3} y2="70" stroke="#1e3a8a" strokeWidth="1" />
                                    <line x1="3" y1="84" x2={containerWidth - 3} y2="84" stroke="#1e3a8a" strokeWidth="1" />
                                  </g>

                                  {/* Side Handle Recess / Quai Xách (Ảnh 3) */}
                                  {containerWidth >= 30 && (
                                    <rect x="3" y="44" width="6" height="16" rx="2" fill="#172554" opacity="0.7" />
                                  )}

                                  {/* White Center Label Slot Tag (Editable on Click & Larger Font Size) */}
                                  {containerWidth >= 24 && (() => {
                                    const slotLabelText = getSlotLabel(bay, tier, slotNum);
                                    const badgeW = Math.max(48, Math.min(containerWidth - 4, slotLabelText.length * (tagFontSize * 0.72) + 16));
                                    const badgeH = Math.max(24, tagFontSize + 12);
                                    const badgeX = containerWidth / 2 - badgeW / 2;
                                    const badgeY = 38 - (tagFontSize - 10) / 2;

                                    return (
                                      <g 
                                        className="cursor-pointer group/label"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectSlotLocation(bay, tier, slotNum);
                                          setEditLabelModal({
                                            bay,
                                            tier,
                                            slot: slotNum,
                                            label: slotLabelText
                                          });
                                        }}
                                      >
                                        <rect 
                                          x={badgeX - 2} 
                                          y={badgeY - 2} 
                                          width={badgeW + 4} 
                                          height={badgeH + 4} 
                                          rx="7" 
                                          fill="#38bdf8" 
                                          opacity="0" 
                                          className="group-hover/label:opacity-90 transition-opacity" 
                                        />
                                        <rect 
                                          x={badgeX} 
                                          y={badgeY} 
                                          width={badgeW} 
                                          height={badgeH} 
                                          rx="5" 
                                          fill="#ffffff" 
                                          stroke="#1e3a8a" 
                                          strokeWidth="1.8" 
                                          filter="url(#cadShadow)" 
                                        />
                                        <text 
                                          x={containerWidth / 2} 
                                          y={badgeY + badgeH / 2 + (tagFontSize * 0.35)} 
                                          fill="#0f172a" 
                                          fontSize={tagFontSize} 
                                          fontWeight="900" 
                                          textAnchor="middle" 
                                          fontFamily="monospace, sans-serif"
                                        >
                                          {slotLabelText}
                                        </text>
                                        <text 
                                          x={badgeX + badgeW - 5} 
                                          y={badgeY + 8} 
                                          fontSize="8" 
                                          opacity="0.5"
                                          className="group-hover/label:opacity-100"
                                        >
                                          ✏️
                                        </text>
                                      </g>
                                    );
                                  })()}

                                  {/* Quantity Badge */}
                                  {containerWidth >= 35 && item && (
                                    <text 
                                      x={containerWidth / 2} 
                                      y="82" 
                                      fill="#60a5fa" 
                                      fontSize="9" 
                                      fontWeight="900" 
                                      textAnchor="middle"
                                    >
                                      {item.quantity} {item.unit || 'cái'}
                                    </text>
                                  )}
                                </g>
                              );
                            })()}

                            {/* B. STORAGE TYPE: PALLET HÀNG (WOODEN PALLETS & CARGO BOXES - ẢNH 2) */}
                            {storageType === 'pallets' && (() => {
                              const boxColor = customTierHex || '#d97706'; // Warm cardboard box color as in Image 2
                              return (
                                <g id={`pallet-${bay}-${tier}-${slotNum}`}>
                                  {/* 3D Top Cardboard Face */}
                                  <polygon 
                                    points={`2,10 10,0 ${containerWidth + 6},0 ${containerWidth - 2},10`} 
                                    fill="#f3d5a5" 
                                    stroke="#b45309" 
                                    strokeWidth="0.8" 
                                  />

                                  {/* 3D Front Cardboard Box Face */}
                                  <rect 
                                    x="2" 
                                    y="10" 
                                    width={containerWidth - 4} 
                                    height="66" 
                                    rx="2" 
                                    fill={boxColor} 
                                    stroke="#92400e" 
                                    strokeWidth="1.2" 
                                    filter="url(#cadShadow)" 
                                  />

                                  {/* 3D Right Side Cardboard Face */}
                                  <polygon 
                                    points={`${containerWidth - 2},10 ${containerWidth + 6},0 ${containerWidth + 6},66 ${containerWidth - 2},76`} 
                                    fill="#b45309" 
                                    stroke="#78350f" 
                                    strokeWidth="0.8" 
                                  />

                                  {/* Cardboard Box Seam Tape Lines */}
                                  <line x1={(containerWidth - 4) / 2 + 2} y1="10" x2={(containerWidth - 4) / 2 + 2} y2="76" stroke="#fef08a" strokeWidth="2.5" opacity="0.85" />

                                  {/* 3D Wooden Pallet Base Underneath (Chân Pallet Gỗ - Ảnh 2) */}
                                  <rect x="0" y="76" width={containerWidth + 4} height="6" fill="#b45309" stroke="#78350f" strokeWidth="1" rx="1" />
                                  <rect x="3" y="82" width="8" height="8" fill="#78350f" />
                                  <rect x={containerWidth / 2 - 4} y="82" width="8" height="8" fill="#78350f" />
                                  <rect x={containerWidth - 7} y="82" width="8" height="8" fill="#78350f" />
                                  <rect x="0" y="90" width={containerWidth + 4} height="4" fill="#b45309" stroke="#78350f" />

                                  {/* Label Tag P-1, P-2 (Editable on Click & Larger Font Size) */}
                                  {containerWidth >= 24 && (() => {
                                    const slotLabelText = getSlotLabel(bay, tier, slotNum);
                                    const badgeW = Math.max(48, Math.min(containerWidth - 4, slotLabelText.length * (tagFontSize * 0.72) + 16));
                                    const badgeH = Math.max(24, tagFontSize + 12);
                                    const badgeX = containerWidth / 2 - badgeW / 2;
                                    const badgeY = 28 - (tagFontSize - 10) / 2;

                                    return (
                                      <g 
                                        className="cursor-pointer group/label"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectSlotLocation(bay, tier, slotNum);
                                          setEditLabelModal({
                                            bay,
                                            tier,
                                            slot: slotNum,
                                            label: slotLabelText
                                          });
                                        }}
                                      >
                                        <rect 
                                          x={badgeX - 2} 
                                          y={badgeY - 2} 
                                          width={badgeW + 4} 
                                          height={badgeH + 4} 
                                          rx="7" 
                                          fill="#f59e0b" 
                                          opacity="0" 
                                          className="group-hover/label:opacity-90 transition-opacity" 
                                        />
                                        <rect 
                                          x={badgeX} 
                                          y={badgeY} 
                                          width={badgeW} 
                                          height={badgeH} 
                                          rx="5" 
                                          fill="#ffffff" 
                                          stroke="#78350f" 
                                          strokeWidth="1.8" 
                                          filter="url(#cadShadow)" 
                                        />
                                        <text 
                                          x={containerWidth / 2} 
                                          y={badgeY + badgeH / 2 + (tagFontSize * 0.35)} 
                                          fill="#0f172a" 
                                          fontSize={tagFontSize} 
                                          fontWeight="900" 
                                          textAnchor="middle" 
                                          fontFamily="monospace, sans-serif"
                                        >
                                          {slotLabelText}
                                        </text>
                                        <text 
                                          x={badgeX + badgeW - 5} 
                                          y={badgeY + 8} 
                                          fontSize="8" 
                                          opacity="0.5"
                                          className="group-hover/label:opacity-100"
                                        >
                                          ✏️
                                        </text>
                                      </g>
                                    );
                                  })()}

                                  {/* Quantity text */}
                                  {containerWidth >= 40 && item && (
                                    <text 
                                      x={containerWidth / 2} 
                                      y="64" 
                                      fill="#ffffff" 
                                      fontSize="8.5" 
                                      fontWeight="900" 
                                      textAnchor="middle"
                                    >
                                      {item.quantity} {item.unit || 'cái'}
                                    </text>
                                  )}
                                </g>
                              );
                            })()}

                            {/* C. STORAGE TYPE: THÙNG CARTON */}
                            {storageType === 'cartons' && (
                              <g id={`carton-${bay}-${tier}-${slotNum}`}>
                                <polygon points={`0,14 12,0 ${containerWidth + 12},0 ${containerWidth},14`} fill="#d97706" opacity="0.9" stroke="#92400e" strokeWidth="0.8" />
                                <rect x="0" y="14" width={containerWidth} height="80" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.2" filter="url(#cadShadow)" />
                                <polygon points={`${containerWidth},14 ${containerWidth + 12},0 ${containerWidth + 12},80 ${containerWidth},94`} fill="#92400e" opacity="0.8" stroke="#78350f" />

                                {/* Packing Tape */}
                                <line x1={containerWidth / 2} y1="14" x2={containerWidth / 2} y2="94" stroke="#fef08a" strokeWidth="4" opacity="0.85" />

                                {/* Label Tag (Editable on Click & Larger Font Size) */}
                                {containerWidth >= 24 && (() => {
                                  const slotLabelText = getSlotLabel(bay, tier, slotNum);
                                  const badgeW = Math.max(48, Math.min(containerWidth - 4, slotLabelText.length * (tagFontSize * 0.72) + 16));
                                  const badgeH = Math.max(24, tagFontSize + 12);
                                  const badgeX = containerWidth / 2 - badgeW / 2;
                                  const badgeY = 32 - (tagFontSize - 10) / 2;

                                  return (
                                    <g 
                                      className="cursor-pointer group/label"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectSlotLocation(bay, tier, slotNum);
                                        setEditLabelModal({
                                          bay,
                                          tier,
                                          slot: slotNum,
                                          label: slotLabelText
                                        });
                                      }}
                                    >
                                      <rect 
                                        x={badgeX - 2} 
                                        y={badgeY - 2} 
                                        width={badgeW + 4} 
                                        height={badgeH + 4} 
                                        rx="7" 
                                        fill="#38bdf8" 
                                        opacity="0" 
                                        className="group-hover/label:opacity-90 transition-opacity" 
                                      />
                                      <rect 
                                        x={badgeX} 
                                        y={badgeY} 
                                        width={badgeW} 
                                        height={badgeH} 
                                        rx="5" 
                                        fill="#ffffff" 
                                        stroke="#0f172a" 
                                        strokeWidth="1.8" 
                                        filter="url(#cadShadow)" 
                                      />
                                      <text 
                                        x={containerWidth / 2} 
                                        y={badgeY + badgeH / 2 + (tagFontSize * 0.35)} 
                                        fill="#0f172a" 
                                        fontSize={tagFontSize} 
                                        fontWeight="900" 
                                        textAnchor="middle" 
                                        fontFamily="monospace, sans-serif"
                                      >
                                        {slotLabelText}
                                      </text>
                                      <text 
                                        x={badgeX + badgeW - 5} 
                                        y={badgeY + 8} 
                                        fontSize="8" 
                                        opacity="0.5"
                                        className="group-hover/label:opacity-100"
                                      >
                                        ✏️
                                      </text>
                                    </g>
                                  );
                                })()}
                              </g>
                            )}

                          </g>
                        );
                      });
                    });
                  })}
                </g>

              </svg>
            </div>

            {/* Bottom Color Legend & Summary Bar */}
            <div className="mt-4 w-full bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-teal-700" />
                  QUẢN LÝ VISUAL MANAGEMENT:
                </span>
                {tierNumbers.map(t => (
                  <div key={`legend-tier-${t}`} className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded border border-slate-400" style={{ backgroundColor: tierColors[t] || '#eab308' }} />
                    <span className="font-bold text-slate-800">Tầng {t} ({t === 1 ? 'Ground' : t === 2 ? 'Mức B' : 'Mức A'})</span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] font-mono text-slate-600 font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-lg border border-amber-300">
                ⚡ 1 Khoang = {itemsPerBay} {storageType === 'pallets' ? 'vị trí / pallet' : 'thùng nhựa 5S'}
              </div>
            </div>

          </div>
        </div>

        {/* SIDE PANEL: SELECTED ITEM DETAILS & INVENTORY SLOT TABLE */}
        <div className={`${isFullWidth ? 'lg:col-span-12' : 'lg:col-span-4'} flex flex-col gap-4`}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            
            {/* 1. ACTIVE SLOT DETAILS CARD */}
            <div className="lg:col-span-6 bg-white rounded-2xl border-2 border-teal-600 shadow-lg overflow-hidden flex flex-col">
              
              <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-300" />
                  <h4 className="font-black text-sm uppercase tracking-wider">
                    THÔNG TIN Ô KỆ ĐANG CHỌN
                  </h4>
                </div>
                <span className="bg-teal-700 text-teal-100 text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border border-teal-500">
                  {rackId}-{selectedBay}-{selectedTier}-{selectedSlot}
                </span>
              </div>

              <div className="p-4 flex flex-col gap-3">
                
                {/* Big Location Address Box */}
                <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">MÃ ĐỊA CHỈ ĐỊNH VỊ 5S</span>
                    <div className="text-xl font-mono font-black text-white tracking-wider flex items-center gap-1.5 mt-0.5">
                      <span className="text-amber-400">{rackId}</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-cyan-400">{selectedBay}</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-emerald-400">{selectedTier}</span>
                      <span className="text-amber-300 text-sm font-sans font-bold ml-1.5">(Vị trí {selectedSlot}/{itemsPerBay})</span>
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getTierInfo(selectedTier).badgeBg}`}>
                    {getTierInfo(selectedTier).label}
                  </div>
                </div>

                {/* Editable Slot Label Box in Side Panel */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3 rounded-xl border border-indigo-500/40 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">NHÃN VỊ TRÍ TRÊN 3D (CLICK ĐỂ SỬA)</span>
                    <div className="text-base font-mono font-black text-amber-300 flex items-center gap-2 mt-0.5">
                      <Tag className="w-4 h-4 text-cyan-400" />
                      <span className="bg-white text-slate-900 px-2 py-0.5 rounded text-sm font-black border border-indigo-300 shadow-2xs">
                        {getSlotLabel(selectedBay, selectedTier, selectedSlot)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditLabelModal({
                      bay: selectedBay,
                      tier: selectedTier,
                      slot: selectedSlot,
                      label: getSlotLabel(selectedBay, selectedTier, selectedSlot)
                    })}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa Chữ</span>
                  </button>
                </div>

                {/* Selected Item Info */}
                {selectedItem ? (
                  <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="bg-teal-700 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                          MÃ SKU: {selectedItem.code}
                        </span>
                        <h5 className="font-black text-base text-slate-900 mt-1">
                          {selectedItem.name}
                        </h5>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {selectedItem.spec || 'Không có quy cách bổ sung'}
                        </p>
                      </div>

                      <button
                        onClick={() => setEditItemModal(selectedItem)}
                        className="p-1.5 bg-white hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-300 transition-colors shadow-xs cursor-pointer"
                        title="Chỉnh sửa vật tư"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="bg-white p-3 rounded-xl border border-teal-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">SỐ LƯỢNG TỒN THỰC TẾ</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black font-mono text-teal-900">
                            {selectedItem.quantity.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-xs font-bold text-slate-600">{selectedItem.unit || 'cái'}</span>
                        </div>
                      </div>

                      {/* + / - Buttons */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(selectedItem, -10)}
                          className="w-8 h-8 bg-white hover:bg-red-50 text-red-700 font-black rounded-lg border border-slate-300 flex items-center justify-center active:scale-90 transition-transform shadow-xs cursor-pointer"
                          title="-10"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(selectedItem, 10)}
                          className="w-8 h-8 bg-white hover:bg-emerald-50 text-emerald-700 font-black rounded-lg border border-slate-300 flex items-center justify-center active:scale-90 transition-transform shadow-xs cursor-pointer"
                          title="+10"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-teal-200">
                      <span className="text-slate-600 font-medium">Nhóm: <strong>{selectedItem.category || 'Linh kiện'}</strong></span>
                      <span className="text-teal-800 font-bold">Mức an toàn: {selectedItem.minStock || 20}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-xl border-2 border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-2">
                    <Box className="w-8 h-8 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">Ô Kệ Này Đang Trống</span>
                    <p className="text-xs text-slate-500">Chưa gán linh kiện cho vị trí {rackId}-{selectedBay}-{selectedTier}-{selectedSlot}</p>
                    
                    {onOpenUpdateModal && (
                      <button
                        type="button"
                        onClick={() => onOpenUpdateModal()}
                        className="mt-1 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Gán Linh Kiện Vào Ô Này
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Bay, Tier, & Slot Selectors */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Grid className="w-3.5 h-3.5 text-teal-700" />
                    CHỌN KHOANG KỆ (01 - 05):
                  </span>

                  <div className="grid grid-cols-5 gap-1.5">
                    {bayNumbers.map(bay => (
                      <button
                        key={`btn-bay-${bay}`}
                        type="button"
                        onClick={() => handleSelectSlotLocation(bay, selectedTier, selectedSlot)}
                        className={`py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer ${
                          selectedBay === bay
                            ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-400'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        BAY {bay}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Layers className="w-3.5 h-3.5 text-teal-700" />
                        TẦNG (1 - 3):
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {tierNumbers.map(tier => (
                          <button
                            key={`btn-tier-${tier}`}
                            type="button"
                            onClick={() => handleSelectSlotLocation(selectedBay, tier, selectedSlot)}
                            className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              selectedTier === tier
                                ? 'bg-teal-700 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            T{tier}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Box className="w-3.5 h-3.5 text-teal-700" />
                        VỊ TRÍ / KHOANG:
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: itemsPerBay }).map((_, sIdx) => {
                          const sNum = sIdx + 1;
                          return (
                            <button
                              key={`btn-slot-${sNum}`}
                              type="button"
                              onClick={() => handleSelectSlotLocation(selectedBay, selectedTier, sNum)}
                              className={`flex-1 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                selectedSlot === sNum
                                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                              }`}
                            >
                              VT {sNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. INVENTORY LIST FOR CURRENT RACK */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-md p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h5 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-700" />
                  DANH SÁCH VẬT TƯ TRÊN KỆ {rackId} ({bayNumbers.length * tierNumbers.length * itemsPerBay} Ô VỊ TRÍ)
                </h5>
                <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {items.filter(i => i.rackId === rackId).length} linh kiện
                </span>
              </div>

              <div className="max-h-[320px] overflow-y-auto flex flex-col gap-1.5 pr-1">
                {bayNumbers.flatMap(bay => 
                  tierNumbers.flatMap(tier => 
                    Array.from({ length: itemsPerBay }).map((_, sIdx) => {
                      const slotNum = sIdx + 1;
                      const it = getItemAt(bay, tier, slotNum);
                      const isSel = selectedBay === bay && selectedTier === tier && selectedSlot === slotNum;

                      return (
                        <div
                          key={`list-slot-${bay}-${tier}-${slotNum}`}
                          onClick={() => handleSelectSlotLocation(bay, tier, slotNum)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSel 
                              ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-400 font-bold shadow-xs' 
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-teal-800 bg-teal-100 px-2 py-0.5 rounded text-[10px]">
                              {rackId}-{bay}-{tier}-{slotNum}
                            </span>
                            <span className="text-slate-800 truncate max-w-[200px] font-semibold">
                              {it ? it.name : '— Ô Trống —'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-700 font-bold">
                              {it ? `${it.quantity} ${it.unit || 'cái'}` : '0'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: EDIT ITEM DETAILS */}
      {editItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-700" />
                Chỉnh Sửa Linh Kiện: {editItemModal.code}
              </h3>
              <button 
                type="button"
                onClick={() => setEditItemModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="flex flex-col gap-3 text-xs">
              <div>
                <label htmlFor="edit-item-name" className="font-bold text-slate-700 block mb-1">Tên Linh Kiện / Vật Tư:</label>
                <input
                  id="edit-item-name"
                  type="text"
                  value={editItemModal.name}
                  onChange={(e) => setEditItemModal({ ...editItemModal, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-teal-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-item-code" className="font-bold text-slate-700 block mb-1">Mã Số (SKU):</label>
                  <input
                    id="edit-item-code"
                    type="text"
                    value={editItemModal.code}
                    onChange={(e) => setEditItemModal({ ...editItemModal, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:border-teal-600"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-item-unit" className="font-bold text-slate-700 block mb-1">Đơn Vị Tính:</label>
                  <input
                    id="edit-item-unit"
                    type="text"
                    value={editItemModal.unit || 'cái'}
                    onChange={(e) => setEditItemModal({ ...editItemModal, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-item-quantity" className="font-bold text-slate-700 block mb-1">Số Lượng Tồn Thực Tế:</label>
                  <input
                    id="edit-item-quantity"
                    type="number"
                    value={editItemModal.quantity}
                    onChange={(e) => setEditItemModal({ ...editItemModal, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label htmlFor="edit-item-category" className="font-bold text-slate-700 block mb-1">Chủng Loại Linh Kiện:</label>
                  <input
                    id="edit-item-category"
                    type="text"
                    value={editItemModal.category || ''}
                    onChange={(e) => setEditItemModal({ ...editItemModal, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-2">
                <button
                  type="button"
                  onClick={() => setEditItemModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-md cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SLOT LABEL TEXT */}
      {editLabelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                Sửa Nhãn Vị Trí 3D ({rackId}-{editLabelModal.bay}-{editLabelModal.tier}-{editLabelModal.slot})
              </h3>
              <button 
                type="button"
                onClick={() => setEditLabelModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomLabel} className="flex flex-col gap-3 text-xs">
              <div>
                <label htmlFor="slot-label-input" className="font-bold text-slate-700 block mb-1">
                  Nội dung chữ hiển thị trên thẻ trắng (VD: P-1, P-2, A-01, BOX-1...):
                </label>
                <input
                  id="slot-label-input"
                  type="text"
                  value={editLabelModal.label}
                  onChange={(e) => setEditLabelModal({ ...editLabelModal, label: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-indigo-500 rounded-xl p-3 font-mono font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Ví dụ: P-1"
                  autoFocus
                  required
                />
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Bạn có thể nhập chữ, số hoặc ký tự tùy ý. Nội dung sẽ lập tức được phóng to và cập nhật trên sơ đồ 3D!</span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    const defaultText = storageType === 'pallets' ? `P-${editLabelModal.slot}` : `#${editLabelModal.slot}`;
                    setEditLabelModal({ ...editLabelModal, label: defaultText });
                  }}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold underline cursor-pointer"
                >
                  Khôi phục mặc định
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditLabelModal(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Lưu Nhãn
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
