import React, { useState, useEffect } from 'react';
import { 
  BoardConfig, 
  FloorMarking, 
  InventoryItem, 
  MapTextAnnotation, 
  RackBay, 
  SafetyRule, 
  WarehouseFacilityObject, 
  FacilityObjectType, 
  WarehouseRack 
} from './types';
import { 
  X, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Upload, 
  Check, 
  Move, 
  Layers, 
  Boxes, 
  Edit3, 
  Type, 
  MapPin, 
  Eye, 
  Sparkles,
  RotateCw,
  Palette,
  Database,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

interface WarehouseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardConfig: BoardConfig;
  onSaveBoardConfig: (cfg: BoardConfig) => void;
  racks: WarehouseRack[];
  onSaveRacks: (racks: WarehouseRack[]) => void;
  facilities: WarehouseFacilityObject[];
  onSaveFacilities: (facilities: WarehouseFacilityObject[]) => void;
  annotations?: MapTextAnnotation[];
  onSaveAnnotations?: (anns: MapTextAnnotation[]) => void;
  floorMarkings?: FloorMarking[];
  onSaveFloorMarkings?: (markings: FloorMarking[]) => void;
  items: InventoryItem[];
  onSaveItems: (items: InventoryItem[]) => void;
  safetyRules: SafetyRule[];
  onSaveSafetyRules: (rules: SafetyRule[]) => void;
  onResetToDefaults: () => void;
}

export const WarehouseEditorModal: React.FC<WarehouseEditorModalProps> = ({
  isOpen,
  onClose,
  boardConfig,
  onSaveBoardConfig,
  racks = [],
  onSaveRacks,
  facilities = [],
  onSaveFacilities,
  annotations = [],
  onSaveAnnotations,
  floorMarkings = [],
  onSaveFloorMarkings,
  items = [],
  onSaveItems,
  safetyRules = [],
  onSaveSafetyRules,
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'racks' | 'facilities' | 'annotations' | 'floor_markings' | 'items' | 'display' | 'board' | 'backup'>('racks');

  // Label & Object Visibility States (Tùy chọn ẩn / hiện tên kệ, tên vật thể, nhãn)
  const [showFacilityLabels, setShowFacilityLabels] = useState<boolean>(() => {
    const saved = localStorage.getItem('warehouse_show_facility_labels');
    return saved !== null ? saved === 'true' : true;
  });
  const [showRackLabels, setShowRackLabels] = useState<boolean>(() => {
    const saved = localStorage.getItem('warehouse_show_rack_labels');
    return saved !== null ? saved === 'true' : true;
  });
  const [showAnnotationLabels, setShowAnnotationLabels] = useState<boolean>(() => {
    const saved = localStorage.getItem('warehouse_show_annotation_labels');
    return saved !== null ? saved === 'true' : true;
  });
  const [showPinBadge, setShowPinBadge] = useState<boolean>(() => {
    const saved = localStorage.getItem('warehouse_show_pin_badge');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleFacilityLabels = (val: boolean) => {
    setShowFacilityLabels(val);
    localStorage.setItem('warehouse_show_facility_labels', String(val));
    window.dispatchEvent(new Event('storage'));
  };
  const toggleRackLabels = (val: boolean) => {
    setShowRackLabels(val);
    localStorage.setItem('warehouse_show_rack_labels', String(val));
    window.dispatchEvent(new Event('storage'));
  };
  const toggleAnnotationLabels = (val: boolean) => {
    setShowAnnotationLabels(val);
    localStorage.setItem('warehouse_show_annotation_labels', String(val));
    window.dispatchEvent(new Event('storage'));
  };
  const togglePinBadge = (val: boolean) => {
    setShowPinBadge(val);
    localStorage.setItem('warehouse_show_pin_badge', String(val));
    window.dispatchEvent(new Event('storage'));
  };

  // Local states for editing
  const [localConfig, setLocalConfig] = useState<BoardConfig>(() => boardConfig ? { ...boardConfig } : ({} as BoardConfig));
  const [localRacks, setLocalRacks] = useState<WarehouseRack[]>(() => Array.isArray(racks) ? [...racks] : []);
  const [localFacilities, setLocalFacilities] = useState<WarehouseFacilityObject[]>(() => Array.isArray(facilities) ? [...facilities] : []);
  const [localAnnotations, setLocalAnnotations] = useState<MapTextAnnotation[]>(() => Array.isArray(annotations) ? [...annotations] : []);
  const [localFloorMarkings, setLocalFloorMarkings] = useState<FloorMarking[]>(() => Array.isArray(floorMarkings) ? [...floorMarkings] : []);
  const [localItems, setLocalItems] = useState<InventoryItem[]>(() => Array.isArray(items) ? [...items] : []);

  // Synchronize local states whenever props change or modal is opened
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(boardConfig ? { ...boardConfig } : ({} as BoardConfig));
      setLocalRacks(Array.isArray(racks) ? [...racks] : []);
      setLocalFacilities(Array.isArray(facilities) ? [...facilities] : []);
      setLocalAnnotations(Array.isArray(annotations) ? [...annotations] : []);
      setLocalFloorMarkings(Array.isArray(floorMarkings) ? [...floorMarkings] : []);
      setLocalItems(Array.isArray(items) ? [...items] : []);
    }
  }, [isOpen, boardConfig, racks, facilities, annotations, floorMarkings, items]);

  // New Facility State
  const [newFacName, setNewFacName] = useState('');
  const [newFacType, setNewFacType] = useState<FacilityObjectType>('mezzanine');
  const [newFacX, setNewFacX] = useState(60);
  const [newFacY, setNewFacY] = useState(50);
  const [newFacW, setNewFacW] = useState(30);
  const [newFacL, setNewFacL] = useState(20);
  const [newFacH, setNewFacH] = useState(28);
  const [newFacColor, setNewFacColor] = useState('#f8fafc');
  const [newFacStairs, setNewFacStairs] = useState(true);

  // New Annotation State
  const [newAnnVi, setNewAnnVi] = useState('');
  const [newAnnEn, setNewAnnEn] = useState('');
  const [newAnnX, setNewAnnX] = useState(50);
  const [newAnnY, setNewAnnY] = useState(50);
  const [newAnnSize, setNewAnnSize] = useState(12);
  const [newAnnColor, setNewAnnColor] = useState('#0f172a');
  const [newAnnBadge, setNewAnnBadge] = useState('');
  const [newAnnRotation, setNewAnnRotation] = useState(0);

  // New Floor Marking State
  const [newFmName, setNewFmName] = useState('');
  const [newFmType, setNewFmType] = useState<'box' | 'line'>('box');
  const [newFmX, setNewFmX] = useState(30);
  const [newFmY, setNewFmY] = useState(30);
  const [newFmW, setNewFmW] = useState(20);
  const [newFmL, setNewFmL] = useState(20);
  const [newFmColor, setNewFmColor] = useState('#facc15');
  const [newFmStroke, setNewFmStroke] = useState(3);

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemLoc, setNewItemLoc] = useState('A-02-C-1');
  const [newItemQty, setNewItemQty] = useState(100);

  // New Rack State
  const [newRackId, setNewRackId] = useState('');
  const [newRackName, setNewRackName] = useState('');
  const [newRackColor, setNewRackColor] = useState('#ea580c');
  const [newRackX, setNewRackX] = useState(60);
  const [newRackY, setNewRackY] = useState(10);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // --- FACILITIES HANDLERS ---
  const handleAddFacility = (e?: React.FormEvent, presetType?: FacilityObjectType) => {
    if (e) e.preventDefault();
    const type = presetType || newFacType;
    let name = newFacName.trim();
    if (!name) {
      if (type === 'bin_rack') name = `Kệ Thùng Nhựa 5S #${localFacilities.filter(f => f.type === 'bin_rack').length + 1}`;
      else if (type === 'mezzanine') name = `Sàn Lửng Mezzanine #${localFacilities.filter(f => f.type === 'mezzanine').length + 1}`;
      else if (type === 'pallet_staging') name = `Khu Vực Pallet Staging #${localFacilities.length + 1}`;
      else if (type === 'conveyor') name = `Băng Tải Phân Loại #${localFacilities.length + 1}`;
      else if (type === 'agv') name = `Xe AGV Tự Động #${localFacilities.length + 1}`;
      else if (type === 'workstation') name = `Bàn QC / Thao Tác #${localFacilities.length + 1}`;
      else if (type === 'door') name = `Cổng Xuất Nhập #${localFacilities.length + 1}`;
      else name = `Thiết Bị Kho #${localFacilities.length + 1}`;
    }

    const newFac: WarehouseFacilityObject = {
      id: `fac-${Date.now()}`,
      name,
      type,
      x: Number(newFacX),
      y: Number(newFacY),
      width: type === 'bin_rack' ? 8 : type === 'mezzanine' ? 34 : Number(newFacW),
      length: type === 'bin_rack' ? 24 : type === 'mezzanine' ? 20 : Number(newFacL),
      height: type === 'bin_rack' ? 16 : type === 'mezzanine' ? 28 : Number(newFacH),
      color: type === 'bin_rack' ? '#2563eb' : newFacColor,
      hasStairs: type === 'mezzanine' ? newFacStairs : undefined,
      tiersCount: type === 'bin_rack' ? 2 : undefined,
      hasAndonBoard: type === 'bin_rack' ? true : undefined,
      hasFloorArrow: type === 'bin_rack' ? true : undefined,
      category: type === 'bin_rack' ? 'Kệ Thùng Nhựa 5S' : type === 'mezzanine' ? 'Sàn tầng lửng' : type === 'pallet_staging' ? 'Khu Pallet' : 'Thiết bị kho',
    };

    const updated = [...localFacilities, newFac];
    setLocalFacilities(updated);
    onSaveFacilities?.(updated);
    showNotification(`Đã thêm thiết bị/sàn "${newFac.name}" thành công!`);
    setNewFacName('');
  };

  const handleUpdateFacility = (id: string, updates: Partial<WarehouseFacilityObject>) => {
    const updated = localFacilities.map(f => f.id === id ? { ...f, ...updates } : f);
    setLocalFacilities(updated);
    onSaveFacilities?.(updated);
  };

  const handleDeleteFacility = (id: string) => {
    const updated = localFacilities.filter(f => f.id !== id);
    setLocalFacilities(updated);
    onSaveFacilities?.(updated);
    showNotification('Đã xóa thiết bị kho thành công!');
  };

  // --- ANNOTATIONS HANDLERS ---
  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnVi.trim()) {
      alert('Vui lòng nhập tên khu vực!');
      return;
    }
    const newAnn: MapTextAnnotation = {
      id: `ann-${Date.now()}`,
      textVi: newAnnVi.trim(),
      textEn: newAnnEn.trim() || undefined,
      x: Number(newAnnX),
      y: Number(newAnnY),
      fontSize: Number(newAnnSize) || 12,
      color: newAnnColor || '#0f172a',
      badge5s: newAnnBadge.trim() || undefined,
      rotation: Number(newAnnRotation) || 0,
    };
    const updated = [...localAnnotations, newAnn];
    setLocalAnnotations(updated);
    onSaveAnnotations?.(updated);
    showNotification(`Đã thêm nhãn "${newAnn.textVi}" vào sơ đồ!`);
    setNewAnnVi('');
    setNewAnnEn('');
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<MapTextAnnotation>) => {
    const updated = localAnnotations.map(a => a.id === id ? { ...a, ...updates } : a);
    setLocalAnnotations(updated);
    onSaveAnnotations?.(updated);
  };

  const handleDeleteAnnotation = (id: string) => {
    const updated = localAnnotations.filter(a => a.id !== id);
    setLocalAnnotations(updated);
    onSaveAnnotations?.(updated);
    showNotification('Đã xóa nhãn khu vực!');
  };

  // --- FLOOR MARKINGS HANDLERS ---
  const handleAddFloorMarking = (e: React.FormEvent) => {
    e.preventDefault();
    const newFm: FloorMarking = {
      id: `fm-${Date.now()}`,
      name: newFmName.trim() || `Vạch vàng ${localFloorMarkings.length + 1}`,
      type: newFmType,
      x: Number(newFmX),
      y: Number(newFmY),
      width: newFmType === 'box' ? Number(newFmW) : undefined,
      length: newFmType === 'box' ? Number(newFmL) : undefined,
      x2: newFmType === 'line' ? Number(newFmX) : undefined,
      y2: newFmType === 'line' ? Number(newFmY) + Number(newFmL) : undefined,
      color: newFmColor || '#facc15',
      strokeWidth: Number(newFmStroke) || 3,
      fillOpacity: newFmType === 'box' ? 0.05 : 0,
    };
    const updated = [...localFloorMarkings, newFm];
    setLocalFloorMarkings(updated);
    onSaveFloorMarkings?.(updated);
    showNotification(`Đã tạo vạch kẻ vàng "${newFm.name}"!`);
    setNewFmName('');
  };

  const handleUpdateFloorMarking = (id: string, updates: Partial<FloorMarking>) => {
    const updated = localFloorMarkings.map(fm => fm.id === id ? { ...fm, ...updates } : fm);
    setLocalFloorMarkings(updated);
    onSaveFloorMarkings?.(updated);
  };

  const handleDeleteFloorMarking = (id: string) => {
    const updated = localFloorMarkings.filter(fm => fm.id !== id);
    setLocalFloorMarkings(updated);
    onSaveFloorMarkings?.(updated);
    showNotification('Đã xóa vạch kẻ vàng!');
  };

  // --- RACKS & LENGTH ADJUSTMENT HANDLERS (5 bays auto, 3 tiers) ---
  const handleUpdateRackLength = (rackId: string, deltaBayLength: number) => {
    const updated = localRacks.map(r => {
      if (r.id === rackId) {
        const currentBayLen = r.bayLength || 4.8;
        const newBayLen = Math.max(2.4, Math.min(9.0, Number((currentBayLen + deltaBayLength).toFixed(1))));
        return { ...r, bayLength: newBayLen };
      }
      return r;
    });
    setLocalRacks(updated);
    onSaveRacks(updated);
    showNotification('Đã cập nhật chiều dài kệ!');
  };

  const handleUpdateRackCoord = (rackId: string, dx: number, dy: number) => {
    const updated = localRacks.map(r => {
      if (r.id === rackId) {
        return {
          ...r,
          x: Math.max(2, Math.min(95, r.x + dx)),
          y: Math.max(2, Math.min(90, r.y + dy)),
        };
      }
      return r;
    });
    setLocalRacks(updated);
    onSaveRacks(updated);
  };

  const handleDeleteRack = (rackId: string) => {
    if (localRacks.length <= 1) {
      alert('Kho cần giữ tối thiểu 1 dãy kệ!');
      return;
    }
    const updated = localRacks.filter(r => r.id !== rackId);
    setLocalRacks(updated);
    onSaveRacks(updated);
    showNotification(`Đã xóa kệ ${rackId}`);
  };

  const handleAddNewRack = (e: React.FormEvent) => {
    e.preventDefault();
    const existingIds = new Set(localRacks.map(r => r.id.trim().toUpperCase()));
    let nextId = newRackId.trim().toUpperCase();

    if (nextId) {
      if (existingIds.has(nextId)) {
        alert(`Dãy kệ "${nextId}" đã tồn tại trên sơ đồ! Vui lòng nhập mã dãy khác hoặc để trống để hệ thống tự cấp.`);
        return;
      }
    } else {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < letters.length; i++) {
        if (!existingIds.has(letters[i])) {
          nextId = letters[i];
          break;
        }
      }
      if (!nextId) {
        let count = 1;
        while (existingIds.has(`R${count}`)) {
          count++;
        }
        nextId = `R${count}`;
      }
    }

    const nextName = newRackName.trim() || `DÃY ${String(localRacks.length + 1).padStart(2, '0')} (KỆ ${nextId})`;
    const createBays = (col: string) => Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1).padStart(2, '0'),
      bayNumber: String(i + 1).padStart(2, '0'),
      tiers: 3,
      slotsPerTier: 2,
      color: col,
      fillLevel: 75,
    }));

    const newRack: WarehouseRack = {
      id: nextId,
      name: nextName,
      colorName: `DÃY ${nextId}`,
      color: newRackColor || '#ea580c',
      x: Number(newRackX) || 60,
      y: Number(newRackY) || 10,
      length: 5,
      bayLength: 4.8,
      width: 2.8,
      bays: createBays(newRackColor || '#ea580c'),
      category: 'Phụ liệu & Linh kiện',
    };

    const updated = [...localRacks.filter(r => r.id.toUpperCase() !== nextId), newRack];
    setLocalRacks(updated);
    onSaveRacks(updated);
    showNotification(`Đã thêm Dãy Kệ "${newRack.id}" (${newRack.name}) thành công!`);
    setNewRackId('');
    setNewRackName('');
  };

  // Save Board Config
  const handleSaveBoard = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBoardConfig(localConfig);
    showNotification('Đã lưu cấu hình bảng thành công!');
  };

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      boardConfig: localConfig,
      racks: localRacks,
      facilities: localFacilities,
      annotations: localAnnotations,
      floorMarkings: localFloorMarkings,
      items: localItems,
      safetyRules,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Warehouse_3D_Layout_${localConfig.warehouseCode || 'SUNHOUSE'}.json`;
    a.click();
    showNotification('Đã xuất file JSON sơ đồ kho!');
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.racks) {
          setLocalRacks(parsed.racks);
          onSaveRacks(parsed.racks);
        }
        if (parsed.facilities) {
          setLocalFacilities(parsed.facilities);
          onSaveFacilities(parsed.facilities);
        }
        if (parsed.annotations) {
          setLocalAnnotations(parsed.annotations);
          onSaveAnnotations?.(parsed.annotations);
        }
        if (parsed.floorMarkings) {
          setLocalFloorMarkings(parsed.floorMarkings);
          onSaveFloorMarkings?.(parsed.floorMarkings);
        }
        if (parsed.boardConfig) {
          setLocalConfig(parsed.boardConfig);
          onSaveBoardConfig(parsed.boardConfig);
        }
        if (parsed.items) {
          setLocalItems(parsed.items);
          onSaveItems(parsed.items);
        }
        showNotification('Đã nạp toàn bộ dữ liệu từ file JSON!');
      } catch (err) {
        alert('File JSON không đúng định dạng!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wide">
                  Quản Trị Tùy Biến Sơ Đồ Kho & Vị Trí
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>Tự động lưu Local Storage tức thì</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Thêm/sửa/xóa nhãn khu vực, vẽ vạch vàng 5S, tinh chỉnh chiều dài kệ và vật tư (Lưu lại ngay khi chỉnh sửa)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {successMsg && (
          <div className="bg-emerald-600 text-white px-6 py-2 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-lg">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Navigation Tabs - Clean, Responsive, No ugly scrollbars */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-3 sm:px-6 py-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
          
          <button
            type="button"
            onClick={() => setActiveTab('racks')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'racks'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-orange-400" />
            <span className="whitespace-nowrap">Dãy Kệ & Chiều Dài</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-orange-950 text-orange-300 border border-orange-800">
              {localRacks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'facilities'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="whitespace-nowrap">Sàn Mezzanine & Thiết Bị</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-purple-950 text-purple-300 border border-purple-800">
              {localFacilities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('annotations')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'annotations'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Type className="w-4 h-4 text-cyan-400" />
            <span className="whitespace-nowrap">Tên & Nhãn Khu Vực</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
              {localAnnotations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('floor_markings')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'floor_markings'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="whitespace-nowrap">Vạch Kẻ 5S Dưới Nền</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-yellow-950 text-yellow-300 border border-yellow-800">
              {localFloorMarkings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'items'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Boxes className="w-4 h-4 text-teal-400" />
            <span className="whitespace-nowrap">Vật Tư & Bu Lông</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-teal-950 text-teal-300 border border-teal-800">
              {localItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'display'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Eye className="w-4 h-4 text-rose-400" />
            <span className="whitespace-nowrap">Ẩn / Hiện Tên & Vật Thể</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'board'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span className="whitespace-nowrap">Thông Tin Bảng & Ảnh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'backup'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="whitespace-nowrap">Lưu Trữ & JSON</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: NHÃN CHỈ DẪN KHU VỰC (TEXT ANNOTATIONS) */}
          {activeTab === 'annotations' && (
            <div className="space-y-6">
              
              {/* Form Thêm Nhãn Mới */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span className="font-extrabold text-xs text-cyan-300 uppercase">
                    + Thêm Nhãn Chỉ Dẫn Khu Vực Mới
                  </span>
                </div>

                <form onSubmit={handleAddAnnotation} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên Khu Vực (Tiếng Việt) *</label>
                    <input
                      type="text"
                      placeholder="VD: KHU VỰC ĐÓNG GÓI, LỐI ĐI 5S..."
                      value={newAnnVi}
                      onChange={(e) => setNewAnnVi(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phụ Đề (Tiếng Anh)</label>
                    <input
                      type="text"
                      placeholder="VD: PACKING AREA, MAIN AISLE..."
                      value={newAnnEn}
                      onChange={(e) => setNewAnnEn(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Huy Hiệu 5S / Icon</label>
                    <input
                      type="text"
                      placeholder="VD: 5S, PCCC..."
                      value={newAnnBadge}
                      onChange={(e) => setNewAnnBadge(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">X (0-100)</label>
                      <input
                        type="number"
                        value={newAnnX}
                        onChange={(e) => setNewAnnX(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Y (0-100)</label>
                      <input
                        type="number"
                        value={newAnnY}
                        onChange={(e) => setNewAnnY(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cỡ Chữ (px)</label>
                    <input
                      type="number"
                      min={8}
                      max={28}
                      value={newAnnSize}
                      onChange={(e) => setNewAnnSize(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Màu Chữ</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newAnnColor}
                        onChange={(e) => setNewAnnColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-slate-800"
                      />
                      <input
                        type="text"
                        value={newAnnColor}
                        onChange={(e) => setNewAnnColor(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Nhãn Lên Bản Đồ</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách nhãn hiện tại */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wide">
                  Danh Sách Nhãn Hiện Có ({localAnnotations.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {localAnnotations.map((ann) => (
                    <div key={ann.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {ann.badge5s && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                              {ann.badge5s}
                            </span>
                          )}
                          <span className="text-sm font-bold text-white" style={{ color: ann.color }}>
                            {ann.textVi}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteAnnotation(ann.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                          title="Xóa nhãn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {ann.textEn && (
                        <div className="text-xs text-slate-400 font-semibold">
                          {ann.textEn}
                        </div>
                      )}

                      {/* Quick Edit Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                        <div>
                          <label className="text-[9px] text-slate-500 block">Cỡ chữ: {ann.fontSize}px</label>
                          <input
                            type="range"
                            min={8}
                            max={24}
                            value={ann.fontSize}
                            onChange={(e) => handleUpdateAnnotation(ann.id, { fontSize: Number(e.target.value) })}
                            className="w-full accent-cyan-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block">Tọa độ X: {ann.x}</label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={ann.x}
                            onChange={(e) => handleUpdateAnnotation(ann.id, { x: Number(e.target.value) })}
                            className="w-full accent-cyan-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block">Tọa độ Y: {ann.y}</label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={ann.y}
                            onChange={(e) => handleUpdateAnnotation(ann.id, { y: Number(e.target.value) })}
                            className="w-full accent-cyan-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>Góc Xoay:</span>
                            <span className="text-cyan-400 font-bold">{Math.round(ann.rotation || 0)}°</span>
                          </div>
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            step={5}
                            value={ann.rotation || 0}
                            onChange={(e) => handleUpdateAnnotation(ann.id, { rotation: Number(e.target.value) })}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Quick angle presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[9px] text-slate-500 font-bold">Góc nhanh:</span>
                        {[0, -15, 30, -30, 45, 90].map((deg) => (
                          <button
                            key={`deg-${deg}`}
                            type="button"
                            onClick={() => handleUpdateAnnotation(ann.id, { rotation: deg })}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              (ann.rotation || 0) === deg
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB FACILITIES: SÀN MEZZANINE, PALLET, BĂNG TẢI, XE AGV... */}
          {activeTab === 'facilities' && (
            <div className="space-y-6">
              
              {/* Quick Add Presets Bar */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-xs text-purple-300 uppercase flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Thêm Nhanh Mẫu Sàn Lửng & Thiết Bị Kho 3D
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Bấm để thả ngay lên sơ đồ 3D</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddFacility(undefined, 'bin_rack')}
                    className="p-3 bg-blue-950/70 hover:bg-blue-900/80 border-2 border-blue-500 rounded-xl text-left transition-all group cursor-pointer shadow-md scale-102"
                  >
                    <div className="text-lg mb-1">📥</div>
                    <div className="text-xs font-black text-blue-200 group-hover:text-blue-100">Kệ Thép Kẽm Hàn (Ảnh 3)</div>
                    <div className="text-[10px] text-blue-300">Basic 2 tầng + Thùng xanh</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddFacility(undefined, 'mezzanine')}
                    className="p-3 bg-purple-950/70 hover:bg-purple-900/80 border-2 border-purple-500 rounded-xl text-left transition-all group cursor-pointer shadow-md scale-102"
                  >
                    <div className="text-lg mb-1">🏢</div>
                    <div className="text-xs font-black text-purple-200 group-hover:text-purple-100">Sàn Trên Dãy Kệ (Ảnh 4)</div>
                    <div className="text-[10px] text-purple-300">Chân là dãy kệ + Lan can</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddFacility(undefined, 'pallet_staging')}
                    className="p-3 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/80 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="text-lg mb-1">📦</div>
                    <div className="text-xs font-bold text-blue-200 group-hover:text-blue-100">Khu Pallet</div>
                    <div className="text-[10px] text-blue-400">Khu tụ hàng rời</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddFacility(undefined, 'conveyor')}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="text-lg mb-1">⚙️</div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white">Băng Tải Roller</div>
                    <div className="text-[10px] text-slate-400">Truyền tải hàng hoá</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddFacility(undefined, 'agv')}
                    className="p-3 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/80 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="text-lg mb-1">🚚</div>
                    <div className="text-xs font-bold text-amber-200 group-hover:text-amber-100">Xe AGV Robot</div>
                    <div className="text-[10px] text-amber-400">Chạy tự động</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddFacility(undefined, 'workstation')}
                    className="p-3 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="text-lg mb-1">🛠</div>
                    <div className="text-xs font-bold text-emerald-200 group-hover:text-emerald-100">Bàn QC Đóng Gói</div>
                    <div className="text-[10px] text-emerald-400">Kiểm định hàng</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddFacility(undefined, 'door')}
                    className="p-3 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-800/80 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="text-lg mb-1">🚪</div>
                    <div className="text-xs font-bold text-sky-200 group-hover:text-sky-100">Cổng Nhập Xuất</div>
                    <div className="text-[10px] text-sky-400">Cửa xuất hàng</div>
                  </button>
                </div>
              </div>

              {/* Form Thêm Tùy Chỉnh */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span className="font-extrabold text-xs text-purple-300 uppercase">
                    + Thêm Tùy Chỉnh Kích Thước Sàn Lửng / Thiết Bị
                  </span>
                </div>

                <form onSubmit={(e) => handleAddFacility(e)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên Tùy Chỉnh</label>
                    <input
                      type="text"
                      placeholder="VD: Sàn Mezzanine Tầng 2, Pallet A1..."
                      value={newFacName}
                      onChange={(e) => setNewFacName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Loại Thiết Bị</label>
                    <select
                      value={newFacType}
                      onChange={(e) => setNewFacType(e.target.value as FacilityObjectType)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white"
                    >
                      <option value="bin_rack">📥 Kệ Để Thùng Nhựa 5S (Ảnh 3)</option>
                      <option value="mezzanine">🏢 Sàn Lửng Mezzanine (Ảnh 4)</option>
                      <option value="pallet_staging">📦 Khu Vực Pallet Staging</option>
                      <option value="conveyor">⚙️ Băng Tải Con Lăn</option>
                      <option value="agv">🚚 Xe AGV Tự Động</option>
                      <option value="workstation">🛠 Bàn QC / Thao Tác</option>
                      <option value="door">🚪 Cổng Xuất Nhập Kho</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rộng (W)</label>
                      <input
                        type="number"
                        value={newFacW}
                        onChange={(e) => setNewFacW(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dài (L)</label>
                      <input
                        type="number"
                        value={newFacL}
                        onChange={(e) => setNewFacL(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cao (H)</label>
                      <input
                        type="number"
                        value={newFacH}
                        onChange={(e) => setNewFacH(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold p-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Vào Sơ Đồ Kho</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách thiết bị hiện có */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wide">
                  Danh Sách Sàn & Thiết Bị Kho Hiện Có ({localFacilities.length})
                </h3>
                {localFacilities.length === 0 ? (
                  <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                    Chưa có thiết bị nào. Hãy bấm nút Thêm Nhanh ở trên!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {localFacilities.map((fac) => (
                      <div key={fac.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {fac.type === 'mezzanine' && '🏢'}
                              {fac.type === 'pallet_staging' && '📦'}
                              {fac.type === 'conveyor' && '⚙️'}
                              {fac.type === 'agv' && '🚚'}
                              {fac.type === 'workstation' && '🛠'}
                              {fac.type === 'door' && '🚪'}
                            </span>
                            <input
                              type="text"
                              value={fac.name}
                              onChange={(e) => handleUpdateFacility(fac.id, { name: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white w-48"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteFacility(fac.id)}
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa thiết bị"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">Vị trí X ({fac.x})</span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={fac.x}
                              onChange={(e) => handleUpdateFacility(fac.id, { x: Number(e.target.value) })}
                              className="w-full accent-purple-400"
                            />
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">Vị trí Y ({fac.y})</span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={fac.y}
                              onChange={(e) => handleUpdateFacility(fac.id, { y: Number(e.target.value) })}
                              className="w-full accent-purple-400"
                            />
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">Chiều Rộng ({fac.width || 20})</span>
                            <input
                              type="range"
                              min={4}
                              max={60}
                              value={fac.width || 20}
                              onChange={(e) => handleUpdateFacility(fac.id, { width: Number(e.target.value) })}
                              className="w-full accent-purple-400"
                            />
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">Chiều Dài ({fac.length || 20})</span>
                            <input
                              type="range"
                              min={4}
                              max={60}
                              value={fac.length || 20}
                              onChange={(e) => handleUpdateFacility(fac.id, { length: Number(e.target.value) })}
                              className="w-full accent-purple-400"
                            />
                          </div>
                        </div>

                        {fac.type === 'mezzanine' && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/50">
                            <label className="flex items-center gap-2 text-slate-300 font-bold text-[11px] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fac.hasStairs !== false}
                                onChange={(e) => handleUpdateFacility(fac.id, { hasStairs: e.target.checked })}
                                className="accent-purple-500 rounded"
                              />
                              <span>Có Cầu Thang Thép 3D</span>
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: VẠCH KẺ CÔNG NGHỆ 5S VÀNG DƯỚI NỀN */}
          {activeTab === 'floor_markings' && (
            <div className="space-y-6">
              
              {/* Form Thêm Vạch Kẻ Vàng */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="font-extrabold text-xs text-yellow-300 uppercase">
                    + Vẽ & Thêm Vạch Kẻ Vàng 5S Dưới Nền Sàn
                  </span>
                </div>

                <form onSubmit={handleAddFloorMarking} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên Vạch / Vùng</label>
                    <input
                      type="text"
                      placeholder="VD: Vạch bao Kệ A, Vạch Lối Đi..."
                      value={newFmName}
                      onChange={(e) => setNewFmName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dạng Kẻ Vạch</label>
                    <select
                      value={newFmType}
                      onChange={(e) => setNewFmType(e.target.value as 'box' | 'line')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white"
                    >
                      <option value="box">🔲 Vùng Hình Chữ Nhật (Khung Bao)</option>
                      <option value="line">📏 Đường Thẳng (Vạch Tim Đường)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">X (0-100)</label>
                      <input
                        type="number"
                        value={newFmX}
                        onChange={(e) => setNewFmX(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Y (0-100)</label>
                      <input
                        type="number"
                        value={newFmY}
                        onChange={(e) => setNewFmY(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chiều Rộng (W)</label>
                      <input
                        type="number"
                        value={newFmW}
                        onChange={(e) => setNewFmW(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chiều Dài (L)</label>
                      <input
                        type="number"
                        value={newFmL}
                        onChange={(e) => setNewFmL(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Vạch Kẻ Vàng Vào Sàn Kho</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách vạch kẻ vàng */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wide">
                  Danh Sách Vạch Kẻ 5S Hiện Có ({localFloorMarkings.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {localFloorMarkings.map((fm) => (
                    <div key={fm.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm" />
                          <span className="text-xs font-extrabold text-white">
                            {fm.name} ({fm.type === 'box' ? 'Khung Bao' : 'Đoạn Thẳng'})
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteFloorMarking(fm.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                          title="Xóa vạch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tọa độ và kích thước */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                        <div>
                          <label className="text-slate-500 block">X: {fm.x}</label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={fm.x}
                            onChange={(e) => handleUpdateFloorMarking(fm.id, { x: Number(e.target.value) })}
                            className="w-full accent-yellow-400 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block">Y: {fm.y}</label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={fm.y}
                            onChange={(e) => handleUpdateFloorMarking(fm.id, { y: Number(e.target.value) })}
                            className="w-full accent-yellow-400 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block">Rộng: {fm.width || 20}</label>
                          <input
                            type="range"
                            min={4}
                            max={60}
                            value={fm.width || 20}
                            onChange={(e) => handleUpdateFloorMarking(fm.id, { width: Number(e.target.value) })}
                            className="w-full accent-yellow-400 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block">Dài: {fm.length || 20}</label>
                          <input
                            type="range"
                            min={4}
                            max={60}
                            value={fm.length || 20}
                            onChange={(e) => handleUpdateFloorMarking(fm.id, { length: Number(e.target.value) })}
                            className="w-full accent-yellow-400 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Góc Xoay:</span>
                            <span className="text-yellow-400 font-bold">{Math.round(fm.rotation || 0)}°</span>
                          </div>
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            step={5}
                            value={fm.rotation || 0}
                            onChange={(e) => handleUpdateFloorMarking(fm.id, { rotation: Number(e.target.value) })}
                            className="w-full accent-yellow-400 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Quick angle presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[9px] text-slate-500 font-bold">Góc nhanh:</span>
                        {[0, -15, 30, -30, 45, 90].map((deg) => (
                          <button
                            key={`deg-fm-${deg}`}
                            type="button"
                            onClick={() => handleUpdateFloorMarking(fm.id, { rotation: deg })}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              (fm.rotation || 0) === deg
                                ? 'bg-yellow-500 text-slate-950'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ĐIỀU CHỈNH CHIỀU DÀI KỆ (5 KHOANG, 3 TẦNG) */}
          {activeTab === 'racks' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
                <strong>💡 Quy chuẩn hệ thống kệ SUNHOUSE:</strong> Tự động cố định <strong>5 khoang (01..05)</strong> và <strong>3 tầng đợt (Tầng A: Vàng, Tầng B: Xanh, Tầng C: Đỏ)</strong>. Bạn có thể kéo giãn hoặc thu ngắn chiều dài kệ thực tế bằng thanh trượt, hoặc thêm dãy kệ mới bên dưới (tự động đồng bộ MALL MAP và sơ đồ 3D).
              </div>

              {/* Form Thêm Dãy Kệ Mới */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Plus className="w-4 h-4 text-orange-400" />
                  <span className="font-extrabold text-xs text-orange-300 uppercase">
                    + Thêm Dãy Kệ Mới (Tự Động Cập Nhật MALL MAP & 3D)
                  </span>
                </div>

                <form onSubmit={handleAddNewRack} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mã Dãy (VD: A, B, C...)</label>
                    <input
                      type="text"
                      placeholder="Tự động (VD: J, K...)"
                      value={newRackId}
                      onChange={(e) => setNewRackId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white uppercase font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên Dãy Kệ</label>
                    <input
                      type="text"
                      placeholder="VD: DÃY 10 (Kệ Linh Kiện Mới)"
                      value={newRackName}
                      onChange={(e) => setNewRackName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Màu Nhận Diện</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newRackColor}
                        onChange={(e) => setNewRackColor(e.target.value)}
                        className="w-full h-8 rounded border border-slate-700 cursor-pointer bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Dãy Kệ</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {localRacks.map((rack) => (
                  <div key={rack.id} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5 shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center shadow"
                          style={{ backgroundColor: rack.color || '#ea580c' }}
                        >
                          {rack.id}
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-white">{rack.name}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            5 Khoang cố định • 3 Tầng đợt (A: Vàng, B: Xanh, C: Đỏ)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRack(rack.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                        title="Xóa dãy kệ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Chiều Dài Kệ (Kéo giãn vật lý) */}
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                        <span className="font-bold text-slate-300">Chiều Dài Kệ:</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-amber-400 text-sm">
                            {((rack.bayLength || 4.8) * 5).toFixed(1)} m
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Khoang: {(rack.bayLength || 4.8).toFixed(1)}m)
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={2.4}
                        max={8.0}
                        step={0.2}
                        value={rack.bayLength || 4.8}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = localRacks.map(r => r.id === rack.id ? { ...r, bayLength: val } : r);
                          setLocalRacks(updated);
                          onSaveRacks(updated);
                        }}
                        className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />

                      {/* Quick Stepper Buttons */}
                      <div className="flex items-center justify-between gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const current = rack.bayLength || 4.8;
                            const newVal = Math.max(2.4, Number((current - 0.2).toFixed(1)));
                            const updated = localRacks.map(r => r.id === rack.id ? { ...r, bayLength: newVal } : r);
                            setLocalRacks(updated);
                            onSaveRacks(updated);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                        >
                          - 0.2m
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = localRacks.map(r => r.id === rack.id ? { ...r, bayLength: 4.8 } : r);
                            setLocalRacks(updated);
                            onSaveRacks(updated);
                          }}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold"
                        >
                          Chuẩn 4.8m (24.0m)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const current = rack.bayLength || 4.8;
                            const newVal = Math.min(8.0, Number((current + 0.2).toFixed(1)));
                            const updated = localRacks.map(r => r.id === rack.id ? { ...r, bayLength: newVal } : r);
                            setLocalRacks(updated);
                            onSaveRacks(updated);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                        >
                          + 0.2m
                        </button>
                      </div>
                    </div>

                    {/* Di Chuyển Tọa Độ Kệ */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[11px] font-mono text-slate-300">X: <strong>{rack.x}</strong></span>
                        <div className="flex gap-1">
                          <button 
                            type="button"
                            onClick={() => handleUpdateRackCoord(rack.id, -2, 0)} 
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold"
                            title="Dịch sang trái 2 đơn vị"
                          >
                            ◀
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleUpdateRackCoord(rack.id, 2, 0)} 
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold"
                            title="Dịch sang phải 2 đơn vị"
                          >
                            ▶
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[11px] font-mono text-slate-300">Y: <strong>{rack.y}</strong></span>
                        <div className="flex gap-1">
                          <button 
                            type="button"
                            onClick={() => handleUpdateRackCoord(rack.id, 0, -2)} 
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold"
                            title="Dịch lên trên 2 đơn vị"
                          >
                            ▲
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleUpdateRackCoord(rack.id, 0, 2)} 
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold"
                            title="Dịch xuống dưới 2 đơn vị"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DANH MỤC VẬT TƯ */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase">
                  Danh Sách Vật Tư Trong Kho ({localItems.length} linh kiện)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                      <th className="p-2.5">Mã VT</th>
                      <th className="p-2.5">Tên Vật Tư</th>
                      <th className="p-2.5">Vị Trí Ô Kệ</th>
                      <th className="p-2.5">Tồn Kho</th>
                      <th className="p-2.5">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono font-bold text-teal-400">{item.code}</td>
                        <td className="p-2.5 font-medium text-white">{item.name}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-300">{item.location}</td>
                        <td className="p-2.5 font-mono">{item.quantity}</td>
                        <td className="p-2.5">
                          <button
                            onClick={() => {
                              const updated = localItems.filter(it => it.id !== item.id);
                              setLocalItems(updated);
                              onSaveItems(updated);
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TIÊU ĐỀ & THÔNG TIN BẢNG */}
          {activeTab === 'board' && (
            <form onSubmit={handleSaveBoard} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tên Công Ty / Doanh Nghiệp</label>
                <input
                  type="text"
                  value={localConfig.companyName}
                  onChange={(e) => setLocalConfig({ ...localConfig, companyName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tiêu Đề Bảng Chỉ Dẫn</label>
                <input
                  type="text"
                  value={localConfig.boardTitle}
                  onChange={(e) => setLocalConfig({ ...localConfig, boardTitle: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phụ Đề Bảng</label>
                <input
                  type="text"
                  value={localConfig.boardSubtitle}
                  onChange={(e) => setLocalConfig({ ...localConfig, boardSubtitle: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tên & Phân Xưởng Kho</label>
                <input
                  type="text"
                  value={localConfig.warehouseName}
                  onChange={(e) => setLocalConfig({ ...localConfig, warehouseName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              {/* Sơ đồ chỉ dẫn / Ảnh chụp kệ thực tế */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-400 uppercase">
                    Ảnh Sơ Đồ Hướng Dẫn Đọc Ô Kệ (5S)
                  </label>
                  {localConfig.guideImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocalConfig({ ...localConfig, guideImageUrl: undefined });
                        try {
                          localStorage.removeItem('sunhouse_rack_guide_custom_image');
                        } catch {}
                      }}
                      className="text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa ảnh / Dùng vector mặc định</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Tải lên ảnh chụp sơ đồ hướng dẫn thực tế tại kho hoặc ảnh thiết kế đồ họa của nhà máy.
                </p>

                {localConfig.guideImageUrl ? (
                  <div className="space-y-2">
                    <div className="w-full h-40 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center p-2">
                      <img 
                        src={localConfig.guideImageUrl} 
                        alt="Sơ đồ hướng dẫn" 
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 shadow">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Thay ảnh khác</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const url = ev.target?.result as string;
                                if (url) {
                                  setLocalConfig({ ...localConfig, guideImageUrl: url });
                                  try {
                                    localStorage.setItem('sunhouse_rack_guide_custom_image', url);
                                  } catch {}
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <select
                        value={localConfig.guideImageFit || 'contain'}
                        onChange={(e) => setLocalConfig({ ...localConfig, guideImageFit: e.target.value as 'contain' | 'cover' })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="contain">Kiểu hiển thị: Vừa khung (Contain)</option>
                        <option value="cover">Kiểu hiển thị: Lấp đầy (Cover)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-900/60 hover:bg-slate-900 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                    <Upload className="w-8 h-8 text-amber-400 mb-1.5" />
                    <span className="text-xs font-bold text-white">Nhấn để tải tệp ảnh lên</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ PNG, JPG, JPEG, WebP, SVG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const url = ev.target?.result as string;
                            if (url) {
                              setLocalConfig({ ...localConfig, guideImageUrl: url });
                              try {
                                localStorage.setItem('sunhouse_rack_guide_custom_image', url);
                              } catch {}
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi Thông Tin Bảng</span>
              </button>
            </form>
          )}

          {/* TAB: DISPLAY VISIBILITY CONTROLS (ẨN / HIỆN TÊN VẬT THỂ & NHÃN THEO YÊU CẦU CỦA USER) */}
          {activeTab === 'display' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-slate-950 p-5 rounded-2xl border border-rose-900/40 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Eye className="w-5 h-5 text-rose-400" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide">
                      Tùy Chọn Ẩn / Hiện Tên Hiển Thị Của Kệ & Các Vật Thể 3D
                    </h4>
                    <p className="text-xs text-slate-400">
                      Bật hoặc tắt hiển thị tên các dãy kệ, tên các vật thể / thiết bị kho, nhãn 5S và điểm định vị theo ý muốn.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {/* 1. Toggle Rack Labels */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Hiển Thị Tên & Mã Các Dãy Kệ</div>
                      <div className="text-[11px] text-slate-400">Hiện các thẻ nhãn KỆ A, KỆ B, DÃY 01, DÃY 02 trên đỉnh kệ</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRackLabels(!showRackLabels)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showRackLabels ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          showRackLabels ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 2. Toggle Facility Labels */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Hiển Thị Tên Các Vật Thể & Thiết Bị Kho</div>
                      <div className="text-[11px] text-slate-400">Hiện tên Sàn Mezzanine, Kệ Thép Hộp Kẽm, Băng Tải, Cổng, Cây cảnh...</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFacilityLabels(!showFacilityLabels)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showFacilityLabels ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          showFacilityLabels ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 3. Toggle Annotation Labels */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Hiển Thị Nhãn Chú Thích Khu Vực 5S</div>
                      <div className="text-[11px] text-slate-400">Hiện chữ LỐI ĐI 5S, BỘ PHẬN GIAO HÀNG, KHU VỰC ĐÓNG GÓI...</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAnnotationLabels(!showAnnotationLabels)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showAnnotationLabels ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          showAnnotationLabels ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 4. Toggle Pin Badge */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Hiển Thị Huy Hiệu & Con Trỏ Vị Trí Hiện Tại (YOU ARE HERE)</div>
                      <div className="text-[11px] text-slate-400">Hiện kim ghim đỏ định vị và tên ô bạn đang đứng</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePinBadge(!showPinBadge)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showPinBadge ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          showPinBadge ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Trạng thái ẩn/hiện được tự động lưu vĩnh viễn và áp dụng ngay lập tức cho sơ đồ 3D và khi xuất ảnh chụp!</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BACKUP & JSON */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-xl">
              {/* Local Storage System Status & Actions */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-900/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Bộ Nhớ Trình Duyệt (Local Storage)</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Hệ thống tự động lưu trữ vĩnh viễn mọi thay đổi vào bộ nhớ của trình duyệt (LocalStorage). Khi tải lại trang hoặc mở lại trình duyệt, toàn bộ sơ đồ kho, kệ, nhãn và ảnh hướng dẫn sẽ được nạp lại tức thì.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSaveBoardConfig(localConfig);
                      onSaveRacks(localRacks);
                      onSaveFacilities?.(localFacilities);
                      onSaveAnnotations?.(localAnnotations);
                      onSaveFloorMarkings?.(localFloorMarkings);
                      onSaveItems(localItems);
                      showNotification('💾 Đã đồng bộ toàn bộ dữ liệu vào Local Storage thành công!');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Ngay Vào Local Storage</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Khôi phục lại toàn bộ dữ liệu mẫu ban đầu của Sunhouse và xóa dữ liệu Local Storage?')) {
                        onResetToDefaults?.();
                        onClose();
                      }
                    }}
                    className="bg-rose-900/40 hover:bg-rose-800 text-rose-200 border border-rose-700/50 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Xóa Local Storage & Đặt Lại Gốc</span>
                  </button>
                </div>
              </div>

              {/* Export JSON */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white">Xuất Toàn Bộ Cấu Hình & Layout Sơ Đồ</h4>
                <p className="text-xs text-slate-400">
                  Tải xuống file JSON chứa toàn bộ vị trí nhãn khu vực, vạch kẻ 5S, kích thước kệ và danh mục vật tư để lưu trữ trên máy tính hoặc chia sẻ cho máy khác.
                </p>
                <button
                  onClick={handleExportJSON}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Xuống File JSON (.json)</span>
                </button>
              </div>

              {/* Import JSON */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white">Nạp Cấu Hình Từ File JSON</h4>
                <p className="text-xs text-slate-400">
                  Chọn file JSON đã lưu để phục hồi lại chính xác vị trí và sơ đồ kho.
                </p>
                <label className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer border border-slate-700">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Chọn File JSON Nạp Lên</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
