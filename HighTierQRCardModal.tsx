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
import { SunhouseLogo } from './SunhouseLogo';
import { safeHtml2Canvas } from './html2canvasSanitizer';

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
  // '10_per_page' (2x5 grid ~ 10 cards, QR 40x40mm), '20_per_page' (5x4 grid ~ 20 cards), '4_per_page' (2x2 grid), '2_per_page' (2 cards), '1_per_page' (Large)
  const [layoutMode, setLayoutMode] = useState<'20_per_page' | '10_per_page' | '4_per_page' | '2_per_page' | '1_per_page'>('10_per_page');
  
  // QR Payload format: 'slot_code' (e.g. C05) or 'full_code' (e.g. A-01-3-1)
  const [qrFormat, setQrFormat] = useState<'slot_code' | 'full_code'>('slot_code');

  // Filter tiers: default to all tiers ([4,3,2,1] for 4T or [3,2,1] for 3T)
  const defaultSelectedTiers = tierCount === 4 ? [4, 3, 2, 1] : [3, 2, 1];
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
    setSelectedTiers(tierCount === 4 ? [4, 3, 2, 1] : [3, 2, 1]);
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

      // Sort tiers ascending (from bottom to top: Tier 1 -> Tier 2 -> Tier 3 -> Tier 4)
      const sortedTiers = [...selectedTiers].sort((a, b) => a - b);

      // Order: Columns (bays) from left to right, and for each column from bottom to top
      for (const b of bayNumbers) {
        for (const t of sortedTiers) {
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
        const canvas = await safeHtml2Canvas(element, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1200,
        });
        const imgData = canvas.toDataURL('image/png');
        const canvasRatio = canvas.width / canvas.height;
        const pdfWidth = 297;
        const pdfHeight = 210;
        const margin = 4;
        const maxW = pdfWidth - margin * 2;
        const maxH = pdfHeight - margin * 2;
        let renderW = maxW;
        let renderH = renderW / canvasRatio;
        if (renderH > maxH) {
          renderH = maxH;
          renderW = renderH * canvasRatio;
        }
        const xOffset = (pdfWidth - renderW) / 2;
        const yOffset = (pdfHeight - renderH) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderW, renderH, undefined, 'FAST');
      } else {
        for (let i = 0; i < pageElements.length; i++) {
          if (i > 0) pdf.addPage('a4', 'landscape');
          const pageEl = pageElements[i];
          const canvas = await safeHtml2Canvas(pageEl, {
            scale: 2.5,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 1200,
          });
          const imgData = canvas.toDataURL('image/png');

          const canvasRatio = canvas.width / canvas.height;
          const pdfWidth = 297;
          const pdfHeight = 210;
          const margin = 4;
          const maxW = pdfWidth - margin * 2;
          const maxH = pdfHeight - margin * 2;

          let renderW = maxW;
          let renderH = renderW / canvasRatio;

          if (renderH > maxH) {
            renderH = maxH;
            renderW = renderH * canvasRatio;
          }

          const xOffset = (pdfWidth - renderW) / 2;
          const yOffset = (pdfHeight - renderH) / 2;

          pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderW, renderH, undefined, 'FAST');
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
      const canvas = await safeHtml2Canvas(cardEl, {
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
  const itemsPerPage = layoutMode === '20_per_page' ? 20 : layoutMode === '10_per_page' ? 10 : layoutMode === '4_per_page' ? 4 : layoutMode === '2_per_page' ? 2 : 1;
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
                  <span>MÃ QR TẤT CẢ VỊ TRÍ KỆ — KỆ {rackId}</span>
                </h2>
                <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {tierCount === 4 ? 'TẤT CẢ 4 TẦNG (36 Ô)' : 'TẤT CẢ 3 TẦNG (30 Ô)'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Xuất thẻ mã QR khổ A4 ngang tiêu chuẩn (QR ≥ 40x40mm) cho tất cả các vị trí khoang và tầng của kệ.
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
                onClick={() => setLayoutMode('20_per_page')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                  layoutMode === '20_per_page'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="20 Thẻ / 1 Trang A4 Ngang (5 cột x 4 hàng - Gọn đẹp chuẩn tỷ lệ)"
              >
                20 Thẻ / Trang (5x4)
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('10_per_page')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                  layoutMode === '10_per_page'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="10 Thẻ / 1 Trang A4 (2 cột x 5 hàng - Chuẩn QR 40x40mm dễ quét camera)"
              >
                10 Thẻ / Trang (2x5 - Chuẩn 40x40mm)
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('4_per_page')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                  layoutMode === '4_per_page'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="4 Thẻ / 1 Trang A4 Ngang (2 cột x 2 hàng)"
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
                title="2 Thẻ / 1 Trang A4 Ngang"
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
                1 Thẻ / Trang
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
                  <span className="font-mono">KỆ {rackId} • BẢNG MÃ QR TẤT CẢ VỊ TRÍ KỆ</span>
                </div>

                {/* Card Grid based on layoutMode */}
                <div className={`grid flex-1 items-center justify-center ${
                  layoutMode === '20_per_page'
                    ? 'grid-cols-5 grid-rows-4 gap-2 sm:gap-2.5'
                    : layoutMode === '10_per_page'
                    ? 'grid-cols-2 grid-rows-5 gap-3.5 sm:gap-4'
                    : layoutMode === '4_per_page'
                    ? 'grid-cols-1 sm:grid-cols-2 grid-rows-2 gap-4'
                    : layoutMode === '2_per_page'
                    ? 'grid-cols-1 sm:grid-cols-2 gap-4'
                    : 'grid-cols-1 gap-4'
                }`}>
                  {pageCards.map((card) => (
                    <div
                      key={card.id}
                      id={`qr-card-${card.id}`}
                      className={`qr-card-item bg-white border-[2px] border-slate-900 rounded-xl flex flex-col justify-between shadow-xs relative group transition-transform hover:scale-[1.01] ${
                        layoutMode === '20_per_page' 
                          ? 'p-1.5 sm:p-2' 
                          : layoutMode === '10_per_page' 
                          ? 'p-2.5 sm:p-3' 
                          : 'p-4 sm:p-5'
                      }`}
                      style={{
                        minHeight: layoutMode === '20_per_page' 
                          ? '122px' 
                          : layoutMode === '10_per_page' 
                          ? '112px' 
                          : layoutMode === '1_per_page' 
                          ? '480px' 
                          : layoutMode === '2_per_page' 
                          ? '320px' 
                          : '230px'
                      }}
                    >
                      {/* Download button on hover (preview mode) */}
                      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-10">
                        <button
                          type="button"
                          onClick={() => handleDownloadSingleCard(card)}
                          className="bg-slate-900/90 hover:bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md cursor-pointer"
                          title="Tải ảnh thẻ này (PNG)"
                        >
                          <Download className="w-3 h-3 text-cyan-300" />
                          <span>PNG</span>
                        </button>
                      </div>

                      {/* TOP SECTION: COMPANY LOGO & NAME */}
                      <div className={`flex items-center justify-between gap-1.5 border-b-2 border-slate-900 ${
                        layoutMode === '20_per_page' ? 'pb-0.5' : layoutMode === '10_per_page' ? 'pb-1' : 'pb-2'
                      }`}>
                        {/* Sunhouse Logo */}
                        <div className="shrink-0">
                          <SunhouseLogo className={
                            layoutMode === '20_per_page' ? 'h-3.5 w-auto' : 
                            layoutMode === '10_per_page' ? 'h-4 sm:h-4.5 w-auto' : 
                            'h-6 sm:h-7 w-auto'
                          } />
                        </div>

                        {/* Company & Branch Text */}
                        <div className="flex-1 text-center flex flex-col items-center justify-center min-w-0">
                          <h3 className={`font-black uppercase text-slate-900 tracking-tight leading-tight w-full ${
                            layoutMode === '20_per_page' ? 'text-[7.5px] sm:text-[8px]' : 
                            layoutMode === '10_per_page' ? 'text-[9.5px] sm:text-[10px]' : 
                            'text-[11px] sm:text-xs'
                          }`}>
                            {editableCompanyName}
                          </h3>
                          {layoutMode !== '20_per_page' && (
                            <h4 className={`font-bold uppercase text-slate-900 tracking-wider mt-0.5 ${
                              layoutMode === '10_per_page' ? 'text-[8.5px] sm:text-[9px]' : 'text-[10px] sm:text-[11px]'
                            }`}>
                              {editableBranchName}
                            </h4>
                          )}
                        </div>
                      </div>

                      {/* MIDDLE SECTION: LOCATION INFO (LEFT) & QR CODE (RIGHT) */}
                      <div className={`flex items-center justify-between gap-1.5 flex-1 ${
                        layoutMode === '20_per_page' ? 'py-0.5' : layoutMode === '10_per_page' ? 'py-1' : 'py-2.5'
                      }`}>
                        
                        {/* Left Column: Label & Hierarchy Details */}
                        <div className="flex flex-col justify-center flex-1 pl-0.5 min-w-0">
                          <span className={`font-black text-slate-900 tracking-wide uppercase ${
                            layoutMode === '20_per_page' ? 'text-[7.5px] sm:text-[8px]' : layoutMode === '10_per_page' ? 'text-[9.5px] sm:text-[10px]' : 'text-xs sm:text-sm'
                          }`}>
                            VỊ TRÍ KỆ
                          </span>

                          <span className={`font-black text-slate-950 tracking-tighter leading-none font-mono ${
                            layoutMode === '20_per_page'
                              ? 'text-2xl sm:text-3xl my-0.5'
                              : layoutMode === '10_per_page'
                              ? 'text-3xl sm:text-3.5xl my-0.5'
                              : layoutMode === '1_per_page' 
                              ? 'text-7xl sm:text-8xl my-1' 
                              : layoutMode === '2_per_page'
                              ? 'text-5xl sm:text-6xl my-1'
                              : 'text-4xl sm:text-5xl my-1'
                          }`}>
                            {card.slotLabel}
                          </span>

                          <div className={`font-bold text-slate-800 flex flex-wrap items-center gap-0.5 ${
                            layoutMode === '20_per_page' ? 'text-[7.5px] sm:text-[8px]' : layoutMode === '10_per_page' ? 'text-[9.5px] sm:text-[10px] mt-0.5 gap-0.5' : 'text-xs sm:text-sm mt-0.5 gap-1'
                          }`}>
                            <span>Khoang {card.bay}</span>
                            <span>-</span>
                            <span>Tầng {card.tier}</span>
                            <span>-</span>
                            <span>VT {card.slot}</span>
                          </div>
                        </div>

                        {/* Right Column: Crisp QR Code */}
                        <div className="shrink-0 flex items-center justify-center border border-slate-900/10 p-0.5 rounded-lg bg-white shadow-xs">
                          {card.qrDataUrl ? (
                            <img
                              src={card.qrDataUrl}
                              alt={`QR Code ${card.slotLabel}`}
                              className="object-contain"
                              style={{
                                width: layoutMode === '20_per_page' ? '52px' : layoutMode === '10_per_page' ? '88px' : layoutMode === '1_per_page' ? '180px' : layoutMode === '2_per_page' ? '125px' : '95px',
                                height: layoutMode === '20_per_page' ? '52px' : layoutMode === '10_per_page' ? '88px' : layoutMode === '1_per_page' ? '180px' : layoutMode === '2_per_page' ? '125px' : '95px',
                                minWidth: layoutMode === '20_per_page' ? '44px' : layoutMode === '10_per_page' ? '80px' : '70px',
                                minHeight: layoutMode === '20_per_page' ? '44px' : layoutMode === '10_per_page' ? '80px' : '70px'
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                              Đang tạo QR...
                            </div>
                          )}
                        </div>

                      </div>

                      {/* BOTTOM SECTION: SCAN NOTICE DIVIDER */}
                      <div className={`border-t-2 border-slate-900 text-center ${
                        layoutMode === '20_per_page' ? 'pt-0.5' : 'pt-1.5'
                      }`}>
                        <span className={`font-bold uppercase tracking-wider text-slate-900 block font-mono ${
                          layoutMode === '20_per_page' ? 'text-[7.5px] sm:text-[8px]' : 'text-[10px] sm:text-[11px]'
                        }`}>
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
