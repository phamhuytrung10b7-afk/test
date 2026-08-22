export interface MapTextAnnotation {
  id: string;
  textVi: string; // "KHU VỰC ĐÓNG GÓI", "LỐI ĐI 5S", etc.
  textEn?: string; // "PACKING AREA", "MAIN AISLE", etc.
  x: number; // 0 - 100 percentage grid
  y: number; // 0 - 100 percentage grid
  z?: number; // elevation
  fontSize: number; // e.g. 12, 14, 16
  color: string; // e.g. "#0f172a", "#1e3a8a", "#0284c7"
  badge5s?: string; // e.g. "5S", "PCCC"
  rotation?: number; // rotation in degrees
}

export interface FloorMarking {
  id: string;
  name: string;
  type: 'box' | 'line';
  x: number; // percentage grid
  y: number;
  width?: number; // for box type
  length?: number; // for box type
  x2?: number; // for line type
  y2?: number; // for line type
  rotation?: number; // rotation in degrees (e.g., 0, 30, 45, 90, etc.)
  color: string; // default "#facc15" (Yellow 5S)
  strokeWidth?: number; // default 2.5
  fillOpacity?: number; // default 0.05
}

export type FacilityObjectType = 
  | 'rack' 
  | 'mezzanine' 
  | 'bin_rack'
  | 'pallet_staging' 
  | 'conveyor' 
  | 'agv' 
  | 'workstation' 
  | 'aisle' 
  | 'planter' 
  | 'door';

export interface WarehouseFacilityObject {
  id: string;
  name: string;
  type: FacilityObjectType;
  x: number; // percentage / grid (0 - 100)
  y: number; // percentage / grid (0 - 100)
  width: number;
  length: number;
  height?: number; // 3D elevation or vertical height
  color: string;
  category?: string;
  rotation?: number; // 0, 90, 180, 270 degrees
  // Specific facility configuration parameters
  baysCount?: number;
  tiersCount?: number;
  boxCols?: number;
  boxRows?: number;
  boxHeight?: number;
  laneCount?: number;
  totesPerLane?: number;
  hasStairs?: boolean;
  hasTugger?: boolean;
  hasAndonBoard?: boolean;
  hasFloorArrow?: boolean;
  notes?: string;
}

export interface WarehousePosition {
  x: number; // percentage (0 - 100) on the map coordinate system
  y: number; // percentage (0 - 100)
  label: string;
  rackId?: string;
  bayId?: string;
  zoneId?: string;
  objectId?: string;
  tier?: number;
  slot?: number;
}

export interface RackBay {
  id: string;
  bayNumber: string; // e.g. "01", "02", "03"
  tiers: number; // number of levels (e.g. 4)
  slotsPerTier: number; // slots per level (e.g. 2 or 3)
  color: string;
  fillLevel: number; // 0 - 100%
}

export interface WarehouseRack {
  id: string; // "A", "B", "C", "D", "E"
  name: string; // "DÃY 01 (A)", "DÃY 02 (B)", etc.
  colorName: string;
  color: string; // Hex or CSS color
  x: number; // Grid column or isometric coordinate
  y: number;
  rotation?: number; // rotation in degrees
  length: number; // number of bays / length scale
  width?: number; // rack depth / width scale (default ~2.8)
  bayLength?: number; // length per bay (default ~4.0)
  bays: RackBay[];
  category: string; // "Kim loại", "Nhựa", "Bao bì", "Linh kiện"
  rackType?: 'heavy_pallet' | 'bin_shelving' | 'carton_flow';
}

export interface WarehouseZone {
  id: string;
  name: string;
  nameEn: string;
  type: 'packing' | 'shipping' | 'receiving' | 'aisle' | 'storage' | 'office';
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  icon: string;
}

export interface InventoryItem {
  id: string;
  code: string; // "001", "002", "VT-019"
  name: string; // "Bulong M6x20", "Bulong M8x20"
  category: string;
  location: string; // "A-02-3-2"
  rackId: string; // "A"
  bayId: string; // "02"
  tier: number; // 3
  slot: number; // 2
  direction: '↑' | '↓' | '←' | '→';
  spec: string; // "Thép mạ kẽm", "Inox 304", "Quy cách chuẩn"
  unit: string; // "Hộp (500 cái)", "Bao (25kg)", "Con"
  quantity: number;
  minQuantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  barcode: string;
  updatedAt: string;
  note?: string;
}

export interface SafetyRule {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: '5S' | 'PCCC' | 'AN TOÀN';
}

export interface BoardConfig {
  companyName: string;
  companyLogoText: string;
  boardTitle: string;
  boardSubtitle: string;
  warehouseCode: string; // e.g. "NMBD" (Nhà Máy Bình Dương)
  warehouseName: string;
  currentStationName: string; // e.g. "RACK A - BAY 02"
  currentStationCode: string;
  themeColor: string;
  guideImageUrl?: string; // Custom uploaded image for Rack Reading Guide
  guideImageFit?: 'contain' | 'cover';
}
