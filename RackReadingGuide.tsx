import React, { useState, useRef, useEffect } from 'react';
import { WarehousePosition } from './types';
import { 
  Upload, 
  Image as ImageIcon, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Check, 
  X, 
  ZoomIn, 
  Sliders, 
  Eye, 
  RefreshCw,
  FileImage
} from 'lucide-react';

interface RackReadingGuideProps {
  currentPosition: WarehousePosition;
  customImage?: string;
  onUpdateCustomImage?: (imageUrl: string | null) => void;
  imageFit?: 'contain' | 'cover';
  onUpdateImageFit?: (fit: 'contain' | 'cover') => void;
}

export const RackReadingGuide: React.FC<RackReadingGuideProps> = ({ 
  currentPosition,
  customImage: propCustomImage,
  onUpdateCustomImage,
  imageFit: propImageFit = 'contain',
  onUpdateImageFit
}) => {
  const rackId = currentPosition.rackId || 'A';
  const bayId = currentPosition.bayId || '02';
  const tierNum = currentPosition.tier || 3;
  const slotNum = currentPosition.slot || 2;

  // Local state initialized with prop or localStorage
  const [localImage, setLocalImage] = useState<string | null>(() => {
    if (propCustomImage) return propCustomImage;
    try {
      return localStorage.getItem('sunhouse_rack_guide_custom_image') || null;
    } catch {
      return null;
    }
  });

  const [localFit, setLocalFit] = useState<'contain' | 'cover'>(propImageFit);
  const [isDragging, setIsDragging] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [showLocationBanner, setShowLocationBanner] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propCustomImage !== undefined) {
      setLocalImage(propCustomImage || null);
    }
  }, [propCustomImage]);

  useEffect(() => {
    if (propImageFit) {
      setLocalFit(propImageFit);
    }
  }, [propImageFit]);

  // Handle image upload from file picker or drag-drop
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP, SVG...)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setLocalImage(dataUrl);
        try {
          localStorage.setItem('sunhouse_rack_guide_custom_image', dataUrl);
        } catch (err) {
          console.warn('LocalStorage save warning:', err);
        }
        onUpdateCustomImage?.(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveCustomImage = () => {
    setLocalImage(null);
    try {
      localStorage.removeItem('sunhouse_rack_guide_custom_image');
    } catch {}
    onUpdateCustomImage?.(null);
  };

  const handleToggleFit = () => {
    const nextFit = localFit === 'contain' ? 'cover' : 'contain';
    setLocalFit(nextFit);
    onUpdateImageFit?.(nextFit);
  };

  return (
    <div 
      id="rack-reading-guide-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full bg-white rounded-xl border-2 shadow-md overflow-hidden flex flex-col transition-all relative ${
        isDragging ? 'border-amber-500 ring-4 ring-amber-500/20' : 'border-slate-300'
      }`}
    >
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Dragging Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-amber-500/90 z-30 flex flex-col items-center justify-center text-white backdrop-blur-sm p-4 text-center">
          <Upload className="w-12 h-12 mb-2 animate-bounce" />
          <p className="text-base font-black uppercase">Thả file ảnh vào đây để tải lên</p>
          <p className="text-xs text-amber-100 mt-1">Hỗ trợ PNG, JPG, JPEG, WebP, SVG</p>
        </div>
      )}

      {/* 1. Header Title Badge & Actions */}
      <div className="bg-[#00695c] text-white px-3 py-1.5 flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
          <span>HƯỚNG DẪN CÁCH ĐỌC ĐỊA CHỈ TRÊN KỆ (CHUẨN 5S)</span>
        </span>

        <div className="flex items-center gap-1.5">
          {localImage ? (
            <>
              <button
                type="button"
                onClick={handleToggleFit}
                className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-all"
                title="Thay đổi cách căn chỉnh ảnh (Chứa toàn bộ / Lấp đầy)"
              >
                <Sliders className="w-3 h-3" />
                <span className="hidden sm:inline">{localFit === 'contain' ? 'Vừa khung' : 'Lấp đầy'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsZoomModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-all"
                title="Phóng to xem ảnh gốc"
              >
                <ZoomIn className="w-3 h-3" />
                <span className="hidden sm:inline">Phóng to</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow transition-all"
                title="Tải ảnh khác lên thay thế"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đổi ảnh</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveCustomImage}
                className="bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-all"
                title="Khôi phục về sơ đồ vector chuẩn 5S"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow transition-transform hover:scale-105"
                title="Tải ảnh sơ đồ kệ của bạn lên đây"
              >
                <Upload className="w-3 h-3" />
                <span>Tải ảnh lên</span>
              </button>
              <span className="bg-white/20 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded hidden sm:inline">
                SƠ ĐỒ 5S
              </span>
            </>
          )}
        </div>
      </div>

      <div className="p-2.5 sm:p-3 flex flex-col gap-2.5 bg-slate-50/50">
        
        {/* 2. Top Location Code Breakdown Banner (Pixel-perfect matching 5S standard) */}
        {showLocationBanner && (
          <div className="bg-white p-2.5 rounded-lg border-2 border-slate-900 shadow-sm flex flex-col">
            {/* Header Category Names with vertical dashed line separators */}
            <div className="grid grid-cols-12 text-[9px] font-bold uppercase text-slate-800 pb-1 border-b border-slate-300 text-center tracking-tight">
              <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">Màu sắc</div>
              <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">Dãy kệ</div>
              <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">Khoang</div>
              <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">Tầng</div>
              <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">Vị trí</div>
              <div className="col-span-2 text-[8px]">Mã Vạch / Hướng</div>
            </div>

            {/* Value Row with heavy display typography */}
            <div className="grid grid-cols-12 items-center text-center pt-1.5 font-sans">
              {/* 1. Màu Sắc (Green Box) */}
              <div className="col-span-2 flex justify-center items-center border-r border-dashed border-slate-300">
                <div 
                  className="w-7 h-10 rounded-sm shadow-sm border border-slate-700"
                  style={{ backgroundColor: '#15803d' }}
                  title="Màu sắc nhận diện dãy kệ / tầng"
                />
              </div>

              {/* 2. Dãy Kệ (A) */}
              <div className="col-span-2 font-black text-3xl sm:text-4xl text-slate-950 border-r border-dashed border-slate-300 font-sans tracking-tight">
                {rackId}
              </div>

              {/* 3. Khoang (02) with leading hyphen */}
              <div className="col-span-2 font-black text-3xl sm:text-4xl text-slate-950 border-r border-dashed border-slate-300 font-sans tracking-tight flex items-center justify-center">
                <span className="text-2xl mr-0.5 text-slate-400 font-light">-</span>
                <span>{bayId}</span>
              </div>

              {/* 4. Tầng (3) with leading hyphen */}
              <div className="col-span-2 font-black text-3xl sm:text-4xl text-slate-950 border-r border-dashed border-slate-300 font-sans tracking-tight flex items-center justify-center">
                <span className="text-2xl mr-0.5 text-slate-400 font-light">-</span>
                <span>{tierNum}</span>
              </div>

              {/* 5. Vị Trí (2) */}
              <div className="col-span-2 font-black text-3xl sm:text-4xl text-slate-950 border-r border-dashed border-slate-300 font-sans tracking-tight">
                {slotNum}
              </div>

              {/* 6. Arrow & Realistic Barcode */}
              <div className="col-span-2 flex items-center justify-center gap-1.5 pl-1">
                <span className="text-3xl font-black text-slate-950">↑</span>
                {/* High-density barcode graphic */}
                <div className="flex items-center h-10 gap-[1.5px] bg-white p-0.5">
                  {[3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2].map((w, i) => (
                    <div 
                      key={`barcode-${i}`} 
                      className="bg-slate-950 h-full"
                      style={{ width: `${w * 1.2}px` }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MAIN DISPLAY AREA: EITHER CUSTOM UPLOADED IMAGE OR DEFAULT 3D SVG */}
        {localImage ? (
          /* Custom Uploaded Image View */
          <div className="relative group bg-slate-950 rounded-lg border-2 border-slate-300 overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[220px]">
            <img 
              src={localImage} 
              alt="Hướng dẫn cách đọc địa chỉ trên kệ" 
              className={`w-full max-h-[360px] cursor-pointer transition-all duration-300 ${
                localFit === 'contain' ? 'object-contain' : 'object-cover'
              }`}
              onClick={() => setIsZoomModalOpen(true)}
            />

            {/* Floating Action Overlay on Hover */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomModalOpen(true);
                }}
                className="pointer-events-auto bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg border border-slate-700 hover:bg-slate-800"
              >
                <ZoomIn className="w-4 h-4 text-cyan-400" />
                <span>Xem kích thước lớn</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="pointer-events-auto bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-lg hover:bg-amber-400"
              >
                <Upload className="w-4 h-4" />
                <span>Thay ảnh</span>
              </button>
            </div>

            {/* Bottom mini status badge */}
            <div className="absolute bottom-2 right-2 pointer-events-none bg-slate-900/80 backdrop-blur-sm text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700">
              Ảnh tùy chỉnh • Nhấn để phóng to
            </div>
          </div>
        ) : (
          /* Default Ultra-realistic 3D Isometric Illustration */
          <div className="relative bg-gradient-to-b from-slate-50 to-slate-200 rounded-lg p-2 border-2 border-slate-300 overflow-hidden shadow-inner flex flex-col items-center">
            
            <svg 
              viewBox="0 0 580 340" 
              className="w-full h-auto max-h-72" 
              style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.12))' }}
            >
              <defs>
                {/* High-definition Kraft box gradients */}
                <linearGradient id="kraftBoxFront" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d5a570" />
                  <stop offset="100%" stopColor="#aa7b49" />
                </linearGradient>
                <linearGradient id="kraftBoxSide" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f0c696" />
                  <stop offset="100%" stopColor="#c8965d" />
                </linearGradient>
                <linearGradient id="kraftBoxTop" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                {/* Blue Rack Upright Gradients */}
                <linearGradient id="uprightBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1d4ed8" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
                {/* Orange Beam Gradients */}
                <linearGradient id="beamOrange" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
              </defs>

              {/* 3 Large Rack Groups */}
              {/* GROUP 1: DÃY AB (Left Front) */}
              <g transform="translate(0, 0)">
                {/* Upright Posts (Blue columns) */}
                <rect x="120" y="40" width="12" height="230" fill="url(#uprightBlue)" rx="2" />
                <rect x="160" y="50" width="10" height="210" fill="url(#uprightBlue)" rx="2" opacity="0.8" />
                
                {/* Cross bracings */}
                <path d="M126 50 L165 90 M126 90 L165 130 M126 130 L165 170 M126 170 L165 210 M126 210 L165 250" stroke="#94a3b8" strokeWidth="2.5" />
                <path d="M165 50 L126 90 M165 90 L126 130 M165 130 L126 170 M165 170 L126 210 M165 210 L126 250" stroke="#94a3b8" strokeWidth="2.5" />

                {/* Orange Beams for Tiers 1-6 */}
                {[240, 205, 170, 135, 100, 65].map((y, idx) => (
                  <path key={`g1-beam-${idx}`} d={`M20 ${y} L130 ${y - 12} L170 ${y - 8}`} stroke="url(#beamOrange)" strokeWidth="6" strokeLinecap="round" />
                ))}

                {/* Stacked Kraft Boxes */}
                {[
                  { x: 30, y: 220, w: 42, h: 28 },
                  { x: 30, y: 185, w: 42, h: 28 },
                  { x: 30, y: 150, w: 42, h: 28 },
                  { x: 30, y: 115, w: 42, h: 28 },
                  { x: 30, y: 80,  w: 42, h: 28 },
                  { x: 30, y: 45,  w: 42, h: 28 },
                  { x: 74, y: 215, w: 42, h: 28 },
                  { x: 74, y: 180, w: 42, h: 28 },
                  { x: 74, y: 145, w: 42, h: 28 },
                  { x: 74, y: 110, w: 42, h: 28 },
                  { x: 74, y: 75,  w: 42, h: 28 },
                  { x: 74, y: 40,  w: 42, h: 28 },
                ].map((b, i) => (
                  <g key={`box-1-${i}`} transform={`translate(${b.x}, ${b.y})`}>
                    {/* Front Face */}
                    <path d={`M0 0 L${b.w} -4 L${b.w} ${b.h} L0 ${b.h + 4} Z`} fill="url(#kraftBoxFront)" stroke="#78350f" strokeWidth="0.8" />
                    {/* Top Face */}
                    <path d={`M0 0 L10 -8 L${b.w + 10} -12 L${b.w} -4 Z`} fill="url(#kraftBoxSide)" stroke="#78350f" strokeWidth="0.8" />
                    {/* Right Face */}
                    <path d={`M${b.w} -4 L${b.w + 10} -12 L${b.w + 10} ${b.h - 8} L${b.w} ${b.h} Z`} fill="#92400e" stroke="#78350f" strokeWidth="0.8" />
                  </g>
                ))}

                {/* Overhead Rack Signboard: Dãy AB */}
                <g transform="translate(118, 25)">
                  <rect x="0" y="0" width="56" height="24" rx="4" fill="#ffffff" stroke="#1e293b" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
                  <text x="28" y="16" fill="#0f172a" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">Dãy AB</text>
                </g>

                {/* Level Number Badges (1..6) */}
                {[
                  { lvl: '1', color: '#eab308', y: 242 },
                  { lvl: '2', color: '#2563eb', y: 207 },
                  { lvl: '3', color: '#dc2626', y: 172 },
                  { lvl: '4', color: '#16a34a', y: 137 },
                  { lvl: '5', color: '#0f172a', y: 102 },
                  { lvl: '6', color: '#c026d3', y: 67 },
                ].map((b, idx) => (
                  <g key={`badge-ab-${idx}`} transform={`translate(122, ${b.y})`}>
                    <rect x="0" y="0" width="18" height="18" rx="4" fill={b.color} stroke="#ffffff" strokeWidth="1.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
                    <text x="9" y="13" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">{b.lvl}</text>
                  </g>
                ))}
              </g>

              {/* GROUP 2: DÃY CD (Middle) */}
              <g transform="translate(130, 20)">
                {/* Upright Posts (Blue columns) */}
                <rect x="120" y="40" width="12" height="230" fill="url(#uprightBlue)" rx="2" />
                <rect x="160" y="50" width="10" height="210" fill="url(#uprightBlue)" rx="2" opacity="0.8" />
                
                {/* Cross bracings */}
                <path d="M126 50 L165 90 M126 90 L165 130 M126 130 L165 170 M126 170 L165 210 M126 210 L165 250" stroke="#94a3b8" strokeWidth="2.5" />
                <path d="M165 50 L126 90 M165 90 L126 130 M165 130 L126 170 M165 170 L126 210 M165 210 L126 250" stroke="#94a3b8" strokeWidth="2.5" />

                {/* Orange Beams */}
                {[240, 205, 170, 135, 100, 65].map((y, idx) => (
                  <path key={`g2-beam-${idx}`} d={`M20 ${y} L130 ${y - 12} L170 ${y - 8}`} stroke="url(#beamOrange)" strokeWidth="6" strokeLinecap="round" />
                ))}

                {/* Stacked Kraft Boxes */}
                {[
                  { x: 30, y: 220, w: 42, h: 28 },
                  { x: 30, y: 185, w: 42, h: 28 },
                  { x: 30, y: 150, w: 42, h: 28 },
                  { x: 30, y: 115, w: 42, h: 28 },
                  { x: 30, y: 80,  w: 42, h: 28 },
                  { x: 30, y: 45,  w: 42, h: 28 },
                  { x: 74, y: 215, w: 42, h: 28 },
                  { x: 74, y: 180, w: 42, h: 28 },
                  { x: 74, y: 145, w: 42, h: 28 },
                  { x: 74, y: 110, w: 42, h: 28 },
                  { x: 74, y: 75,  w: 42, h: 28 },
                  { x: 74, y: 40,  w: 42, h: 28 },
                ].map((b, i) => (
                  <g key={`box-2-${i}`} transform={`translate(${b.x}, ${b.y})`}>
                    <path d={`M0 0 L${b.w} -4 L${b.w} ${b.h} L0 ${b.h + 4} Z`} fill="url(#kraftBoxFront)" stroke="#78350f" strokeWidth="0.8" />
                    <path d={`M0 0 L10 -8 L${b.w + 10} -12 L${b.w} -4 Z`} fill="url(#kraftBoxSide)" stroke="#78350f" strokeWidth="0.8" />
                    <path d={`M${b.w} -4 L${b.w + 10} -12 L${b.w + 10} ${b.h - 8} L${b.w} ${b.h} Z`} fill="#92400e" stroke="#78350f" strokeWidth="0.8" />
                  </g>
                ))}

                {/* Overhead Rack Signboard: Dãy CD */}
                <g transform="translate(118, 25)">
                  <rect x="0" y="0" width="56" height="24" rx="4" fill="#ffffff" stroke="#1e293b" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
                  <text x="28" y="16" fill="#0f172a" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">Dãy CD</text>
                </g>

                {/* Level Number Badges (1..6) */}
                {[
                  { lvl: '1', color: '#eab308', y: 242 },
                  { lvl: '2', color: '#2563eb', y: 207 },
                  { lvl: '3', color: '#dc2626', y: 172 },
                  { lvl: '4', color: '#16a34a', y: 137 },
                  { lvl: '5', color: '#0f172a', y: 102 },
                  { lvl: '6', color: '#c026d3', y: 67 },
                ].map((b, idx) => (
                  <g key={`badge-cd-${idx}`} transform={`translate(122, ${b.y})`}>
                    <rect x="0" y="0" width="18" height="18" rx="4" fill={b.color} stroke="#ffffff" strokeWidth="1.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
                    <text x="9" y="13" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">{b.lvl}</text>
                  </g>
                ))}
              </g>

              {/* GROUP 3: DÃY EF (Right) */}
              <g transform="translate(260, 40)">
                {/* Upright Posts */}
                <rect x="120" y="40" width="12" height="230" fill="url(#uprightBlue)" rx="2" />
                <rect x="160" y="50" width="10" height="210" fill="url(#uprightBlue)" rx="2" opacity="0.8" />
                
                {/* Cross bracings */}
                <path d="M126 50 L165 90 M126 90 L165 130 M126 130 L165 170 M126 170 L165 210 M126 210 L165 250" stroke="#94a3b8" strokeWidth="2.5" />
                <path d="M165 50 L126 90 M165 90 L126 130 M165 130 L126 170 M165 170 L126 210 M165 210 L126 250" stroke="#94a3b8" strokeWidth="2.5" />

                {/* Orange Beams */}
                {[240, 205, 170, 135, 100, 65].map((y, idx) => (
                  <path key={`g3-beam-${idx}`} d={`M20 ${y} L130 ${y - 12} L170 ${y - 8}`} stroke="url(#beamOrange)" strokeWidth="6" strokeLinecap="round" />
                ))}

                {/* Stacked Kraft Boxes */}
                {[
                  { x: 30, y: 220, w: 42, h: 28 },
                  { x: 30, y: 185, w: 42, h: 28 },
                  { x: 30, y: 150, w: 42, h: 28 },
                  { x: 30, y: 115, w: 42, h: 28 },
                  { x: 30, y: 80,  w: 42, h: 28 },
                  { x: 30, y: 45,  w: 42, h: 28 },
                  { x: 74, y: 215, w: 42, h: 28 },
                  { x: 74, y: 180, w: 42, h: 28 },
                  { x: 74, y: 145, w: 42, h: 28 },
                  { x: 74, y: 110, w: 42, h: 28 },
                  { x: 74, y: 75,  w: 42, h: 28 },
                  { x: 74, y: 40,  w: 42, h: 28 },
                ].map((b, i) => (
                  <g key={`box-3-${i}`} transform={`translate(${b.x}, ${b.y})`}>
                    <path d={`M0 0 L${b.w} -4 L${b.w} ${b.h} L0 ${b.h + 4} Z`} fill="url(#kraftBoxFront)" stroke="#78350f" strokeWidth="0.8" />
                    <path d={`M0 0 L10 -8 L${b.w + 10} -12 L${b.w} -4 Z`} fill="url(#kraftBoxSide)" stroke="#78350f" strokeWidth="0.8" />
                    <path d={`M${b.w} -4 L${b.w + 10} -12 L${b.w + 10} ${b.h - 8} L${b.w} ${b.h} Z`} fill="#92400e" stroke="#78350f" strokeWidth="0.8" />
                  </g>
                ))}

                {/* Overhead Rack Signboard: Dãy EF */}
                <g transform="translate(118, 25)">
                  <rect x="0" y="0" width="56" height="24" rx="4" fill="#ffffff" stroke="#1e293b" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
                  <text x="28" y="16" fill="#0f172a" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">Dãy EF</text>
                </g>

                {/* Letter Tags (A, B, C, D, E, F) beside Level Numbers */}
                {[
                  { let: 'A', num: '1', color: '#eab308', y: 242 },
                  { let: 'B', num: '2', color: '#2563eb', y: 207 },
                  { let: 'C', num: '3', color: '#dc2626', y: 172 },
                  { let: 'D', num: '4', color: '#16a34a', y: 137 },
                  { let: 'E', num: '5', color: '#0f172a', y: 102 },
                  { let: 'F', num: '6', color: '#c026d3', y: 67 },
                ].map((b, idx) => (
                  <g key={`badge-ef-${idx}`} transform={`translate(100, ${b.y})`}>
                    <text x="12" y="14" fill="#0f172a" fontSize="11" fontWeight="900" textAnchor="middle">{b.let}</text>
                    <g transform="translate(22, 0)">
                      <rect x="0" y="0" width="18" height="18" rx="4" fill={b.color} stroke="#ffffff" strokeWidth="1.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
                      <text x="9" y="13" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">{b.num}</text>
                    </g>
                  </g>
                ))}
              </g>

              {/* Bottom Ground Bay Numbers & Angled Guideline: 03 / 02 / 01 */}
              <g transform="translate(40, 275)">
                {/* 3D Isometric Projection Line */}
                <line x1="0" y1="40" x2="200" y2="10" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
                <text x="18" y="24" fill="#94a3b8" fontSize="22" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">03</text>
                <text x="48" y="24" fill="#cbd5e1" fontSize="22" fontWeight="400" fontFamily="sans-serif">/</text>
                <text x="64" y="24" fill="#64748b" fontSize="26" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">02</text>
                <text x="98" y="24" fill="#cbd5e1" fontSize="22" fontWeight="400" fontFamily="sans-serif">/</text>
                <text x="114" y="18" fill="#0f172a" fontSize="30" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">01</text>
              </g>

              {/* Target Location Bracket Pointer (Connecting Location Code to Pallet) */}
              <g transform="translate(10, 0)">
                <line x1="88" y1="0" x2="88" y2="185" stroke="#0f172a" strokeWidth="2.5" />
                <rect x="74" y="185" width="28" height="7" fill="none" stroke="#0f172a" strokeWidth="2.5" />
              </g>
            </svg>

            {/* Quick Upload Banner for easy discovery */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-2 py-2 px-3 bg-white hover:bg-amber-50 border border-dashed border-amber-400 rounded-lg flex items-center justify-between cursor-pointer transition-all text-slate-700 hover:text-slate-950"
            >
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <Upload className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Tải ảnh chụp sơ đồ thực tế lên thay thế (Kéo thả hoặc click vào đây)</span>
              </div>
              <span className="text-[10px] text-amber-600 font-extrabold bg-amber-100 px-2 py-0.5 rounded">
                Chọn tệp ảnh
              </span>
            </div>
          </div>
        )}

        {/* 4. Legend Guide Explanation (Quy chuẩn 5 thành phần) */}
        <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-300 flex flex-col gap-1 text-[10px] text-slate-700 font-sans leading-tight">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-700 flex-shrink-0" />
              <span><strong>Màu sắc / Dãy Kệ:</strong> Quy chuẩn nhận diện màu và ký hiệu dãy (A, B, C...)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-900 flex-shrink-0" />
              <span><strong>Khoang (Bay):</strong> 01, 02, 03... từ đầu đến cuối dãy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-red-600 flex-shrink-0" />
              <span><strong>Tầng (Tier/Level):</strong> Đánh số 1..6 hoặc ký hiệu A, B, C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-600 flex-shrink-0" />
              <span><strong>Vị trí (Position):</strong> Ô chứa kiện hàng (1, 2...) trên mỗi tầng</span>
            </div>
          </div>
        </div>

      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isZoomModalOpen && localImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 p-3 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <FileImage className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm uppercase">Sơ Đồ Hướng Dẫn Đọc Địa Chỉ Trên Kệ</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFit}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700"
                >
                  {localFit === 'contain' ? 'Đổi sang Lấp đầy' : 'Đổi sang Vừa khung'}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1 rounded-lg shadow"
                >
                  Thay ảnh khác
                </button>
                <button
                  onClick={() => setIsZoomModalOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-2 min-h-[300px]">
              <img 
                src={localImage} 
                alt="Sơ đồ hướng dẫn phóng to" 
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
