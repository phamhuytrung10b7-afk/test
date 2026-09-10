import { 
  BoardConfig, 
  WarehouseRack, 
  WarehouseFacilityObject, 
  MapTextAnnotation, 
  FloorMarking, 
  WarehouseZone, 
  InventoryItem, 
  SafetyRule, 
  WarehousePosition 
} from './types';

import {
  initialBoardConfig,
  defaultRacks,
  defaultFacilities,
  defaultAnnotations,
  defaultFloorMarkings,
  defaultZones,
  defaultItems,
  defaultSafetyRules,
  defaultPositions
} from './defaultWarehouse';

export const STORAGE_KEYS = {
  BOARD_CONFIG: 'sunhouse_warehouse_board_config',
  RACKS: 'sunhouse_warehouse_racks',
  FACILITIES: 'sunhouse_warehouse_facilities',
  ANNOTATIONS: 'sunhouse_warehouse_annotations',
  FLOOR_MARKINGS: 'sunhouse_warehouse_floor_markings',
  ZONES: 'sunhouse_warehouse_zones',
  ITEMS: 'sunhouse_warehouse_items',
  SAFETY_RULES: 'sunhouse_warehouse_safety_rules',
  CURRENT_POSITION: 'sunhouse_warehouse_current_position',
  VIEW_MODE: 'sunhouse_warehouse_view_mode',
  LAST_SAVED: 'sunhouse_warehouse_last_saved_at',
  CUSTOM_SLOT_LABELS: 'sunhouse_warehouse_custom_slot_labels',
  APP_VERSION: 'sunhouse_warehouse_version'
} as const;

export const CURRENT_STORAGE_VERSION = '2.5.0';

/**
 * Generic safe loader from localStorage
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const serialized = localStorage.getItem(key);
    if (!serialized) return fallback;
    const parsed = JSON.parse(serialized);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.warn(`[LocalStorage] Error loading key "${key}":`, error);
    return fallback;
  }
}

/**
 * Generic safe writer to localStorage
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
    return true;
  } catch (error) {
    console.error(`[LocalStorage] Error saving key "${key}":`, error);
    return false;
  }
}

export interface StoredWarehouseBundle {
  boardConfig: BoardConfig;
  racks: WarehouseRack[];
  facilities: WarehouseFacilityObject[];
  annotations: MapTextAnnotation[];
  floorMarkings: FloorMarking[];
  zones: WarehouseZone[];
  items: InventoryItem[];
  safetyRules: SafetyRule[];
  currentPosition: WarehousePosition;
  viewMode: 'board' | '3d_map' | 'single_rack' | 'single_rack_4t3k' | 'slotting';
}

function deduplicateById<T extends { id: string }>(items: T[], prefix: string = 'item'): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.map((item, index) => {
    let id = item.id ? String(item.id).trim() : `${prefix}-${index + 1}`;
    if (!id || seen.has(id.toUpperCase())) {
      let counter = 1;
      let newId = `${id || prefix}-${counter}`;
      while (seen.has(newId.toUpperCase())) {
        counter++;
        newId = `${id || prefix}-${counter}`;
      }
      id = newId;
    }
    seen.add(id.toUpperCase());
    return { ...item, id };
  });
}

/**
 * Load complete initial state from LocalStorage or fall back to defaults
 */
export function loadAllWarehouseState(): StoredWarehouseBundle {
  const loadedRacks = loadFromStorage<WarehouseRack[]>(STORAGE_KEYS.RACKS, defaultRacks);
  const loadedFacilities = loadFromStorage<WarehouseFacilityObject[]>(STORAGE_KEYS.FACILITIES, defaultFacilities);
  const loadedAnnotations = loadFromStorage<MapTextAnnotation[]>(STORAGE_KEYS.ANNOTATIONS, defaultAnnotations);
  const loadedFloorMarkings = loadFromStorage<FloorMarking[]>(STORAGE_KEYS.FLOOR_MARKINGS, defaultFloorMarkings);
  const loadedItems = loadFromStorage<InventoryItem[]>(STORAGE_KEYS.ITEMS, defaultItems);
  const loadedZones = loadFromStorage<WarehouseZone[]>(STORAGE_KEYS.ZONES, defaultZones);
  const loadedSafetyRules = loadFromStorage<SafetyRule[]>(STORAGE_KEYS.SAFETY_RULES, defaultSafetyRules);

  return {
    boardConfig: loadFromStorage<BoardConfig>(STORAGE_KEYS.BOARD_CONFIG, initialBoardConfig),
    racks: deduplicateById(loadedRacks, 'RACK'),
    facilities: deduplicateById(loadedFacilities, 'FAC'),
    annotations: deduplicateById(loadedAnnotations, 'ANN'),
    floorMarkings: deduplicateById(loadedFloorMarkings, 'FM'),
    zones: deduplicateById(loadedZones, 'ZONE'),
    items: deduplicateById(loadedItems, 'ITEM'),
    safetyRules: deduplicateById(loadedSafetyRules, 'RULE'),
    currentPosition: loadFromStorage<WarehousePosition>(STORAGE_KEYS.CURRENT_POSITION, defaultPositions[0]),
    viewMode: loadFromStorage<'board' | '3d_map' | 'single_rack' | 'single_rack_4t3k' | 'slotting'>(STORAGE_KEYS.VIEW_MODE, 'board'),
  };
}

/**
 * Save all warehouse entities to LocalStorage simultaneously
 */
export function saveAllWarehouseState(bundle: StoredWarehouseBundle): boolean {
  try {
    saveToStorage(STORAGE_KEYS.BOARD_CONFIG, bundle.boardConfig);
    saveToStorage(STORAGE_KEYS.RACKS, bundle.racks);
    saveToStorage(STORAGE_KEYS.FACILITIES, bundle.facilities);
    saveToStorage(STORAGE_KEYS.ANNOTATIONS, bundle.annotations);
    saveToStorage(STORAGE_KEYS.FLOOR_MARKINGS, bundle.floorMarkings);
    saveToStorage(STORAGE_KEYS.ZONES, bundle.zones);
    saveToStorage(STORAGE_KEYS.ITEMS, bundle.items);
    saveToStorage(STORAGE_KEYS.SAFETY_RULES, bundle.safetyRules);
    saveToStorage(STORAGE_KEYS.CURRENT_POSITION, bundle.currentPosition);
    saveToStorage(STORAGE_KEYS.VIEW_MODE, bundle.viewMode);
    saveToStorage(STORAGE_KEYS.APP_VERSION, CURRENT_STORAGE_VERSION);
    return true;
  } catch (error) {
    console.error('[LocalStorage] Failed to bundle save:', error);
    return false;
  }
}

/**
 * Completely clear warehouse LocalStorage keys (Reset)
 */
export function clearWarehouseStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem('sunhouse_rack_guide_custom_image');
  } catch (error) {
    console.warn('[LocalStorage] Error clearing warehouse keys:', error);
  }
}

/**
 * Get formatted last saved time
 */
export function getLastSavedTimestamp(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
    if (!raw) return null;
    const date = new Date(raw);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return null;
  }
}
