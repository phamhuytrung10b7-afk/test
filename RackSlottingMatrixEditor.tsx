import React, { useState } from 'react';
import { InventoryItem, WarehousePosition, WarehouseRack, RackBay } from './types';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Grid, 
  List, 
  X,
} from 'lucide-react';

interface RackSlottingMatrixEditorProps {
  activeRack?: WarehouseRack;
  racks: WarehouseRack[];
  onSelectRack: (rackId: string, bayId?: string) => void;
  onUpdateRacks?: (racks: WarehouseRack[]) => void;
  items: InventoryItem[];
  onUpdateItems?: (items: InventoryItem[]) => void;
  selectedItem?: InventoryItem | null;
  onSelectItem?: (item: InventoryItem) => void;
  currentPosition?: WarehousePosition;
  onPositionChange?: (pos: WarehousePosition) => void;
}

export const RackSlottingMatrixEditor: React.FC<RackSlottingMatrixEditorProps> = ({
  activeRack: propActiveRack,
  racks,
  onSelectRack,
  onUpdateRacks,
  items = [],
  onUpdateItems,
  selectedItem,
  onSelectItem,
  currentPosition,
  onPositionChange,
}) => {
  // Determine current active rack
  const activeRack = propActiveRack || 
    racks.find(r => r.id === currentPosition?.rackId) || 
    racks[0];

  const rackId = activeRack?.id || 'A';

  // Bay & Tier numbers calculation
  const bays: RackBay[] = activeRack?.bays && activeRack.bays.length > 0 
    ? activeRack.bays 
    : [
        { id: `${rackId}-01`, bayNumber: '01', tiers: 3, slotsPerTier: 2, color: '#f59e0b', fillLevel: 50 },
        { id: `${rackId}-02`, bayNumber: '02', tiers: 3, slotsPerTier: 2, color: '#f59e0b', fillLevel: 50 },
        { id: `${rackId}-03`, bayNumber: '03', tiers: 3, slotsPerTier: 2, color: '#f59e0b', fillLevel: 50 },
        { id: `${rackId}-04`, bayNumber: '04', tiers: 3, slotsPerTier: 2, color: '#f59e0b', fillLevel: 50 },
        { id: `${rackId}-05`, bayNumber: '05', tiers: 3, slotsPerTier: 2, color: '#f59e0b', fillLevel: 50 },
      ];

  const numBays = bays.length;
  // Get max tiers in this rack
  const numTiers = Math.max(1, Math.min(8, bays[0]?.tiers || 3));

  // Generate array of tiers: e.g. [3, 2, 1] from top to bottom
  const tierNumbers = Array.from({ length: numTiers }, (_, i) => numTiers - i);

  // Active view: 'matrix' (shelf visual grid) or 'list'
  const [viewTab, setViewTab] = useState<'matrix' | 'list'>('matrix');

  // Handle Add Khoang (Bay)
  const handleAddBay = () => {
    if (!onUpdateRacks || !activeRack) return;
    const nextBayNum = (numBays + 1).toString().padStart(2, '0');
    const newBay: RackBay = {
      id: `${rackId}-${nextBayNum}`,
      bayNumber: nextBayNum,
      tiers: numTiers,
      slotsPerTier: 2,
      color: activeRack.color || '#ea580c',
      fillLevel: 0,
    };

    const updatedBays = [...bays, newBay];
    const updatedRacks = racks.map(r => {
      if (r.id === rackId) {
        return {
          ...r,
          length: updatedBays.length,
          bays: updatedBays,
        };
      }
      return r;
    });
    onUpdateRacks(updatedRacks);
  };

  // Handle Remove Khoang (Bay)
  const handleRemoveBay = () => {
    if (!onUpdateRacks || !activeRack || numBays <= 1) return;
    const updatedBays = bays.slice(0, -1);
    const updatedRacks = racks.map(r => {
      if (r.id === rackId) {
        return {
          ...r,
          length: updatedBays.length,
          bays: updatedBays,
        };
      }
      return r;
    });
    onUpdateRacks(updatedRacks);
  };

  // Handle Add Tầng (Tier / Level)
  const handleAddTier = () => {
    if (!onUpdateRacks || !activeRack || numTiers >= 8) return;
    const newTierCount = numTiers + 1;
    const updatedBays = bays.map(b => ({
      ...b,
      tiers: newTierCount,
    }));
    const updatedRacks = racks.map(r => {
      if (r.id === rackId) {
        return {
          ...r,
          bays: updatedBays,
        };
      }
      return r;
    });
    onUpdateRacks(updatedRacks);
  };

  // Handle Remove Tầng (Tier / Level)
  const handleRemoveTier = () => {
    if (!onUpdateRacks || !activeRack || numTiers <= 1) return;
    const newTierCount = numTiers - 1;
    const updatedBays = bays.map(b => ({
      ...b,
      tiers: newTierCount,
    }));
    const updatedRacks = racks.map(r => {
      if (r.id === rackId) {
        return {
          ...r,
          bays: updatedBays,
        };
      }
      return r;
    });
    onUpdateRacks(updatedRacks);
  };

  // Helper to find item at rack, bay, tier, and slot position (1 or 2)
  const getItemAt = (bayNum: string, tier: number, pos: number): InventoryItem | undefined => {
    return items.find(
      i => i.rackId === rackId && i.bayId === bayNum && i.tier === tier && (i.slot === pos || (!i.slot && pos === 1))
    );
  };

  // Inline Direct Editing of Item Name in Cell
  const handleCellNameChange = (bayNum: string, tier: number, pos: number, newName: string) => {
    if (!onUpdateItems) return;
    const existing = getItemAt(bayNum, tier, pos);

    if (existing) {
      if (newName.trim() === '') {
        // If empty string, keep item or update name
        const updated = items.map(i => i.id === existing.id ? { ...i, name: '' } : i);
        onUpdateItems(updated);
      } else {
        const updated = items.map(i => i.id === existing.id ? { ...i, name: newName } : i);
        onUpdateItems(updated);
      }
    } else if (newName.trim() !== '') {
      // Create new inventory item on this slot
      const newItem: InventoryItem = {
        id: `item-${rackId}-${bayNum}-${tier}-${pos}-${Date.now()}`,
        code: `VT-${rackId}${bayNum}${tier}${pos}`,
        name: newName,
        category: activeRack?.category || 'Linh kiện',
        location: `${rackId}-${bayNum}-${tier}-${pos}`,
        rackId: rackId,
        bayId: bayNum,
        tier: tier,
        slot: pos,
        direction: pos === 1 ? '←' : '→',
        spec: 'Tiêu chuẩn',
        unit: 'Cái',
        quantity: 100,
        minQuantity: 10,
        status: 'in_stock',
        barcode: `893601${rackId.charCodeAt(0)}${bayNum}${tier}${pos}`,
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };
      onUpdateItems([...items, newItem]);
    }
  };

  // Quick Clear a cell
  const handleClearSlot = (bayNum: string, tier: number, pos: number) => {
    if (!onUpdateItems) return;
    const existing = getItemAt(bayNum, tier, pos);
    if (existing) {
      const updated = items.filter(i => i.id !== existing.id);
      onUpdateItems(updated);
    }
  };

  // Tier Color Coding
  const getTierColorStyle = (tier: number) => {
    if (tier === 3 || tier >= 3) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-700', badge: 'bg-amber-500 text-white' };
    if (tier === 2) return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-700', badge: 'bg-blue-600 text-white' };
    return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-700', badge: 'bg-red-600 text-white' };
  };

  return (
    <div className="bg-white p-3.5 rounded-xl border-2 border-slate-300 shadow-sm flex flex-col justify-between overflow-hidden">
      
      {/* 1. Header: Rack Selector & Add/Remove Khoang, Tầng Controls */}
      <div className="border-b border-slate-200 pb-2.5 mb-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          {/* Active Rack Pill / Switcher */}
          <div className="flex items-center gap-2">
            <span 
              className="w-4 h-4 rounded-md shadow-sm border border-black/20 flex-shrink-0"
              style={{ backgroundColor: activeRack?.color || '#ea580c' }}
            />
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500">Chi Tiết:</label>
              <select
                value={rackId}
                onChange={(e) => onSelectRack(e.target.value)}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-black text-xs px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                {racks.map(r => (
                  <option key={r.id} value={r.id}>
                    KỆ {r.id} ({r.colorName || r.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Tab Switcher (Matrix vs List) */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewTab('matrix')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                viewTab === 'matrix' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem ma trận ô kệ"
            >
              <Grid className="w-3 h-3" />
              <span>Ma Trận</span>
            </button>
            <button
              onClick={() => setViewTab('list')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                viewTab === 'list' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem danh sách"
            >
              <List className="w-3 h-3" />
              <span>Danh Sách</span>
            </button>
          </div>
        </div>

        {/* Dynamic Khoang & Tầng Increment/Decrement Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
          
          {/* Khoang (Bays) Count Controller */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[11px] text-slate-700">Khoang:</span>
            <div className="flex items-center bg-white rounded border border-slate-300 shadow-inner overflow-hidden">
              <button
                onClick={handleRemoveBay}
                disabled={numBays <= 1}
                className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white font-black"
                title="Bớt 1 khoang"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 font-mono font-black text-slate-900 text-[11px] min-w-[24px] text-center">
                {numBays}
              </span>
              <button
                onClick={handleAddBay}
                disabled={numBays >= 12}
                className="px-1.5 py-0.5 text-teal-700 hover:bg-teal-50 disabled:opacity-30 disabled:hover:bg-white font-black"
                title="Thêm 1 khoang mới"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Tầng (Tiers/Levels) Count Controller */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[11px] text-slate-700">Tầng:</span>
            <div className="flex items-center bg-white rounded border border-slate-300 shadow-inner overflow-hidden">
              <button
                onClick={handleRemoveTier}
                disabled={numTiers <= 1}
                className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white font-black"
                title="Bớt 1 tầng"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 font-mono font-black text-slate-900 text-[11px] min-w-[24px] text-center">
                {numTiers}
              </span>
              <button
                onClick={handleAddTier}
                disabled={numTiers >= 8}
                className="px-1.5 py-0.5 text-teal-700 hover:bg-teal-50 disabled:opacity-30 disabled:hover:bg-white font-black"
                title="Thêm 1 tầng mới"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 italic">
            (Sửa & điền tay trực tiếp vào từng ô)
          </span>
        </div>
      </div>

      {/* 2. Interactive Shelf Matrix Grid View */}
      {viewTab === 'matrix' && (
        <div className="flex-1 w-full overflow-y-auto max-h-[310px] border border-slate-200 rounded-lg shadow-inner bg-slate-100/60 p-1.5">
          <div className="w-full flex flex-col gap-1.5">
            
            {/* Header Columns: Khoang 01, Khoang 02, Khoang 03... */}
            <div className="flex items-center gap-1 pl-12 sm:pl-14">
              {bays.map((bay) => (
                <div 
                  key={`head-${bay.bayNumber}`}
                  className="flex-1 min-w-0 text-center font-black text-[9px] sm:text-[10px] uppercase text-slate-700 bg-white/90 py-1 rounded border border-slate-300 shadow-xs truncate"
                >
                  Khoang {bay.bayNumber}
                </div>
              ))}
            </div>

            {/* Rows: Tầng Levels (from Top to Bottom: e.g. Tầng 3, Tầng 2, Tầng 1) */}
            {tierNumbers.map((tierNum) => {
              const tierStyle = getTierColorStyle(tierNum);
              const tierLetter = tierNum === 3 ? 'A' : tierNum === 2 ? 'B' : tierNum === 1 ? 'C' : `L${tierNum}`;

              return (
                <div key={`row-tier-${tierNum}`} className="flex items-center gap-1">
                  {/* Left Row Header: Tầng Tag */}
                  <div className={`w-11 sm:w-12 flex flex-col items-center justify-center p-1 rounded font-mono font-black text-[10px] shadow-xs flex-shrink-0 ${tierStyle.badge}`}>
                    <span className="text-[7.5px] sm:text-[8px] opacity-90 uppercase">Tầng {tierNum}</span>
                    <span className="font-extrabold">{tierLetter}</span>
                  </div>

                  {/* Bay Cells */}
                  {bays.map((bay) => {
                    const isCurrentStation = currentPosition?.rackId === rackId && currentPosition?.bayId === bay.bayNumber && (currentPosition?.tier || 3) === tierNum;

                    return (
                      <div
                        key={`cell-${bay.bayNumber}-${tierNum}`}
                        className={`flex-1 min-w-0 min-h-[56px] p-1 sm:p-1.5 rounded-lg border-2 flex gap-1.5 transition-all bg-white relative ${
                          isCurrentStation 
                            ? 'border-teal-500 ring-2 ring-teal-400/40 shadow-md' 
                            : 'border-slate-300 hover:border-slate-400 shadow-xs'
                        }`}
                      >
                        {[1, 2].map(pos => {
                          const item = getItemAt(bay.bayNumber, tierNum, pos);
                          const slotLocation = `${rackId}-${bay.bayNumber}-${tierNum}-${pos}`;
                          
                          return (
                            <div key={`pos-${pos}`} className="flex-1 flex flex-col justify-between min-w-0">
                              {/* Cell Top Header */}
                              <div className="flex items-center justify-between gap-0.5 mb-1">
                                <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-slate-500 bg-slate-100 px-1 rounded truncate">
                                  {slotLocation}
                                </span>
                                {item && (
                                  <button
                                    onClick={() => handleClearSlot(bay.bayNumber, tierNum, pos)}
                                    className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors flex-shrink-0"
                                    title={`Xóa linh kiện ở ô ${slotLocation}`}
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>

                              {/* Direct Editable Part Name Input */}
                              <input
                                type="text"
                                value={item?.name || ''}
                                onChange={(e) => handleCellNameChange(bay.bayNumber, tierNum, pos, e.target.value)}
                                placeholder="+ Linh kiện..."
                                className={`w-full text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded border transition-colors focus:outline-none truncate ${
                                  item?.name 
                                    ? 'bg-amber-50/50 border-amber-300 text-slate-900 focus:bg-white focus:border-teal-500' 
                                    : 'bg-transparent border-dashed border-slate-300 text-slate-400 placeholder:text-slate-400 focus:bg-white focus:border-teal-500'
                                }`}
                                title={`Gõ tên linh kiện cho ô ${slotLocation}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* 3. Detailed List View of Slots & Items */}
      {viewTab === 'list' && (
        <div className="flex-1 overflow-y-auto max-h-[290px] border border-slate-200 rounded-lg shadow-inner bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 sticky top-0 border-b border-slate-300 text-[10px] uppercase font-bold text-slate-600">
              <tr>
                <th className="p-2">Vị Trí Ô</th>
                <th className="p-2">Khoang / Tầng</th>
                <th className="p-2">Tên Linh Kiện (Điền tay)</th>
                <th className="p-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {bays.flatMap((bay) => 
                tierNumbers.flatMap((tierNum) => 
                  [1, 2].map(pos => {
                    const item = getItemAt(bay.bayNumber, tierNum, pos);
                    const slotLocation = `${rackId}-${bay.bayNumber}-${tierNum}-${pos}`;

                    return (
                      <tr key={`list-${slotLocation}`} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 font-mono font-bold text-teal-700">
                          {slotLocation}
                        </td>
                        <td className="p-2 text-slate-500 text-[11px]">
                          Khoang {bay.bayNumber} • Tầng {tierNum} • Vị trí {pos}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item?.name || ''}
                            onChange={(e) => handleCellNameChange(bay.bayNumber, tierNum, pos, e.target.value)}
                            placeholder="Nhập tên linh kiện..."
                            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-right">
                          {item && (
                            <button
                              onClick={() => handleClearSlot(bay.bayNumber, tierNum, pos)}
                              className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded"
                              title="Xóa trắng ô"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Footer Note */}
      <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="font-semibold text-teal-800">
          Kệ {rackId}: {numBays} khoang × {numTiers} tầng × 2 vị trí = {numBays * numTiers * 2} vị trí ô
        </span>
        <span>Tự động lưu vào hệ thống</span>
      </div>

    </div>
  );
};
