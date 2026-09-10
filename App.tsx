import React, { useState, useEffect, useRef } from 'react';
import { 
  defaultRacks, 
  defaultZones, 
  defaultFacilities,
  defaultAnnotations,
  defaultFloorMarkings,
  defaultItems, 
  defaultSafetyRules, 
  defaultPositions, 
  initialBoardConfig 
} from './defaultWarehouse';
import { 
  BoardConfig, 
  FloorMarking, 
  InventoryItem, 
  MapTextAnnotation, 
  SafetyRule, 
  WarehouseFacilityObject, 
  WarehousePosition, 
  WarehouseRack, 
  WarehouseZone 
} from './types';
import { 
  loadAllWarehouseState, 
  saveAllWarehouseState, 
  clearWarehouseStorage, 
  getLastSavedTimestamp 
} from './localStorageHelper';
import { PhysicalBoardFrame } from './PhysicalBoardFrame';
import { IsometricWarehouseCanvas } from './IsometricWarehouseCanvas';
import { SingleRack3DDetailView } from './SingleRack3DDetailView';
import { RackSlottingDiagram } from './RackSlottingDiagram';
import { ItemDirectoryTable } from './ItemDirectoryTable';
import { RackSlottingMatrixEditor } from './RackSlottingMatrixEditor';
import { UpdateBoltModal } from './UpdateBoltModal';
import { StationPickerModal } from './StationPickerModal';
import { WarehouseEditorModal } from './WarehouseEditorModal';
import { PrintExportModal } from './PrintExportModal';
import { SunhouseLogo } from './SunhouseLogo';
import { 
  Layers, 
  MapPin, 
  Layout, 
  Search, 
  Settings, 
  Printer, 
  Compass, 
  Sliders, 
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Type,
  Database,
  CheckCircle2,
  Save,
  Box
} from 'lucide-react';

interface HistorySnapshot {
  racks: WarehouseRack[];
  facilities: WarehouseFacilityObject[];
  annotations: MapTextAnnotation[];
  floorMarkings: FloorMarking[];
  boardConfig: BoardConfig;
  items: InventoryItem[];
}

export default function App() {
  // Load initial state from LocalStorage or fall back to defaults
  const [initialData] = useState(() => loadAllWarehouseState());

  // Application Data States
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(initialData.boardConfig);
  const [racks, setRacks] = useState<WarehouseRack[]>(initialData.racks);
  const [facilities, setFacilities] = useState<WarehouseFacilityObject[]>(initialData.facilities);
  const [annotations, setAnnotations] = useState<MapTextAnnotation[]>(initialData.annotations);
  const [floorMarkings, setFloorMarkings] = useState<FloorMarking[]>(initialData.floorMarkings);
  const [zones, setZones] = useState<WarehouseZone[]>(initialData.zones);
  const [items, setItems] = useState<InventoryItem[]>(initialData.items);
  const [safetyRules, setSafetyRules] = useState<SafetyRule[]>(initialData.safetyRules);

  // Active Interactive Selection States
  const [currentPosition, setCurrentPosition] = useState<WarehousePosition>(initialData.currentPosition);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(initialData.items[0] || null);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(initialData.currentPosition?.rackId || 'A');

  // Navigation View Modes
  const [viewMode, setViewMode] = useState<'board' | '3d_map' | 'single_rack' | 'single_rack_4t3k' | 'slotting'>(initialData.viewMode || 'board');

  // LocalStorage Auto-save & Status indicator states
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(getLastSavedTimestamp());
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // Auto-persist all warehouse data to LocalStorage on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveAllWarehouseState({
        boardConfig,
        racks,
        facilities,
        annotations,
        floorMarkings,
        zones,
        items,
        safetyRules,
        currentPosition,
        viewMode
      });
      const nowFormatted = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(nowFormatted);
      setIsSavedFeedback(true);
      const feedbackTimer = setTimeout(() => setIsSavedFeedback(false), 2000);
      return () => clearTimeout(feedbackTimer);
    }, 350);

    return () => clearTimeout(timer);
  }, [boardConfig, racks, facilities, annotations, floorMarkings, zones, items, safetyRules, currentPosition, viewMode]);

  const pushToHistory = () => {
    setHistory(prev => [
      ...prev.slice(-40),
      {
        racks: JSON.parse(JSON.stringify(racks)),
        facilities: JSON.parse(JSON.stringify(facilities)),
        annotations: JSON.parse(JSON.stringify(annotations)),
        floorMarkings: JSON.parse(JSON.stringify(floorMarkings)),
        boardConfig: JSON.parse(JSON.stringify(boardConfig)),
        items: JSON.parse(JSON.stringify(items)),
      }
    ]);
    setFuture([]);
  };

  const setRacksWithHistory = (newRacksOrUpdater: WarehouseRack[] | ((prev: WarehouseRack[]) => WarehouseRack[])) => {
    pushToHistory();
    setRacks(newRacksOrUpdater);
  };

  const setFacilitiesWithHistory = (newFacsOrUpdater: WarehouseFacilityObject[] | ((prev: WarehouseFacilityObject[]) => WarehouseFacilityObject[])) => {
    pushToHistory();
    setFacilities(newFacsOrUpdater);
  };

  const setAnnotationsWithHistory = (newAnnsOrUpdater: MapTextAnnotation[] | ((prev: MapTextAnnotation[]) => MapTextAnnotation[])) => {
    pushToHistory();
    setAnnotations(newAnnsOrUpdater);
  };

  const setFloorMarkingsWithHistory = (newFmsOrUpdater: FloorMarking[] | ((prev: FloorMarking[]) => FloorMarking[])) => {
    pushToHistory();
    setFloorMarkings(newFmsOrUpdater);
  };

  const setBoardConfigWithHistory = (newConfigOrUpdater: BoardConfig | ((prev: BoardConfig) => BoardConfig)) => {
    pushToHistory();
    setBoardConfig(newConfigOrUpdater);
  };

  const setItemsWithHistory = (newItemsOrUpdater: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => {
    pushToHistory();
    setItems(newItemsOrUpdater);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    // Save current to future
    setFuture(prev => [
      {
        racks: JSON.parse(JSON.stringify(racks)),
        facilities: JSON.parse(JSON.stringify(facilities)),
        annotations: JSON.parse(JSON.stringify(annotations)),
        floorMarkings: JSON.parse(JSON.stringify(floorMarkings)),
        boardConfig: JSON.parse(JSON.stringify(boardConfig)),
        items: JSON.parse(JSON.stringify(items)),
      },
      ...prev,
    ]);

    setHistory(newHistory);
    setRacks(previous.racks);
    setFacilities(previous.facilities);
    setAnnotations(previous.annotations || defaultAnnotations);
    setFloorMarkings(previous.floorMarkings || defaultFloorMarkings);
    setBoardConfig(previous.boardConfig);
    setItems(previous.items);
    showToast('↩️ Đã hoàn tác (Undo - Ctrl+Z)');
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    // Save current to history
    setHistory(prev => [
      ...prev,
      {
        racks: JSON.parse(JSON.stringify(racks)),
        facilities: JSON.parse(JSON.stringify(facilities)),
        annotations: JSON.parse(JSON.stringify(annotations)),
        floorMarkings: JSON.parse(JSON.stringify(floorMarkings)),
        boardConfig: JSON.parse(JSON.stringify(boardConfig)),
        items: JSON.parse(JSON.stringify(items)),
      }
    ]);

    setFuture(newFuture);
    setRacks(next.racks);
    setFacilities(next.facilities);
    setAnnotations(next.annotations || defaultAnnotations);
    setFloorMarkings(next.floorMarkings || defaultFloorMarkings);
    setBoardConfig(next.boardConfig);
    setItems(next.items);
    showToast('↪️ Đã làm lại (Redo - Ctrl+Y)');
  };

  // Manual trigger to force save LocalStorage immediately
  const handleForceSaveLocalStorage = () => {
    const success = saveAllWarehouseState({
      boardConfig,
      racks,
      facilities,
      annotations,
      floorMarkings,
      zones,
      items,
      safetyRules,
      currentPosition,
      viewMode
    });
    if (success) {
      const nowFormatted = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(nowFormatted);
      showToast(`💾 Đã lưu toàn bộ vào LocalStorage lúc ${nowFormatted}`);
    }
  };

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT'
      );
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, future, racks, facilities, annotations, floorMarkings, boardConfig, items]);

  // Modals Open State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [modalItemToUpdate, setModalItemToUpdate] = useState<InventoryItem | undefined>(undefined);
  const [isStationPickerOpen, setIsStationPickerOpen] = useState<boolean>(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [activePdfTabToOpen, setActivePdfTabToOpen] = useState<'pdf1' | 'pdf2' | 'pdf3' | 'pdf4'>('pdf1');
  const [pdf4ConfigState, setPdf4ConfigState] = useState<any>(null);

  const handleOpenPrintModal = (tab: 'pdf1' | 'pdf2' | 'pdf3' | 'pdf4' = 'pdf1', pdf4Config?: any) => {
    setActivePdfTabToOpen(tab);
    if (pdf4Config) {
      setPdf4ConfigState(pdf4Config);
    }
    setIsPrintModalOpen(true);
  };

  // Handlers
  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setSelectedRackId(item.rackId);
    
    // Auto sync map view to item rack position
    const targetRack = racks.find(r => r.id === item.rackId);
    if (targetRack) {
      setCurrentPosition({
        rackId: item.rackId,
        bayId: item.bayId,
        tier: item.tier,
        slot: item.slot,
        label: `Vị trí vật tư: Kệ ${item.rackId} - Bay ${item.bayId} (${item.code})`,
        x: targetRack.x,
        y: targetRack.y + (parseInt(item.bayId || '1') - 1) * (targetRack.bayLength || 4.8),
      });
    }
  };

  const handleSelectRack = (rackId: string, bayId?: string) => {
    setSelectedRackId(rackId);
  };

  const handlePositionChange = (pos: WarehousePosition) => {
    setCurrentPosition(pos);
    if (pos.rackId) {
      setSelectedRackId(pos.rackId);
    }
  };

  const handleOpenUpdateModal = (item?: InventoryItem) => {
    setModalItemToUpdate(item);
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdatedItem = (updatedItem: InventoryItem) => {
    pushToHistory();
    const exists = items.some(i => i.id === updatedItem.id);
    if (exists) {
      setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
    } else {
      setItems([updatedItem, ...items]);
    }
    setSelectedItem(updatedItem);
    setIsUpdateModalOpen(false);
  };

  const handleResetToDefaults = () => {
    if (confirm('Bạn có chắc muốn đặt lại toàn bộ dữ liệu sơ đồ kho về mặc định ban đầu và xóa bộ nhớ Local Storage?')) {
      pushToHistory();
      clearWarehouseStorage();
      setRacks(defaultRacks);
      setFacilities(defaultFacilities);
      setAnnotations(defaultAnnotations);
      setFloorMarkings(defaultFloorMarkings);
      setZones(defaultZones);
      setItems(defaultItems);
      setSafetyRules(defaultSafetyRules);
      setBoardConfig(initialBoardConfig);
      setCurrentPosition(defaultPositions[0]);
      showToast('🗑️ Đã đặt lại dữ liệu mặc định & xóa bộ nhớ Local Storage');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      
      {/* Top Application Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-sm">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Application Title */}
          <div className="flex items-center gap-3">
            <SunhouseLogo className="h-9 w-auto" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-900 tracking-wide flex items-center gap-1.5">
                <span>HỆ THỐNG SƠ ĐỒ & BẢNG ĐỊNH VỊ VỊ TRÍ 5S</span>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-teal-300">
                  3D ISOMETRIC
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                Nhà máy Sunhouse Bình Dương • Bảng chuẩn nhận diện thị giác kho xưởng
              </span>
            </div>
          </div>

          {/* View Mode Switchers */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'board'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>BẢNG TRỰC QUAN 1:1</span>
            </button>

            <button
              onClick={() => setViewMode('3d_map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === '3d_map'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>BẢN ĐỒ 3D MỞ RỘNG</span>
            </button>

            <button
              onClick={() => setViewMode('single_rack')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'single_rack'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Xem mô phỏng 3D chi tiết Kệ Mẫu 1 (3 Tầng, 5 Khoang, 2 Vị Trí = 30 Vị Trí)"
            >
              <Box className="w-3.5 h-3.5" />
              <span>CHI TIẾT KỆ 3D (3T - 5K)</span>
            </button>

            <button
              onClick={() => setViewMode('single_rack_4t3k')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'single_rack_4t3k'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm ring-1 ring-amber-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Xem mô phỏng 3D chi tiết Kệ Mẫu 2 (4 Tầng, 3 Khoang, 3 Vị Trí = 36 Vị Trí)"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>CHI TIẾT KỆ 3D (4T - 3K - 3VT)</span>
            </button>

            <button
              onClick={() => setViewMode('slotting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'slotting'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ô KỆ & VẬT TƯ</span>
            </button>
          </div>

          {/* Right Fast Actions */}
          <div className="flex items-center gap-2">
            
            {/* LocalStorage Live Status & Quick Save */}
            <button
              onClick={handleForceSaveLocalStorage}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                isSavedFeedback
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
              title={`Lưu trữ tự động vào bộ nhớ trình duyệt (LocalStorage). Bấm để lưu ngay.\nLần lưu gần nhất: ${lastSavedTime || 'Đang sẵn sàng'}`}
            >
              <Database className={`w-3.5 h-3.5 ${isSavedFeedback ? 'text-emerald-600 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden xl:inline">LocalStorage:</span>
              <span className={`font-mono ${isSavedFeedback ? 'text-emerald-800' : 'text-slate-700'}`}>
                {lastSavedTime ? `${lastSavedTime}` : 'Đã lưu'}
              </span>
              {isSavedFeedback && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
            </button>

            {/* Undo / Redo Global Buttons */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="p-1.5 text-slate-700 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors"
                title="Hoàn tác (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={future.length === 0}
                className="p-1.5 text-slate-700 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors"
                title="Làm lại (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsStationPickerOpen(true)}
              className="bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-teal-300 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Đổi vị trí đứng"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden md:inline">Vị Trí Đứng:</span>
              <span className="text-slate-900 font-mono font-black">{currentPosition.rackId ? `Rack ${currentPosition.rackId}` : 'Khu vực'}</span>
            </button>

            <button
              onClick={() => setIsEditorModalOpen(true)}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 px-2.5 text-xs font-bold shadow-sm"
              title="Cài đặt & Tùy biến sơ đồ"
            >
              <Settings className="w-4 h-4 text-cyan-600" />
              <span className="hidden sm:inline">Tùy Biến Sơ Đồ</span>
            </button>

            <button
              onClick={() => handleOpenPrintModal('pdf1')}
              className="p-1.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg transition-all flex items-center gap-1.5 px-3 text-xs font-black shadow-md cursor-pointer"
              title="Xuất file PDF chuẩn 5S"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Xuất File PDF</span>
            </button>
          </div>

        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-teal-300 border border-teal-500/50 px-4 py-2 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col">
        
        {/* MODE 1: THE COMPLETE RECREATED PHYSICAL BOARD */}
        {viewMode === 'board' && (
          <PhysicalBoardFrame
            boardConfig={boardConfig}
            onUpdateBoardConfig={setBoardConfigWithHistory}
            racks={racks}
            onUpdateRacks={setRacksWithHistory}
            facilities={facilities}
            onUpdateFacilities={setFacilitiesWithHistory}
            annotations={annotations}
            onUpdateAnnotations={setAnnotationsWithHistory}
            floorMarkings={floorMarkings}
            onUpdateFloorMarkings={setFloorMarkingsWithHistory}
            zones={zones}
            currentPosition={currentPosition}
            onPositionChange={handlePositionChange}
            items={items}
            onUpdateItems={setItemsWithHistory}
            selectedItem={selectedItem}
            selectedRackId={selectedRackId}
            onSelectItem={handleSelectItem}
            onSelectRack={handleSelectRack}
            safetyRules={safetyRules}
            onOpenUpdateModal={handleOpenUpdateModal}
            onOpenStationPicker={() => setIsStationPickerOpen(true)}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onOpenEditorModal={() => setIsEditorModalOpen(true)}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        )}

        {/* MODE 2: EXPANDED FULLSCREEN 3D MAP EXPLORER */}
        {viewMode === '3d_map' && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-teal-400" />
                  <span>Bản Đồ Phối Cảnh 3D Không Điểm Tụ (Isometric Warehouse Map)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Bật <strong>"ĐANG BIÊN TẬP"</strong> trên bản đồ để thêm/sửa nhãn văn bản, vẽ vạch vàng 5S, kéo giãn chiều dài kệ (5 khoang, 3 tầng đợt A-B-C). Nhấn <strong>Ctrl+Z</strong> để hoàn tác.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-teal-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>Trạm đứng hiện tại: <strong>{currentPosition.label}</strong></span>
              </div>
            </div>

            {/* EXPANDED 3D VIEW: FULL WIDTH HERO CANVAS */}
            <div className="w-full flex flex-col gap-4">
              <IsometricWarehouseCanvas
                racks={racks}
                onUpdateRacks={setRacksWithHistory}
                facilities={facilities}
                onUpdateFacilities={setFacilitiesWithHistory}
                annotations={annotations}
                onUpdateAnnotations={setAnnotationsWithHistory}
                floorMarkings={floorMarkings}
                onUpdateFloorMarkings={setFloorMarkingsWithHistory}
                zones={zones}
                currentPosition={currentPosition}
                onPositionChange={handlePositionChange}
                items={items}
                onUpdateItems={setItemsWithHistory}
                selectedItem={selectedItem}
                selectedRackId={selectedRackId}
                onSelectRack={handleSelectRack}
                isCompact={false}
                canUndo={history.length > 0}
                canRedo={future.length > 0}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RackSlottingDiagram
                  currentPosition={currentPosition}
                  activeRack={racks.find(r => r.id === currentPosition.rackId) || racks[0]}
                  items={items}
                  selectedItem={selectedItem}
                  onSelectItem={handleSelectItem}
                />

                <RackSlottingMatrixEditor
                  activeRack={racks.find(r => r.id === (selectedRackId || currentPosition.rackId)) || racks[0]}
                  racks={racks}
                  onSelectRack={handleSelectRack}
                  onUpdateRacks={setRacksWithHistory}
                  items={items}
                  onUpdateItems={setItemsWithHistory}
                  selectedItem={selectedItem}
                  onSelectItem={handleSelectItem}
                  currentPosition={currentPosition}
                  onPositionChange={handlePositionChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* MODE: DETAILED 3D SINGLE RACK VIEW - MẪU 1 (3 TẦNG / 5 KHOANG / 2 VỊ TRÍ) */}
        {viewMode === 'single_rack' && (
          <SingleRack3DDetailView
            racks={racks}
            selectedRackId={selectedRackId || 'A'}
            onSelectRack={handleSelectRack}
            onUpdateRacks={setRacksWithHistory}
            items={items}
            onUpdateItems={setItemsWithHistory}
            currentPosition={currentPosition}
            onPositionChange={handlePositionChange}
            onOpenUpdateModal={handleOpenUpdateModal}
            onOpenPrintModal={handleOpenPrintModal}
            tierCount={3}
            defaultBays={['01', '02', '03', '04', '05']}
            defaultItemsPerBay={2}
            modelName="MẪU 1 (3 TẦNG / 5 KHOANG / 2 VỊ TRÍ - 30 Ô)"
          />
        )}

        {/* MODE: DETAILED 3D SINGLE RACK VIEW - MẪU 2 (4 TẦNG / 3 KHOANG / 3 VỊ TRÍ) */}
        {viewMode === 'single_rack_4t3k' && (
          <SingleRack3DDetailView
            racks={racks}
            selectedRackId={selectedRackId || 'A'}
            onSelectRack={handleSelectRack}
            onUpdateRacks={setRacksWithHistory}
            items={items}
            onUpdateItems={setItemsWithHistory}
            currentPosition={currentPosition}
            onPositionChange={handlePositionChange}
            onOpenUpdateModal={handleOpenUpdateModal}
            onOpenPrintModal={handleOpenPrintModal}
            tierCount={4}
            defaultBays={['01', '02', '03']}
            defaultItemsPerBay={3}
            modelName="MẪU 2 (4 TẦNG / 3 KHOANG / 3 VỊ TRÍ - 36 Ô)"
          />
        )}

        {/* MODE 3: FOCUSED SLOTTING & INVENTORY WORKBENCH */}
        {viewMode === 'slotting' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  Định Vị Ô Kệ & Sơ Đồ Chi Tiết (Rack Slotting Diagram)
                </h3>
                <p className="text-xs text-slate-400">
                  Cấu trúc 3 tầng chuẩn (Tầng A: Vàng, Tầng B: Xanh, Tầng C: Đỏ) và 5 khoang (01..05)
                </p>
              </div>

              <RackSlottingDiagram
                currentPosition={currentPosition}
                activeRack={racks.find(r => r.id === currentPosition.rackId) || racks[0]}
                items={items}
                selectedItem={selectedItem}
                onSelectItem={handleSelectItem}
              />

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold uppercase text-white mb-2">Chọn Dãy Kệ Cần Quản Lý:</h4>
                <div className="grid grid-cols-5 gap-2">
                  {racks.map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRack(r.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        selectedRackId === r.id
                          ? 'bg-teal-600 text-white border-teal-400 shadow-lg'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: r.color }} />
                      <span className="font-bold text-xs">Kệ {r.id}</span>
                      <span className="text-[9px] text-slate-300">{r.colorName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-4">
              <ItemDirectoryTable
                items={items}
                selectedItem={selectedItem}
                onSelectItem={handleSelectItem}
                onOpenUpdateModal={() => handleOpenUpdateModal(selectedItem || undefined)}
              />

              <RackSlottingMatrixEditor
                activeRack={racks.find(r => r.id === (selectedRackId || currentPosition.rackId)) || racks[0]}
                racks={racks}
                onSelectRack={handleSelectRack}
                onUpdateRacks={setRacksWithHistory}
                items={items}
                onUpdateItems={setItemsWithHistory}
                selectedItem={selectedItem}
                onSelectItem={handleSelectItem}
                currentPosition={currentPosition}
                onPositionChange={handlePositionChange}
              />
            </div>
          </div>
        )}

      </main>

      {/* MODALS */}
      <UpdateBoltModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        item={modalItemToUpdate}
        items={items}
        racks={racks}
        onSaveItem={handleSaveUpdatedItem}
      />

      <StationPickerModal
        isOpen={isStationPickerOpen}
        onClose={() => setIsStationPickerOpen(false)}
        currentPosition={currentPosition}
        onSelectPosition={handlePositionChange}
        racks={racks}
        zones={zones}
        presetPositions={defaultPositions}
      />

      <WarehouseEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        boardConfig={boardConfig}
        onSaveBoardConfig={setBoardConfigWithHistory}
        racks={racks}
        onSaveRacks={setRacksWithHistory}
        facilities={facilities}
        onSaveFacilities={setFacilitiesWithHistory}
        annotations={annotations}
        onSaveAnnotations={setAnnotationsWithHistory}
        floorMarkings={floorMarkings}
        onSaveFloorMarkings={setFloorMarkingsWithHistory}
        items={items}
        onSaveItems={setItemsWithHistory}
        safetyRules={safetyRules}
        onSaveSafetyRules={setSafetyRules}
        onResetToDefaults={handleResetToDefaults}
      />

      <PrintExportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        boardConfig={boardConfig}
        currentPosition={currentPosition}
        racks={racks}
        items={items}
        safetyRules={safetyRules}
        initialPdfTab={activePdfTabToOpen}
        selectedRackId={selectedRackId}
        pdf4Config={pdf4ConfigState}
      />

    </div>
  );
}
