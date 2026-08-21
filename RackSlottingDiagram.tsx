import React, { useState } from 'react';
import { InventoryItem, WarehousePosition, WarehouseRack } from './types';
import { Layers, Info, CheckCircle2, Box, ArrowUp, ArrowRight, Sparkles } from 'lucide-react';

interface RackSlottingDiagramProps {
  currentPosition: WarehousePosition;
  activeRack?: WarehouseRack;
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
  onSelectItem: (item: InventoryItem) => void;
  onSelectSlot?: (rackId: string, bayId: string, tier: number, slot: number) => void;
}

export const RackSlottingDiagram: React.FC<RackSlottingDiagramProps> = ({
  currentPosition,
  activeRack,
  items,
  selectedItem,
  onSelectItem,
  onSelectSlot,
}) => {
  const [activeTier, setActiveTier] = useState<number>(selectedItem?.tier || 3);
  const [activeSlot, setActiveSlot] = useState<number>(selectedItem?.slot || 2);

  const rackId = currentPosition.rackId || activeRack?.id || 'A';
  const bayId = currentPosition.bayId || '02';
  const currentCoordinate = `${rackId}-${bayId}-${activeTier} ${activeSlot} ↑`;

  // Find item stored in current active slot
  const slotLocationCode = `${rackId}-${bayId}-${activeTier}-${activeSlot}`;
  const itemInSlot = items.find(
    i => i.rackId === rackId && i.bayId === bayId && i.tier === activeTier && i.slot === activeSlot
  ) || items.find(i => i.location === slotLocationCode);

  const tiers = [4, 3, 2, 1]; // Top to bottom
  const slots = [1, 2];

  const handleSlotClick = (tier: number, slot: number) => {
    setActiveTier(tier);
    setActiveSlot(slot);
    if (onSelectSlot) {
      onSelectSlot(rackId, bayId, tier, slot);
    }
    const found = items.find(
      i => i.rackId === rackId && i.bayId === bayId && i.tier === tier && i.slot === slot
    );
    if (found) {
      onSelectItem(found);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-lg overflow-hidden flex flex-col">
      {/* Header with Title matching physical board */}
      <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-sm tracking-wider uppercase">
            RACK {rackId} - BAY {bayId}
          </span>
        </div>
        <span className="text-[11px] text-slate-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
          Sơ đồ định vị ô kệ / địa chỉ kho
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Main Big Address Code Badge (Like in the photo: A-02-3 2 ↑) */}
        <div className="bg-slate-50 border-2 border-slate-800 rounded-lg p-2.5 flex items-center justify-center gap-2 shadow-inner">
          <div className="flex items-center text-2xl lg:text-3xl font-mono font-black tracking-wider">
            <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              {rackId}
            </span>
            <span className="text-slate-400 mx-0.5">-</span>
            <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              {bayId}
            </span>
            <span className="text-slate-400 mx-0.5">-</span>
            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {activeTier}
            </span>
            <span className="text-slate-300 mx-1"> </span>
            <span className="text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
              {activeSlot}
            </span>
            <span className="text-slate-800 ml-1 text-2xl">
              ↑
            </span>
          </div>
        </div>

        {/* 3D Isometric View of the Rack Bay Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Visual 3D Bay Graphic */}
          <div className="md:col-span-7 bg-slate-100/80 rounded-lg p-2 border border-slate-200 flex flex-col items-center justify-center min-h-[170px] relative">
            <div className="w-full flex flex-col gap-1.5 max-w-[280px]">
              {tiers.map((tierNum) => (
                <div
                  key={`tier-${tierNum}`}
                  className="flex items-center gap-1.5"
                >
                  <span className="w-8 text-[11px] font-bold font-mono text-slate-500 text-right">
                    T{tierNum}
                  </span>

                  <div className="flex-1 grid grid-cols-2 gap-1.5">
                    {slots.map((slotNum) => {
                      const isThisSelected = activeTier === tierNum && activeSlot === slotNum;
                      const hasItem = items.some(
                        i => i.rackId === rackId && i.bayId === bayId && i.tier === tierNum && i.slot === slotNum
                      );

                      return (
                        <button
                          key={`slot-${tierNum}-${slotNum}`}
                          onClick={() => handleSlotClick(tierNum, slotNum)}
                          className={`relative h-9 rounded border transition-all flex items-center justify-between px-2 text-xs font-mono font-bold ${
                            isThisSelected
                              ? 'bg-cyan-500 text-white border-cyan-700 shadow-md ring-2 ring-cyan-300 scale-[1.03]'
                              : hasItem
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Box className={`w-3.5 h-3.5 ${isThisSelected ? 'text-white' : hasItem ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span>Vị trí {slotNum}</span>
                          </div>
                          {hasItem && (
                            <span className={`w-2 h-2 rounded-full ${isThisSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Bay Ground Line */}
            <div className="w-full max-w-[280px] mt-1 pt-1 border-t-2 border-dashed border-slate-300 flex justify-between text-[9px] font-mono text-slate-500 px-8">
              <span>◄ Vị trí 1 (Trái)</span>
              <span>Vị trí 2 (Phải) ►</span>
            </div>
          </div>

          {/* Active Slot Details & Content */}
          <div className="md:col-span-5 flex flex-col justify-between h-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-cyan-600" />
                Vật tư tại ô {currentCoordinate}:
              </div>

              {itemInSlot ? (
                <div className="bg-white p-2 rounded border border-cyan-200 shadow-sm flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{itemInSlot.name}</span>
                    <span className="bg-cyan-100 text-cyan-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                      Mã: {itemInSlot.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-medium">Quy cách:</span> {itemInSlot.spec}
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Tồn kho:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {itemInSlot.quantity} {itemInSlot.unit}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 text-slate-500 p-2.5 rounded border border-dashed border-slate-300 text-center text-[11px]">
                  Ô kệ hiện đang trống (Có thể gán vật tư mới)
                </div>
              )}
            </div>

            {/* Quick action button */}
            {itemInSlot && (
              <button
                onClick={() => onSelectItem(itemInSlot)}
                className="mt-2 w-full py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <span>Xem trên Terminal Tra Cứu</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Color Legend (Exact Match to Picture on the Board) */}
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-[10px] leading-relaxed">
          <div className="font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Ý NGHĨA QUY TẮC ĐỊA CHỈ Ô KỆ:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-600 shrink-0" />
              <span><strong className="text-red-700">Kệ - Khoang - Tầng - Vị trí - Hướng</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
              <span><strong className="text-amber-700">Bay (Khoang):</strong> Tầng - Vị trí - Kính gọ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
              <span><strong className="text-emerald-700">Level:</strong> Tầng quản lý độ cao (T1..T4)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-500 shrink-0" />
              <span><strong className="text-cyan-700">Position:</strong> Vị trí ô bảng trên giá đỡ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
