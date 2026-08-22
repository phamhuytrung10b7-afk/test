import React, { useState } from 'react';
import { 
  WarehouseRack, 
  InventoryItem, 
  WarehousePosition 
} from './types';
import { IsometricRackSVG } from './IsometricRackSVG';
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
  onOpenPrintModal?: (tab?: 'pdf1' | 'pdf2' | 'pdf3' | 'pdf4', pdf4Config?: any) => void;
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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
            <span className="hidden lg:inline">{isFullWidth ? "Thu Gọn" : "Mở Rộng Full"}</span>
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
            onClick={() => onOpenPrintModal ? onOpenPrintModal('pdf4', {
              storageType,
              itemsPerBay,
              tierColors,
              customSlotLabels,
              tagFontSize
            }) : window.print()}
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
        <div className={`${isFullscreen ? 'fixed inset-0 z-[99999] w-screen h-screen rounded-none' : isFullWidth ? 'lg:col-span-12 rounded-2xl border-2 border-slate-300 shadow-xl' : 'lg:col-span-8 rounded-2xl border-2 border-slate-300 shadow-xl'} bg-white overflow-hidden flex flex-col relative`}>
          
          {/* Header Banner */}
          <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-black text-sm uppercase tracking-wider text-teal-300">
                MÔ PHỎNG PHỐI CẢNH 3D KỆ {rackId} — CAD ISOMETRIC (5 KHOANG x 3 TẦNG)
              </h3>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-mono">
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-teal-400 hover:text-teal-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer mr-1" title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}>{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button><span className="bg-slate-800 text-amber-300 px-3 py-1 rounded-lg border border-slate-700 font-bold">
                {storageType === 'bins' ? `📦 LOẠI: THÙNG NHỰA 5S (${itemsPerBay} thùng/khoang)` : storageType === 'pallets' ? `🪵 LOẠI: PALLET HÀNG (${itemsPerBay} pallet/khoang)` : `📦 LOẠI: THÙNG CARTON (${itemsPerBay} thùng/khoang)`}
              </span>
            </div>
          </div>

          {/* CANVAS AREA (CLEAN WHITE BACKGROUND, ISOMETRIC 3D CAD MODEL) */}
          <div className={`w-full bg-white p-3 sm:p-5 relative overflow-auto flex flex-col items-center select-none ${isFullscreen ? "flex-1" : "min-h-[600px]"}`}>
            
            {/* HIGH-PRECISION ISOMETRIC 3D INDUSTRIAL RACK SVG MODEL */}
            <div 
              className="w-full min-w-max flex justify-center transition-transform duration-300 my-2 origin-top"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <IsometricRackSVG
                rackId={rackId}
                storageType={storageType}
                itemsPerBay={itemsPerBay}
                tierColors={tierColors}
                bayNumbers={bayNumbers}
                selectedBay={selectedBay}
                selectedTier={selectedTier}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlotLocation}
                onDoubleClickLabel={(bay, tier, slot) => {
                  const current = getSlotLabel(bay, tier, slot);
                  const newLabel = window.prompt(`Sửa nhanh nhãn vị trí ${bay}-${tier}-${slot}:`, current);
                  if (newLabel !== null) {
                    const key = `${selectedRackId || "A"}-${bay}-${tier}-${slot}`;
                    setCustomSlotLabels(prev => ({ ...prev, [key]: newLabel.trim() || (storageType === "pallets" ? `P-${slot}` : `#${slot}`) }));
                  }
                }}
                getSlotLabel={getSlotLabel}
                getSlotItem={getItemAt}
                tagFontSize={tagFontSize}
              />
            </div>

            {/* Bottom Color Legend & Summary Bar */}
            <div className="mt-4 w-full bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-teal-700" />
                  QUẢN LÝ VISUAL MANAGEMENT: <span className="ml-2 font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1 inline-flex">💡 Kích đúp vào nhãn trên 3D để sửa nhanh chữ!</span>
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
