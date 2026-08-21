import React, { useState, useEffect } from 'react';
import { InventoryItem, WarehouseRack } from './types';
import { X, Save, Edit3, MapPin, CheckCircle2, Box } from 'lucide-react';

interface UpdateBoltModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  items: InventoryItem[];
  racks: WarehouseRack[];
  onSaveItem: (updatedItem: InventoryItem) => void;
}

export const UpdateBoltModal: React.FC<UpdateBoltModalProps> = ({
  isOpen,
  onClose,
  item,
  items,
  racks,
  onSaveItem,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(item?.id || items[0]?.id || '');
  const [rackId, setRackId] = useState<string>(item?.rackId || 'A');
  const [bayId, setBayId] = useState<string>(item?.bayId || '02');
  const [tier, setTier] = useState<number>(item?.tier || 3);
  const [slot, setSlot] = useState<number>(item?.slot || 2);
  const [direction, setDirection] = useState<'↑' | '↓' | '←' | '→'>(item?.direction || '↑');
  const [quantity, setQuantity] = useState<number>(item?.quantity || 50);
  const [spec, setSpec] = useState<string>(item?.spec || '');
  const [note, setNote] = useState<string>(item?.note || '');

  useEffect(() => {
    if (item) {
      setSelectedItemId(item.id);
      setRackId(item.rackId);
      setBayId(item.bayId);
      setTier(item.tier);
      setSlot(item.slot);
      setDirection(item.direction);
      setQuantity(item.quantity);
      setSpec(item.spec);
      setNote(item.note || '');
    }
  }, [item]);

  if (!isOpen) return null;

  const currentItem = items.find(i => i.id === selectedItemId) || items[0];

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedItemId(id);
    const found = items.find(i => i.id === id);
    if (found) {
      setRackId(found.rackId);
      setBayId(found.bayId);
      setTier(found.tier);
      setSlot(found.slot);
      setDirection(found.direction);
      setQuantity(found.quantity);
      setSpec(found.spec);
      setNote(found.note || '');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;

    const newLocation = `${rackId}-${bayId}-${tier}-${slot}`;
    const updated: InventoryItem = {
      ...currentItem,
      rackId,
      bayId,
      tier,
      slot,
      direction,
      location: newLocation,
      quantity,
      spec,
      note,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onSaveItem(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide">Cập Nhật Vị Trí Bulong / Vật Tư</h3>
              <p className="text-[11px] text-slate-400">Điều chỉnh tọa độ ô kệ và tồn kho thực tế</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          {/* Select Item */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Chọn Vật Tư Cần Cập Nhật
            </label>
            <select
              value={selectedItemId}
              onChange={handleItemChange}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  [{i.code}] {i.name} - Vị trí hiện tại: {i.location}
                </option>
              ))}
            </select>
          </div>

          {/* Coordinate Selector Grid */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              Định Vị Tọa Độ Mới Trên Kệ (Slotting Coordinates)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Rack Row */}
              <div>
                <label className="block text-[10px] font-bold text-red-700 uppercase mb-1">
                  1. Kệ (Rack)
                </label>
                <select
                  value={rackId}
                  onChange={(e) => setRackId(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-white border border-red-300 rounded p-2 text-slate-900 focus:ring-2 focus:ring-red-500"
                >
                  {racks.map(r => (
                    <option key={r.id} value={r.id}>Kệ {r.id} ({r.colorName})</option>
                  ))}
                </select>
              </div>

              {/* Bay / Khoang */}
              <div>
                <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">
                  2. Khoang (Bay)
                </label>
                <select
                  value={bayId}
                  onChange={(e) => setBayId(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-white border border-amber-300 rounded p-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
                >
                  {['01', '02', '03', '04', '05', '06'].map(b => (
                    <option key={b} value={b}>Bay {b}</option>
                  ))}
                </select>
              </div>

              {/* Tier / Tầng */}
              <div>
                <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">
                  3. Tầng (Level)
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold bg-white border border-emerald-300 rounded p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {[4, 3, 2, 1].map(t => (
                    <option key={t} value={t}>Tầng {t}</option>
                  ))}
                </select>
              </div>

              {/* Slot / Vị trí */}
              <div>
                <label className="block text-[10px] font-bold text-cyan-700 uppercase mb-1">
                  4. Ô (Position)
                </label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold bg-white border border-cyan-300 rounded p-2 text-slate-900 focus:ring-2 focus:ring-cyan-500"
                >
                  <option value={1}>Vị trí 1 (Trái)</option>
                  <option value={2}>Vị trí 2 (Phải)</option>
                </select>
              </div>
            </div>

            {/* Address Preview Pill */}
            <div className="bg-slate-900 text-white p-2 rounded-lg flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">Mã địa chỉ mới:</span>
              <span className="text-amber-400 font-bold text-sm">
                {rackId}-{bayId}-{tier}-{slot} {direction}
              </span>
            </div>
          </div>

          {/* Quantity & Spec */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Số Lượng Tồn Kho ({currentItem?.unit})
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Quy Cách / Thông Số
              </label>
              <input
                type="text"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ghi Chú Vận Hành (Dây chuyền sử dụng, cảnh báo)
            </label>
            <input
              type="text"
              placeholder="VD: Dùng cho dây chuyền dập khung SHD-860..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all shadow flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cập Nhật</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
