import * as XLSX from 'xlsx';
import { InventoryItem, WarehouseRack } from './types';

export interface ParsedSlotData {
  index: number; // 1 to N (e.g. 1 to 30 or 1 to 36)
  slotCode: string; // e.g. "G01", "C01", ...
  bayId: string; // "01", "02", ...
  tier: number; // 1 (Ground), 2, 3, 4 (Top)
  slot: number; // 1, 2, 3
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  spec: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  note?: string;
}

export interface ExcelImportResult {
  success: boolean;
  message: string;
  totalParsed: number;
  parsedSlots: ParsedSlotData[];
  customLabels: { [key: string]: string };
  updatedItems: InventoryItem[];
}

// 40 Standard Sample Items for Sunhouse Industrial Warehouse (covering up to 36+ slots)
export const STANDARD_SLOT_SAMPLES: {
  code: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  note: string;
}[] = [
  { code: 'SH-BL-M6', name: 'Bulong M6x20 Inox 304', spec: 'Inox 304 ren mịn chống rỉ', qty: 350, unit: 'hộp', note: 'Hàng chuẩn 5S' },
  { code: 'SH-BL-M8', name: 'Bulong M8x25 Thép Mạ Kẽm', spec: 'Thép mạ kẽm cấp bền 8.8', qty: 280, unit: 'hộp', note: 'Hàng xuất xưởng' },
  { code: 'SH-OC-M6', name: 'Ốc Vít Lục Giác M6', spec: 'Thép đen phủ photphat', qty: 500, unit: 'hộp', note: 'Linh kiện nồi cơm' },
  { code: 'SH-OC-M8', name: 'Đai Ốc Tự Khóa Inox M8', spec: 'Inox 304 có vòng đệm nylon', qty: 420, unit: 'hộp', note: 'Linh kiện bếp ga' },
  { code: 'SH-MN-1000', name: 'Mâm Nhiệt Nồi Cơm Điện 1.8L', spec: 'Nhôm đúc 220V - 700W', qty: 120, unit: 'cái', note: 'Đã kiểm định QC' },
  { code: 'SH-MN-1500', name: 'Mâm Nhiệt Bếp Hồng Ngoại', spec: 'Dây mayso kép 220V - 2000W', qty: 95, unit: 'cái', note: 'Đạt chuẩn CE' },
  { code: 'SH-RL-100', name: 'Rơle Nhiệt Ấm Siêu Tốc 100°C', spec: 'KSD301 tự ngắt khi sôi', qty: 450, unit: 'cái', note: 'Hàng nhập khẩu' },
  { code: 'SH-RL-150', name: 'Rơle Bảo Vệ Quá Nhiệt Nồi Chiên', spec: 'Tự ngắt an toàn 250V 16A', qty: 320, unit: 'cái', note: 'Linh kiện loại A' },
  { code: 'SH-CT-220', name: 'Công Tắc Bập Bênh 3 Chân Đèn Báo', spec: '250V 16A chịu nhiệt cao', qty: 600, unit: 'cái', note: 'Linh kiện ấm đun' },
  { code: 'SH-CT-XOAY', name: 'Núm Xoay Điều Khiển Cơ Quạt', spec: 'Nhựa ABS chống cháy cấp V0', qty: 380, unit: 'cái', note: 'Hàng mới nhập kho' },
  { code: 'SH-MQ-B4', name: 'Mô Tơ Quạt Đứng B4 Dây Đồng', spec: '220V 50Hz 47W 100% đồng', qty: 110, unit: 'bộ', note: 'Linh kiện quạt mát' },
  { code: 'SH-CQ-400', name: 'Cánh Quạt 5 Cánh Trong Suốt 40cm', spec: 'Nhựa AS dẻo cao cấp', qty: 160, unit: 'cái', note: 'Đóng thùng carton' },
  { code: 'SH-BM-BT', name: 'Bo Mạch Điều Khiển Bếp Từ Đơn', spec: 'IGBT 25A tụ lọc cao cấp', qty: 85, unit: 'bộ', note: 'Khu vực nhạy cảm ESD' },
  { code: 'SH-BM-NC', name: 'Bo Mạch Vi Xử Lý Nồi Cơm Điện Tử', spec: 'Chip MCU 8-bit lập trình sẵn', qty: 140, unit: 'bộ', note: 'Bảo quản chống ẩm' },
  { code: 'SH-DC-3X15', name: 'Dây Nguồn Đúc Liền Phích Cắm 1.5m', spec: 'Lõi đồng 3x1.5mm2 bọc PVC', qty: 400, unit: 'sợi', note: 'Chịu tải 16A' },
  { code: 'SH-DC-2X075', name: 'Dây Điện Chịu Nhiệt Silicone', spec: 'Lõi mạ thiếc 200°C', qty: 850, unit: 'mét', note: 'Dây luồn ống cách điện' },
  { code: 'SH-VT-NC18', name: 'Vỏ Thân Nồi Cơm Điện 1.8L Inox', spec: 'Inox xước trang trí in lụa', qty: 90, unit: 'cái', note: 'Pallet bọc màng co' },
  { code: 'SH-VT-AST17', name: 'Thân Ấm Siêu Tốc 1.7L Inox 304', spec: 'Inox 304 2 lớp chống bỏng', qty: 210, unit: 'cái', note: 'Đã dán tem bảo hành' },
  { code: 'SH-GD-SIL', name: 'Gioăng Silicone Chịu Nhiệt Nồi Áp Suất', spec: 'Silicone thực phẩm phi 22cm', qty: 550, unit: 'cái', note: 'Chứng nhận FDA' },
  { code: 'SH-GD-NC', name: 'Gioăng Nắp Phụ Nồi Cơm Điện Tử', spec: 'Cao su EPDM chịu nhiệt 150°C', qty: 480, unit: 'cái', note: 'Chống tràn hơi nước' },
  { code: 'SH-KN-AST', name: 'Kính Thủy Báo Mực Nước Ấm Đun', spec: 'Nhựa PP trong suốt chịu nhiệt', qty: 300, unit: 'cái', note: 'Khay linh kiện 5S' },
  { code: 'SH-TC-BT', name: 'Mặt Kính Ceramic Bếp Từ Đơn', spec: 'Kính chịu sốc nhiệt 800°C', qty: 75, unit: 'tấm', note: 'Hàng dễ vỡ ⚠️' },
  { code: 'SH-LH-NC', name: 'Lòng Nồi Cơm 1.8L Phủ Men Chống Dính', spec: 'Hợp kim nhôm 2.5mm tráng Whitford', qty: 130, unit: 'cái', note: 'Chống dính cao cấp' },
  { code: 'SH-LH-AS', name: 'Lòng Nồi Áp Suất Đa Năng 6L', spec: 'Nhôm tấm 3.0mm phủ Daikin', qty: 80, unit: 'cái', note: 'Đạt chuẩn xuất khẩu' },
  { code: 'SH-VP-NC', name: 'Van Xả Áp Suất Tự Động', spec: 'Đồng mạ niken lò xo inox', qty: 340, unit: 'cái', note: 'An toàn áp lực cao' },
  { code: 'SH-NC-AST', name: 'Nắp Ấm Siêu Tốc Bật Mở Lò Xo', spec: 'Nhựa PP bọc inox 304', qty: 260, unit: 'cái', note: 'Kèm nút bấm mở' },
  { code: 'SH-DB-AST', name: 'Đế Tiếp Điện Ấm Siêu Tốc 360°', spec: 'Mâm đồng Strix cao cấp', qty: 310, unit: 'bộ', note: 'Tiêu chuẩn châu Âu' },
  { code: 'SH-DK-BL', name: 'Điều Khiển Từ Xa Quạt Cây', spec: 'Pin CR2025 sóng hồng ngoại', qty: 220, unit: 'cái', note: 'Kèm pin kèm theo' },
  { code: 'SH-CB-ND', name: 'Cảm Biến Nhiệt NTC 100K Nồi Cơm', spec: 'Đầu dò ren M4 dây bọc teflon', qty: 430, unit: 'cái', note: 'Độ chính xác ±1%' },
  { code: 'SH-CB-AP', name: 'Cảm Biến Áp Suất Điện Tử', spec: '0 - 100kPa ngõ ra analog', qty: 190, unit: 'cái', note: 'Kiểm định 100%' },
  { code: 'SH-TR-BL6', name: 'Trục Đỡ Quạt Bạc Đạn Đồng Thau', spec: 'Thép tôi cứng phi 8mm', qty: 240, unit: 'cái', note: 'Chống mài mòn' },
  { code: 'SH-BG-NC', name: 'Bản Lề Khóa Nắp Nồi Cơm', spec: 'Inox 304 có lò xo trợ lực', qty: 310, unit: 'cái', note: 'Linh kiện Sunhouse' },
  { code: 'SH-DN-BT', name: 'Đèn LED Hiển Thị Bếp Từ 4 Số', spec: 'LED 7 đoạn màu đỏ siêu sáng', qty: 400, unit: 'cái', note: 'Kiểm tra 100%' },
  { code: 'SH-MD-12V', name: 'Mô Tơ Đảo Gió Quạt Hộp 12V', spec: 'Động cơ bước 5 dây giảm tốc', qty: 180, unit: 'bộ', note: 'Hoạt động êm ái' },
  { code: 'SH-CC-10A', name: 'Cầu Chì Nhiệt Bảo Vệ 10A 250V', spec: 'Nhiệt độ đứt 185°C', qty: 900, unit: 'cái', note: 'Đạt chuẩn an toàn' },
  { code: 'SH-OC-M4', name: 'Vít Tự Khoan Đầu Bằng M4x15', spec: 'Inox 304 ren sâu', qty: 750, unit: 'hộp', note: 'Khay linh kiện 5S' },
  { code: 'SH-QD-AST', name: 'Quai Cầm Ấm Siêu Tốc Cách Nhiệt', spec: 'Nhựa Bakelite chịu nhiệt cao', qty: 220, unit: 'cái', note: 'Chống trượt 5S' },
  { code: 'SH-TT-BT', name: 'Tấm Tản Nhiệt Nhôm Khối Bếp Từ', spec: 'Nhôm định hình anodized đen', qty: 150, unit: 'cái', note: 'Tản nhiệt nhanh' }
];

export const STANDARD_30_SLOT_SAMPLES = STANDARD_SLOT_SAMPLES;

/**
 * Generates the standard sequential position code (e.g. G01 to G30 or C01 to C36)
 */
export function getStandardSlotCode(
  bay: string,
  tier: number,
  slot: number,
  bayNumbers: string[] = ['01', '02', '03', '04', '05'],
  itemsPerBay: number = 2,
  prefix: string = 'G',
  tierCount: number = 3
): string {
  const bIdx = Math.max(0, bayNumbers.indexOf(bay));
  const bayOffset = bIdx >= 0 ? bIdx : (parseInt(bay, 10) - 1 || 0);
  
  // In each bay:
  // Tier 1 (Ground) is offset 0
  // Tier 2 is offset itemsPerBay
  // Tier 3 is offset itemsPerBay * 2 ...
  const tierOffset = (tier - 1) * itemsPerBay;
  const slotOffset = slot - 1;
  const seqNumber = bayOffset * (tierCount * itemsPerBay) + tierOffset + slotOffset + 1;
  
  return `${prefix}${seqNumber < 10 ? '0' + seqNumber : seqNumber}`;
}

/**
 * Calculates (bayId, tier, slot) from sequential index (1 to N)
 */
export function getSlotCoordinatesFromSeq(
  seqNumber: number,
  bayNumbers: string[] = ['01', '02', '03', '04', '05'],
  itemsPerBay: number = 2,
  tierCount: number = 3
): { bayId: string; tier: number; slot: number } {
  const zeroIdx = seqNumber - 1;
  const slotsPerBay = tierCount * itemsPerBay;
  const bIdx = Math.floor(zeroIdx / slotsPerBay);
  const bayId = bIdx < bayNumbers.length ? bayNumbers[bIdx] : String(bIdx + 1).padStart(2, '0');
  
  const remainderInBay = zeroIdx % slotsPerBay;
  const tier = Math.floor(remainderInBay / itemsPerBay) + 1; // 1 (Ground) to tierCount
  const slot = (remainderInBay % itemsPerBay) + 1; // 1 to itemsPerBay
  
  return { bayId, tier, slot };
}

/**
 * Fast prefix replacer: replaces existing letter prefix (e.g., 'G') with new prefix (e.g., 'C'),
 * while keeping all sequence numbers intact!
 * Example: "G01" -> "C01", "G30" -> "C30", "G12-A" -> "C12-A"
 */
export function replacePrefixInLabel(label: string, oldPrefix: string, newPrefix: string): string {
  if (!label) return label;
  const trimmedOld = oldPrefix.trim();
  const trimmedNew = newPrefix.trim();
  
  if (trimmedOld && label.startsWith(trimmedOld)) {
    return trimmedNew + label.slice(trimmedOld.length);
  }
  
  // Regex fallback: match leading letters followed by digits (e.g., "G05" -> "C05")
  const match = label.match(/^([A-Za-z]+)(\d+.*)$/);
  if (match) {
    return `${trimmedNew}${match[2]}`;
  }
  
  return label;
}

/**
 * Batch replaces prefix for all slot labels of a rack in customLabels dictionary
 */
export function batchReplacePrefixForRack(
  customLabels: { [key: string]: string },
  rackId: string,
  oldPrefix: string,
  newPrefix: string,
  bayNumbers: string[] = ['01', '02', '03', '04', '05'],
  itemsPerBay: number = 2,
  tierCount: number = 3
): { [key: string]: string } {
  const updated = { ...customLabels };
  const targetPrefix = rackId ? `${rackId}-` : '';

  // 1. Process all existing keys for this rack
  Object.keys(updated).forEach(key => {
    if (!targetPrefix || key.startsWith(targetPrefix)) {
      const currentLabel = updated[key];
      if (currentLabel) {
        updated[key] = replacePrefixInLabel(currentLabel, oldPrefix, newPrefix);
      }
    }
  });

  // 2. Ensure all valid slots have the updated prefix even if not previously customized
  bayNumbers.forEach(bay => {
    for (let t = 1; t <= tierCount; t++) {
      for (let s = 1; s <= itemsPerBay; s++) {
        const key = `${rackId}-${bay}-${t}-${s}`;
        const currentVal = updated[key];
        if (currentVal) {
          updated[key] = replacePrefixInLabel(currentVal, oldPrefix, newPrefix);
        } else {
          updated[key] = getStandardSlotCode(bay, t, s, bayNumbers, itemsPerBay, newPrefix, tierCount);
        }
      }
    }
  });

  return updated;
}

/**
 * Generates and downloads standard Excel Template (.xlsx) matching warehouse format
 */
export function exportStandardRackExcelTemplate(
  rackId: string = 'A',
  rackName: string = 'KỆ A - KHU VỰC LINH KIỆN CHUẨN SUNHOUSE',
  items: InventoryItem[] = [],
  customLabels: { [key: string]: string } = {},
  itemsPerBay: number = 2,
  bayNumbers: string[] = ['01', '02', '03', '04', '05'],
  tierCount: number = 3
) {
  const rows: any[] = [];
  let seq = 1;

  bayNumbers.forEach((bay) => {
    for (let tier = 1; tier <= tierCount; tier++) {
      for (let s = 1; s <= itemsPerBay; s++) {
        const slotKey = `${rackId}-${bay}-${tier}-${s}`;
        const defaultCode = getStandardSlotCode(bay, tier, s, bayNumbers, itemsPerBay, 'G', tierCount);
        const displaySlotCode = customLabels[slotKey] || defaultCode;
        
        // Find if an item exists
        const locCode = `${rackId}-${bay}-${tier}-${s}`;
        const locCodeSimple = `${rackId}-${bay}-${tier}`;
        const foundItem = items.find(i => 
          i.location === locCode || 
          (i.rackId === rackId && i.bayId === bay && i.tier === tier && (i.slot === s || (!i.slot && s === 1))) ||
          (s === 1 && i.location === locCodeSimple)
        );

        // Fallback sample data if empty
        const sample = STANDARD_SLOT_SAMPLES[(seq - 1) % STANDARD_SLOT_SAMPLES.length];

        let tierName = `Tầng ${tier}`;
        if (tierCount === 3) {
          tierName = tier === 1 ? 'Tầng 1 (Mặt Đất - Đỏ)' : tier === 2 ? 'Tầng 2 (Mức B Giữa - Xanh)' : 'Tầng 3 (Mức A Cao - Vàng)';
        } else if (tierCount === 4) {
          tierName = tier === 1 ? 'Tầng 1 (Mặt Đất - Đỏ)' : tier === 2 ? 'Tầng 2 (Mức C - Xanh Dương)' : tier === 3 ? 'Tầng 3 (Mức B - Cam/Xanh Lá)' : 'Tầng 4 (Mức A Cao Nhất - Vàng)';
        }
        const slotPosName = itemsPerBay === 2 ? (s === 1 ? 'Vị trí 1 (Trái)' : 'Vị trí 2 (Phải)') : (s === 1 ? 'Vị trí 1 (Trái)' : s === 2 ? 'Vị trí 2 (Giữa)' : 'Vị trí 3 (Phải)');

        rows.push({
          'STT': seq,
          'Mã Vị Trí': displaySlotCode,
          'Mã Kệ': rackId,
          'Khoang': bay,
          'Tầng': tier,
          'Tên Tầng': tierName,
          'Vị Trí Ô': slotPosName,
          'Mã SKU': foundItem?.code || sample.code,
          'Tên Linh Kiện / Hàng Hóa': foundItem?.name || sample.name,
          'Quy Cách / Thông Số': foundItem?.spec || sample.spec,
          'Số Lượng': foundItem?.quantity !== undefined ? foundItem.quantity : sample.qty,
          'Đơn Vị Tính': foundItem?.unit || sample.unit,
          'Mức Tồn Tối Thiểu': foundItem?.minQuantity || 20,
          'Trạng Thái': foundItem?.status || 'in_stock',
          'Ghi Chú 5S': foundItem?.note || sample.note,
        });

        seq++;
      }
    }
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths for beautiful Excel formatting
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Mã Vị Trí
    { wch: 8 },  // Mã Kệ
    { wch: 8 },  // Khoang
    { wch: 6 },  // Tầng
    { wch: 28 }, // Tên Tầng
    { wch: 18 }, // Vị Trí Ô
    { wch: 16 }, // Mã SKU
    { wch: 38 }, // Tên Linh Kiện
    { wch: 30 }, // Quy Cách
    { wch: 12 }, // Số Lượng
    { wch: 12 }, // Đơn Vị
    { wch: 16 }, // Mức Tồn Min
    { wch: 14 }, // Trạng Thái
    { wch: 25 }, // Ghi Chú
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const totalSlots = bayNumbers.length * tierCount * itemsPerBay;
  XLSX.utils.book_append_sheet(wb, ws, `Ke_${rackId}_${totalSlots}ViTri`);

  // Download file
  const fileName = `Mau_Excel_Ke_${rackId}_${tierCount}Tang_${bayNumbers.length}Khoang_${totalSlots}ViTri_Sunhouse.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Parses uploaded Excel file (.xlsx, .xls, .csv) and returns mapped positions and items
 */
export async function parseExcelRackFile(
  file: File,
  activeRackId: string = 'A',
  currentItems: InventoryItem[] = [],
  itemsPerBay: number = 2,
  bayNumbers: string[] = ['01', '02', '03', '04', '05'],
  tierCount: number = 3
): Promise<ExcelImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            message: 'Không thể đọc nội dung file Excel.',
            totalParsed: 0,
            parsedSlots: [],
            customLabels: {},
            updatedItems: currentItems
          });
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        if (!worksheet) {
          resolve({
            success: false,
            message: 'File Excel không có dữ liệu Sheet nào.',
            totalParsed: 0,
            parsedSlots: [],
            customLabels: {},
            updatedItems: currentItems
          });
          return;
        }

        // Convert sheet to JSON rows
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            message: 'File Excel không chứa dòng dữ liệu nào.',
            totalParsed: 0,
            parsedSlots: [],
            customLabels: {},
            updatedItems: currentItems
          });
          return;
        }

        const customLabels: { [key: string]: string } = {};
        const parsedSlots: ParsedSlotData[] = [];
        const newItems = [...currentItems];

        rawJson.forEach((row, idx) => {
          // Normalize column headers to lowercase
          const getVal = (keys: string[]): string => {
            for (const k of Object.keys(row)) {
              const lowerKey = k.trim().toLowerCase();
              if (keys.some(target => lowerKey.includes(target.toLowerCase()))) {
                return String(row[k] || '').trim();
              }
            }
            return '';
          };

          let slotCode = getVal(['mã vị trí', 'mã ô', 'vị trí', 'mã số', 'code', 'slotcode']);
          
          // Try to extract bay, tier, slot
          let bayStr = getVal(['khoang', 'bay']);
          let tierStr = getVal(['tầng', 'tier', 'level']);
          let slotStr = getVal(['vị trí ô', 'vị trí', 'ô', 'slot']);

          // Clean up values
          let bay = bayStr.replace(/\D/g, '');
          if (bay.length === 1) bay = '0' + bay;
          if (!bay || !bayNumbers.includes(bay)) {
            // Calculate coordinates from sequential row index
            const coords = getSlotCoordinatesFromSeq(idx + 1, bayNumbers, itemsPerBay, tierCount);
            bay = coords.bayId;
          }

          let tier = parseInt(tierStr.replace(/\D/g, ''), 10);
          if (isNaN(tier) || tier < 1 || tier > tierCount) {
            const coords = getSlotCoordinatesFromSeq(idx + 1, bayNumbers, itemsPerBay, tierCount);
            tier = coords.tier;
          }

          let slot = parseInt(slotStr.replace(/\D/g, ''), 10);
          if (isNaN(slot) || slot < 1 || slot > itemsPerBay) {
            const coords = getSlotCoordinatesFromSeq(idx + 1, bayNumbers, itemsPerBay, tierCount);
            slot = coords.slot;
          }

          // If slotCode is empty, generate standard code G01..GN
          if (!slotCode) {
            slotCode = getStandardSlotCode(bay, tier, slot, bayNumbers, itemsPerBay, 'G', tierCount);
          }

          // Extract Item attributes
          const itemCode = getVal(['mã sku', 'mã vật tư', 'mã sp', 'sku', 'code']) || `SH-LK-${String(idx + 1).padStart(3, '0')}`;
          const itemName = getVal(['tên linh kiện', 'tên hàng hóa', 'tên vật tư', 'tên sản phẩm', 'name', 'item']) || `Linh kiện ${slotCode}`;
          const spec = getVal(['quy cách', 'thông số', 'chủng loại', 'spec', 'description']) || 'Quy cách chuẩn';
          const qtyRaw = getVal(['số lượng', 'tồn kho', 'quantity', 'qty']);
          const quantity = Math.max(0, parseInt(qtyRaw.replace(/[^0-9]/g, ''), 10) || 100);
          const unit = getVal(['đơn vị', 'đvt', 'unit']) || 'cái';
          const statusRaw = getVal(['trạng thái', 'status']).toLowerCase();
          const status: 'in_stock' | 'low_stock' | 'out_of_stock' = 
            statusRaw.includes('hết') || statusRaw.includes('out') ? 'out_of_stock' :
            statusRaw.includes('thấp') || statusRaw.includes('low') || quantity < 20 ? 'low_stock' : 'in_stock';
          const note = getVal(['ghi chú', 'note', '5s']) || 'Đồng bộ từ Excel';

          // Set custom label for 3D visual tag
          const slotKey = `${activeRackId}-${bay}-${tier}-${slot}`;
          customLabels[slotKey] = slotCode;

          // Push to parsed slots list
          parsedSlots.push({
            index: idx + 1,
            slotCode,
            bayId: bay,
            tier,
            slot,
            itemCode,
            itemName,
            quantity,
            unit,
            spec,
            status,
            note
          });

          // Update or insert item in inventory state
          const locString = `${activeRackId}-${bay}-${tier}-${slot}`;
          const existingItemIndex = newItems.findIndex(i => 
            i.location === locString || 
            (i.rackId === activeRackId && i.bayId === bay && i.tier === tier && i.slot === slot)
          );

          const updatedItemObj: InventoryItem = {
            id: existingItemIndex >= 0 ? newItems[existingItemIndex].id : `item-auto-${activeRackId}-${bay}-${tier}-${slot}-${Date.now()}`,
            code: itemCode,
            name: itemName,
            category: 'Linh kiện Sunhouse',
            location: locString,
            rackId: activeRackId,
            bayId: bay,
            tier,
            slot,
            direction: '→',
            spec,
            unit,
            quantity,
            minQuantity: 20,
            status,
            barcode: `893${activeRackId}${bay}${tier}${slot}${String(quantity).slice(0, 3)}`,
            updatedAt: new Date().toISOString(),
            note
          };

          if (existingItemIndex >= 0) {
            newItems[existingItemIndex] = updatedItemObj;
          } else {
            newItems.push(updatedItemObj);
          }
        });

        resolve({
          success: true,
          message: `Đã nạp thành công ${parsedSlots.length} vị trí kệ từ file Excel! Các nhãn mã đã được đồng bộ tự động lên mô hình 3D.`,
          totalParsed: parsedSlots.length,
          parsedSlots,
          customLabels,
          updatedItems: newItems
        });
      } catch (err: any) {
        console.error('Lỗi khi đọc file Excel:', err);
        resolve({
          success: false,
          message: `Lỗi khi xử lý file: ${err?.message || 'Định dạng file không tương thích.'}`,
          totalParsed: 0,
          parsedSlots: [],
          customLabels: {},
          updatedItems: currentItems
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        message: 'Lỗi khi đọc dữ liệu từ file.',
        totalParsed: 0,
        parsedSlots: [],
        customLabels: {},
        updatedItems: currentItems
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Generates sample items for a rack (customizable tier count, bay count, items per bay)
 */
export function generateSampleItemsForRack(
  rackId: string = 'A',
  bayNumbers: string[] = ['01', '02', '03', '04', '05'],
  itemsPerBay: number = 2,
  tierCount: number = 3,
  prefix: string = 'G'
): InventoryItem[] {
  const newItems: InventoryItem[] = [];
  let seq = 1;

  bayNumbers.forEach((bay) => {
    for (let tier = 1; tier <= tierCount; tier++) {
      for (let s = 1; s <= itemsPerBay; s++) {
        const slotCode = getStandardSlotCode(bay, tier, s, bayNumbers, itemsPerBay, prefix, tierCount);
        const sample = STANDARD_SLOT_SAMPLES[(seq - 1) % STANDARD_SLOT_SAMPLES.length];
        const locCode = `${rackId}-${bay}-${tier}-${s}`;

        newItems.push({
          id: `item-${rackId}-${bay}-${tier}-${s}`,
          code: sample.code,
          name: sample.name,
          category: tier === 1 ? 'Hàng Nặng / Kim Loại' : tier === 2 ? 'Linh Kiện Lắp Ráp' : tier === 3 ? 'Phụ Kiện Điện Tử' : 'Vỏ Thân & Hàng Nhẹ',
          location: locCode,
          rackId,
          bayId: bay,
          tier,
          slot: s,
          direction: s === 1 ? '↑' : s === 2 ? '→' : '↓',
          spec: sample.spec,
          unit: sample.unit,
          quantity: sample.qty,
          minQuantity: Math.round(sample.qty * 0.2),
          status: sample.qty < 50 ? 'low_stock' : 'in_stock',
          barcode: `89360${String(seq).padStart(3, '0')}${rackId}`,
          updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          note: sample.note,
        });

        seq++;
      }
    }
  });

  return newItems;
}

export function generate30SampleItemsForRack(
  rackId: string = 'A',
  bayNumbers: string[] = ['01', '02', '03', '04', '05'],
  itemsPerBay: number = 2
): InventoryItem[] {
  return generateSampleItemsForRack(rackId, bayNumbers, itemsPerBay, 3, 'G');
}
