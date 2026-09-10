import React, { useState } from 'react';
import { InventoryItem } from './types';
import { Search, MapPin, Edit3, ArrowUpRight, CheckCircle, AlertTriangle, XCircle, Plus, Filter } from 'lucide-react';

interface ItemDirectoryTableProps {
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
  onSelectItem: (item: InventoryItem) => void;
  onOpenUpdateModal: () => void;
  onAddNewItem?: () => void;
}

export const ItemDirectoryTable: React.FC<ItemDirectoryTableProps> = ({
  items = [],
  selectedItem,
  onSelectItem,
  onOpenUpdateModal,
  onAddNewItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const safeItems = Array.isArray(items) ? items : [];
  const categories = ['all', ...Array.from(new Set(safeItems.map(i => i?.category).filter(Boolean)))];

  const filteredItems = safeItems.filter(item => {
    if (!item) return false;
    const matchesSearch = 
      (item.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.spec || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-lg overflow-hidden flex flex-col h-full">
      {/* Top Banner with "CẬP NHẬT VỊ TRÍ BULONG" Action Button (Exact Match to Picture) */}
      <div className="bg-slate-800 p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">
            DANH MỤC VẬT TƯ CHÍNH (INVENTORY DIRECTORY)
          </h3>
        </div>

        {/* The prominent button from the top right of the board in the photo */}
        <button
          onClick={onOpenUpdateModal}
          className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow transition-all flex items-center gap-1.5 uppercase tracking-wide border border-amber-400"
          id="btn-update-bolt-location"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>CẬP NHẬT VỊ TRÍ BULONG / VẬT TƯ</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã VT, Tên vật tư (M6x20, M8...), Vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
          />
        </div>

        {categories.length > 2 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Tất cả nhóm vật tư ({items.length})</option>
            {categories.filter(c => c !== 'all').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table Body (Formatted precisely like the physical warehouse board table) */}
      <div className="flex-1 overflow-y-auto max-h-[380px] lg:max-h-[440px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-300 font-bold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2 px-2.5 text-center w-12">MÃ VT</th>
              <th className="py-2 px-3">TÊN VẬT TƯ</th>
              <th className="py-2 px-2.5 text-center font-mono">VỊ TRÍ</th>
              <th className="py-2 px-2 hidden sm:table-cell">QUY CÁCH</th>
              <th className="py-2 px-2 text-right">TỒN KHO</th>
              <th className="py-2 px-2 text-center w-12">ĐỊNH VỊ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  Không tìm thấy vật tư phù hợp
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-100/90 text-cyan-950 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {/* Mã VT */}
                    <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-900">
                      {item.code}
                    </td>

                    {/* Tên VT */}
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.status === 'low_stock' && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="Sắp hết hàng" />
                        )}
                        {item.status === 'out_of_stock' && (
                          <span className="w-2 h-2 rounded-full bg-red-500" title="Hết hàng" />
                        )}
                      </div>
                    </td>

                    {/* Vị trí */}
                    <td className="py-2 px-2.5 text-center font-mono font-bold">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                        isSelected 
                          ? 'bg-cyan-700 text-white' 
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {item.location}
                      </span>
                    </td>

                    {/* Quy cách */}
                    <td className="py-2 px-2 text-slate-500 hidden sm:table-cell truncate max-w-[140px]" title={item.spec}>
                      {item.spec}
                    </td>

                    {/* Tồn kho */}
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-800">
                      {item.quantity}
                    </td>

                    {/* Định vị Button */}
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                        className={`p-1 rounded transition-colors ${
                          isSelected 
                            ? 'bg-cyan-600 text-white' 
                            : 'text-slate-400 hover:text-cyan-600 hover:bg-slate-100'
                        }`}
                        title="Định vị ô kệ trên bản đồ 3D"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 p-2 px-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Hiển thị {filteredItems.length}/{items.length} mã vật tư</span>
        <span className="text-[10px] text-cyan-700 font-semibold">
          Click vào dòng để hiển thị đường dẫn 3D
        </span>
      </div>
    </div>
  );
};
