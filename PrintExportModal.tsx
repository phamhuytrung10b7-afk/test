import React, { useState, useRef, useEffect } from 'react';
import { BoardConfig, InventoryItem, SafetyRule, WarehousePosition, WarehouseRack } from './types';
import { X, Printer, Download, Layers, FileText, Compass, Box, Sparkles, RefreshCw, Upload, Trash2, Edit3, Save, Plus, RotateCcw, Image as ImageIcon, Check, ExternalLink, QrCode } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { IsometricRackSVG } from './IsometricRackSVG';
import { SunhouseLogo } from './SunhouseLogo';

interface CustomTableItem {
  id: string;
  location: string;
  code: string;
  name: string;
  quantity: string;
  spec: string;
}

interface PdfCustomData {
  pdf1: {
    title: string;
    subtitle: string;
    warehouseCode: string;
    companyLogoText: string;
    customImage: string | null;
  };
  pdf2: {
    title: string;
    subtitle: string;
    rackId: string;
    companyLogoText: string;
    bayNames: string[];
    matrixSlots: Record<string, { code: string; name: string; qty: string }>;
    customTableItems: CustomTableItem[];
  };
  pdf3: {
    title: string;
    subtitle: string;
    companyLogoText: string;
    customImage: string | null;
    rackLetter: string;
    bayNum: string;
    tierNum: string;
    posNum: string;
    colorHex: string;
  };
  pdf4: {
    title: string;
    subtitle: string;
    rackId: string;
    companyLogoText: string;
    customImage: string | null;
    bayNames: string[];
    tier3Label: string;
    tier2Label: string;
    tier1Label: string;
    floorNotice: string;
    matrixSlots: Record<string, { code: string; name: string; qty: string }>;
  };
}

const LOCAL_STORAGE_KEY = 'sunhouse_pdf_custom_data_v2';

interface PrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardConfig: BoardConfig;
  currentPosition: WarehousePosition;
  racks: WarehouseRack[];
  items: InventoryItem[];
  safetyRules: SafetyRule[];
  initialPdfTab?: 'pdf1' | 'pdf2' | 'pdf3' | 'pdf4' | 'pdf5';
  selectedRackId?: string | null;
  pdf4Config?: any;
}

export const PrintExportModal: React.FC<PrintExportModalProps> = ({
  isOpen,
  onClose,
  boardConfig,
  currentPosition,
  racks = [],
  items = [],
  safetyRules = [],
  initialPdfTab = 'pdf1',
  selectedRackId = 'C',
  pdf4Config,
}) => {
  const [activePdfTab, setActivePdfTab] = useState<'pdf1' | 'pdf2' | 'pdf3' | 'pdf4' | 'pdf5'>(initialPdfTab);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const activeRackId = selectedRackId || currentPosition.rackId || 'C';

  // Default PDF Custom Data
  const getDefaultPdfData = (): PdfCustomData => {
    const rackItems = items.filter(i => i.rackId === activeRackId);

    // Initial matrix slots from items
    const initialMatrixSlots: Record<string, { code: string; name: string; qty: string }> = {};
    [1, 2, 3, 4, 5].forEach((bNum) => {
      const bayStr = bNum.toString().padStart(2, '0');
      [1, 2, 3].forEach((tNum) => {
        [1, 2].forEach(pos => {
          const key = `${bayStr}-${tNum}-${pos}`;
          const matchItem = items.find(i => i.rackId === activeRackId && i.bayId === bayStr && i.tier === tNum && (i.slot === pos || (!i.slot && pos === 1)));
          if (matchItem) {
            initialMatrixSlots[key] = {
              code: matchItem.code || '',
              name: matchItem.name || '',
              qty: `${matchItem.quantity || ''} ${matchItem.unit || 'cái'}`,
            };
          } else {
            initialMatrixSlots[key] = { code: '', name: '', qty: '' };
          }
        });
      });
    });

    const initialPdf4Slots: Record<string, { code: string; name: string; qty: string }> = {};
    [1, 2, 3, 4, 5].forEach((bNum) => {
      const bayStr = bNum.toString().padStart(2, '0');
      [1, 2, 3].forEach((tNum) => {
        [1, 2].forEach(pos => {
          const key = `${bayStr}-${tNum}-${pos}`;
          const matchItem = items.find(i => i.rackId === activeRackId && i.bayId === bayStr && i.tier === tNum && (i.slot === pos || (!i.slot && pos === 1)));
          initialPdf4Slots[key] = {
            code: matchItem?.code || `${activeRackId}-${bayStr}-${tNum}-${pos}`,
            name: matchItem?.name || `Vị trí ${pos}`,
            qty: matchItem?.quantity ? `${matchItem.quantity} ${matchItem.unit || 'cái'}` : '',
          };
        });
      });
    });

    const initialTableItems: CustomTableItem[] = rackItems.length > 0 
      ? rackItems.map((item, idx) => ({
          id: item.id || `item-${idx}`,
          location: item.location || `${activeRackId}-${item.bayId || '01'}-${item.tier || 1}`,
          code: item.code || '',
          name: item.name || '',
          quantity: `${item.quantity || ''} ${item.unit || 'cái'}`,
          spec: item.spec || 'Hàng linh kiện tiêu chuẩn 5S',
        }))
      : [
          { id: '1', location: `${activeRackId}-01-3`, code: 'LK-SH-001', name: 'Mạch điện tử lò vi sóng', quantity: '500 cái', spec: 'Đóng thùng carton 5S' },
          { id: '2', location: `${activeRackId}-01-2`, code: 'LK-SH-002', name: 'Thân vỏ inox nồi cơm điện', quantity: '200 cái', spec: 'Xếp pallet gỗ' },
          { id: '3', location: `${activeRackId}-02-3`, code: 'LK-SH-003', name: 'Mặt kính bếp từ đôi', quantity: '150 cái', spec: 'Kèm đệm mút chống sốc' },
        ];

    return {
      pdf1: {
        title: 'SƠ ĐỒ VẬN HÀNH & TRA CỨU KHO',
        subtitle: 'HỆ THỐNG TRỰC QUAN HÓA & ĐỊNH VỊ Ô KỆ (VISUAL MANAGEMENT BOARD) • BÌNH DƯƠNG',
        warehouseCode: boardConfig.warehouseCode || 'BD-W01',
        companyLogoText: boardConfig.companyLogoText || 'SUNHOUSE',
        customImage: null,
      },
      pdf2: {
        title: `CHI TIẾT RACK: KỆ ${activeRackId} (DÃY ${activeRackId})`,
        subtitle: 'MA TRẬN PHÂN BỔ KHOANG & TẦNG (5 KHOANG x 3 TẦNG x 2 VỊ TRÍ = 30 Ô KỆ)',
        rackId: activeRackId,
        companyLogoText: boardConfig.companyLogoText || 'SUNHOUSE',
        bayNames: ['KHOANG 01', 'KHOANG 02', 'KHOANG 03', 'KHOANG 04', 'KHOANG 05'],
        matrixSlots: initialMatrixSlots,
        customTableItems: initialTableItems,
      },
      pdf3: {
        title: 'HƯỚNG DẪN CÁCH ĐỌC ĐỊA CHỈ TRÊN KỆ (CHUẨN 5S)',
        subtitle: 'NHÀ MÁY SUNHOUSE BÌNH DƯƠNG • QUY CHUẨN BẢNG NHẬN DIỆN THỊ GIÁC (VISUAL MANAGEMENT)',
        companyLogoText: boardConfig.companyLogoText || 'SUNHOUSE',
        customImage: null,
        rackLetter: activeRackId,
        bayNum: '02',
        tierNum: '3',
        posNum: '2',
        colorHex: '#047857',
      },
      pdf4: {
        title: `MÔ PHỎNG PHỐI CẢNH 3D KỆ ${activeRackId} — CAD ISOMETRIC`,
        subtitle: 'SƠ ĐỒ PHỐI CẢNH 3D CHI TIẾT KỆ HÀNG (5 KHOANG x 3 TẦNG x 2 VỊ TRÍ = 30 VỊ TRÍ)',
        rackId: activeRackId,
        companyLogoText: boardConfig.companyLogoText || 'SUNHOUSE',
        customImage: null,
        bayNames: ['KHOANG 01', 'KHOANG 02', 'KHOANG 03', 'KHOANG 04', 'KHOANG 05'],
        tier3Label: 'TẦNG 3 (Mức A - Cao)',
        tier2Label: 'TẦNG 2 (Mức B - Giữa)',
        tier1Label: 'TẦNG 1 (MẶT ĐẤT)',
        floorNotice: `⚠️ MẶT ĐẤT (TẦNG 1) — VẠCH SƠN AN TOÀN 5S KHO BÌNH DƯƠNG (KỆ ${activeRackId})`,
        matrixSlots: initialPdf4Slots,
      },
    };
  };

  // State to hold custom PDF editable data
  const [pdfData, setPdfData] = useState<PdfCustomData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const defaults = getDefaultPdfData();
        return {
          ...defaults,
          ...parsed,
          pdf2: {
            ...defaults.pdf2,
            ...(parsed.pdf2 || {}),
            matrixSlots: { ...defaults.pdf2.matrixSlots, ...(parsed.pdf2?.matrixSlots || {}) },
          },
          pdf4: {
            ...defaults.pdf4,
            ...(parsed.pdf4 || {}),
            matrixSlots: { ...defaults.pdf4.matrixSlots, ...(parsed.pdf4?.matrixSlots || {}) },
          },
        };
      }
    } catch (e) {
      console.error('Failed to parse saved PDF custom data:', e);
    }
    return getDefaultPdfData();
  });

  // Automatically save to localStorage on data changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pdfData));
    } catch (e) {
      console.error('Failed to save PDF custom data to localStorage:', e);
    }
  }, [pdfData]);

  if (!isOpen) return null;

  // Image Upload Handlers
  const handleImageUpload = (pdfKey: 'pdf1' | 'pdf3' | 'pdf4', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setPdfData((prev) => ({
        ...prev,
        [pdfKey]: {
          ...prev[pdfKey],
          customImage: base64Url,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = (pdfKey: 'pdf1' | 'pdf3' | 'pdf4') => {
    setPdfData((prev) => ({
      ...prev,
      [pdfKey]: {
        ...prev[pdfKey],
        customImage: null,
      },
    }));
  };

  const handleResetPdfData = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại dữ liệu PDF mặc định?')) {
      const defaultData = getDefaultPdfData();
      setPdfData(defaultData);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // State & QR generation for Tab 5 (High-Tier QR Labels)
  const tab5TierCount = pdf4Config?.tierCount || 3;
  const tab5BayNumbers = pdf4Config?.bayNumbers || ['01', '02', '03', '04', '05'];
  const tab5ItemsPerBay = pdf4Config?.itemsPerBay || 2;
  const [tab5Layout, setTab5Layout] = useState<'10_per_page' | '4_per_page' | '2_per_page' | '1_per_page'>('10_per_page');
  const [tab5SelectedTiers, setTab5SelectedTiers] = useState<number[]>(tab5TierCount === 4 ? [4, 3, 2, 1] : [3, 2, 1]);
  const [tab5Cards, setTab5Cards] = useState<Array<{
    id: string;
    bay: string;
    tier: number;
    slot: number;
    slotLabel: string;
    qrDataUrl?: string;
  }>>([]);

  useEffect(() => {
    setTab5SelectedTiers(tab5TierCount === 4 ? [4, 3, 2, 1] : [3, 2, 1]);
  }, [tab5TierCount, activeRackId]);

  useEffect(() => {
    let isMounted = true;
    const generateTab5Cards = async () => {
      const list: Array<{
        id: string;
        bay: string;
        tier: number;
        slot: number;
        slotLabel: string;
        qrDataUrl?: string;
      }> = [];

      const sortedTiers = [...tab5SelectedTiers].sort((a, b) => b - a);
      for (const t of sortedTiers) {
        for (const b of tab5BayNumbers) {
          for (let s = 1; s <= tab5ItemsPerBay; s++) {
            const key = `${activeRackId}-${b}-${t}-${s}`;
            let slotLabel = '';
            if (pdf4Config?.customSlotLabels && pdf4Config.customSlotLabels[key]) {
              slotLabel = pdf4Config.customSlotLabels[key];
            } else {
              const bIdx = Math.max(0, tab5BayNumbers.indexOf(b));
              const seq = bIdx * (tab5TierCount * tab5ItemsPerBay) + (t - 1) * tab5ItemsPerBay + s;
              slotLabel = `C${seq < 10 ? '0' + seq : seq}`;
            }

            try {
              const qrDataUrl = await QRCode.toDataURL(slotLabel, {
                width: 300,
                margin: 1,
                errorCorrectionLevel: 'M',
                color: { dark: '#000000', light: '#ffffff' }
              });
              list.push({ id: key, bay: b, tier: t, slot: s, slotLabel, qrDataUrl });
            } catch (err) {
              list.push({ id: key, bay: b, tier: t, slot: s, slotLabel });
            }
          }
        }
      }

      if (isMounted) {
        setTab5Cards(list);
      }
    };

    generateTab5Cards();
    return () => {
      isMounted = false;
    };
  }, [activeRackId, tab5TierCount, tab5BayNumbers, tab5ItemsPerBay, pdf4Config, tab5SelectedTiers]);

  // Helper function to convert oklch and oklab color strings to rgb/rgba format for html2canvas compatibility
  const parseAndConvertModernColors = (str: string): string => {
    if (!str) return str;
    let result = str;

    // Convert oklch(...)
    if (result.includes('oklch')) {
      result = result.replace(/oklch\s*\(\s*([^)]+)\s*\)/gi, (match, argsStr) => {
        try {
          const parts = argsStr.trim().split(/\s*[\/\s]\s*/);
          if (parts.length < 3) return 'rgb(100, 116, 139)';

          let l = parseFloat(parts[0]);
          if (parts[0].endsWith('%')) l /= 100;

          let c = parseFloat(parts[1]);
          if (parts[1].endsWith('%')) c /= 100;

          let h = parseFloat(parts[2]);

          let alpha = 1;
          if (parts[3]) {
            alpha = parseFloat(parts[3]);
            if (parts[3].endsWith('%')) alpha /= 100;
          }

          const hRad = (h * Math.PI) / 180;
          const a = c * Math.cos(hRad);
          const b = c * Math.sin(hRad);

          const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
          const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
          const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

          const l3 = l_ * l_ * l_;
          const m3 = m_ * m_ * m_;
          const s3 = s_ * s_ * s_;

          const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
          const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
          const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

          const gamma = (v: number) => {
            v = Math.max(0, Math.min(1, v));
            return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
          };

          const r8 = Math.round(gamma(rLin) * 255);
          const g8 = Math.round(gamma(gLin) * 255);
          const b8 = Math.round(gamma(bLin) * 255);

          if (alpha < 1) {
            return `rgba(${r8}, ${g8}, ${b8}, ${alpha.toFixed(2)})`;
          }
          return `rgb(${r8}, ${g8}, ${b8})`;
        } catch {
          return 'rgb(100, 116, 139)';
        }
      });
    }

    // Convert oklab(...)
    if (result.includes('oklab')) {
      result = result.replace(/oklab\s*\(\s*([^)]+)\s*\)/gi, (match, argsStr) => {
        try {
          const parts = argsStr.trim().split(/\s*[\/\s]\s*/);
          if (parts.length < 3) return 'rgb(100, 116, 139)';

          let l = parseFloat(parts[0]);
          if (parts[0].endsWith('%')) l /= 100;

          let a = parseFloat(parts[1]);
          if (parts[1].endsWith('%')) a /= 100;

          let b = parseFloat(parts[2]);
          if (parts[2].endsWith('%')) b /= 100;

          let alpha = 1;
          if (parts[3]) {
            alpha = parseFloat(parts[3]);
            if (parts[3].endsWith('%')) alpha /= 100;
          }

          const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
          const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
          const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

          const l3 = l_ * l_ * l_;
          const m3 = m_ * m_ * m_;
          const s3 = s_ * s_ * s_;

          const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
          const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
          const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

          const gamma = (v: number) => {
            v = Math.max(0, Math.min(1, v));
            return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
          };

          const r8 = Math.round(gamma(rLin) * 255);
          const g8 = Math.round(gamma(gLin) * 255);
          const b8 = Math.round(gamma(bLin) * 255);

          if (alpha < 1) {
            return `rgba(${r8}, ${g8}, ${b8}, ${alpha.toFixed(2)})`;
          }
          return `rgb(${r8}, ${g8}, ${b8})`;
        } catch {
          return 'rgb(100, 116, 139)';
        }
      });
    }

    // Convert light-dark(...)
    if (result.includes('light-dark')) {
      result = result.replace(/light-dark\s*\(\s*([^,]+)\s*,\s*[^)]+\)/gi, '$1');
    }

    return result;
  };

  const sanitizeClonedDocForHtml2Canvas = (clonedDoc: Document) => {
    try {
      const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
      styleTags.forEach((styleEl) => {
        if (styleEl.textContent && (
          styleEl.textContent.includes('oklch') || 
          styleEl.textContent.includes('oklab') || 
          styleEl.textContent.includes('light-dark')
        )) {
          styleEl.textContent = parseAndConvertModernColors(styleEl.textContent);
        }
      });

      const allElements = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
      allElements.forEach((el) => {
        const styleAttr = el.getAttribute('style');
        if (styleAttr && (
          styleAttr.includes('oklch') || 
          styleAttr.includes('oklab') || 
          styleAttr.includes('light-dark')
        )) {
          el.setAttribute('style', parseAndConvertModernColors(styleAttr));
        }
      });
    } catch (err) {
      console.warn('Error sanitizing modern colors for html2canvas:', err);
    }
  };

  // Helper function to trigger actual file download or fallback anchor
  const triggerBlobDownload = (pdf: jsPDF, fileName: string) => {
    try {
      pdf.save(fileName);
    } catch (e) {
      console.warn('pdf.save standard call failed:', e);
    }

    try {
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.target = '_blank';
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 3000);
    } catch (e) {
      console.error('Blob URL download trigger failed:', e);
    }
  };

  // Open PDF directly in a new browser tab (bypasses iframe download restrictions)
  const handleOpenPdfInNewTab = async (pdfType: 'pdf1' | 'pdf2' | 'pdf3' | 'pdf4' | 'pdf5') => {
    setIsEditMode(false);
    setIsExportingPdf(true);
    setExportProgressText('Đang khởi tạo & mở PDF trong tab mới...');

    try {
      await new Promise(r => setTimeout(r, 200));
      const element = document.getElementById(`printable-pdf-container-${pdfType}`);
      if (element) {
        const canvas = await html2canvas(element, { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          onclone: (clonedDoc) => {
            sanitizeClonedDocForHtml2Canvas(clonedDoc);
          }
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        const win = window.open(blobUrl, '_blank');
        if (!win) {
          const link = document.createElement('a');
          link.href = blobUrl;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Open PDF error:', error);
      alert('Khung hình bị chặn mở tab mới. Vui lòng bấm "In Ngay (Print)" để lưu file PDF!');
    } finally {
      setIsExportingPdf(false);
      setExportProgressText('');
    }
  };

  // Helper to generate and download PDF using html2canvas & jsPDF
  const handleDownloadPdf = async (pdfType: 'pdf1' | 'pdf2' | 'pdf3' | 'pdf4' | 'pdf5' | 'all') => {
    // Automatically turn off edit mode before rendering PDF
    setIsEditMode(false);
    setIsExportingPdf(true);
    setExportProgressText('Đang khởi tạo bản in PDF...');

    try {
      if (pdfType === 'all') {
        const tabs: ('pdf1' | 'pdf2' | 'pdf3' | 'pdf4' | 'pdf5')[] = ['pdf1', 'pdf2', 'pdf3', 'pdf4', 'pdf5'];
        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i];
          setActivePdfTab(tab);
          setExportProgressText(`Đang xử lý PDF ${i + 1}/5...`);
          await new Promise(r => setTimeout(r, 450));
          
          const element = document.getElementById(`printable-pdf-container-${tab}`);
          if (element) {
            const canvas = await html2canvas(element, { 
              scale: 2, 
              useCORS: true, 
              logging: false,
              onclone: (clonedDoc) => {
                sanitizeClonedDocForHtml2Canvas(clonedDoc);
              }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'mm',
              format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            const fileNames = {
              pdf1: `PDF1_SoDoTongQuanKho_${pdfData.pdf1.warehouseCode}.pdf`,
              pdf2: `PDF2_ChiTietVatTuKe_${pdfData.pdf2.rackId}.pdf`,
              pdf3: `PDF3_HuongDanDocDiaChiKe5S.pdf`,
              pdf4: `PDF4_SoDo3DChiTietKe_${pdfData.pdf4.rackId}.pdf`,
              pdf5: `PDF5_MaQRViTriTangCao_Ke_${activeRackId}.pdf`
            };
            triggerBlobDownload(pdf, fileNames[tab]);
          }
        }
      } else {
        setExportProgressText('Đang chụp khung hình chất lượng cao A4...');
        await new Promise(r => setTimeout(r, 300));
        const element = document.getElementById(`printable-pdf-container-${pdfType}`);
        if (element) {
          const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true, 
            logging: false, 
            onclone: (clonedDoc) => {
              sanitizeClonedDocForHtml2Canvas(clonedDoc);
            }
          });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
          });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

          const fileNames = {
            pdf1: `PDF1_SoDoTongQuanKho_${pdfData.pdf1.warehouseCode}.pdf`,
            pdf2: `PDF2_ChiTietVatTuKe_${pdfData.pdf2.rackId}.pdf`,
            pdf3: `PDF3_HuongDanDocDiaChiKe5S.pdf`,
            pdf4: `PDF4_SoDo3DChiTietKe_${pdfData.pdf4.rackId}.pdf`,
            pdf5: `PDF5_MaQRViTriTangCao_Ke_${activeRackId}.pdf`
          };
          triggerBlobDownload(pdf, fileNames[pdfType]);
        }
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Có lỗi khi tạo PDF. Vui lòng sử dụng nút In Ngay (Print) để lưu PDF.');
    } finally {
      setIsExportingPdf(false);
      setExportProgressText('');
    }
  };

  const handlePrint = () => {
    setIsEditMode(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-hidden">
      <div className="bg-slate-100 w-full max-w-6xl rounded-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[97vh]">
        
        {/* HEADER BAR */}
        <div className="bg-slate-900 text-white p-3.5 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-wide flex items-center gap-2">
                <span>TRUNG TÂM XUẤT BẢN FILE PDF KHO 5S</span>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold px-2 py-0.5 rounded">
                  4 BẢN XUẤT PDF CHUYÊN NGHIỆP
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cho phép thả ảnh tự do, điền thông tin và lưu tự động vào Local Storage
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 4 PDF TAB NAVIGATION SWITCHER & EDIT TOOLBAR */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Tab 1: Full Warehouse Map */}
            <button
              type="button"
              onClick={() => setActivePdfTab('pdf1')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activePdfTab === 'pdf1'
                  ? 'bg-teal-700 text-white shadow-md ring-2 ring-teal-500 ring-offset-1'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>PDF 1: Sơ Đồ Tổng Cả Kho (Ảnh 2)</span>
            </button>

            {/* Tab 2: Rack Slotting Details */}
            <button
              type="button"
              onClick={() => setActivePdfTab('pdf2')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activePdfTab === 'pdf2'
                  ? 'bg-teal-700 text-white shadow-md ring-2 ring-teal-500 ring-offset-1'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>PDF 2: Chi Tiết Trong Kệ (Ảnh 3)</span>
            </button>

            {/* Tab 3: 5S Reading Guide */}
            <button
              type="button"
              onClick={() => setActivePdfTab('pdf3')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activePdfTab === 'pdf3'
                  ? 'bg-teal-700 text-white shadow-md ring-2 ring-teal-500 ring-offset-1'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>PDF 3: Hướng Dẫn Đọc Kệ 5S (Ảnh 4)</span>
            </button>

            {/* Tab 4: 3D Single Rack View */}
            <button
              type="button"
              onClick={() => setActivePdfTab('pdf4')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activePdfTab === 'pdf4'
                  ? 'bg-teal-700 text-white shadow-md ring-2 ring-teal-500 ring-offset-1'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4 text-rose-400" />
              <span>PDF 4: Sơ Đồ 3D Kệ (Ảnh 5)</span>
            </button>

            {/* Tab 5: High-Tier QR Code Cards */}
            <button
              type="button"
              onClick={() => setActivePdfTab('pdf5')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activePdfTab === 'pdf5'
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400 ring-offset-1'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4 text-yellow-300" />
              <span>PDF 5: Thẻ Mã QR Tất Cả Vị Trí Kệ</span>
            </button>

          </div>

          {/* EDIT & BATCH EXPORT ACTION TOOLBAR */}
          <div className="flex items-center gap-2">
            {/* Toggle Edit Mode */}
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isEditMode
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {isEditMode ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4 text-amber-600" />}
              <span>{isEditMode ? 'Khóa & Xem Bản In' : 'Chỉnh Sửa Thông Tin'}</span>
            </button>

            {/* Reset Defaults */}
            <button
              type="button"
              onClick={handleResetPdfData}
              className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Khôi phục dữ liệu PDF mặc định"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Batch Export All Button */}
            <button
              type="button"
              onClick={() => handleDownloadPdf('all')}
              disabled={isExportingPdf}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Xuất Tất Cả 4 File PDF</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW DISPLAY CONTAINER */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-300/80 flex flex-col items-center justify-start">
          
          {/* Quick PDF Export Control Bar for Active Tab */}
          <div className="w-full max-w-[1100px] mb-3 bg-slate-900 text-white p-2.5 px-4 rounded-xl border border-slate-700 shadow-md flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-200">
                Đang xem: <strong className="text-amber-400 uppercase">{activePdfTab === 'pdf1' ? 'PDF 1: Sơ Đồ Tổng Cả Kho' : activePdfTab === 'pdf2' ? 'PDF 2: Chi Tiết Trong Kệ' : activePdfTab === 'pdf3' ? 'PDF 3: Hướng Dẫn Đọc Kệ 5S' : 'PDF 4: Sơ Đồ 3D Chi Tiết 1 Kệ'}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Button 1: Direct PDF Download */}
              <button
                type="button"
                onClick={() => handleDownloadPdf(activePdfTab)}
                disabled={isExportingPdf}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Tải File PDF</span>
              </button>

              {/* Button 2: Open in New Tab */}
              <button
                type="button"
                onClick={() => handleOpenPdfInNewTab(activePdfTab)}
                disabled={isExportingPdf}
                className="bg-sky-600 hover:bg-sky-500 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Mở PDF trong tab trình duyệt mới để xem hoặc lưu"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở PDF Trong Tab Mới</span>
              </button>

              {/* Button 3: Browser Print to PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="bg-slate-700 hover:bg-slate-600 text-amber-300 font-black text-xs px-3 py-1.5 rounded-lg border border-slate-600 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                title="Mở hộp thoại In / Lưu thành PDF chuẩn hệ thống"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>In Ngay / Lưu PDF (Print)</span>
              </button>
            </div>
          </div>

          {isExportingPdf && (
            <div className="mb-4 bg-slate-900 text-white px-6 py-2.5 rounded-xl border border-amber-400 shadow-lg flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
              <span className="font-bold text-sm text-amber-300">{exportProgressText}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PDF 1: SƠ ĐỒ KỆ TỔNG CẢ KHO VÀ VỊ TRÍ KỆ ĐỨNG (ẢNH 2) */}
          {/* ========================================================================= */}
          {activePdfTab === 'pdf1' && (
            <div 
              id="printable-pdf-container-pdf1"
              className="bg-white w-full max-w-[1100px] p-6 rounded-xl border-2 border-slate-400 shadow-2xl flex flex-col gap-4 text-slate-900 relative"
            >
              {/* Header Bar */}
              <div className="border-b-4 border-[#00838f] pb-3 flex items-center justify-between">
                <div className="bg-red-600 text-white font-black text-xl px-4 py-1.5 rounded tracking-wider">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={pdfData.pdf1.companyLogoText}
                      onChange={(e) => setPdfData({
                        ...pdfData,
                        pdf1: { ...pdfData.pdf1, companyLogoText: e.target.value }
                      })}
                      className="bg-red-700 text-white font-black text-xl px-1 rounded w-32 outline-none"
                    />
                  ) : (
                    pdfData.pdf1.companyLogoText
                  )}
                </div>
                <div className="text-center flex flex-col items-center">
                  {isEditMode ? (
                    <>
                      <input
                        type="text"
                        value={pdfData.pdf1.title}
                        onChange={(e) => setPdfData({
                          ...pdfData,
                          pdf1: { ...pdfData.pdf1, title: e.target.value }
                        })}
                        className="text-2xl font-black uppercase text-center border-b border-slate-300 px-2 py-0.5 w-full max-w-lg"
                      />
                      <input
                        type="text"
                        value={pdfData.pdf1.subtitle}
                        onChange={(e) => setPdfData({
                          ...pdfData,
                          pdf1: { ...pdfData.pdf1, subtitle: e.target.value }
                        })}
                        className="text-xs font-bold text-[#00838f] text-center border-b border-slate-200 mt-1 w-full max-w-xl"
                      />
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                        {pdfData.pdf1.title}
                      </h1>
                      <span className="text-xs font-bold text-[#00838f] uppercase tracking-wider block mt-0.5">
                        {pdfData.pdf1.subtitle}
                      </span>
                    </>
                  )}
                </div>
                <div className="bg-slate-900 text-cyan-400 font-mono font-black text-sm px-3.5 py-1.5 rounded-lg border border-slate-700 shadow-inner flex items-center gap-1">
                  <span>MÃ KHO:</span>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={pdfData.pdf1.warehouseCode}
                      onChange={(e) => setPdfData({
                        ...pdfData,
                        pdf1: { ...pdfData.pdf1, warehouseCode: e.target.value }
                      })}
                      className="bg-slate-800 text-cyan-300 font-mono font-bold text-sm px-1 rounded w-20 outline-none"
                    />
                  ) : (
                    <span>{pdfData.pdf1.warehouseCode}</span>
                  )}
                </div>
              </div>

              {/* IMAGE UPLOAD / VECTOR GRAPHIC AREA FOR PDF 1 */}
              <div className="bg-slate-900 rounded-2xl border-2 border-slate-800 p-4 text-white flex flex-col relative overflow-hidden shadow-inner min-h-[440px]">
                {/* Station Badge Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs font-mono font-black text-teal-300 uppercase tracking-widest">
                      BẢN ĐỒ 3D ISOMETRIC TOÀN KHO & CÁC DÃY KỆ
                    </span>
                  </div>
                  
                  {/* Image Upload Control Button */}
                  <div className="flex items-center gap-2">
                    <label className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Thả / Tải Ảnh Sơ Đồ Thay Thế</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload('pdf1', e)} 
                        className="hidden" 
                      />
                    </label>

                    {pdfData.pdf1.customImage && (
                      <button
                        type="button"
                        onClick={() => handleClearImage('pdf1')}
                        className="bg-red-600/80 hover:bg-red-500 text-white p-1 px-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        title="Dùng sơ đồ vector mặc định"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Ảnh</span>
                      </button>
                    )}

                    <div className="bg-teal-600/30 text-teal-300 text-[11px] font-mono font-bold px-2.5 py-1 rounded border border-teal-500/40">
                      VỊ TRÍ: {currentPosition.rackId ? `KỆ ${currentPosition.rackId}` : 'TRẠM TỔNG'}
                    </div>
                  </div>
                </div>

                {/* GRAPHIC AREA: CUSTOM UPLOADED IMAGE OR DEFAULT ISOMETRIC VECTOR */}
                <div className="relative w-full flex-1 min-h-[380px] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-2 overflow-hidden">
                  {pdfData.pdf1.customImage ? (
                    <img 
                      src={pdfData.pdf1.customImage} 
                      alt="Sơ đồ kho đã tải lên" 
                      className="w-full h-full object-contain max-h-[390px] rounded-lg"
                    />
                  ) : (
                    <svg viewBox="0 0 1000 480" className="w-full h-full">
                      <polygon points="50,420 950,420 880,470 0,470" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                      <text x="480" y="450" fill="#94a3b8" fontSize="12" fontWeight="900" textAnchor="middle">
                        BỘ PHẬN GIAO HÀNG / DELIVERY DEPT • BÀN BẢNG TỔNG 5S
                      </text>

                      <g transform="translate(360, 200)">
                        <polygon points="0,60 280,60 220,120 -60,120" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                        <text x="110" y="95" fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="middle">
                          🏢 SÀN LỬNG MEZZANINE #1
                        </text>
                      </g>

                      {[
                        { name: 'A', x: 280, y: 50 },
                        { name: 'B', x: 320, y: 65 },
                        { name: 'C', x: 360, y: 80 },
                        { name: 'D', x: 400, y: 95 },
                        { name: 'E', x: 440, y: 110 },
                        { name: 'F', x: 500, y: 130 },
                        { name: 'G', x: 540, y: 145 },
                        { name: 'H2', x: 580, y: 160 },
                        { name: 'I', x: 620, y: 175 },
                        { name: 'J', x: 670, y: 195 },
                        { name: 'K', x: 710, y: 210 },
                        { name: 'L', x: 750, y: 225 },
                        { name: 'M', x: 140, y: 210 },
                        { name: 'N', x: 180, y: 225 },
                        { name: 'O', x: 220, y: 240 },
                        { name: 'H', x: 240, y: 120 },
                      ].map((rk, idx) => (
                        <g key={`pdf1-rack-${rk.name}-${idx}`} transform={`translate(${rk.x}, ${rk.y})`}>
                          <path d="M 0,0 L 100,-30 L 100,-10 L 0,20 Z" fill="#ea580c" stroke="#ffffff" strokeWidth="0.8" />
                          <path d="M 0,20 L 100,-10 L 100,50 L 0,80 Z" fill="#2563eb" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
                          
                          <rect x="35" y="-35" width="28" height="18" rx="4" fill="#ea580c" stroke="#ffffff" strokeWidth="1.5" />
                          <text x="49" y="-22" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
                            {rk.name}
                          </text>

                          {rk.name === (currentPosition.rackId || 'A') && (
                            <g transform="translate(49, -60)">
                              <rect x="-42" y="-12" width="84" height="22" rx="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                              <text x="0" y="2" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
                                📍 VỊ TRÍ CỦA BẠN
                              </text>
                            </g>
                          )}
                        </g>
                      ))}
                    </svg>
                  )}
                </div>
              </div>

              {/* Footer Summary Info */}
              <div className="grid grid-cols-12 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-300 text-xs">
                <div className="col-span-6 border-r border-slate-200 pr-3">
                  <span className="font-bold text-slate-700 uppercase block mb-0.5">TRẠM BẢNG ĐỊNH VỊ:</span>
                  <div className="font-mono font-black text-sm text-[#00838f]">
                    {currentPosition.rackId ? `TRẠM KỆ ${currentPosition.rackId} - BAY ${currentPosition.bayId || '02'}` : 'TRẠM ĐỊNH VỊ TRUNG TÂM'}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Toạ độ trạm: Khoang {currentPosition.bayId || '02'} - Tầng {currentPosition.tier || 3}</span>
                </div>

                <div className="col-span-6 pl-2">
                  <span className="font-bold text-slate-700 uppercase block mb-0.5">QUY CHUẨN KHO BÌNH DƯƠNG:</span>
                  <span className="text-[11px] text-slate-600 block">Tất cả vật tư sắp xếp theo tiêu chuẩn 5S. Sơ đồ cập nhật trực tuyến tự động.</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PDF 2: CHI TIẾT TRONG KỆ CÓ NHỮNG GÌ (ẢNH 3) - FULLY EDITABLE */}
          {/* ========================================================================= */}
          {activePdfTab === 'pdf2' && (
            <div 
              id="printable-pdf-container-pdf2"
              className="bg-white w-full max-w-[1100px] p-6 rounded-xl border-2 border-slate-400 shadow-2xl flex flex-col gap-4 text-slate-900"
            >
              {/* Header Bar */}
              <div className="border-b-4 border-amber-600 pb-3 flex items-center justify-between">
                <div className="bg-red-600 text-white font-black text-xl px-4 py-1.5 rounded tracking-wider">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={pdfData.pdf2.companyLogoText}
                      onChange={(e) => setPdfData({
                        ...pdfData,
                        pdf2: { ...pdfData.pdf2, companyLogoText: e.target.value }
                      })}
                      className="bg-red-700 text-white font-black text-xl px-1 rounded w-32 outline-none"
                    />
                  ) : (
                    pdfData.pdf2.companyLogoText
                  )}
                </div>
                <div className="text-center flex flex-col items-center">
                  {isEditMode ? (
                    <>
                      <input
                        type="text"
                        value={pdfData.pdf2.title}
                        onChange={(e) => setPdfData({
                          ...pdfData,
                          pdf2: { ...pdfData.pdf2, title: e.target.value }
                        })}
                        className="text-2xl font-black uppercase text-center border-b border-slate-300 px-2 py-0.5 w-full max-w-lg"
                      />
                      <input
                        type="text"
                        value={pdfData.pdf2.subtitle}
                        onChange={(e) => setPdfData({
                          ...pdfData,
                          pdf2: { ...pdfData.pdf2, subtitle: e.target.value }
                        })}
                        className="text-xs font-bold text-amber-600 text-center border-b border-slate-200 mt-1 w-full max-w-xl"
                      />
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                        {pdfData.pdf2.title}
                      </h1>
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mt-0.5">
                        {pdfData.pdf2.subtitle}
                      </span>
                    </>
                  )}
                </div>
                <div className="bg-amber-600 text-white font-mono font-black text-sm px-3.5 py-1.5 rounded-lg border border-amber-700 shadow-inner flex items-center gap-1">
                  <span>KỆ</span>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={pdfData.pdf2.rackId}
                      onChange={(e) => setPdfData({
                        ...pdfData,
                        pdf2: { ...pdfData.pdf2, rackId: e.target.value.toUpperCase() }
                      })}
                      className="bg-amber-700 text-white font-mono font-black text-sm px-1 rounded w-10 outline-none text-center"
                    />
                  ) : (
                    <span>{pdfData.pdf2.rackId}</span>
                  )}
                </div>
              </div>

              {/* 5 Bays x 3 Tiers Matrix Grid Layout */}
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-300 flex flex-col gap-3">
                <div className="grid grid-cols-5 gap-3">
                  {(pdfData.pdf2?.bayNames || ['KHOANG 01', 'KHOANG 02', 'KHOANG 03', 'KHOANG 04', 'KHOANG 05']).map((bTitle, bIdx) => {
                    const bayNum = (bIdx + 1).toString().padStart(2, '0');
                    return (
                      <div key={`pdf2-bay-${bIdx}`} className="flex flex-col gap-2">
                        {/* Bay Column Header */}
                        <div className="bg-slate-900 text-white text-center font-black text-xs py-1.5 rounded-lg tracking-wider">
                          {isEditMode ? (
                            <input
                              type="text"
                              value={bTitle}
                              onChange={(e) => {
                                const newBays = [...(pdfData.pdf2?.bayNames || ['KHOANG 01', 'KHOANG 02', 'KHOANG 03', 'KHOANG 04', 'KHOANG 05'])];
                                newBays[bIdx] = e.target.value;
                                setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, bayNames: newBays } });
                              }}
                              className="bg-slate-800 text-white text-center font-black text-xs w-full px-1 outline-none rounded"
                            />
                          ) : (
                            bTitle
                          )}
                        </div>

                        {/* 3 Tiers (Tier 3 top, Tier 2 mid, Tier 1 ground) */}
                        {[3, 2, 1].map((tierNum) => {
                          const tierBg = tierNum === 3 ? 'bg-amber-50 border-amber-300 text-amber-900' : tierNum === 2 ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-red-50 border-red-300 text-red-900';
                          const tagBg = tierNum === 3 ? 'bg-amber-500' : tierNum === 2 ? 'bg-blue-600' : 'bg-red-600';

                          return (
                            <div key={`pdf2-tier-wrapper-${bayNum}-${tierNum}`} className="flex gap-1.5 w-full">
                              {[1, 2].map(pos => {
                                const slotKey = `${bayNum}-${tierNum}-${pos}`;
                                const slotData = pdfData.pdf2.matrixSlots[slotKey] || { code: '', name: '', qty: '' };
                                const slotCodeDisplay = `${pdfData.pdf2.rackId}-${bayNum}-${tierNum}-${pos}`;

                                return (
                                  <div 
                                    key={`pdf2-cell-${bayNum}-${tierNum}-${pos}`} 
                                    className={`p-1.5 sm:p-2 rounded-xl border-2 ${tierBg} flex flex-col gap-1 w-1/2 min-h-[95px] shadow-xs relative`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className={`text-[9px] font-black text-white px-1 py-0.5 rounded font-mono flex items-center justify-center leading-none ${tagBg}`}>
                                        {slotCodeDisplay}
                                      </span>
                                      <span className="text-[7.5px] font-extrabold opacity-60">T{tierNum}-{pos}</span>
                                    </div>

                                    {isEditMode ? (
                                      <div className="mt-1 flex flex-col gap-1">
                                        <input
                                          type="text"
                                          placeholder="Tên vật tư..."
                                          value={slotData.name}
                                          onChange={(e) => {
                                            const newSlots = { ...pdfData.pdf2.matrixSlots };
                                            newSlots[slotKey] = { ...slotData, name: e.target.value };
                                            setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, matrixSlots: newSlots } });
                                          }}
                                          className="text-[10px] font-bold bg-white/80 border border-slate-300 rounded px-1 text-slate-900 w-full"
                                        />
                                        <div className="flex flex-col gap-1">
                                          <input
                                            type="text"
                                            placeholder="Mã..."
                                            value={slotData.code}
                                            onChange={(e) => {
                                              const newSlots = { ...pdfData.pdf2.matrixSlots };
                                              newSlots[slotKey] = { ...slotData, code: e.target.value };
                                              setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, matrixSlots: newSlots } });
                                            }}
                                            className="text-[9px] font-mono bg-white/80 border border-slate-300 rounded px-1 w-full"
                                          />
                                          <input
                                            type="text"
                                            placeholder="SL..."
                                            value={slotData.qty}
                                            onChange={(e) => {
                                              const newSlots = { ...pdfData.pdf2.matrixSlots };
                                              newSlots[slotKey] = { ...slotData, qty: e.target.value };
                                              setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, matrixSlots: newSlots } });
                                            }}
                                            className="text-[9px] bg-white/80 border border-slate-300 rounded px-1 w-full"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      slotData.name || slotData.code ? (
                                        <div className="mt-1 flex flex-col">
                                          <span className="font-bold text-[10px] leading-normal text-slate-900 block break-words pb-0.5" title={slotData.name || 'Linh kiện'}>
                                            {slotData.name || 'Linh kiện'}
                                          </span>
                                          <span className="font-mono text-[8.5px] font-extrabold text-cyan-800">{slotData.code || 'N/A'}</span>
                                          <span className="text-[8px] text-slate-600 font-semibold">SL: {slotData.qty || '0'}</span>
                                        </div>
                                      ) : (
                                        <div className="mt-2 text-slate-400 font-bold text-[9px] italic border border-dashed border-slate-300 rounded p-1 text-center">
                                          + Ô trống
                                        </div>
                                      )
                                    )}
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

                <div className="text-right text-xs font-bold text-slate-500 pt-1 border-t border-slate-200">
                  Tổng quy mô Kệ {pdfData.pdf2.rackId}: 5 khoang × 3 tầng × 2 vị trí = 30 vị trí ô chứa hàng • Đã lưu tự động
                </div>
              </div>

              {/* Items Inventory Directory Table */}
              <div className="flex flex-col gap-2">
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <span>DANH MỤC LƯU TRỮ CHÍNH TRONG KỆ {pdfData.pdf2.rackId}</span>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: CustomTableItem = {
                          id: Date.now().toString(),
                          location: `${pdfData.pdf2.rackId}-01-1`,
                          code: 'LK-SH-NEW',
                          name: 'Mặt hàng linh kiện mới',
                          quantity: '100 cái',
                          spec: 'Thùng carton 5S',
                        };
                        setPdfData({
                          ...pdfData,
                          pdf2: {
                            ...pdfData.pdf2,
                            customTableItems: [...pdfData.pdf2.customTableItems, newItem],
                          },
                        });
                      }}
                      className="bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Dòng</span>
                    </button>
                  )}
                </h3>

                <table className="w-full text-xs border border-slate-300 border-collapse">
                  <thead className="bg-slate-100 font-black uppercase text-slate-800">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-12">STT</th>
                      <th className="border border-slate-300 p-2 text-center font-mono">Mã Vị Trí</th>
                      <th className="border border-slate-300 p-2 text-center font-mono">Mã Vật Tư</th>
                      <th className="border border-slate-300 p-2 text-left">Tên Linh Kiện / Vật Tư</th>
                      <th className="border border-slate-300 p-2 text-center">Số Lượng</th>
                      <th className="border border-slate-300 p-2 text-left">Ghi Chú Quy Cách</th>
                      {isEditMode && <th className="border border-slate-300 p-2 text-center w-12">Thao Tác</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pdfData.pdf2.customTableItems.length > 0 ? (
                      pdfData.pdf2.customTableItems.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="border border-slate-300 p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono font-black text-teal-800 bg-teal-50/50">
                            {isEditMode ? (
                              <input
                                type="text"
                                value={item.location}
                                onChange={(e) => {
                                  const updated = [...pdfData.pdf2.customTableItems];
                                  updated[idx].location = e.target.value;
                                  setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, customTableItems: updated } });
                                }}
                                className="w-full text-center bg-white border border-slate-300 rounded px-1 font-mono font-bold"
                              />
                            ) : (
                              item.location
                            )}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-900">
                            {isEditMode ? (
                              <input
                                type="text"
                                value={item.code}
                                onChange={(e) => {
                                  const updated = [...pdfData.pdf2.customTableItems];
                                  updated[idx].code = e.target.value;
                                  setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, customTableItems: updated } });
                                }}
                                className="w-full text-center bg-white border border-slate-300 rounded px-1 font-mono"
                              />
                            ) : (
                              item.code
                            )}
                          </td>
                          <td className="border border-slate-300 p-1.5 font-bold text-slate-900">
                            {isEditMode ? (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...pdfData.pdf2.customTableItems];
                                  updated[idx].name = e.target.value;
                                  setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, customTableItems: updated } });
                                }}
                                className="w-full bg-white border border-slate-300 rounded px-1 font-bold"
                              />
                            ) : (
                              item.name
                            )}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono font-extrabold text-amber-700">
                            {isEditMode ? (
                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) => {
                                  const updated = [...pdfData.pdf2.customTableItems];
                                  updated[idx].quantity = e.target.value;
                                  setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, customTableItems: updated } });
                                }}
                                className="w-full text-center bg-white border border-slate-300 rounded px-1 font-mono font-extrabold"
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-slate-600">
                            {isEditMode ? (
                              <input
                                type="text"
                                value={item.spec}
                                onChange={(e) => {
                                  const updated = [...pdfData.pdf2.customTableItems];
                                  updated[idx].spec = e.target.value;
                                  setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, customTableItems: updated } });
                                }}
                                className="w-full bg-white border border-slate-300 rounded px-1 text-slate-600"
                              />
                            ) : (
                              item.spec
                            )}
                          </td>
                          {isEditMode && (
                            <td className="border border-slate-300 p-1 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = pdfData.pdf2.customTableItems.filter((_, i) => i !== idx);
                                  setPdfData({ ...pdfData, pdf2: { ...pdfData.pdf2, customTableItems: updated } });
                                }}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400 font-bold italic">
                          Chưa có vật tư trong danh mục. Nhấn nút "Thêm Dòng" để tạo mới!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PDF 3: HƯỚNG DẪN CÁCH ĐỌC ĐỊA CHỈ TRÊN KỆ CHUẨN 5S (ẢNH 4) */}
          {/* ========================================================================= */}
          {activePdfTab === 'pdf3' && (
            <div 
              id="printable-pdf-container-pdf3"
              className="bg-white w-full max-w-[1100px] p-6 rounded-xl border-2 border-slate-400 shadow-2xl flex flex-col gap-4 text-slate-900 relative"
            >
              {/* Header Bar */}
              <div className="border-b-4 border-emerald-700 pb-3 flex items-center justify-between">
                <div className="bg-red-600 text-white font-black text-xl px-4 py-1.5 rounded tracking-wider">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={pdfData.pdf3.companyLogoText}
                      onChange={(e) => setPdfData({
                        ...pdfData,
                        pdf3: { ...pdfData.pdf3, companyLogoText: e.target.value }
                      })}
                      className="bg-red-700 text-white font-black text-xl px-1 rounded w-32 outline-none"
                    />
                  ) : (
                    pdfData.pdf3.companyLogoText
                  )}
                </div>
                <div className="text-center flex flex-col items-center">
                  {isEditMode ? (
                    <>
                      <input
                        type="text"
                        value={pdfData.pdf3.title}
                        onChange={(e) => setPdfData({
                          ...pdfData,
                          pdf3: { ...pdfData.pdf3, title: e.target.value }
                        })}
                        className="text-2xl font-black uppercase text-center border-b border-slate-300 px-2 py-0.5 w-full max-w-lg"
                      />
                      <input
                        type="text"
                        value={pdfData.pdf3.subtitle}
                        onChange={(e) => setPdfData({
                          ...pdfData,
                          pdf3: { ...pdfData.pdf3, subtitle: e.target.value }
                        })}
                        className="text-xs font-bold text-emerald-700 text-center border-b border-slate-200 mt-1 w-full max-w-xl"
                      />
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                        {pdfData.pdf3.title}
                      </h1>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mt-0.5">
                        {pdfData.pdf3.subtitle}
                      </span>
                    </>
                  )}
                </div>
                <div className="bg-emerald-700 text-white font-mono font-black text-sm px-3.5 py-1.5 rounded-lg border border-emerald-800 shadow-inner">
                  STANDARD 5S
                </div>
              </div>

              {/* Top Controls Bar for Uploading Custom Diagram Image */}
              <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Tùy biến sơ đồ hướng dẫn:</span>
                <div className="flex items-center gap-2">
                  <label className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Thả / Tải Ảnh Hướng Dẫn Mới</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload('pdf3', e)} 
                      className="hidden" 
                    />
                  </label>

                  {pdfData.pdf3.customImage && (
                    <button
                      type="button"
                      onClick={() => handleClearImage('pdf3')}
                      className="bg-red-600/80 hover:bg-red-500 text-white p-1 px-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Ảnh</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 5S Address Location Breakdown Banner (Pixel perfect from Image 4) */}
              <div className="bg-white p-4 rounded-xl border-2 border-slate-900 shadow-md flex flex-col">
                <div className="grid grid-cols-12 text-xs font-bold uppercase text-slate-800 pb-2 border-b border-slate-300 text-center tracking-tight">
                  <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">MÀU SẮC</div>
                  <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">DÃY KỆ</div>
                  <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">KHOANG</div>
                  <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">TẦNG</div>
                  <div className="col-span-2 border-r border-dashed border-slate-300 pr-1">VỊ TRÍ</div>
                  <div className="col-span-2 text-[10px]">MÃ VẠCH / HƯỚNG</div>
                </div>

                <div className="grid grid-cols-12 items-center text-center pt-2 font-sans">
                  {/* Color box */}
                  <div className="col-span-2 flex justify-center items-center border-r border-dashed border-slate-300">
                    <div 
                      className="w-9 h-12 rounded shadow-sm border border-slate-800" 
                      style={{ backgroundColor: pdfData.pdf3.colorHex || '#047857' }}
                    />
                  </div>

                  {/* Rack row letter */}
                  <div className="col-span-2 font-black text-5xl text-slate-950 border-r border-dashed border-slate-300 font-sans tracking-tight">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={pdfData.pdf3.rackLetter}
                        onChange={(e) => setPdfData({ ...pdfData, pdf3: { ...pdfData.pdf3, rackLetter: e.target.value.toUpperCase() } })}
                        className="text-4xl font-black w-16 text-center border border-slate-300 rounded"
                      />
                    ) : (
                      pdfData.pdf3.rackLetter
                    )}
                  </div>

                  {/* Bay number */}
                  <div className="col-span-2 font-black text-5xl text-slate-950 border-r border-dashed border-slate-300 font-sans tracking-tight flex items-center justify-center">
                    <span className="text-3xl mr-0.5 text-slate-400 font-light">-</span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={pdfData.pdf3.bayNum}
                        onChange={(e) => setPdfData({ ...pdfData, pdf3: { ...pdfData.pdf3, bayNum: e.target.value } })}
                        className="text-4xl font-black w-20 text-center border border-slate-300 rounded"
                      />
                    ) : (
                      <span>{pdfData.pdf3.bayNum}</span>
                    )}
                  </div>

                  {/* Tier number */}
                  <div className="col-span-2 font-black text-5xl text-slate-950 border-r border-dashed border-slate-300 font-sans tracking-tight flex items-center justify-center">
                    <span className="text-3xl mr-0.5 text-slate-400 font-light">-</span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={pdfData.pdf3.tierNum}
                        onChange={(e) => setPdfData({ ...pdfData, pdf3: { ...pdfData.pdf3, tierNum: e.target.value } })}
                        className="text-4xl font-black w-16 text-center border border-slate-300 rounded"
                      />
                    ) : (
                      <span>{pdfData.pdf3.tierNum}</span>
                    )}
                  </div>

                  {/* Position slot number */}
                  <div className="col-span-2 font-black text-5xl text-slate-950 border-r border-dashed border-slate-300 font-sans tracking-tight">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={pdfData.pdf3.posNum}
                        onChange={(e) => setPdfData({ ...pdfData, pdf3: { ...pdfData.pdf3, posNum: e.target.value } })}
                        className="text-4xl font-black w-16 text-center border border-slate-300 rounded"
                      />
                    ) : (
                      pdfData.pdf3.posNum
                    )}
                  </div>

                  {/* Arrow & Barcode */}
                  <div className="col-span-2 flex items-center justify-center gap-2 pl-1">
                    <span className="text-4xl font-black text-slate-950">↑</span>
                    <div className="flex items-center h-12 gap-[2px] bg-white p-0.5">
                      {[3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2].map((w, i) => (
                        <div key={`pdf3-bc-${i}`} className="bg-slate-950 h-full" style={{ width: `${w * 1.5}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CUSTOM UPLOADED IMAGE OR DEFAULT 3D DIAGRAM ILLUSTRATION */}
              <div className="bg-slate-100 p-4 rounded-xl border-2 border-slate-300 flex flex-col items-center justify-center min-h-[220px]">
                {pdfData.pdf3.customImage ? (
                  <img 
                    src={pdfData.pdf3.customImage} 
                    alt="Sơ đồ 5S đã tải lên" 
                    className="w-full h-auto max-h-[280px] object-contain rounded-lg"
                  />
                ) : (
                  <svg viewBox="0 0 580 260" className="w-full h-auto max-h-[280px]">
                    <g transform="translate(40, 20)">
                      <rect x="20" y="20" width="100" height="180" fill="#2563eb" opacity="0.1" rx="8" />
                      <rect x="20" y="20" width="100" height="20" fill="#15803d" rx="4" />
                      <text x="70" y="34" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">Dãy AB</text>
                    </g>
                    <g transform="translate(180, 20)">
                      <rect x="20" y="20" width="100" height="180" fill="#2563eb" opacity="0.1" rx="8" />
                      <rect x="20" y="20" width="100" height="20" fill="#15803d" rx="4" />
                      <text x="70" y="34" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">Dãy CD</text>
                    </g>
                    <g transform="translate(320, 20)">
                      <rect x="20" y="20" width="100" height="180" fill="#2563eb" opacity="0.1" rx="8" />
                      <rect x="20" y="20" width="100" height="20" fill="#15803d" rx="4" />
                      <text x="70" y="34" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">Dãy EF</text>
                    </g>
                  </svg>
                )}
              </div>

              {/* 5 Component Definition Table */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded bg-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-slate-900">Màu sắc / Dãy Kệ:</strong>
                    <span className="text-slate-600 text-[11px]">Quy chuẩn nhận diện màu sắc & ký hiệu nhận dạng dãy (A, B, C...)</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded bg-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-slate-900">Khoang (Bay):</strong>
                    <span className="text-slate-600 text-[11px]">Số thứ tự khoang từ đầu dãy đến cuối dãy (01, 02, 03...)</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded bg-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-slate-900">Tầng (Tier/Level):</strong>
                    <span className="text-slate-600 text-[11px]">Đánh số từ 1..6 từ mặt đất lên cao (hoặc ký hiệu A, B, C)</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded bg-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-slate-900">Vị trí (Position):</strong>
                    <span className="text-slate-600 text-[11px]">Số vị trí ô đặt kiện hàng/pallet (1, 2...) trên mỗi tầng khoang</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PDF 4: CHI TIẾT TRONG 1 KỆ SƠ ĐỒ (MÔ PHỎNG 3D) - CHỈ HIỂN THỊ SƠ ĐỒ 3D */}
          {/* ========================================================================= */}
          {activePdfTab === 'pdf4' && (
            <div 
              id="printable-pdf-container-pdf4"
              className="bg-white w-full max-w-[1100px] p-4 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-slate-900 relative shadow-xl"
            >
              {pdfData.pdf4.customImage ? (
                <img 
                  src={pdfData.pdf4.customImage} 
                  alt="Sơ đồ 3D Kệ đã tải lên" 
                  className="w-full h-auto max-h-[580px] object-contain"
                />
              ) : (
                <div className="w-full flex items-center justify-center">
                  <IsometricRackSVG
                    rackId={selectedRackId || 'A'}
                    storageType={pdf4Config?.storageType || 'pallets'}
                    tierCount={pdf4Config?.tierCount || 3}
                    itemsPerBay={pdf4Config?.itemsPerBay || 2}
                    tierColors={pdf4Config?.tierColors || { 3: '#f59e0b', 2: '#3b82f6', 1: '#dc2626' }}
                    bayNumbers={pdf4Config?.bayNumbers || ['01', '02', '03', '04', '05']}
                    selectedBay={undefined}
                    selectedTier={undefined}
                    selectedSlot={undefined}
                    onSelectSlot={() => {}}
                    getSlotLabel={(bay, tier, slot) => {
                      const key = `${selectedRackId || 'A'}-${bay}-${tier}-${slot}`;
                      if (pdf4Config?.customSlotLabels && pdf4Config.customSlotLabels[key]) {
                        return pdf4Config.customSlotLabels[key];
                      }
                      const bList = pdf4Config?.bayNumbers || ['01', '02', '03', '04', '05'];
                      const itPerBay = pdf4Config?.itemsPerBay || 2;
                      const tCount = pdf4Config?.tierCount || 3;
                      const bIdx = Math.max(0, bList.indexOf(bay));
                      const seq = bIdx * (tCount * itPerBay) + (tier - 1) * itPerBay + slot;
                      return `C${seq < 10 ? '0' + seq : seq}`;
                    }}
                    getSlotItem={(bay, tier, slot) => {
                      const loc = `${selectedRackId || 'A'}-${bay}-${tier}-${slot}`;
                      return items.find(i => i.location === loc || (i.rackId === (selectedRackId || 'A') && i.bayId === bay && i.tier === tier && (i.slot === slot || (!i.slot && slot === 1))));
                    }}
                    tagFontSize={pdf4Config?.tagFontSize || 14}
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PDF 5: THẺ MÃ QR VỊ TRÍ TẦNG CAO (ẢNH MẪU 6) - KHỔ A4 NGANG */}
          {/* ========================================================================= */}
          {activePdfTab === 'pdf5' && (
            <div className="w-full max-w-[1100px] flex flex-col items-center gap-4">
              
              {/* Tab 5 Tooling Bar */}
              <div className="w-full bg-slate-900 text-white p-3 rounded-2xl border border-slate-700 shadow-md flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-400">Bố cục in A4:</span>
                  <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setTab5Layout('4_per_page')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tab5Layout === '4_per_page' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      4 Thẻ / Trang
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab5Layout('2_per_page')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tab5Layout === '2_per_page' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      2 Thẻ / Trang
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab5Layout('1_per_page')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tab5Layout === '1_per_page' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      1 Thẻ Lớn / Trang
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Chọn tầng xuất QR:</span>
                  {[4, 3, 2, 1].filter(t => t <= tab5TierCount).map(t => {
                    const isSelected = tab5SelectedTiers.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (tab5SelectedTiers.length > 1) {
                              setTab5SelectedTiers(tab5SelectedTiers.filter(x => x !== t));
                            }
                          } else {
                            setTab5SelectedTiers([...tab5SelectedTiers, t]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                          isSelected 
                            ? 'bg-amber-500 text-slate-950 border-amber-400' 
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        Tầng {t} {t === 4 ? '(Cao nhất)' : t === 3 ? '(Tầng 3)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Printable PDF 5 Container */}
              <div 
                id="printable-pdf-container-pdf5"
                className="bg-white w-full p-6 sm:p-8 rounded-2xl flex flex-col text-slate-900 relative shadow-xl border border-slate-200"
              >
                {/* Header Banner */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-6">
                  <div className="flex items-center gap-3">
                    <SunhouseLogo className="h-9 w-auto" />
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight uppercase">
                        BẢNG MÃ QR CODE TẤT CẢ VỊ TRÍ KỆ • KỆ {activeRackId}
                      </h2>
                      <p className="text-xs font-semibold text-slate-500">
                        NHÀ MÁY SUNHOUSE BÌNH DƯƠNG • MÃ QR QUÉT TẤT CẢ VỊ TRÍ KỆ (BIN LOCATION)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-3 py-1 rounded-lg shadow-xs">
                      {tab5Cards.length} VỊ TRÍ MÃ QR
                    </span>
                  </div>
                </div>

                {/* Grid of QR Code Cards */}
                <div className={`w-full grid gap-4 sm:gap-6 ${
                  tab5Layout === '4_per_page' ? 'grid-cols-1 md:grid-cols-2' :
                  tab5Layout === '2_per_page' ? 'grid-cols-1 md:grid-cols-2' :
                  'grid-cols-1'
                }`}>
                  {tab5Cards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white border-4 border-slate-950 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between text-center relative shadow-sm overflow-hidden"
                      style={{ minHeight: tab5Layout === '1_per_page' ? '360px' : '260px' }}
                    >
                      {/* Top Header */}
                      <div className="w-full flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <SunhouseLogo className="h-5 w-auto" />
                        </div>
                        <div className="bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded text-xs border border-slate-950">
                          KỆ {activeRackId} • KHOANG {card.bay} • TẦNG {card.tier}
                        </div>
                      </div>

                      {/* Middle: Large QR and Big Text */}
                      <div className="w-full flex items-center justify-around gap-4 my-2">
                        {/* QR Code Container */}
                        <div className="bg-white p-2 border-2 border-slate-900 rounded-xl shadow-xs flex flex-col items-center">
                          {card.qrDataUrl ? (
                            <img 
                              src={card.qrDataUrl} 
                              alt={`QR ${card.slotLabel}`}
                              className="w-28 h-28 sm:w-36 sm:h-36 object-contain"
                              style={{ minWidth: '120px', minHeight: '120px' }}
                            />
                          ) : (
                            <div className="w-28 h-28 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-bold">
                              Đang tạo QR...
                            </div>
                          )}
                          <span className="text-[9px] font-black text-slate-600 mt-1 uppercase">
                            QUÉT MÃ VỊ TRÍ
                          </span>
                        </div>

                        {/* Location Text Big Display */}
                        <div className="flex flex-col items-center justify-center flex-1">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            MÃ VỊ TRÍ Ô
                          </span>
                          <div className="text-4xl sm:text-5xl font-black text-slate-950 tracking-wider my-1 font-mono border-b-4 border-amber-500 pb-1">
                            {card.slotLabel}
                          </div>
                          <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 mt-1">
                            Ô số {card.slot} • Khoang {card.bay}
                          </span>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="w-full bg-slate-100 rounded-lg py-1.5 px-3 mt-3 border border-slate-300 flex items-center justify-between text-[10px] font-bold text-slate-600">
                        <span>Hệ thống Quản lý Kho 5S Sunhouse</span>
                        <span className="font-mono text-slate-900">{card.id}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Notice */}
                <div className="w-full mt-6 pt-3 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
                  <span>In trực tiếp hoặc tải file PDF khổ A4 ngang dán thanh giằng tầng 1 để nhân viên quét tầm thấp</span>
                  <span className="font-bold text-slate-700">Quy chuẩn nhãn QR Kho Sunhouse</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* BOTTOM ACTION BUTTONS BAR */}
        <div className="bg-white p-3.5 px-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-lg shrink-0">
          <div className="text-xs text-slate-500 font-semibold">
            Lưu tự động vào Local Storage • Khuyên dùng xuất khổ A4 Ngang cho bản in quy chuẩn kho Sunhouse.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPdf(activePdfTab)}
              disabled={isExportingPdf}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Tải File PDF Về Máy ({activePdfTab.toUpperCase()})</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay (Print)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
