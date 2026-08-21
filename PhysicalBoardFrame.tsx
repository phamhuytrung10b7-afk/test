import React from 'react';
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
import { IsometricWarehouseCanvas } from './IsometricWarehouseCanvas';
import { RackReadingGuide } from './RackReadingGuide';
import { RackSlottingMatrixEditor } from './RackSlottingMatrixEditor';
import { ManualDPadController } from './ManualDPadController';
import { 
  Sparkles, 
  Trash2, 
  Flame, 
  AlertTriangle, 
  ShieldBan, 
  Layers, 
  Maximize2, 
  Printer, 
  Edit2, 
  Compass,
  MapPin,
  User,
  Star
} from 'lucide-react';

interface PhysicalBoardFrameProps {
  boardConfig: BoardConfig;
  onUpdateBoardConfig?: (config: BoardConfig) => void;
  racks: WarehouseRack[];
  onUpdateRacks?: (racks: WarehouseRack[]) => void;
  facilities?: WarehouseFacilityObject[];
  onUpdateFacilities?: (facilities: WarehouseFacilityObject[]) => void;
  annotations?: MapTextAnnotation[];
  onUpdateAnnotations?: (annotations: MapTextAnnotation[]) => void;
  floorMarkings?: FloorMarking[];
  onUpdateFloorMarkings?: (markings: FloorMarking[]) => void;
  zones: WarehouseZone[];
  currentPosition: WarehousePosition;
  onPositionChange: (pos: WarehousePosition) => void;
  items: InventoryItem[];
  onUpdateItems?: (items: InventoryItem[]) => void;
  selectedItem: InventoryItem | null;
  selectedRackId: string | null;
  onSelectItem: (item: InventoryItem) => void;
  onSelectRack: (rackId: string, bayId?: string) => void;
  safetyRules: SafetyRule[];
  onOpenUpdateModal: (item?: InventoryItem) => void;
  onOpenStationPicker: () => void;
  onOpenPrintModal: () => void;
  onOpenEditorModal: () => void;
  isKioskFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const PhysicalBoardFrame: React.FC<PhysicalBoardFrameProps> = ({
  boardConfig,
  onUpdateBoardConfig,
  racks,
  onUpdateRacks,
  facilities = [],
  onUpdateFacilities,
  annotations = [],
  onUpdateAnnotations,
  floorMarkings = [],
  onUpdateFloorMarkings,
  zones,
  currentPosition,
  onPositionChange,
  items = [],
  onUpdateItems,
  selectedItem,
  selectedRackId,
  onSelectItem,
  onSelectRack,
  safetyRules,
  onOpenStationPicker,
  onOpenPrintModal,
  onOpenEditorModal,
  onToggleFullscreen,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const getSafetyIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trash2': return <Trash2 className="w-5 h-5 text-cyan-600" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-emerald-600" />;
      case 'AlertTriangle': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'Flame': return <Flame className="w-5 h-5 text-red-600" />;
      case 'ShieldBan': return <ShieldBan className="w-5 h-5 text-rose-600" />;
      default: return <Layers className="w-5 h-5 text-blue-600" />;
    }
  };

  const handleManualMovePin = (direction: 'up' | 'down' | 'left' | 'right') => {
    const delta = 3;
    let newX = currentPosition.x;
    let newY = currentPosition.y;

    if (direction === 'up') newY -= delta;
    if (direction === 'down') newY += delta;
    if (direction === 'left') newX -= delta;
    if (direction === 'right') newX += delta;

    newX = Math.max(1, Math.min(99, newX));
    newY = Math.max(1, Math.min(99, newY));

    const targetRack = racks.find(r => Math.abs(r.x - newX) < 10 && Math.abs(r.y - newY) < 15);
    let targetBayId = '02';
    if (targetRack) {
      const bayLen = targetRack.bayLength || 4.8;
      const bayIdx = Math.min(5, Math.max(1, Math.floor((newY - targetRack.y) / bayLen) + 1));
      targetBayId = String(bayIdx).padStart(2, '0');
    }

    const newLabel = targetRack 
      ? `Trạm đứng Kệ ${targetRack.id} - Bay ${targetBayId} (${targetRack.colorName || targetRack.name})`
      : `Trạm đứng toạ độ (${newX.toFixed(0)}, ${newY.toFixed(0)})`;

    onPositionChange({
      ...currentPosition,
      x: newX,
      y: newY,
      label: newLabel,
      rackId: targetRack?.id,
      bayId: targetRack ? targetBayId : undefined,
    });
  };

  return (
    <div className="w-full max-w-[1650px] mx-auto flex flex-col items-center select-none">
      {/* Top Action Toolbar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-3 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStationPicker}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg border border-teal-800 transition-all shadow-sm"
          >
            <Compass className="w-4 h-4 text-teal-200" />
            <span>Đổi Vị Trí Trạm Đứng ({currentPosition.rackId ? `Rack ${currentPosition.rackId} - Bay ${currentPosition.bayId || '02'}` : currentPosition.label})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenEditorModal}
            className="flex items-center gap-1.5 bg-white text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5 text-cyan-600" />
            <span>Tùy Biến Sơ Đồ & Vạch 5S</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Xuất File In / PDF</span>
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 bg-white text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 shadow-sm"
              title="Toàn màn hình Kiosk"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* The Physical Signboard Container (Bảng Mica Khung Kệ Sắt Xanh NMBD) */}
      <div className="w-full bg-slate-100 p-2 sm:p-4 md:p-5 rounded-2xl border-4 border-slate-300 shadow-xl relative">
        {/* Blue Metal Rack Uprights (Khung cột kệ sắt xanh bao quanh) */}
        <div className="absolute -left-3.5 top-0 bottom-0 w-3 bg-blue-700 rounded-l flex flex-col justify-around py-6 shadow-md border-r border-blue-900">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={`left-hole-${i}`} className="w-1.5 h-3.5 bg-slate-900 rounded mx-auto" />
          ))}
        </div>
        <div className="absolute -right-3.5 top-0 bottom-0 w-3 bg-blue-700 rounded-r flex flex-col justify-around py-6 shadow-md border-l border-blue-900">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={`right-hole-${i}`} className="w-1.5 h-3.5 bg-slate-900 rounded mx-auto" />
          ))}
        </div>

        {/* The White Acrylic Board Surface (Mặt bảng Mica trắng viền xanh đậm) */}
        <div className="w-full bg-white rounded-xl border-4 border-[#00695c] shadow-inner flex flex-col overflow-hidden">
          
          {/* 1. Header Bar (Matching Image 1: SUNHOUSE logo + SƠ ĐỒ VẬN HÀNH & TRA CỨU) */}
          <div className="bg-white border-b-2 border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-[#dc2626] text-white font-black px-4 py-1.5 rounded-lg text-lg tracking-tighter shadow-md border border-red-700 flex items-center justify-center font-sans">
                SUNHOUSE
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {boardConfig.companyName || 'NHÀ MÁY SUNHOUSE BÌNH DƯƠNG'}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {boardConfig.boardSubtitle || 'HỆ THỐNG ĐỊNH VỊ & CHỈ DẪN TRỰC QUAN'}
                </span>
              </div>
            </div>

            {/* Center / Right: Main Title */}
            <div className="text-right sm:text-center flex-1 pr-2">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-[#004d40] tracking-tight uppercase">
                {boardConfig.boardTitle || 'SƠ ĐỒ VẬN HÀNH & TRA CỨU'}
              </h1>
            </div>
          </div>

          {/* 2. Main Middle Body (Top: 3D Isometric Map; Bottom: 3 Columns [Mall Map | You Are Here | Rack Reading Guide]) */}
          <div className="p-3 sm:p-5 bg-slate-50/50 flex flex-col gap-4">
            
            {/* 2A. 3D Warehouse Map Container (Bo tròn viền xám đậm giống hình 1) */}
            <div className="w-full bg-white rounded-xl border-2 border-slate-300 shadow-md p-2 overflow-hidden flex flex-col">
              <IsometricWarehouseCanvas
                racks={racks}
                onUpdateRacks={onUpdateRacks}
                facilities={facilities}
                onUpdateFacilities={onUpdateFacilities}
                annotations={annotations}
                onUpdateAnnotations={onUpdateAnnotations}
                floorMarkings={floorMarkings}
                onUpdateFloorMarkings={onUpdateFloorMarkings}
                zones={zones}
                currentPosition={currentPosition}
                onPositionChange={onPositionChange}
                items={items}
                onUpdateItems={onUpdateItems}
                selectedItem={selectedItem}
                selectedRackId={selectedRackId}
                onSelectRack={onSelectRack}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={onUndo}
                onRedo={onRedo}
              />
            </div>

            {/* 2B. Bottom Row of the Sign Board (3 Columns: Slotting Matrix Editor | You Are Here | Rack Reading Guide) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              
              {/* Column 1: BẢNG CHI TIẾT Ô KỆ & LINH KIỆN ĐIỀN TAY (7/12 - MỞ RỘNG RỘNG RÃI) */}
              <div className="md:col-span-7 flex flex-col">
                <RackSlottingMatrixEditor
                  activeRack={racks.find(r => r.id === (selectedRackId || currentPosition.rackId)) || racks[0]}
                  racks={racks}
                  onSelectRack={onSelectRack}
                  onUpdateRacks={onUpdateRacks}
                  items={items}
                  onUpdateItems={onUpdateItems}
                  selectedItem={selectedItem}
                  onSelectItem={onSelectItem}
                  currentPosition={currentPosition}
                  onPositionChange={onPositionChange}
                />
              </div>

              {/* Column 2: VỊ TRÍ CỦA BẠN / YOU ARE HERE (2/12 - GỌN GÀNG, KHÔNG BỊ DÀI) */}
              <div className="md:col-span-2 bg-gradient-to-b from-teal-50 to-emerald-50/50 p-3 rounded-xl border-2 border-teal-500 shadow-md flex flex-col items-center justify-between text-center relative overflow-hidden">
                {/* Background soft glow */}
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />

                <div className="flex flex-col items-center">
                  <h2 className="font-black text-xs sm:text-sm text-[#004d40] uppercase tracking-tight">
                    VỊ TRÍ CỦA BẠN
                  </h2>
                  <span className="text-[9px] font-bold text-teal-700 uppercase tracking-widest mb-1 font-mono">
                    YOU ARE HERE
                  </span>
                </div>

                {/* Sleek Teardrop Pin */}
                <div className="relative my-1">
                  <div className="w-11 h-14 bg-[#00695c] rounded-t-full rounded-b-[40%] flex flex-col items-center justify-center shadow-md border-2 border-white transform transition-transform hover:scale-105">
                    <div className="relative">
                      <User className="w-5 h-5 text-white" />
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 absolute -top-1 -right-1" />
                    </div>
                  </div>
                  {/* Pin Point */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[9px] border-t-[#00695c] mx-auto -mt-0.5" />
                </div>

                <div className="w-full flex flex-col items-center gap-1 mt-1">
                  <div className="w-full bg-white/95 px-2 py-1 rounded-lg border border-teal-300 shadow-xs text-[11px] font-mono font-black text-teal-900 truncate">
                    {currentPosition.rackId ? `RACK ${currentPosition.rackId} - BAY ${currentPosition.bayId || '02'}` : currentPosition.label}
                  </div>

                  {/* Manual Directional Pad Controller (Image 2 style) */}
                  <div className="mt-1">
                    <ManualDPadController onMove={handleManualMovePin} size="sm" label="NÚT ĐIỀU CHỈNH" />
                  </div>

                  <button
                    onClick={onOpenStationPicker}
                    className="text-[9.5px] text-teal-800 hover:text-teal-950 font-bold underline cursor-pointer mt-1"
                  >
                    (Chạm/Kéo để đổi trạm)
                  </button>
                </div>
              </div>

              {/* Column 3: RACK ADDRESS READING GUIDE (3/12 - CÂN ĐỐI VỚI BẢNG) */}
              <div className="md:col-span-3 flex flex-col">
                <RackReadingGuide 
                  currentPosition={currentPosition} 
                  customImage={boardConfig.guideImageUrl}
                  onUpdateCustomImage={(img) => onUpdateBoardConfig?.({ ...boardConfig, guideImageUrl: img || undefined })}
                  imageFit={boardConfig.guideImageFit}
                  onUpdateImageFit={(fit) => onUpdateBoardConfig?.({ ...boardConfig, guideImageFit: fit })}
                />
              </div>

            </div>

          </div>

          {/* 3. Bottom Safety Rules Section (QUY TẮC AN TOÀN KHO 5S & PCCC) */}
          <div className="bg-[#004d40] text-white p-3 sm:p-4 border-t-2 border-teal-700">
            <div className="text-center font-black text-xs sm:text-sm uppercase tracking-widest mb-2.5 flex items-center justify-center gap-2">
              <span className="w-10 h-0.5 bg-teal-300" />
              <span>QUY TẮC AN TOÀN KHO (5S & PCCC)</span>
              <span className="w-10 h-0.5 bg-teal-300" />
            </div>

            {/* 6 Safety Rules Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {safetyRules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-white text-slate-900 rounded-lg p-2.5 flex flex-col items-center text-center shadow-sm border border-slate-200 hover:bg-teal-50/50 transition-all"
                >
                  <div className="p-1.5 bg-slate-100 rounded-full mb-1.5">
                    {getSafetyIcon(rule.icon)}
                  </div>
                  <span className="font-extrabold text-[10px] leading-tight uppercase text-slate-900 mb-0.5">
                    {rule.title}
                  </span>
                  <span className="text-[8.5px] text-slate-600 leading-tight line-clamp-2">
                    {rule.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 4. Physical Blue Station Plate Tag Mounted below board (As in photo: RACK A - BAY 02) */}
        <div className="mt-4 flex flex-col items-center">
          <div 
            onClick={onOpenStationPicker}
            className="cursor-pointer bg-blue-800 hover:bg-blue-700 text-white font-mono font-black text-sm sm:text-lg px-6 py-2 rounded-xl border-4 border-white shadow-xl flex items-center gap-3 transition-transform hover:scale-105"
            title="Nhấn để đổi trạm gắn bảng này"
          >
            <span className="text-xs uppercase text-blue-200 font-sans font-bold">VỊ TRÍ BẢNG HIỆN TẠI:</span>
            <span>{currentPosition.rackId ? `RACK ${currentPosition.rackId} - BAY ${currentPosition.bayId || '02'}` : currentPosition.label}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
