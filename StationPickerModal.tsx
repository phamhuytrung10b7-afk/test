import React, { useState } from 'react';
import { WarehousePosition, WarehouseRack, WarehouseZone } from './types';
import { X, MapPin, Check, Compass, Sparkles } from 'lucide-react';

interface StationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPosition: WarehousePosition;
  onSelectPosition: (pos: WarehousePosition) => void;
  racks: WarehouseRack[];
  zones: WarehouseZone[];
  presetPositions: WarehousePosition[];
}

export const StationPickerModal: React.FC<StationPickerModalProps> = ({
  isOpen,
  onClose,
  currentPosition,
  onSelectPosition,
  racks,
  zones,
  presetPositions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide">
                Chọn Vị Trí Đứng / Vị Trí Lắp Đặt Bảng (YOU ARE HERE)
              </h3>
              <p className="text-[11px] text-slate-400">
                Thay đổi vị trí đứng để bảng tự động căn chỉnh sơ đồ định hướng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* Active Location Display */}
          <div className="bg-teal-50 border-2 border-teal-500 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 block">
                  Vị trí đang chọn hiện tại:
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {currentPosition.label}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-teal-600 text-white px-2 py-0.5 rounded">
              X:{currentPosition.x} Y:{currentPosition.y}
            </span>
          </div>

          {/* Preset Locations Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Các Trạm Định Vị Tiêu Chuẩn Trong Kho:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presetPositions.map((pos, idx) => {
                const isSelected = 
                  pos.rackId === currentPosition.rackId && 
                  pos.bayId === currentPosition.bayId;

                return (
                  <button
                    key={`pos-${idx}`}
                    onClick={() => {
                      onSelectPosition(pos);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-300'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-teal-600'}`} />
                        <span>{pos.label}</span>
                      </div>
                      {pos.rackId && (
                        <div className={`text-[10px] font-mono mt-1 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                          Kệ {pos.rackId} • Bay {pos.bayId || '01'} • Tầng {pos.tier || 1}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick By-Rack Jump */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Hoặc Chọn Trực Tiếp Theo Dãy Kệ:
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {racks.map(rack => (
                <button
                  key={rack.id}
                  onClick={() => {
                    onSelectPosition({
                      x: rack.x,
                      y: rack.y + 4,
                      label: `Vị trí Kệ ${rack.id} - Bay 02 (${rack.colorName})`,
                      rackId: rack.id,
                      bayId: '02',
                      tier: 3,
                      slot: 2,
                    });
                    onClose();
                  }}
                  className="p-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-white flex flex-col items-center justify-center text-center transition-transform hover:scale-105"
                >
                  <span className="w-4 h-4 rounded-full mb-1 shadow-sm" style={{ backgroundColor: rack.color }} />
                  <span className="font-bold text-xs text-slate-900">{rack.id}</span>
                  <span className="text-[9px] text-slate-500 font-mono">Kệ {rack.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Mẹo: Bạn cũng có thể click trực tiếp vào bất kỳ vị trí nào trên bản đồ 3D để dời trạm đứng!</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-3 px-5 flex justify-end border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
