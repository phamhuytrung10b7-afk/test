import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  Download, 
  QrCode, 
  Sliders, 
  Check, 
  Layers, 
  Sparkles, 
  FileText, 
  Image as ImageIcon,
  Copy,
  ChevronRight,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface QRCardItem {
  id: string;
  rackId: string;
  bay: string;
  tier: number;
  slot: number;
  slotLabel: string;
  fullLocationCode: string;
  qrPayload: string;
  qrDataUrl?: string;
  isHighTier: boolean;
}

interface HighTierQRCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rackId: string;
  tierCount: number; // 3 or 4
  bayNumbers: string[]; // e.g. ['01','02','03','04','05'] or ['01','02','03']
  itemsPerBay: number; // 2 or 3
  customSlotLabels: { [key: string]: string };
  companyName?: string;
  branchName?: string;
}

export const HighTierQRCardModal: React.FC<HighTierQRCardModalProps> = ({
  isOpen,
  onClose,
  rackId,
  tierCount,
  bayNumbers,
  itemsPerBay,
  customSlotLabels,
  companyName = 'CÔNG TY SẢN XUẤT ĐỒ GIA DỤNG SUNHOUSE',
  branchName = 'CHI NHÁNH BÌNH DƯƠNG'
}) => {
  // Modal customization states
  const [editableCompanyName, setEditableCompanyName] = useState<string>(companyName);
  const [editableBranchName, setEditableBranchName] = useState<string>(branchName);
  const [bottomNote, setBottomNote] = useState<string>('MÃ SCAN TỰ ĐỘNG  -  KHO HÀNG');
  
  // Layout mode for printing on A4 Landscape
  // '4_per_page' (2x2 grid ~ 45x45mm QR), '2_per_page' (2 cards ~ 55x55mm QR), '1_per_page' (Large ~ 100x100mm QR)
  const [layoutMode, setLayoutMode] = useState<'4_per_page' | '2_per_page' | '1_per_page'>('4_per_page');
  
  // QR Payload format: 'slot_code' (e.g. C05) or 'full_code' (e.g. A-01-3-1)
  const [qrFormat, setQrFormat] = useState<'slot_code' | 'full_code'>('slot_code');

  // Filter tiers: 'high_tiers_only' (Tier 3 for 3T, Tier 3&4 for 4T), or 'all_tiers', or custom selected tiers
  const defaultSelectedTiers = tierCount === 4 ? [4, 3] : [3];
  const [selectedTiers, setSelectedTiers] = useState<number[]>(defaultSelectedTiers);

  // Cards state with generated QR data URLs
  const [cards, setCards] = useState<QRCardItem[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Print container ref
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Reset selected tiers when tierCount changes
  useEffect(() => {
    setSelectedTiers(tierCount === 4 ? [4, 3] : [3]);
  }, [tierCount, rackId]);

  // Helper to compute default slot label
  const getDefaultSlotLabel = (bay: string, tier: number, slot: number): string => {
    const key = `${rackId}-${bay}-${tier}-${slot}`;
    if (customSlotLabels && customSlotLabels[key]) {
      return customSlotLabels[key];
    }
    const bIdx = Math.max(0, bayNumbers.indexOf(bay));
    const seq = bIdx * (tierCount * itemsPerBay) + (tier - 1) * itemsPerBay + slot;
    return `C${seq < 10 ? '0' + seq : seq}`;
  };

  // Build card list and generate QR codes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGenerating(true);

    const generateAllCards = async () => {
      const itemsList: QRCardItem[] = [];

      // Sort tiers descending (e.g. Tier 4 then Tier 3) or ascending based on selectedTiers
      const sortedTiers = [...selectedTiers].sort((a, b) => b - a);

      for (const t of sortedTiers) {
        for (const b of bayNumbers) {
          for (let s = 1; s <= itemsPerBay; s++) {
            const slotLabel = getDefaultSlotLabel(b, t, s);
            const fullLocationCode = `${rackId}-${b}-${t}-${s}`;
            const qrPayload = qrFormat === 'slot_code' ? slotLabel : fullLocationCode;
            const isHighTier = tierCount === 4 ? (t === 4 || t === 3) : (t === 3);

            try {
              const qrDataUrl = await QRCode.toDataURL(qrPayload, {
                width: 320,
                margin: 1,
                errorCorrectionLevel: 'M',
                color: {
                  dark: '#000000',
                  light: '#ffffff',
                },
              });

              itemsList.push({
                id: `${rackId}-${b}-${t}-${s}`,
                rackId,
                bay: b,
                tier: t,
                slot: s,
                slotLabel,
                fullLocationCode,
                qrPayload,
                qrDataUrl,
                isHighTier
              });
            } catch (err) {
              console.error('Error generating QR code:', err);
              itemsList.push({
                id: `${rackId}-${b}-${t}-${s}`,
                rackId,
                bay: b,
                tier: t,
                slot: s,
                slotLabel,
                fullLocationCode,
                qrPayload,
                isHighTier
              });
            }
          }
        }
      }

      if (isMounted) {
        setCards(itemsList);
        setIsGenerating(false);
      }
    };

    generateAllCards();

    return () => {
      isMounted = false;
    };
  }, [isOpen, rackId, tierCount, bayNumbers, itemsPerBay, customSlotLabels, selectedTiers, qrFormat]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle tier selection
  const handleToggleTier = (t: number) => {
    if (selectedTiers.includes(t)) {
      if (selectedTiers.length > 1) {
        setSelectedTiers(selectedTiers.filter(item => item !== t));
      }
    } else {
      setSelectedTiers([...selectedTiers, t]);
    }
  };

  // Direct Browser Print
  const handleDirectPrint = () => {
    window.print();
  };

  // Export High-Res PDF using jsPDF + html2canvas
  const handleExportPDF = async () => {
    if (!printContainerRef.current) return;
    setIsExportingPdf(true);

    try {
      const element = printContainerRef.current;
      
      // Target landscape A4 in mm: 297 x 210
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Find all page elements with class 'qr-a4-page'
      const pageElements = element.querySelectorAll<HTMLElement>('.qr-a4-page');

      if (pageElements.length === 0) {
        // Fallback: capture whole element
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 5, 5, 287, 200);
      } else {
        for (let i = 0; i < pageElements.length; i++) {
          if (i > 0) pdf.addPage('a4', 'landscape');
          const pageEl = pageElements[i];
          const canvas = await html2canvas(pageEl, {
            scale: 2.5,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
          });
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 5, 5, 287, 200, undefined, 'FAST');
        }
      }

      pdf.save(`Ma_QR_Tang_Cao_Ke_${rackId}_${tierCount}T_${new Date().toISOString().slice(0,10)}.pdf`);
      showToast(`🎉 Đã xuất thành công file PDF Mã QR Kệ ${rackId}!`);
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Lỗi khi xuất PDF: ${err?.message || 'Vui lòng thử in trực tiếp'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Single card download as PNG
  const handleDownloadSingleCard = async (card: QRCardItem) => {
    const cardEl = document.getElementById(`qr-card-${card.id}`);
    if (!cardEl) return;

    try {
      const canvas = await html2canvas(cardEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `QR_The_Ke_${card.rackId}_${card.slotLabel}_Khoang_${card.bay}_Tang_${card.tier}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast(`✅ Đã tải ảnh thẻ ${card.slotLabel}!`);
    } catch (err) {
      console.error(err);
      showToast('❌ Lỗi khi tải ảnh thẻ');
    }
  };

  // Chunk cards into pages based on layoutMode
  const itemsPerPage = layoutMode === '4_per_page' ? 4 : layoutMode === '2_per_page' ? 2 : 1;
  const chunkedPages: QRCardItem[][] = [];
  for (let i = 0; i < cards.length; i += itemsPerPage) {
    chunkedPages.push(cards.slice(i, i + itemsPerPage));
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* MODAL WRAPPER */}
      <div className="bg-white w-full max-w-[1450px] max-h-[96vh] rounded-3xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden text-slate-900">
        
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <span>MÃ QR QUÉT VỊ TRÍ TẦNG CAO — KỆ {rackId}</span>
                </h2>
                <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {tierCount === 4 ? 'TẦNG 3 & 4 (18 Ô)' : 'TẦNG 3 (10 Ô)'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Xuất thẻ mã QR khổ A4 ngang tiêu chuẩn (QR ≥ 40x40mm) để dán vị trí tầm thấp, hỗ trợ quét mã kho tầng cao nhanh chóng.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDirectPrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              title="In trực tiếp ra máy in khổ A4 ngang"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>In Trực Tiếp (A4)</span>
            </button>

            <button
              type="button"
              disabled={isExportingPdf || isGenerating}
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md border border-emerald-400/40 active:scale-95 disabled:opacity-50"
              title="Xuất file PDF chất lượng cao khổ A4 ngang"
            >
              {isExportingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-yellow-300" />
              )}
              <span>{isExportingPdf ? 'Đang xuất PDF...' : 'Xuất File PDF (A4 Ngang)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOOLBAR CONTROLS & SETTINGS */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          
          {/* Left: Tiers Selection & Layout Selection */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Tier Filter Pills */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs">
              <span className="text-slate-600 text-[11px] font-bold uppercase mr-1">CHỌN TẦNG XUẤT:</span>
              {Array.from({ length: tierCount }, (_, idx) => tierCount - idx).map(t => {
                const isSelected = selectedTiers.includes(t);
                const isHigh = tierCount === 4 ? (t === 4 || t === 3) : (t === 3);
                return (
                  <button
                    key={`tier-filter-${t}`}
                    type="button"
                    onClick={() => handleToggleTier(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? isHigh 
                          ? 'bg-amber-600 text-white shadow-xs font-black' 
                          : 'bg-indigo-600 text-white shadow-xs font-black'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>Tầng {t} {isHigh && '⭐'}</span>
                  </button>
                );
              })}
            </div>

            {/* Layout Mode (A4 Grid) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-xs">
              <span className="text-slate-600 text-[11px] font-bold px-2 uppercase">BỐ CỤC IN A4:</span>
              <button
                type="button"
                onClick={() => setLayoutMode('4_per_page')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                  layoutMode === '4_per_page'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="4 Thẻ / 1 Trang A4 Ngang (QR ~45x45mm chuẩn dán thanh dầm)"
              >
                4 Thẻ / Trang (2x2)
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('2_per_page')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                  layoutMode === '2_per_page'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="2 Thẻ / 1 Trang A4 Ngang (QR ~55x55mm thẻ lớn)"
              >
                2 Thẻ / Trang
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('1_per_page')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                  layoutMode === '1_per_page'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="1 Thẻ To / 1 Trang A4 Ngang"
              >
                1 Thẻ / Trang (Khổ Đại)
              </button>
            </div>

            {/* QR Content Format */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-xs">
              <span className="text-slate-600 text-[11px] font-bold px-2 uppercase">DỮ LIỆU QR:</span>
              <button
                type="button"
                onClick={() => setQrFormat('slot_code')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                  qrFormat === 'slot_code'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Quét ra mã ô ngắn gọn (VD: C05, G05...)"
              >
                Mã Ô (VD: {cards[0]?.slotLabel || 'C05'})
              </button>
              <button
                type="button"
                onClick={() => setQrFormat('full_code')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                  qrFormat === 'full_code'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Quét ra mã đầy đủ (VD: A-01-3-1)"
              >
                Mã Đầy Đủ (VD: {rackId}-01-3-1)
              </button>
            </div>

          </div>

          {/* Right: Editable Company & Branch Name */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white px-2.5 py-1 rounded-xl border border-slate-300 gap-1.5">
              <span className="text-[11px] text-slate-500 font-bold">Cty:</span>
              <input
                type="text"
                value={editableCompanyName}
                onChange={(e) => setEditableCompanyName(e.target.value)}
                className="text-xs font-bold text-slate-800 border-b border-transparent focus:border-indigo-600 outline-none w-56"
                title="Sửa tên công ty in trên thẻ"
              />
            </div>

            <div className="flex items-center bg-white px-2.5 py-1 rounded-xl border border-slate-300 gap-1.5">
              <span className="text-[11px] text-slate-500 font-bold">Chi nhánh:</span>
              <input
                type="text"
                value={editableBranchName}
                onChange={(e) => setEditableBranchName(e.target.value)}
                className="text-xs font-bold text-slate-800 border-b border-transparent focus:border-indigo-600 outline-none w-36"
                title="Sửa tên chi nhánh in trên thẻ"
              />
            </div>
          </div>

        </div>

        {/* MAIN PREVIEW STAGE WITH PRINT CSS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/80 flex flex-col items-center gap-6">
          
          {/* Info Banner */}
          <div className="w-full max-w-[1150px] bg-indigo-50 border border-indigo-200 text-indigo-950 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Đang hiển thị <strong>{cards.length} thẻ mã QR</strong> (Khổ A4 ngang: <strong>{chunkedPages.length} trang in</strong>). Kích thước ô mã QR tiêu chuẩn ≥ <strong>45x45mm</strong> (đáp ứng tối thiểu 40x40mm) đảm bảo máy đọc barcode quét nhạy 100%!
              </span>
            </div>
            <span className="font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
              KỆ {rackId} • {tierCount} TẦNG • {bayNumbers.length} KHOANG
            </span>
          </div>

          {/* PRINT CONTAINER (Contains all A4 pages formatted for Print & PDF) */}
          <div ref={printContainerRef} className="w-full max-w-[1150px] flex flex-col gap-8">
            
            {chunkedPages.map((pageCards, pageIndex) => (
              <div
                key={`a4-page-${pageIndex}`}
                className="qr-a4-page bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-slate-300 w-full flex flex-col justify-between print:shadow-none print:border-none print:p-4 print:m-0 print:rounded-none"
                style={{
                  // A4 Landscape Aspect Ratio ~ 297mm / 210mm = 1.414
                  minHeight: '620px',
                  pageBreakAfter: 'always',
                  breakAfter: 'page'
                }}
              >
                {/* Page Title & Watermark in Preview (Hidden in Print) */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-dashed border-slate-200 print:hidden text-xs text-slate-500">
                  <span className="font-bold">TRANG {pageIndex + 1} / {chunkedPages.length} (KHỔ A4 NGANG)</span>
                  <span className="font-mono">KỆ {rackId} • BẢNG MÃ QR VỊ TRÍ TẦNG CAO</span>
                </div>

                {/* Card Grid based on layoutMode */}
                <div className={`grid gap-5 flex-1 items-center justify-center ${
                  layoutMode === '4_per_page'
                    ? 'grid-cols-1 sm:grid-cols-2 grid-rows-2'
                    : layoutMode === '2_per_page'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1'
                }`}>
                  {pageCards.map((card) => (
                    <div
                      key={card.id}
                      id={`qr-card-${card.id}`}
                      className="qr-card-item bg-white border-[2.5px] border-slate-900 rounded-[28px] p-4 sm:p-5 flex flex-col justify-between shadow-md relative group transition-transform hover:scale-[1.01]"
                      style={{
                        minHeight: layoutMode === '1_per_page' ? '480px' : layoutMode === '2_per_page' ? '320px' : '230px'
                      }}
                    >
                      {/* Download button on hover (preview mode) */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-10">
                        <button
                          type="button"
                          onClick={() => handleDownloadSingleCard(card)}
                          className="bg-slate-900/90 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-md cursor-pointer"
                          title="Tải ảnh thẻ này (PNG)"
                        >
                          <Download className="w-3 h-3 text-cyan-300" />
                          <span>Tải PNG</span>
                        </button>
                      </div>

                      {/* TOP SECTION: COMPANY LOGO & NAME */}
                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b-2 border-slate-900">
                        {/* Sunhouse Red Badge Logo Pill */}
                        <div className="shrink-0">
                          <div className="bg-[#dc2626] text-white px-3 py-1 rounded-full flex flex-col items-center justify-center shadow-xs border border-red-700">
                            <span className="font-black text-[11px] sm:text-xs tracking-wider leading-none">
                              SUNHOUSE
                            </span>
                            {/* Blue bottom arc accent */}
                            <span className="w-full h-[2px] bg-teal-300 rounded-full mt-0.5" />
                          </div>
                        </div>

                        {/* Company & Branch Text */}
                        <div className="flex-1 text-center flex flex-col items-center justify-center">
                          <h3 className="text-[11px] sm:text-xs font-black uppercase text-slate-900 tracking-tight leading-tight">
                            {editableCompanyName}
                          </h3>
                          <h4 className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-900 tracking-wider mt-0.5">
                            {editableBranchName}
                          </h4>
                        </div>
                      </div>

                      {/* MIDDLE SECTION: LOCATION INFO (LEFT) & QR CODE (RIGHT) */}
                      <div className="flex items-center justify-between gap-4 py-3 flex-1">
                        
                        {/* Left Column: Label & Hierarchy Details */}
                        <div className="flex flex-col justify-center flex-1 pl-1">
                          <span className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase">
                            VỊ TRÍ KỆ
                          </span>

                          <span className={`font-black text-slate-950 tracking-tighter leading-none my-1 font-mono ${
                            layoutMode === '1_per_page' 
                              ? 'text-7xl sm:text-8xl' 
                              : layoutMode === '2_per_page'
                              ? 'text-5xl sm:text-6xl'
                              : 'text-4xl sm:text-5xl'
                          }`}>
                            {card.slotLabel}
                          </span>

                          <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1 flex flex-wrap items-center gap-1">
                            <span>Khoang {card.bay}</span>
                            <span>-</span>
                            <span>Tầng {card.tier}</span>
                            <span>-</span>
                            <span>Vị trí {card.slot}</span>
                          </div>
                        </div>

                        {/* Right Column: Crisp QR Code (Min 40x40mm) */}
                        <div className="shrink-0 flex items-center justify-center pr-1">
                          {card.qrDataUrl ? (
                            <img
                              src={card.qrDataUrl}
                              alt={`QR Code ${card.slotLabel}`}
                              className="object-contain"
                              style={{
                                width: layoutMode === '1_per_page' ? '180px' : layoutMode === '2_per_page' ? '125px' : '95px',
                                height: layoutMode === '1_per_page' ? '180px' : layoutMode === '2_per_page' ? '125px' : '95px',
                                minWidth: '85px',
                                minHeight: '85px'
                              }}
                            />
                          ) : (
                            <div className="w-24 h-24 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-xs text-slate-400">
                              Đang tạo QR...
                            </div>
                          )}
                        </div>

                      </div>

                      {/* BOTTOM SECTION: SCAN NOTICE DIVIDER */}
                      <div className="pt-2 border-t-2 border-slate-900 text-center">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-900 block font-mono">
                          {bottomNote}
                        </span>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Page Footer in Print */}
                <div className="text-center pt-3 text-[10px] font-bold text-slate-400 hidden print:block">
                  HỆ THỐNG QUẢN LÝ KHO 5S • SUNHOUSE BÌNH DƯƠNG • KỆ {rackId} • TRANG {pageIndex + 1}/{chunkedPages.length}
                </div>

              </div>
            ))}

          </div>

        </div>

        {/* FOOTER BAR */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Đã nạp đầy đủ mã QR cho các ô tầng cao ({cards.map(c => c.slotLabel).slice(0, 6).join(', ')}...)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={isExportingPdf || isGenerating}
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md border border-emerald-400/40"
            >
              <Download className="w-4 h-4 text-yellow-300" />
              <span>Xuất PDF Trọn Bộ (A4 Ngang)</span>
            </button>
          </div>
        </div>

      </div>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border-2 border-teal-400 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up max-w-md">
          <Sparkles className="w-4 h-4 text-teal-300 shrink-0" />
          <div className="text-xs font-semibold leading-relaxed">
            {toastMessage}
          </div>
        </div>
      )}

    </div>
  );
};
