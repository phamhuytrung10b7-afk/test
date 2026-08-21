import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Navigation } from 'lucide-react';

interface ManualDPadControllerProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  className?: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const ManualDPadController: React.FC<ManualDPadControllerProps> = ({
  onMove,
  className = '',
  label = 'DI CHUYỂN THỦ CÔNG',
  size = 'md',
}) => {
  const btnClass = size === 'sm'
    ? 'w-7 h-7 text-xs rounded-md'
    : 'w-8 h-8 text-sm rounded-lg';

  return (
    <div className={`bg-slate-900/95 text-white p-2 rounded-xl border border-slate-700/80 shadow-lg flex flex-col items-center select-none ${className}`}>
      {label && (
        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wide mb-1 flex items-center gap-1">
          <Navigation className="w-2.5 h-2.5 text-cyan-400" />
          {label}
        </span>
      )}

      {/* Up Button */}
      <div className="flex justify-center mb-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove('up');
          }}
          className={`${btnClass} bg-slate-800 hover:bg-teal-600 text-slate-100 hover:text-white flex items-center justify-center border border-slate-600 transition-all active:scale-90 shadow-sm`}
          title="Di chuyển Lên (Phím Mũi Tên Trực Quan)"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* Left, Down, Right Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove('left');
          }}
          className={`${btnClass} bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center border border-cyan-400/60 transition-all active:scale-90 shadow-sm`}
          title="Di chuyển Sang Trái"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove('down');
          }}
          className={`${btnClass} bg-slate-800 hover:bg-teal-600 text-slate-100 hover:text-white flex items-center justify-center border border-slate-600 transition-all active:scale-90 shadow-sm`}
          title="Di chuyển Xuống"
        >
          <ArrowDown className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove('right');
          }}
          className={`${btnClass} bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center border border-cyan-400/60 transition-all active:scale-90 shadow-sm`}
          title="Di chuyển Sang Phải"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
