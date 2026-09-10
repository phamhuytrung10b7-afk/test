import React, { useState, useEffect, useRef } from 'react';
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
  Type,
  FileSpreadsheet,
  Upload,
  Download,
  Zap,
  Sparkles,
  RefreshCw,
  FileCheck2,
  AlertCircle,
  ArrowRightLeft,
  Replace,
  Copy,
  Hash,
  QrCode
} from 'lucide-react';
import { 
  exportStandardRackExcelTemplate, 
  parseExcelRackFile, 
  getStandardSlotCode, 
  generateSampleItemsForRack,
  batchReplacePrefixForRack,
  replacePrefixInLabel,
  ExcelImportResult,
  ParsedSlotData
} from './ExcelRackSyncHelper';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './localStorageHelper';
import { HighTierQRCardModal } from './HighTierQRCardModal';

export interface SingleRack3DDetailViewProps {
  racks: WarehouseRack[];
  selectedRackId: string;
  onSelectRack: (rackId: string, bayId?: string) => void;
  onUpdateRacks?: (racks: WarehouseRack[]) => void;
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
  currentPosition: WarehousePosition;
  onPositionChange: (pos: WarehousePosition) => void;
  onOpenUpdateModal?: (item?: InventoryItem) => void;
  onOpenPrintModal?: (tab?: 'pdf1' | 'pdf2' | 'pdf3' | 'pdf4', pdf4Config?: any) => void;
  tierCount?: number; // 3 or 4
  defaultBays?: string[]; // e.g. ['01','02','03','04','05'] or ['01','02','03']
  defaultItemsPerBay?: number; // e.g. 2 or 3
  modelName?: string;
}

export const SingleRack3DDetailView: React.FC<SingleRack3DDetailViewProps> = ({
  racks,
  selectedRackId,
  onSelectRack,
  onUpdateRacks,
  items,
  onUpdateItems,
  currentPosition,
  onPositionChange,
  onOpenUpdateModal,
  onOpenPrintModal,
  tierCount = 3,
  defaultBays,
  defaultItemsPerBay,
  modelName,
}) => {
  // Effective rack model configuration
  const is4Tier = tierCount === 4;
  const effectiveTierCount = is4Tier ? 4 : 3;
  const effectiveTierList = is4Tier ? [4, 3, 2, 1] : [3, 2, 1];
  const initialBays = defaultBays || (is4Tier ? ['01', '02', '03'] : ['01', '02', '03', '04', '05']);
  const initialItemsPerBay = defaultItemsPerBay || (is4Tier ? 3 : 2);
  const totalSlotsCount = initialBays.length * effectiveTierCount * initialItemsPerBay;

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

  // Rack Rename / Details Modal
  const [editRackTitleModal, setEditRackTitleModal] = useState<{
    name: string;
    id: string;
    category?: string;
  } | null>(null);

  // Selected Bay, Tier, and Slot inside Bay
  const [selectedBay, setSelectedBay] = useState<string>('01');
  const [selectedTier, setSelectedTier] = useState<number>(is4Tier ? 4 : 3);
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [editItemModal, setEditItemModal] = useState<InventoryItem | null>(null);

  // Layout & Perspective Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1.1);
  const [isFullWidth, setIsFullWidth] = useState<boolean>(true);

  // Editable Tag Font Size (Default 14px for bold, highly legible text)
  const [tagFontSize, setTagFontSize] = useState<number>(14);

  // Storage Type & Number of items per bay
  const [storageType, setStorageType] = useState<'bins' | 'pallets' | 'cartons'>('pallets');
  const [itemsPerBay, setItemsPerBay] = useState<number>(initialItemsPerBay);
  const [bayNumbers, setBayNumbers] = useState<string[]>(initialBays);

  // Color Customization per Tier
  const [tierColors, setTierColors] = useState<{ [tier: number]: string }>(() => {
    if (is4Tier) {
      return {
        4: '#eab308', // Tier 4: Yellow (Top)
        3: '#ea580c', // Tier 3: Orange
        2: '#2563eb', // Tier 2: Blue
        1: '#dc2626', // Tier 1: Red (Ground)
      };
    }
    return {
      3: '#eab308', // Tier 3: Yellow
      2: '#2563eb', // Tier 2: Blue
      1: '#dc2626', // Tier 1: Red (Ground)
    };
  });

  // Custom Slot Labels map (Key: `${rackId}-${bay}-${tier}-${slot}`)
  const storageKey = is4Tier ? `${STORAGE_KEYS.CUSTOM_SLOT_LABELS}_4T3K` : STORAGE_KEYS.CUSTOM_SLOT_LABELS;
  const [customSlotLabels, setCustomSlotLabels] = useState<{ [key: string]: string }>(() => {
    return loadFromStorage<{ [key: string]: string }>(storageKey, {});
  });

  // Save to localStorage when customSlotLabels change
  useEffect(() => {
    saveToStorage(storageKey, customSlotLabels);
  }, [customSlotLabels, storageKey]);

  // Modal state for editing single slot label
  const [editLabelModal, setEditLabelModal] = useState<{
    bay: string;
    tier: number;
    slot: number;
    label: string;
  } | null>(null);

  // Quick Prefix Replacer States
  const [quickOldPrefix, setQuickOldPrefix] = useState<string>('G');
  const [quickNewPrefix, setQuickNewPrefix] = useState<string>('C');
  const [isBatchPrefixModalOpen, setIsBatchPrefixModalOpen] = useState<boolean>(false);
  const [batchModalOld, setBatchModalOld] = useState<string>('G');
  const [batchModalNew, setBatchModalNew] = useState<string>('C');
  const [batchKeepNumbers, setBatchKeepNumbers] = useState<boolean>(true);

  // Excel File Input Ref & Upload Modal State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState<boolean>(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preset Color Palette
  const COLOR_PALETTE = [
    { name: 'Đỏ', hex: '#dc2626', bgClass: 'bg-red-600' },
    { name: 'Xanh Dương', hex: '#2563eb', bgClass: 'bg-blue-600' },
    { name: 'Vàng', hex: '#eab308', bgClass: 'bg-yellow-500' },
    { name: 'Cam', hex: '#ea580c', bgClass: 'bg-orange-600' },
    { name: 'Xanh Lá', hex: '#16a34a', bgClass: 'bg-green-600' },
    { name: 'Tím', hex: '#9333ea', bgClass: 'bg-purple-600' },
    { name: 'Gỗ / Nâu', hex: '#b45309', bgClass: 'bg-amber-800' },
    { name: 'Xám Ghi', hex: '#475569', bgClass: 'bg-slate-600' },
  ];

  // Helper to show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Switch storage type with default itemsPerBay recommendation
  const handleStorageTypeChange = (type: 'bins' | 'pallets' | 'cartons') => {
    setStorageType(type);
    if (type === 'pallets') {
      setItemsPerBay(initialItemsPerBay);
    } else if (type === 'bins') {
      setItemsPerBay(3);
    } else {
      setItemsPerBay(3);
    }
  };

  // Get info for tier
  const getTierInfo = (tier: number) => {
    const customHex = tierColors[tier] || (tier === 4 ? '#eab308' : tier === 3 ? (is4Tier ? '#ea580c' : '#eab308') : tier === 2 ? '#2563eb' : '#dc2626');
    if (is4Tier) {
      switch(tier) {
        case 4:
          return {
            code: 'A',
            name: 'Tầng 4 (Top - Mức A)',
            badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
            hex: customHex,
            label: 'Tầng 4 (Cao Nhất)'
          };
        case 3:
          return {
            code: 'B',
            name: 'Tầng 3 (Upper - Mức B)',
            badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
            hex: customHex,
            label: 'Tầng 3 (Tầng Trên)'
          };
        case 2:
          return {
            code: 'C',
            name: 'Tầng 2 (Middle - Mức C)',
            badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
            hex: customHex,
            label: 'Tầng 2 (Tầng Giữa)'
          };
        case 1:
        default:
          return {
            code: 'D',
            name: 'Tầng 1 (Ground - Mặt Đất)',
            badgeBg: 'bg-red-100 text-red-900 border-red-300',
            hex: customHex,
            label: 'Tầng 1 (Mặt Đất)'
          };
      }
    }

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

  // Get slot label (Custom or Default G01 to GN)
  const getSlotLabel = (bay: string, tier: number, slot: number) => {
    const key = `${rackId}-${bay}-${tier}-${slot}`;
    if (customSlotLabels[key]) return customSlotLabels[key];
    return getStandardSlotCode(bay, tier, slot, bayNumbers, itemsPerBay, 'G', effectiveTierCount);
  };

  // Save custom slot label from double click
  const handleSaveCustomLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLabelModal) return;
    const key = `${rackId}-${editLabelModal.bay}-${editLabelModal.tier}-${editLabelModal.slot}`;
    const newText = editLabelModal.label.trim();
    setCustomSlotLabels(prev => ({
      ...prev,
      [key]: newText || getStandardSlotCode(editLabelModal.bay, editLabelModal.tier, editLabelModal.slot, bayNumbers, itemsPerBay, 'G', effectiveTierCount)
    }));
    setEditLabelModal(null);
  };

  /**
   * KEY FEATURE 1: BATCH REPLACE PREFIX (E.G. 'G' -> 'C') KEEPING ALL SEQUENCE NUMBERS INTACT
   */
  const handleExecuteBatchPrefixReplace = (oldP: string, newP: string) => {
    const trimmedOld = oldP.trim().toUpperCase();
    const trimmedNew = newP.trim().toUpperCase();
    if (!trimmedNew) {
      showToast('⚠️ Vui lòng nhập chữ/tiền tố mới (ví dụ: C, A, B, K...)');
      return;
    }

    // 1. Update customSlotLabels dictionary for this rack
    const updatedLabels = batchReplacePrefixForRack(
      customSlotLabels,
      rackId,
      trimmedOld,
      trimmedNew,
      bayNumbers,
      itemsPerBay,
      effectiveTierCount
    );
    setCustomSlotLabels(updatedLabels);

    // 2. Also update current prefix states
    setQuickOldPrefix(trimmedNew);
    setQuickNewPrefix(trimmedOld === 'G' ? 'C' : 'G');

    setIsBatchPrefixModalOpen(false);
    showToast(`⚡ ĐÃ ĐỔI HÀNG LOẠT: Thay chữ '${trimmedOld}' thành '${trimmedNew}' thành công! Toàn bộ ${totalSlotsCount} vị trí đã nhảy sang (${trimmedNew}01..${trimmedNew}${totalSlotsCount < 10 ? '0' + totalSlotsCount : totalSlotsCount}) mà vẫn giữ nguyên 100% số thứ tự.`);
  };

  // One-click Auto Sequence (G01 to GN, or custom prefix)
  const handleApplyAutoSequence = (prefix: string = 'G') => {
    const newLabels: { [key: string]: string } = { ...customSlotLabels };
    bayNumbers.forEach(bay => {
      for (let t = 1; t <= effectiveTierCount; t++) {
        for (let s = 1; s <= itemsPerBay; s++) {
          const key = `${rackId}-${bay}-${t}-${s}`;
          newLabels[key] = getStandardSlotCode(bay, t, s, bayNumbers, itemsPerBay, prefix, effectiveTierCount);
        }
      }
    });
    setCustomSlotLabels(newLabels);
    setQuickOldPrefix(prefix);
    showToast(`⚡ Đã đánh số tự động toàn bộ ${totalSlotsCount} vị trí Kệ (${prefix}01 đến ${prefix}${totalSlotsCount < 10 ? '0' + totalSlotsCount : totalSlotsCount}) thành công!`);
  };

  // One-click Auto Fill Sample Pallets with Sunhouse industrial items
  const handleFillSamplePallets = (prefix: string = 'G') => {
    const sampleItems = generateSampleItemsForRack(rackId, bayNumbers, itemsPerBay, effectiveTierCount, prefix);
    const otherItems = items.filter(i => i.rackId !== rackId && !i.location?.startsWith(`${rackId}-`));
    const merged = [...otherItems, ...sampleItems];
    onUpdateItems(merged);
    handleApplyAutoSequence(prefix);
    showToast(`🎉 Đã nạp thành công đầy đủ ${sampleItems.length} Pallet hàng hóa chuẩn Sunhouse (${prefix}01 - ${prefix}${sampleItems.length}) vào Kệ ${rackId}!`);
  };

  // Download Sample Excel File matching current rack layout
  const handleDownloadExcelTemplate = () => {
    exportStandardRackExcelTemplate(
      rackId,
      activeRack.name || `KỆ ${rackId} - KHU VỰC LINH KIỆN`,
      items,
      customSlotLabels,
      itemsPerBay,
      bayNumbers,
      effectiveTierCount
    );
    showToast(`📥 Đã tải file mẫu Excel (${effectiveTierCount} Tầng - ${bayNumbers.length} Khoang - ${totalSlotsCount} Vị Trí) về máy!`);
  };

  // Handle Excel File Upload & Parse
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingExcel(true);
    try {
      const res = await parseExcelRackFile(file, rackId, items, itemsPerBay, bayNumbers, effectiveTierCount);
      setImportResult(res);
      setIsExcelModalOpen(true);
      if (res.success) {
        setCustomSlotLabels(prev => ({
          ...prev,
          ...res.customLabels
        }));
        onUpdateItems(res.updatedItems);
        showToast(`🎉 ${res.message}`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Lỗi khi đọc file Excel: ${err?.message || 'Vui lòng kiểm tra lại cấu trúc file.'}`);
    } finally {
      setIsUploadingExcel(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Apply parsed results from modal
  const handleConfirmImport = () => {
    if (importResult && importResult.success) {
      setCustomSlotLabels(prev => ({
        ...prev,
        ...importResult.customLabels
      }));
      onUpdateItems(importResult.updatedItems);
      setIsExcelModalOpen(false);
      showToast(`✅ Đã đồng bộ hoàn tất ${importResult.totalParsed} vị trí vào sơ đồ 3D Kệ ${rackId}!`);
    }
  };

  // Currently selected item
  const selectedItem = getItemAt(selectedBay, selectedTier, selectedSlot);

  // Handle slot selection
  const handleSelectSlotLocation = (bay: string, tier: number, slot: number = 1) => {
    setSelectedBay(bay);
    setSelectedTier(tier);
    setSelectedSlot(slot);
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
      
      {/* QUICK RACK SWITCHER & MODEL BANNER */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Box className="w-4 h-4 text-cyan-400" />
            <span>CHỌN NHANH KỆ:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {racks.map(r => {
              const isActive = r.id === rackId;
              return (
                <button
                  key={`quick-rack-btn-${r.id}`}
                  type="button"
                  onClick={() => onSelectRack(r.id, selectedBay)}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-105 ring-2 ring-white/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500'
                  }`}
                  title={`Xem mô phỏng 3D Kệ ${r.id}`}
                >
                  <span>KỆ {r.id}</span>
                </button>
              );
            })}
          </div>

          <span className="ml-3 bg-teal-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-black px-2.5 py-1 rounded-lg">
            {modelName || (is4Tier ? 'MẪU 2 (4 TẦNG / 3 KHOANG / 3 VỊ TRÍ - 36 Ô)' : 'MẪU 1 (3 TẦNG / 5 KHOANG / 2 VỊ TRÍ - 30 Ô)')}
          </span>
        </div>

        {/* Quick Print & Export Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQRModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer border-2 border-yellow-300 ring-2 ring-amber-400/30 active:scale-95"
            title="Xuất trọn bộ mã QR tất cả các vị trí kệ (Toàn bộ các tầng) khổ A4 ngang"
          >
            <QrCode className="w-4 h-4 text-slate-950" />
            <span>📱 XUẤT MÃ QR TẤT CẢ VỊ TRÍ KỆ</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenPrintModal ? onOpenPrintModal('pdf4', {
              storageType,
              itemsPerBay,
              tierColors,
              customSlotLabels,
              tagFontSize,
              tierCount: effectiveTierCount,
              bayNumbers
            }) : window.print()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer border border-emerald-400/40 active:scale-95"
            title="In sơ đồ 3D mô phỏng Kệ này ra khổ A4/A3 dán thực tế tại xưởng"
          >
            <Printer className="w-4 h-4 text-yellow-300" />
            <span>🖨️ IN SƠ ĐỒ KỆ DÁN THỰC TẾ (A4/A3)</span>
          </button>
        </div>
      </div>

      {/* TOP CONTROL BAR: STORAGE TYPE & FONT CONTROLS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Storage Type Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white p-2.5 rounded-xl shadow-sm flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-300" />
            <span className="font-black text-sm tracking-wide uppercase">CẤU TRÚC KỆ {rackId} ({effectiveTierCount} TẦNG • {bayNumbers.length} KHOANG • {totalSlotsCount} VỊ TRÍ)</span>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs font-bold gap-1">
            <span className="text-[11px] text-slate-500 font-semibold px-1 hidden md:inline">LOẠI LƯU TRỮ:</span>
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

        {/* Right: Tag Font Size & Zoom */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tag Font Size Selector */}
          <div className="flex items-center bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 gap-2">
            <Type className="w-4 h-4 text-indigo-700" />
            <span className="text-xs font-bold text-indigo-900">Cỡ Chữ Nhãn Thẻ:</span>
            <div className="flex items-center gap-1">
              {[12, 14, 16, 18].map(sz => (
                <button
                  key={`fontsize-btn-${sz}`}
                  type="button"
                  onClick={() => setTagFontSize(sz)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
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

          {/* Full Width Toggle */}
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
        </div>
      </div>

      {/* QUICK PREFIX BATCH REPLACER & EXCEL SYNC TOOLBAR */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 text-white px-4 py-3.5 rounded-2xl border-2 border-indigo-600/60 shadow-xl flex flex-col gap-3">
        
        {/* Row 1: Fast Prefix / Letter Replacer (G -> C) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-white/10">
          
          {/* Left Title & Fast Replacer Form */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <ArrowRightLeft className="w-5 h-5 animate-pulse" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>ĐỔI TIỀN TỐ VỊ TRÍ HÀNG LOẠT (GIỮ NGUYÊN SỐ ĐÁNH)</span>
                </span>
                <span className="bg-amber-500/30 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 font-mono">
                  G01 ➔ C01 / A01
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Thay đổi nhanh chữ cái đầu (VD: đổi chữ <strong>G</strong> thành chữ <strong>C</strong>), toàn bộ nhãn ({totalSlotsCount} ô) sẽ tự động nhảy thành <strong>C01, C02...</strong> mà không mất số thứ tự!
              </p>
            </div>
          </div>

          {/* Right: Instant Prefix Replacer Box & 1-Click Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Input Box */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-indigo-400/50 shadow-inner gap-1.5">
              <span className="text-[11px] text-slate-300 font-bold px-2">Đổi chữ:</span>
              <input
                type="text"
                value={quickOldPrefix}
                onChange={(e) => setQuickOldPrefix(e.target.value.toUpperCase())}
                className="w-8 bg-slate-900 border border-slate-600 rounded-lg text-center font-mono font-black text-sm text-yellow-300 focus:outline-none focus:border-amber-400"
                maxLength={3}
                placeholder="G"
                title="Chữ tiền tố hiện tại cần đổi (VD: G)"
              />
              <span className="text-amber-400 font-black text-sm">➔</span>
              <input
                type="text"
                value={quickNewPrefix}
                onChange={(e) => setQuickNewPrefix(e.target.value.toUpperCase())}
                className="w-8 bg-slate-900 border border-slate-600 rounded-lg text-center font-mono font-black text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
                maxLength={3}
                placeholder="C"
                title="Chữ tiền tố mới thay thế (VD: C)"
              />
              <button
                type="button"
                onClick={() => handleExecuteBatchPrefixReplace(quickOldPrefix, quickNewPrefix)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title={`Đổi toàn bộ ${quickOldPrefix} thành ${quickNewPrefix} giữ nguyên số thứ tự`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Đổi Hàng Loạt ({quickOldPrefix} ➔ {quickNewPrefix})</span>
              </button>
            </div>

            {/* 1-Click Preset Replacement Pills */}
            <div className="flex items-center gap-1">
              {[
                { from: 'G', to: 'C' },
                { from: 'C', to: 'G' },
                { from: 'G', to: 'A' },
                { from: 'G', to: 'B' },
                { from: 'G', to: 'K' }
              ].map(preset => (
                <button
                  key={`preset-${preset.from}-${preset.to}`}
                  type="button"
                  onClick={() => {
                    setQuickOldPrefix(preset.from);
                    setQuickNewPrefix(preset.to);
                    handleExecuteBatchPrefixReplace(preset.from, preset.to);
                  }}
                  className="bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white px-2 py-1 rounded-lg text-[11px] font-mono font-bold border border-slate-700 hover:border-indigo-400 transition-all cursor-pointer active:scale-95"
                  title={`Đổi nhanh ${preset.from} thành ${preset.to}`}
                >
                  {preset.from}➔{preset.to}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsBatchPrefixModalOpen(true)}
                className="bg-indigo-700 hover:bg-indigo-600 text-white p-1.5 rounded-lg text-xs font-bold border border-indigo-400 transition-all cursor-pointer"
                title="Mở bảng cấu hình đổi tiền tố nâng cao"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

        {/* Row 2: Excel Sync & Sample Pallet Fill */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          {/* Left Excel Info */}
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">
              ĐỒNG BỘ DỮ LIỆU EXCEL ({totalSlotsCount} VỊ TRÍ):
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              accept=".xlsx, .xls"
              className="hidden"
            />

            {/* 1. Download Template Button */}
            <button
              type="button"
              onClick={handleDownloadExcelTemplate}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-emerald-400/40 active:scale-95"
              title={`Tải file Excel mẫu chuẩn ${totalSlotsCount} vị trí cho Kệ này`}
            >
              <Download className="w-4 h-4 text-emerald-100" />
              <span>Tải Mẫu Excel ({totalSlotsCount} Ô)</span>
            </button>

            {/* 2. Upload / Import Excel Button */}
            <button
              type="button"
              disabled={isUploadingExcel}
              onClick={() => fileInputRef.current?.click()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer border border-cyan-400/40 active:scale-95"
              title="Tải lên file Excel để tự động đồng bộ vật tư và mã thẻ"
            >
              {isUploadingExcel ? (
                <RefreshCw className="w-4 h-4 text-cyan-200 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-cyan-100" />
              )}
              <span>{isUploadingExcel ? 'Đang đọc...' : 'Nhập Từ Excel'}</span>
            </button>

            {/* 3. Auto-Sequence Button (01 to N) */}
            <button
              type="button"
              onClick={() => handleApplyAutoSequence(quickOldPrefix || 'G')}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-amber-400/40 active:scale-95"
              title={`Tự động gán nhãn chuẩn từ 01 đến ${totalSlotsCount}`}
            >
              <Hash className="w-4 h-4 text-amber-200" />
              <span>Đánh Số Chuẩn ({quickOldPrefix || 'G'}01 - {quickOldPrefix || 'G'}{totalSlotsCount < 10 ? '0' + totalSlotsCount : totalSlotsCount})</span>
            </button>

            {/* 4. One-Click Fill Sample Pallets */}
            <button
              type="button"
              onClick={() => handleFillSamplePallets(quickOldPrefix || 'G')}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-indigo-300/40 active:scale-95"
              title={`Tự động nạp ${totalSlotsCount} Pallet hàng hóa linh kiện Sunhouse chuẩn lên toàn bộ kệ`}
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>⚡ Nạp {totalSlotsCount} Pallet Mẫu Sunhouse</span>
            </button>
          </div>

        </div>

      </div>

      {/* RACK ITEMS SHORTAGE NOTIFICATION BANNER */}
      {items.filter(i => i.rackId === rackId || i.location?.startsWith(`${rackId}-`)).length < 6 && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100 to-orange-50 border-2 border-amber-400/80 text-amber-950 px-4 py-3 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-900">
                📦 Kệ {rackId} ({effectiveTierCount} Tầng / {bayNumbers.length} Khoang) hiện chưa nạp đủ {totalSlotsCount} kiện pallet hàng hóa hiển thị.
              </p>
              <p className="text-[11px] text-amber-800">
                Bạn có thể bấm <strong className="font-black underline cursor-pointer" onClick={() => handleFillSamplePallets(quickOldPrefix || 'G')}>[⚡ Nạp {totalSlotsCount} Pallet Mẫu Sunhouse]</strong> hoặc <strong className="font-black underline cursor-pointer" onClick={() => fileInputRef.current?.click()}>[Nhập Từ Excel]</strong> để xem đầy đủ kiện pallet 3D, số thứ tự ({quickOldPrefix || 'G'}01 - {quickOldPrefix || 'G'}{totalSlotsCount < 10 ? '0' + totalSlotsCount : totalSlotsCount}), mã vật tư và số lượng!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleFillSamplePallets(quickOldPrefix || 'G')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          >
            ⚡ Nạp Nhanh {totalSlotsCount} Pallet
          </button>
        </div>
      )}

      {/* TOAST MESSAGE FLOATING ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border-2 border-teal-400 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up max-w-md">
          <div className="w-7 h-7 rounded-xl bg-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold leading-relaxed">
            {toastMessage}
          </div>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN 3D WORKBENCH: CANVAS (LEFT) & DETAIL INSPECTOR (RIGHT) */}
      <div className={`grid grid-cols-1 ${isFullWidth ? 'lg:grid-cols-12' : 'lg:grid-cols-12'} gap-5 items-start`}>
        
        {/* 3D ISOMETRIC RACK CANVAS CONTAINER */}
        <div className={`${isFullWidth ? 'lg:col-span-8' : 'lg:col-span-7'} bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden flex flex-col`}>
          
          {/* Canvas Top Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black text-slate-800 tracking-wide">
                MÔ PHỎNG 3D ISOMETRIC THỰC TẾ — KỆ {rackId} ({effectiveTierCount} TẦNG • {bayNumbers.length} KHOANG • {totalSlotsCount} VỊ TRÍ)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold hidden sm:inline">
                💡 Kích đúp vào nhãn thẻ trên kệ để sửa chữ nhanh
              </span>
            </div>
          </div>

          {/* Interactive SVG Stage with White CAD Canvas */}
          <div className="relative w-full overflow-x-auto overflow-y-hidden p-3 bg-gradient-to-b from-white via-slate-50/40 to-slate-100 flex items-center justify-center min-h-[460px]">
            <div 
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }} 
              className="w-full max-w-[1050px] transition-transform duration-150"
            >
              <IsometricRackSVG
                rackId={rackId}
                rackDisplayName={activeRack.name}
                onDoubleClickRackName={() => setEditRackTitleModal({
                  id: activeRack.id,
                  name: activeRack.name || `Kệ ${activeRack.id}`,
                  category: activeRack.colorName
                })}
                storageType={storageType}
                tierCount={effectiveTierCount}
                tierList={effectiveTierList}
                itemsPerBay={itemsPerBay}
                tierColors={tierColors}
                bayNumbers={bayNumbers}
                selectedBay={selectedBay}
                selectedTier={selectedTier}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlotLocation}
                onDoubleClickLabel={(b, t, s) => {
                  const currLabel = getSlotLabel(b, t, s);
                  setEditLabelModal({
                    bay: b,
                    tier: t,
                    slot: s,
                    label: currLabel
                  });
                }}
                getSlotLabel={getSlotLabel}
                getSlotItem={getItemAt}
                tagFontSize={tagFontSize}
              />
            </div>
          </div>

          {/* Color Customization Palette for All Tiers */}
          <div className="bg-slate-900 text-white p-4 border-t border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  TÙY CHỈNH MÀU SƠN THEO TẦNG ({effectiveTierCount} TẦNG):
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Click vào màu để đổi ngay màu kiện pallet / thùng 3D của tầng tương ứng
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {effectiveTierList.map(tier => {
                const tierInfo = getTierInfo(tier);
                const currentHex = tierColors[tier] || tierInfo.hex;
                return (
                  <div key={`tier-palette-${tier}`} className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-200">{tierInfo.name}</span>
                      <span className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: currentHex }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {COLOR_PALETTE.map(col => (
                        <button
                          key={`col-${tier}-${col.hex}`}
                          type="button"
                          onClick={() => setTierColors(prev => ({ ...prev, [tier]: col.hex }))}
                          className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${col.bgClass} ${
                            currentHex.toLowerCase() === col.hex.toLowerCase()
                              ? 'ring-2 ring-white scale-125 border-white'
                              : 'border-slate-600 hover:scale-110 opacity-70 hover:opacity-100'
                          }`}
                          title={`Đổi ${tierInfo.name} thành màu ${col.name}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT DETAIL INSPECTOR: SELECTED POSITION INFORMATION */}
        <div className={`${isFullWidth ? 'lg:col-span-4' : 'lg:col-span-5'} flex flex-col gap-4`}>
          
          {/* Selected Slot Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-5 flex flex-col gap-4">
            
            {/* Header: Slot Badge & Current Tag */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-mono font-black text-sm shadow-xs">
                  {getSlotLabel(selectedBay, selectedTier, selectedSlot)}
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <span>CHI TIẾT VỊ TRÍ</span>
                    <span className="bg-cyan-100 text-cyan-900 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      K{rackId}-B{selectedBay}-T{selectedTier}-S{selectedSlot}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Khoang {selectedBay} • {getTierInfo(selectedTier).name} • Ô {selectedSlot}
                  </p>
                </div>
              </div>

              {/* Edit Label Button */}
              <button
                type="button"
                onClick={() => setEditLabelModal({
                  bay: selectedBay,
                  tier: selectedTier,
                  slot: selectedSlot,
                  label: getSlotLabel(selectedBay, selectedTier, selectedSlot)
                })}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-indigo-200"
                title="Chỉnh sửa nhãn thẻ vị trí"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa Nhãn</span>
              </button>
            </div>

            {/* Item Details in this Position */}
            {selectedItem ? (
              <div className="flex flex-col gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-teal-900 bg-teal-100/80 px-2 py-0.5 rounded-md border border-teal-300">
                      {selectedItem.code}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      selectedItem.status === 'out_of_stock'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : selectedItem.status === 'low_stock'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {selectedItem.status === 'out_of_stock' ? 'Hết Hàng' : selectedItem.status === 'low_stock' ? 'Cảnh Báo Tồn Thấp' : 'Tồn Đạt Chuẩn 5S'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 leading-snug">
                    {selectedItem.name}
                  </h4>

                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-700">Quy cách:</strong> {selectedItem.spec || 'Quy cách chuẩn'}
                  </p>

                  {/* Quantity adjustment */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-1">
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">TỒN KHO THỰC TẾ:</span>
                      <span className="font-mono font-black text-base text-slate-900">
                        {selectedItem.quantity} <span className="text-xs font-normal text-slate-500">{selectedItem.unit || 'cái'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(selectedItem, -10)}
                        className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                        title="Giảm 10"
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(selectedItem, -1)}
                        className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                        title="Giảm 1"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(selectedItem, 1)}
                        className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                        title="Tăng 1"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(selectedItem, 10)}
                        className="w-8 h-8 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 shadow-xs"
                        title="Tăng 10"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>

                {/* Edit Item / Barcode button */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditItemModal(selectedItem)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Sửa Thông Tin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenUpdateModal ? onOpenUpdateModal(selectedItem) : setEditItemModal(selectedItem)}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Cập Nhật Đầy Đủ</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center gap-2">
                <Box className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">Vị trí này chưa gán vật tư cụ thể</p>
                <p className="text-[11px] text-slate-500">Bạn có thể bấm nạp vật tư mẫu hoặc nhập file Excel để gán hàng loạt</p>
                <button
                  type="button"
                  onClick={() => {
                    const sample = {
                      id: `item-${rackId}-${selectedBay}-${selectedTier}-${selectedSlot}-${Date.now()}`,
                      code: `SH-LK-${getSlotLabel(selectedBay, selectedTier, selectedSlot)}`,
                      name: `Linh kiện ${getSlotLabel(selectedBay, selectedTier, selectedSlot)}`,
                      category: 'Linh kiện Sunhouse',
                      location: `${rackId}-${selectedBay}-${selectedTier}-${selectedSlot}`,
                      rackId,
                      bayId: selectedBay,
                      tier: selectedTier,
                      slot: selectedSlot,
                      direction: '→',
                      spec: 'Quy cách chuẩn Sunhouse 5S',
                      unit: 'cái',
                      quantity: 150,
                      minQuantity: 20,
                      status: 'in_stock' as const,
                      barcode: `893${rackId}${selectedBay}${selectedTier}${selectedSlot}`,
                      updatedAt: new Date().toISOString(),
                      note: 'Tạo nhanh tại vị trí'
                    };
                    onUpdateItems([...items, sample]);
                    showToast(`✅ Đã thêm vật tư mẫu vào vị trí ${getSlotLabel(selectedBay, selectedTier, selectedSlot)}`);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-xs mt-1"
                >
                  + Thêm Vật Tư Vào Ô Này
                </button>
              </div>
            )}

            {/* Quick 1-Click Bay Switcher within this rack */}
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">CHỌN NHANH KHOANG:</span>
              <div className="grid grid-cols-5 gap-1.5">
                {bayNumbers.map(b => (
                  <button
                    key={`side-bay-btn-${b}`}
                    type="button"
                    onClick={() => handleSelectSlotLocation(b, selectedTier, selectedSlot)}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedBay === b
                        ? 'bg-teal-700 text-white shadow-xs font-black'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    K{b}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick 1-Click Tier Switcher within this rack */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">CHỌN NHANH TẦNG:</span>
              <div className={`grid ${is4Tier ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5`}>
                {effectiveTierList.map(t => (
                  <button
                    key={`side-tier-btn-${t}`}
                    type="button"
                    onClick={() => handleSelectSlotLocation(selectedBay, t, selectedSlot)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedTier === t
                        ? 'bg-indigo-600 text-white shadow-xs font-black'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Tầng {t}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: BATCH PREFIX REPLACER ADVANCED */}
      {isBatchPrefixModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Đổi Tiền Tố Nhãn Vị Trí Hàng Loạt
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kệ {rackId} ({totalSlotsCount} vị trí)
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsBatchPrefixModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Chữ/Tiền tố cũ cần đổi:
                  </label>
                  <input
                    type="text"
                    value={batchModalOld}
                    onChange={(e) => setBatchModalOld(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-mono font-black text-base text-slate-900 text-center"
                    placeholder="G"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Chữ/Tiền tố mới thay thế:
                  </label>
                  <input
                    type="text"
                    value={batchModalNew}
                    onChange={(e) => setBatchModalNew(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-indigo-500 rounded-xl p-2.5 font-mono font-black text-base text-indigo-900 text-center"
                    placeholder="C"
                    autoFocus
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1.5">Xem trước kết quả nhảy hàng loạt:</span>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                  <div className="bg-white p-1.5 rounded border text-center">
                    <span className="text-slate-400 line-through mr-1">{batchModalOld}01</span>
                    <strong className="text-emerald-700">{batchModalNew}01</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border text-center">
                    <span className="text-slate-400 line-through mr-1">{batchModalOld}02</span>
                    <strong className="text-emerald-700">{batchModalNew}02</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border text-center">
                    <span className="text-slate-400 line-through mr-1">{batchModalOld}{totalSlotsCount}</span>
                    <strong className="text-emerald-700">{batchModalNew}{totalSlotsCount}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Số thứ tự (01, 02.. {totalSlotsCount}) sẽ được giữ nguyên 100%. Chỉ tiền tố chữ cái thay đổi theo yêu cầu của bạn!</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsBatchPrefixModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleExecuteBatchPrefixReplace(batchModalOld, batchModalNew)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Xác Nhận Đổi Hàng Loạt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SINGLE SLOT LABEL (DOUBLE CLICK) */}
      {editLabelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-mono font-black text-sm">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Sửa Nhãn Thẻ Vị Trí Ô Kệ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kệ {rackId} • Khoang {editLabelModal.bay} • Tầng {editLabelModal.tier} • Ô {editLabelModal.slot}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditLabelModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomLabel} className="flex flex-col gap-3 text-xs">
              <div>
                <label htmlFor="slot-label-input" className="font-bold text-slate-700 block mb-1">
                  Nội dung chữ hiển thị trên thẻ trắng (VD: G01, C01, P-1, A-01...):
                </label>
                <input
                  id="slot-label-input"
                  type="text"
                  value={editLabelModal.label}
                  onChange={(e) => setEditLabelModal({ ...editLabelModal, label: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-indigo-500 rounded-xl p-3 font-mono font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Ví dụ: C01"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    const defaultText = getStandardSlotCode(editLabelModal.bay, editLabelModal.tier, editLabelModal.slot, bayNumbers, itemsPerBay, 'G', effectiveTierCount);
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

      {/* MODAL: EDIT RACK TITLE (DOUBLE CLICK ON TITLE BADGE) */}
      {editRackTitleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Đổi Tên & Tiêu Đề Kệ 3D
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kệ ID: {editRackTitleModal.id}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditRackTitleModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateRacks) {
                const updated = racks.map(r => r.id === editRackTitleModal.id ? { ...r, name: editRackTitleModal.name, colorName: editRackTitleModal.category } : r);
                onUpdateRacks(updated);
              }
              setEditRackTitleModal(null);
              showToast('✅ Đã lưu tên kệ mới thành công!');
            }} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên hiển thị trên huy hiệu Kệ (VD: KỆ A, KỆ DÃY 01, KỆ LINH KIỆN...):
                </label>
                <input
                  type="text"
                  value={editRackTitleModal.name}
                  onChange={(e) => setEditRackTitleModal({ ...editRackTitleModal, name: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-orange-500 rounded-xl p-3 font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Phân loại / Ghi chú khu vực:
                </label>
                <input
                  type="text"
                  value={editRackTitleModal.category || ''}
                  onChange={(e) => setEditRackTitleModal({ ...editRackTitleModal, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  placeholder="Ví dụ: Khu Vực Linh Kiện Nồi Cơm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 mt-1">
                <button
                  type="button"
                  onClick={() => setEditRackTitleModal(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Lưu Tên Kệ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCEL IMPORT RESULT PREVIEW */}
      {isExcelModalOpen && importResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 flex flex-col gap-4 animate-scale-up max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${importResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {importResult.success ? <FileCheck2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {importResult.success ? 'Đã Nhập Dữ Liệu Excel Thành Công!' : 'Có Lỗi Khi Đọc File Excel'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tổng số vị trí đã xử lý: <strong className="text-slate-800">{importResult.totalParsed}</strong> ô
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsExcelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[360px] border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono font-bold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Mã Thẻ (3D)</th>
                    <th className="p-2.5">Khoang - Tầng - VT</th>
                    <th className="p-2.5">Mã Vật Tư</th>
                    <th className="p-2.5">Tên Vật Tư</th>
                    <th className="p-2.5 text-right">Số Lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {(importResult.parsedSlots || []).map((row, idx) => (
                    <tr key={`excel-row-${idx}`} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-black text-amber-900 bg-amber-50">
                        {row.slotCode}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">
                        K{rackId}-B{row.bayId}-T{row.tier}-S{row.slot}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-teal-800">
                        {row.itemCode || '—'}
                      </td>
                      <td className="p-2.5 font-medium text-slate-800">
                        {row.itemName || '—'}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-right text-slate-900">
                        {row.quantity > 0 ? `${row.quantity} ${row.unit || 'cái'}` : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer text-xs"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Áp Dụng Vào Sơ Đồ 3D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ITEM DETAILS */}
      {editItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900">
                Chỉnh Sửa Vật Tư: {editItemModal.code}
              </h3>
              <button 
                type="button"
                onClick={() => setEditItemModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mã Vật Tư / SKU:</label>
                <input
                  type="text"
                  value={editItemModal.code}
                  onChange={(e) => setEditItemModal({ ...editItemModal, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Vật Tư / Hàng Hóa:</label>
                <input
                  type="text"
                  value={editItemModal.name}
                  onChange={(e) => setEditItemModal({ ...editItemModal, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Lượng Tồn:</label>
                  <input
                    type="number"
                    value={editItemModal.quantity}
                    onChange={(e) => setEditItemModal({ ...editItemModal, quantity: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn Vị Tính:</label>
                  <input
                    type="text"
                    value={editItemModal.unit || 'cái'}
                    onChange={(e) => setEditItemModal({ ...editItemModal, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Quy Cách / Thông Số:</label>
                <input
                  type="text"
                  value={editItemModal.spec || ''}
                  onChange={(e) => setEditItemModal({ ...editItemModal, spec: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 mt-1">
                <button
                  type="button"
                  onClick={() => setEditItemModal(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIGH TIER QR CODE EXPORT MODAL */}
      {isQRModalOpen && (
        <HighTierQRCardModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          rackId={rackId}
          tierCount={effectiveTierCount}
          bayNumbers={bayNumbers}
          itemsPerBay={itemsPerBay}
          customSlotLabels={customSlotLabels}
          companyName="CÔNG TY SẢN XUẤT ĐỒ GIA DỤNG SUNHOUSE"
          branchName="CHI NHÁNH BÌNH DƯƠNG"
        />
      )}

    </div>
  );
};
