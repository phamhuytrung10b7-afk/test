import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { ManualDPadController } from './ManualDPadController';
import { 
  WarehouseRack, 
  WarehouseZone, 
  WarehousePosition, 
  InventoryItem, 
  WarehouseFacilityObject, 
  FacilityObjectType,
  MapTextAnnotation,
  FloorMarking
} from './types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Compass, 
  MapPin, 
  Plus, 
  Trash2, 
  Move, 
  Maximize2, 
  Minimize2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Sliders, 
  Check, 
  Edit3, 
  X,
  Sparkles,
  Type,
  Palette,
  RotateCw,
  Eye,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  CheckCircle2,
  Tag,
  Camera,
  Download,
  Image as ImageIcon,
  Sun,
  Moon,
  Crop
} from 'lucide-react';

interface IsometricWarehouseCanvasProps {
  racks: WarehouseRack[];
  onUpdateRacks?: (racks: WarehouseRack[]) => void;
  facilities?: WarehouseFacilityObject[];
  onUpdateFacilities?: (facilities: WarehouseFacilityObject[]) => void;
  annotations?: MapTextAnnotation[];
  onUpdateAnnotations?: (annotations: MapTextAnnotation[]) => void;
  floorMarkings?: FloorMarking[];
  onUpdateFloorMarkings?: (markings: FloorMarking[]) => void;
  zones: WarehouseZone[];
  currentPosition: WarehousePosition;
  onPositionChange: (newPos: WarehousePosition) => void;
  items?: InventoryItem[];
  onUpdateItems?: (items: InventoryItem[]) => void;
  selectedItem?: InventoryItem | null;
  selectedRackId?: string | null;
  onSelectRack: (rackId: string, bayId?: string) => void;
  isCompact?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const IsometricWarehouseCanvas: React.FC<IsometricWarehouseCanvasProps> = ({
  racks,
  onUpdateRacks,
  facilities = [],
  onUpdateFacilities,
  annotations = [],
  onUpdateAnnotations,
  floorMarkings = [],
  onUpdateFloorMarkings,
  zones,
  currentPosition,
  onPositionChange,
  items = [],
  onUpdateItems,
  selectedItem,
  selectedRackId,
  onSelectRack,
  isCompact = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const [zoom, setZoom] = useState<number>(1.15);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Edit Mode & Universal Object Selection
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{ 
    type: 'rack' | 'facility' | 'annotation' | 'marking'; 
    id: string 
  } | null>(null);
  
  // Dragging State
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ u: number; v: number }>({ u: 0, v: 0 });

  // Quick Add Modals on Canvas
  const [isAddAnnotationModalOpen, setIsAddAnnotationModalOpen] = useState(false);
  const [newAnnVi, setNewAnnVi] = useState('');
  const [newAnnEn, setNewAnnEn] = useState('');
  const [newAnnBadge, setNewAnnBadge] = useState('');
  const [newAnnColor, setNewAnnColor] = useState('#0f172a');
  const [newAnnSize, setNewAnnSize] = useState(12);

  const [isAddMarkingModalOpen, setIsAddMarkingModalOpen] = useState(false);
  const [newMarkingName, setNewMarkingName] = useState('');
  const [newMarkingWidth, setNewMarkingWidth] = useState(25);
  const [newMarkingLength, setNewMarkingLength] = useState(25);

  // Double Click / Inline Quick Edit Modal for Rack
  const [quickEditRack, setQuickEditRack] = useState<{
    isOpen: boolean;
    rackId: string;
    idValue: string;
    nameValue: string;
    colorValue: string;
    colorNameValue: string;
    bayLengthValue: number;
  } | null>(null);

  // Copy / Clipboard State for Racks (Ctrl+C, Ctrl+V)
  const [copiedRack, setCopiedRack] = useState<WarehouseRack | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Studio Photo & Clean Screenshot Mode States
  const [isStudioPhotoMode, setIsStudioPhotoMode] = useState(false);
  const [screenshotBg, setScreenshotBg] = useState<'clean-white' | 'studio-slate' | 'dark-luxury'>('clean-white');
  const [showPinInStudio, setShowPinInStudio] = useState(true);
  const [showLabelsInStudio, setShowLabelsInStudio] = useState(true);
  const [showMarkingsInStudio, setShowMarkingsInStudio] = useState(true);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showCanvasToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick Camera Angles & Presets for Photography
  const handleCameraFitOverview = () => {
    setZoom(1.25);
    setPan({ x: 0, y: 0 });
    showCanvasToast('📍 Đã căn giữa toàn cảnh sơ đồ 3D!');
  };

  const handleCameraFitRacks = () => {
    setZoom(1.65);
    setPan({ x: 30, y: 20 });
    showCanvasToast('📦 Đã cận cảnh khu vực các dãy kệ!');
  };

  const handleCameraFitDelivery = () => {
    setZoom(1.5);
    setPan({ x: -100, y: -40 });
    showCanvasToast('🚚 Đã cận cảnh khu giao nhận / xuất nhập!');
  };

  // High-Res 3D Map PNG Export (Omit UI overlays, 3x sharp scale)
  const handleDownloadPngScreenshot = async () => {
    if (!containerRef.current) return;
    setIsExportingPng(true);
    showCanvasToast('📸 Đang tạo ảnh 3D Ultra HD sắc nét...');
    try {
      await new Promise(r => setTimeout(r, 150));
      const element = containerRef.current;
      const canvas = await html2canvas(element, {
        scale: 3, // Ultra crisp 3x resolution
        useCORS: true,
        backgroundColor: screenshotBg === 'clean-white' ? '#ffffff' : screenshotBg === 'studio-slate' ? '#f1f5f9' : '#0f172a',
        logging: false,
        ignoreElements: (el) => el.classList.contains('no-screenshot'),
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `SoDo_3D_Kho_${currentPosition.label || 'TongKho'}_${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showCanvasToast('✅ Đã tải file ảnh 3D Ultra HD về máy!');
    } catch (err) {
      console.error('PNG Capture error:', err);
      alert('Không thể tải tự động. Bạn có thể dùng phím tắt Windows + Shift + S để cắt ảnh!');
    } finally {
      setIsExportingPng(false);
    }
  };

  // Handle Copy Rack (Ctrl+C)
  const handleCopyRack = (targetRack?: WarehouseRack) => {
    const target = targetRack || 
      (selectedTarget?.type === 'rack' ? racks.find(r => r.id === selectedTarget.id) : null) || 
      (selectedRackId ? racks.find(r => r.id === selectedRackId) : null) ||
      (currentPosition.rackId ? racks.find(r => r.id === currentPosition.rackId) : null) ||
      racks[0];

    if (!target) {
      showCanvasToast('⚠️ Vui lòng nhấp chọn một Kệ trước khi nhấn Ctrl+C để sao chép!');
      return;
    }

    setCopiedRack({ ...target });
    showCanvasToast(`📋 Đã sao chép Kệ "${target.id}" (${target.name}). Nhấn Ctrl+V để dán/nhân bản kệ mới!`);
  };

  // Handle Paste / Clone Rack (Ctrl+V)
  const handlePasteRack = (sourceRack?: WarehouseRack) => {
    const template = sourceRack || copiedRack || 
      (selectedTarget?.type === 'rack' ? racks.find(r => r.id === selectedTarget.id) : null) || 
      (selectedRackId ? racks.find(r => r.id === selectedRackId) : null);

    if (!template) {
      showCanvasToast('⚠️ Chưa có kệ nào được sao chép! Hãy bấm vào 1 kệ rồi nhấn Ctrl+C trước.');
      return;
    }

    const existingIds = new Set(racks.map(r => r.id.trim().toUpperCase()));
    let nextId = '';

    // If template was a single letter like 'J', look for next alphabetical letter 'K', 'L'...
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const templateId = template.id.toUpperCase();
    const letterIdx = letters.indexOf(templateId);
    if (letterIdx >= 0) {
      for (let i = letterIdx + 1; i < letters.length; i++) {
        if (!existingIds.has(letters[i])) {
          nextId = letters[i];
          break;
        }
      }
    }

    if (!nextId) {
      for (let i = 0; i < letters.length; i++) {
        if (!existingIds.has(letters[i])) {
          nextId = letters[i];
          break;
        }
      }
    }

    if (!nextId) {
      let count = 1;
      while (existingIds.has(`R${count}`)) {
        count++;
      }
      nextId = `R${count}`;
    }

    // Smart placement offset
    let nextX = template.x + 8;
    let nextY = template.y;
    if (nextX > 92) {
      nextX = 10;
      nextY = Math.min(88, template.y + 12);
    }

    const newRack: WarehouseRack = {
      ...template,
      id: nextId,
      name: `DÃY ${nextId} (${template.colorName || 'Nhân bản'})`,
      x: nextX,
      y: nextY,
      bayLength: template.bayLength || 4.8,
    };

    const updated = [...racks, newRack];
    onUpdateRacks?.(updated);
    onSelectRack(nextId);
    setSelectedTarget({ type: 'rack', id: nextId });
    showCanvasToast(`✨ Đã nhân bản Kệ "${nextId}" thành công (Ctrl+V)!`);
  };

  // Double-Click Trigger to Start Inline Edit
  const handleStartInlineEditRack = (rack: WarehouseRack) => {
    setQuickEditRack({
      isOpen: true,
      rackId: rack.id,
      idValue: rack.id,
      nameValue: rack.name,
      colorValue: rack.color || '#ea580c',
      colorNameValue: rack.colorName || 'Màu tiêu chuẩn',
      bayLengthValue: rack.bayLength || 4.8,
    });
    onSelectRack(rack.id);
  };

  // Save changes from Quick Edit Modal
  const handleSaveQuickEditRack = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickEditRack) return;

    const oldId = quickEditRack.rackId;
    const newId = quickEditRack.idValue.trim().toUpperCase() || oldId;
    const newName = quickEditRack.nameValue.trim() || `DÃY ${newId}`;

    // Check duplicate if ID changed
    if (newId !== oldId) {
      const isDuplicate = racks.some(r => r.id.toUpperCase() === newId && r.id !== oldId);
      if (isDuplicate) {
        alert(`Mã Kệ "${newId}" đã tồn tại! Vui lòng chọn mã khác.`);
        return;
      }
    }

    const updatedRacks = racks.map(r => {
      if (r.id === oldId) {
        return {
          ...r,
          id: newId,
          name: newName,
          color: quickEditRack.colorValue,
          colorName: quickEditRack.colorNameValue,
          bayLength: quickEditRack.bayLengthValue,
        };
      }
      return r;
    });

    onUpdateRacks?.(updatedRacks);

    // If ID changed, update items matching this rack
    if (newId !== oldId && items.length > 0 && onUpdateItems) {
      const updatedItems = items.map(item => {
        if (item.rackId === oldId) {
          const newLoc = item.location ? item.location.replace(new RegExp(`^${oldId}-`), `${newId}-`) : item.location;
          return { ...item, rackId: newId, location: newLoc };
        }
        return item;
      });
      onUpdateItems(updatedItems);
    }

    // Update current position if on this rack
    if (currentPosition.rackId === oldId) {
      onPositionChange({
        ...currentPosition,
        rackId: newId,
        label: currentPosition.label.replace(oldId, newId),
      });
    }

    onSelectRack(newId);
    showCanvasToast(`✅ Đã lưu thay đổi Kệ "${newId}" (${newName}) thành công!`);
    setQuickEditRack(null);
  };

  // Global Keyboard Shortcuts (Ctrl+C, Ctrl+V, Ctrl+D, Delete, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }

      // Close quick modal on Escape
      if (e.key === 'Escape') {
        if (quickEditRack?.isOpen) {
          setQuickEditRack(null);
          return;
        }
      }

      // Ctrl+C or Cmd+C -> Copy selected rack
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleCopyRack();
      }
      // Ctrl+V or Cmd+V -> Paste / Duplicate copied rack
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        handlePasteRack();
      }
      // Ctrl+D or Cmd+D -> Duplicate directly
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handleCopyRack();
        setTimeout(() => handlePasteRack(), 60);
      }
      // Delete or Backspace key -> Delete selected object
      else if (e.key === 'Delete') {
        if (selectedTarget) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [racks, selectedTarget, selectedRackId, copiedRack, quickEditRack, currentPosition, items]);

  // Isometric projection coordinates
  const originX = 510;
  const originY = 160;
  const scaleU = 6.4;
  const scaleV = 6.4;

  const toIso = (u: number, v: number, h: number = 0) => {
    const rad = Math.PI / 6; // 30 degrees
    const cos30 = Math.cos(rad);
    const sin30 = Math.sin(rad);

    const x = originX + (u - v) * cos30 * scaleU;
    const y = originY + (u + v) * sin30 * scaleV - h;
    return { x, y };
  };

  const getIsoWithRot = (cx: number, cy: number, du: number, dv: number, h: number = 0, deg: number = 0) => {
    if (!deg) return toIso(cx + du, cy + dv, h);
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rotU = du * cos - dv * sin;
    const rotV = du * sin + dv * cos;
    return toIso(cx + rotU, cy + rotV, h);
  };

  const toGrid = (pixelX: number, pixelY: number) => {
    const rad = Math.PI / 6;
    const cos30 = Math.cos(rad);
    const sin30 = Math.sin(rad);

    const dx = (pixelX - originX) / scaleU;
    const dy = (pixelY - originY) / scaleV;

    const u = (dx / (2 * cos30)) + (dy / (2 * sin30));
    const v = (dy / (2 * sin30)) - (dx / (2 * cos30));

    return {
      u: Math.max(0, Math.min(100, Math.round(u * 10) / 10)),
      v: Math.max(0, Math.min(100, Math.round(v * 10) / 10)),
    };
  };

  // Find object under coordinate
  const findObjectAt = (u: number, v: number) => {
    // Check annotations
    for (const a of annotations) {
      if (Math.abs(a.x - u) < 6 && Math.abs(a.y - v) < 6) {
        return { type: 'annotation' as const, id: a.id, annotation: a };
      }
    }
    // Check racks
    for (const r of racks) {
      const bayLen = r.bayLength || 4.8;
      const totalLen = (r.length || 5) * bayLen;
      if (Math.abs(r.x - u) < 4.5 && v >= r.y - 2 && v <= r.y + totalLen + 2) {
        return { type: 'rack' as const, id: r.id, rack: r };
      }
    }
    // Check facilities
    for (const f of facilities) {
      const halfW = (f.width || 8) / 2;
      const halfL = (f.length || 8) / 2;
      if (Math.abs(f.x - u) <= Math.max(4, halfW) && Math.abs(f.y - v) <= Math.max(4, halfL)) {
        return { type: 'facility' as const, id: f.id, facility: f };
      }
    }
    // Check floor markings
    for (const fm of floorMarkings) {
      const halfW = (fm.width || 20) / 2;
      const halfL = (fm.length || 20) / 2;
      if (Math.abs(fm.x - u) <= halfW + 2 && Math.abs(fm.y - v) <= halfL + 2) {
        return { type: 'marking' as const, id: fm.id, marking: fm };
      }
    }
    return null;
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning || isDraggingObject) return;
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;
    const { u, v } = toGrid(clickX, clickY);

    const hit = findObjectAt(u, v);

    if (hit) {
      setSelectedTarget({ type: hit.type, id: hit.id });
      if (hit.type === 'rack') {
        const bayLen = hit.rack.bayLength || 4.8;
        const bayIdx = Math.min(5, Math.max(1, Math.floor((v - hit.rack.y) / bayLen) + 1));
        const bayId = String(bayIdx).padStart(2, '0');
        onSelectRack(hit.id, bayId);
      }
    } else {
      setSelectedTarget(null);
    }
  };

  // Manual Movement Handler via D-Pad or Arrow Keys
  const handleManualMovePin = (direction: 'up' | 'down' | 'left' | 'right', delta: number = 2.5) => {
    let newX = currentPosition.x;
    let newY = currentPosition.y;

    if (direction === 'up') newY -= delta;
    if (direction === 'down') newY += delta;
    if (direction === 'left') newX -= delta;
    if (direction === 'right') newX += delta;

    newX = Math.max(1, Math.min(99, newX));
    newY = Math.max(1, Math.min(99, newY));

    const hit = findObjectAt(newX, newY);
    let targetRack: WarehouseRack | undefined;
    let targetBayId = '02';
    let targetFacility: WarehouseFacilityObject | undefined;

    if (hit) {
      if (hit.type === 'rack') {
        targetRack = hit.rack;
        const bayLen = targetRack.bayLength || 4.8;
        const bayIdx = Math.min(5, Math.max(1, Math.floor((newY - targetRack.y) / bayLen) + 1));
        targetBayId = String(bayIdx).padStart(2, '0');
      } else if (hit.type === 'facility') {
        targetFacility = hit.facility;
      }
    }

    let newLabel = '';
    if (targetRack) {
      newLabel = `Trạm đứng Kệ ${targetRack.id} - Bay ${targetBayId} (${targetRack.colorName || targetRack.name})`;
    } else if (targetFacility) {
      newLabel = `Trạm đứng: ${targetFacility.name}`;
    } else {
      newLabel = `Trạm đứng toạ độ (${newX.toFixed(0)}, ${newY.toFixed(0)})`;
    }

    onPositionChange({
      ...currentPosition,
      x: newX,
      y: newY,
      label: newLabel,
      rackId: targetRack?.id,
      bayId: targetRack ? targetBayId : undefined,
      zoneId: targetFacility?.type,
    });
  };

  // Keyboard Arrow Key Listener for Pin Movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleManualMovePin('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleManualMovePin('down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleManualMovePin('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleManualMovePin('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPosition, racks, facilities]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('.controls')) return;

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - pan.x) / zoom;
      const clickY = (e.clientY - rect.top - pan.y) / zoom;
      const { u, v } = toGrid(clickX, clickY);

      if (isEditMode) {
        // Find if user clicked directly on an object (Annotation, Rack, Marking, Facility)
        const hit = findObjectAt(u, v);
        if (hit) {
          setSelectedTarget({ type: hit.type, id: hit.id });
          if (hit.type === 'rack') {
            onSelectRack(hit.id);
          }

          let targetX = u;
          let targetY = v;
          if (hit.type === 'rack' && hit.rack) { targetX = hit.rack.x; targetY = hit.rack.y; }
          else if (hit.type === 'facility' && hit.facility) { targetX = hit.facility.x; targetY = hit.facility.y; }
          else if (hit.type === 'annotation' && hit.annotation) { targetX = hit.annotation.x; targetY = hit.annotation.y; }
          else if (hit.type === 'marking' && hit.marking) { targetX = hit.marking.x; targetY = hit.marking.y; }

          setIsDraggingObject(true);
          setDragOffset({ u: targetX - u, v: targetY - v });
          return;
        }
      }
    }

    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingPin && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      const { u, v } = toGrid(mouseX, mouseY);

      const hit = findObjectAt(u, v);
      let targetRack: WarehouseRack | undefined;
      let targetBayId = '02';
      let targetFacility: WarehouseFacilityObject | undefined;

      if (hit) {
        if (hit.type === 'rack') {
          targetRack = hit.rack;
          const bayLen = targetRack.bayLength || 4.8;
          const bayIdx = Math.min(5, Math.max(1, Math.floor((v - targetRack.y) / bayLen) + 1));
          targetBayId = String(bayIdx).padStart(2, '0');
        } else if (hit.type === 'facility') {
          targetFacility = hit.facility;
        }
      }

      let newLabel = '';
      if (targetRack) {
        newLabel = `Trạm đứng Kệ ${targetRack.id} - Bay ${targetBayId} (${targetRack.colorName || targetRack.name})`;
      } else if (targetFacility) {
        newLabel = `Trạm đứng: ${targetFacility.name}`;
      } else {
        newLabel = `Trạm đứng toạ độ (${u.toFixed(0)}, ${v.toFixed(0)})`;
      }

      onPositionChange({
        ...currentPosition,
        x: u,
        y: v,
        label: newLabel,
        rackId: targetRack?.id,
        bayId: targetRack ? targetBayId : undefined,
        zoneId: targetFacility?.type,
      });
      return;
    }

    if (isDraggingObject && selectedTarget && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      const { u, v } = toGrid(mouseX, mouseY);

      const nextU = Math.max(2, Math.min(95, Math.round((u + dragOffset.u) * 2) / 2));
      const nextV = Math.max(2, Math.min(95, Math.round((v + dragOffset.v) * 2) / 2));

      if (selectedTarget.type === 'rack') {
        const updated = racks.map(r => r.id === selectedTarget.id ? { ...r, x: nextU, y: nextV } : r);
        onUpdateRacks?.(updated);
      } else if (selectedTarget.type === 'facility') {
        const updated = facilities.map(f => f.id === selectedTarget.id ? { ...f, x: nextU, y: nextV } : f);
        onUpdateFacilities?.(updated);
      } else if (selectedTarget.type === 'annotation') {
        const updated = annotations.map(a => a.id === selectedTarget.id ? { ...a, x: nextU, y: nextV } : a);
        onUpdateAnnotations?.(updated);
      } else if (selectedTarget.type === 'marking') {
        const updated = floorMarkings.map(m => m.id === selectedTarget.id ? { ...m, x: nextU, y: nextV } : m);
        onUpdateFloorMarkings?.(updated);
      }
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingObject(false);
    setIsDraggingPin(false);
  };

  // Nudge movement
  const handleNudge = (du: number, dv: number) => {
    if (!selectedTarget) return;
    if (selectedTarget.type === 'rack') {
      const updated = racks.map(r => r.id === selectedTarget.id ? { ...r, x: Math.max(0, Math.min(100, r.x + du)), y: Math.max(0, Math.min(100, r.y + dv)) } : r);
      onUpdateRacks?.(updated);
    } else if (selectedTarget.type === 'facility') {
      const updated = facilities.map(f => f.id === selectedTarget.id ? { ...f, x: Math.max(0, Math.min(100, f.x + du)), y: Math.max(0, Math.min(100, f.y + dv)) } : f);
      onUpdateFacilities?.(updated);
    } else if (selectedTarget.type === 'annotation') {
      const updated = annotations.map(a => a.id === selectedTarget.id ? { ...a, x: Math.max(0, Math.min(100, a.x + du)), y: Math.max(0, Math.min(100, a.y + dv)) } : a);
      onUpdateAnnotations?.(updated);
    } else if (selectedTarget.type === 'marking') {
      const updated = floorMarkings.map(m => m.id === selectedTarget.id ? { ...m, x: Math.max(0, Math.min(100, m.x + du)), y: Math.max(0, Math.min(100, m.y + dv)) } : m);
      onUpdateFloorMarkings?.(updated);
    }
  };

  // Delete active selected object
  const handleDeleteSelected = () => {
    if (!selectedTarget) return;
    if (selectedTarget.type === 'annotation') {
      const updated = annotations.filter(a => a.id !== selectedTarget.id);
      onUpdateAnnotations?.(updated);
      setSelectedTarget(null);
    } else if (selectedTarget.type === 'marking') {
      const updated = floorMarkings.filter(m => m.id !== selectedTarget.id);
      onUpdateFloorMarkings?.(updated);
      setSelectedTarget(null);
    } else if (selectedTarget.type === 'rack') {
      if (racks.length <= 1) {
        alert('Kho cần giữ tối thiểu 1 kệ!');
        return;
      }
      const updated = racks.filter(r => r.id !== selectedTarget.id);
      onUpdateRacks?.(updated);
      setSelectedTarget(null);
    } else if (selectedTarget.type === 'facility') {
      const updated = facilities.filter(f => f.id !== selectedTarget.id);
      onUpdateFacilities?.(updated);
      setSelectedTarget(null);
    }
  };

  // Active object references for quick editor floating drawer
  const activeAnnotation = selectedTarget?.type === 'annotation' ? annotations.find(a => a.id === selectedTarget.id) : null;
  const activeMarking = selectedTarget?.type === 'marking' ? floorMarkings.find(m => m.id === selectedTarget.id) : null;
  const activeRack = selectedTarget?.type === 'rack' ? racks.find(r => r.id === selectedTarget.id) : null;
  const activeFacility = selectedTarget?.type === 'facility' ? facilities.find(f => f.id === selectedTarget.id) : null;

  // Active Location Coordinates for "You Are Here" Pin
  const currentPinIso = toIso(currentPosition.x, currentPosition.y, 0);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isCompact ? 'h-[460px]' : isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-[620px]'} ${
        isStudioPhotoMode 
          ? screenshotBg === 'clean-white' ? 'bg-white border-slate-300' : screenshotBg === 'studio-slate' ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
          : 'bg-slate-900 border-slate-800'
      } rounded-2xl overflow-hidden border shadow-2xl flex flex-col select-none transition-colors duration-200`}
    >
      
      {/* STUDIO PHOTO CONTROL BAR (Visible only in Studio Mode) */}
      {isStudioPhotoMode ? (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 no-screenshot bg-slate-900/95 text-white backdrop-blur-xl border border-emerald-500/60 p-2 px-4 rounded-2xl shadow-2xl flex flex-wrap items-center gap-2.5 text-xs max-w-[96%] animate-fadeIn">
          <div className="flex items-center gap-1.5 font-black text-emerald-400 border-r border-slate-700 pr-3">
            <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>STUDIO CẮT ÂNH 3D</span>
          </div>

          {/* Background Selector */}
          <div className="flex items-center gap-1 border-r border-slate-700 pr-3">
            <span className="text-[10px] text-slate-400 font-bold mr-0.5">Nền:</span>
            <button
              onClick={() => setScreenshotBg('clean-white')}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                screenshotBg === 'clean-white'
                  ? 'bg-white text-slate-950 border-white shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 inline-block"></span>
              Trắng Tinh
            </button>

            <button
              onClick={() => setScreenshotBg('studio-slate')}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                screenshotBg === 'studio-slate'
                  ? 'bg-slate-200 text-slate-900 border-slate-300 shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400 inline-block"></span>
              Xám Studio
            </button>

            <button
              onClick={() => setScreenshotBg('dark-luxury')}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                screenshotBg === 'dark-luxury'
                  ? 'bg-slate-950 text-cyan-400 border-cyan-500/50 shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-600 inline-block"></span>
              Tối Sang
            </button>
          </div>

          {/* Camera Angle Presets */}
          <div className="flex items-center gap-1 border-r border-slate-700 pr-3">
            <span className="text-[10px] text-slate-400 font-bold mr-0.5">Góc nhìn:</span>
            <button
              onClick={handleCameraFitOverview}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-[10px] transition-all cursor-pointer"
              title="Căn giữa toàn cảnh 100%"
            >
              📍 Toàn Cảnh
            </button>
            <button
              onClick={handleCameraFitRacks}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-[10px] transition-all cursor-pointer"
              title="Cận cảnh khu vực dãy kệ"
            >
              📦 Cận Kệ
            </button>
            <button
              onClick={handleCameraFitDelivery}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-[10px] transition-all cursor-pointer"
              title="Cận cảnh khu giao nhận"
            >
              🚚 Khu Giao
            </button>
          </div>

          {/* Element Toggles */}
          <div className="flex items-center gap-2 border-r border-slate-700 pr-3 text-[10px]">
            <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showPinInStudio}
                onChange={(e) => setShowPinInStudio(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              <span>Ghim Vị Trí</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showLabelsInStudio}
                onChange={(e) => setShowLabelsInStudio(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              <span>Nhãn Text</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPngScreenshot}
              disabled={isExportingPng}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg transition-all flex items-center gap-1 shadow-md cursor-pointer disabled:opacity-50 text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPng ? 'Đang chụp...' : 'TẢI ÂNH PNG HD'}</span>
            </button>

            <button
              onClick={() => setIsStudioPhotoMode(false)}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Thoát chế độ chụp ảnh Studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Standard Top Floating Control Bar */
        <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none no-screenshot">
          
          {/* Left: Mode Switchers & Tools */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
            <button
              onClick={() => {
                setIsEditMode(!isEditMode);
                setSelectedTarget(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditMode
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'ĐANG BIÊN TẬP (BẬT)' : 'CHẾ ĐỘ XEM / VỊ TRÍ'}</span>
            </button>

            {/* Studio Photo Mode Toggle Button */}
            <button
              onClick={() => {
                setIsStudioPhotoMode(true);
                setIsEditMode(false);
                setSelectedTarget(null);
                setZoom(1.25);
                setPan({ x: 0, y: 0 });
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Mở Chế Độ Studio: Tự động ẩn các nút điều khiển, đổi nền sáng/trắng để bạn chụp/cắt ảnh chèn báo cáo cực đẹp!"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-300" />
              <span>📷 CHỤP ÂNH 3D ĐẸP</span>
            </button>

            {/* Quick Add Annotation Button */}
            {isEditMode && (
              <>
                <button
                  onClick={() => setIsAddAnnotationModalOpen(true)}
                  className="px-2.5 py-1.5 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 border border-cyan-500/40 transition-all cursor-pointer"
                  title="Thêm nhãn văn bản / tên khu vực mới"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>+ Thêm Nhãn Text</span>
                </button>

                <button
                  onClick={() => setIsAddMarkingModalOpen(true)}
                  className="px-2.5 py-1.5 bg-yellow-600/30 hover:bg-yellow-600 text-yellow-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 border border-yellow-500/40 transition-all cursor-pointer"
                  title="Thêm vạch kẻ vàng công nghệ 5S"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Vẽ Vạch Vàng</span>
                </button>
              </>
            )}

            {/* Undo / Redo */}
            {onUndo && (
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                title="Hoàn tác (Undo)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}
            {onRedo && (
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                title="Làm lại (Redo)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Zoom & Reset Navigation */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.5))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.6))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1.15);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Đặt lại góc nhìn"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-teal-400 hover:text-teal-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

        </div>
      )}

      {/* FLOATING QUICK EDIT DRAWER (When an object is selected in Edit Mode) */}
      {isEditMode && selectedTarget && (
        <div className="absolute top-16 right-3 z-40 w-80 bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              {selectedTarget.type === 'annotation' && 'Biên Tập Nhãn Khu Vực'}
              {selectedTarget.type === 'marking' && 'Biên Tập Vạch Kẻ Vàng 5S'}
              {selectedTarget.type === 'rack' && 'Biên Tập Kệ (5 Khoang, 3 Tầng)'}
              {selectedTarget.type === 'facility' && 'Biên Tập Thiết Bị Kho'}
            </span>
            <button
              onClick={() => setSelectedTarget(null)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* EDIT ANNOTATION PROPS */}
          {activeAnnotation && (
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Tên Tiếng Việt:</label>
                <input
                  type="text"
                  value={activeAnnotation.textVi}
                  onChange={(e) => {
                    const updated = annotations.map(a => a.id === activeAnnotation.id ? { ...a, textVi: e.target.value } : a);
                    onUpdateAnnotations?.(updated);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Phụ Đề Tiếng Anh:</label>
                <input
                  type="text"
                  value={activeAnnotation.textEn || ''}
                  onChange={(e) => {
                    const updated = annotations.map(a => a.id === activeAnnotation.id ? { ...a, textEn: e.target.value } : a);
                    onUpdateAnnotations?.(updated);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              {/* GÓC XOAY (ROTATION) CHO NHÃN */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-cyan-400">
                  <span>Góc Xoay (Độ):</span>
                  <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {Math.round(activeAnnotation.rotation || 0)}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={5}
                  value={activeAnnotation.rotation || 0}
                  onChange={(e) => {
                    const updated = annotations.map(a => a.id === activeAnnotation.id ? { ...a, rotation: Number(e.target.value) } : a);
                    onUpdateAnnotations?.(updated);
                  }}
                  className="w-full accent-cyan-400"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    { label: '0° Ngang', val: 0 },
                    { label: '-15°', val: -15 },
                    { label: '30° Trục 1', val: 30 },
                    { label: '-30° Trục 2', val: -30 },
                    { label: '45°', val: 45 },
                    { label: '90° Dọc', val: 90 },
                  ].map((p) => (
                    <button
                      key={`ann-rot-${p.val}`}
                      onClick={() => {
                        const updated = annotations.map(a => a.id === activeAnnotation.id ? { ...a, rotation: p.val } : a);
                        onUpdateAnnotations?.(updated);
                      }}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        (activeAnnotation.rotation || 0) === p.val
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Cỡ chữ: {activeAnnotation.fontSize}px</label>
                  <input
                    type="range"
                    min={8}
                    max={26}
                    value={activeAnnotation.fontSize}
                    onChange={(e) => {
                      const updated = annotations.map(a => a.id === activeAnnotation.id ? { ...a, fontSize: Number(e.target.value) } : a);
                      onUpdateAnnotations?.(updated);
                    }}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Màu sắc:</label>
                  <input
                    type="color"
                    value={activeAnnotation.color || '#0f172a'}
                    onChange={(e) => {
                      const updated = annotations.map(a => a.id === activeAnnotation.id ? { ...a, color: e.target.value } : a);
                      onUpdateAnnotations?.(updated);
                    }}
                    className="w-full h-7 rounded border border-slate-700 cursor-pointer bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Huy hiệu (VD: 5S):</label>
                <input
                  type="text"
                  placeholder="Để trống nếu không dùng"
                  value={activeAnnotation.badge5s || ''}
                  onChange={(e) => {
                    const updated = annotations.map(a => a.id === activeAnnotation.id ? { ...a, badge5s: e.target.value } : a);
                    onUpdateAnnotations?.(updated);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white"
                />
              </div>
            </div>
          )}

          {/* EDIT FLOOR MARKING PROPS */}
          {activeMarking && (
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Tên Vạch Kẻ:</label>
                <input
                  type="text"
                  value={activeMarking.name}
                  onChange={(e) => {
                    const updated = floorMarkings.map(m => m.id === activeMarking.id ? { ...m, name: e.target.value } : m);
                    onUpdateFloorMarkings?.(updated);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              {/* GÓC XOAY (ROTATION) CHO VẠCH KẺ VÀNG 5S */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-yellow-400">
                  <span>Góc Xoay Vạch Kẻ (Độ):</span>
                  <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {Math.round(activeMarking.rotation || 0)}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={5}
                  value={activeMarking.rotation || 0}
                  onChange={(e) => {
                    const updated = floorMarkings.map(m => m.id === activeMarking.id ? { ...m, rotation: Number(e.target.value) } : m);
                    onUpdateFloorMarkings?.(updated);
                  }}
                  className="w-full accent-yellow-400"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    { label: '0° Chuẩn', val: 0 },
                    { label: '-15° Nghiêng', val: -15 },
                    { label: '30° Dọc Trục', val: 30 },
                    { label: '-30°', val: -30 },
                    { label: '45° Chéo', val: 45 },
                    { label: '90° Vuông', val: 90 },
                  ].map((p) => (
                    <button
                      key={`fm-rot-${p.val}`}
                      onClick={() => {
                        const updated = floorMarkings.map(m => m.id === activeMarking.id ? { ...m, rotation: p.val } : m);
                        onUpdateFloorMarkings?.(updated);
                      }}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        (activeMarking.rotation || 0) === p.val
                          ? 'bg-yellow-500 text-slate-950 shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Chiều Rộng: {activeMarking.width || 20}</label>
                  <input
                    type="range"
                    min={4}
                    max={60}
                    value={activeMarking.width || 20}
                    onChange={(e) => {
                      const updated = floorMarkings.map(m => m.id === activeMarking.id ? { ...m, width: Number(e.target.value) } : m);
                      onUpdateFloorMarkings?.(updated);
                    }}
                    className="w-full accent-yellow-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Chiều Dài: {activeMarking.length || 20}</label>
                  <input
                    type="range"
                    min={4}
                    max={60}
                    value={activeMarking.length || 20}
                    onChange={(e) => {
                      const updated = floorMarkings.map(m => m.id === activeMarking.id ? { ...m, length: Number(e.target.value) } : m);
                      onUpdateFloorMarkings?.(updated);
                    }}
                    className="w-full accent-yellow-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* EDIT FACILITY OBJECT PROPS */}
          {activeFacility && (
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Tên Thiết Bị / Sàn:</label>
                <input
                  type="text"
                  value={activeFacility.name}
                  onChange={(e) => {
                    const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, name: e.target.value } : f);
                    onUpdateFacilities?.(updated);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Loại Thiết Bị:</label>
                  <select
                    value={activeFacility.type}
                    onChange={(e) => {
                      const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, type: e.target.value as FacilityObjectType } : f);
                      onUpdateFacilities?.(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-[11px]"
                  >
                    <option value="mezzanine">🏢 Sàn Mezzanine</option>
                    <option value="pallet_staging">📦 Pallet Staging</option>
                    <option value="conveyor">⚙️ Băng Tải</option>
                    <option value="agv">🚚 Xe AGV</option>
                    <option value="workstation">🛠 Bàn QC</option>
                    <option value="door">🚪 Cổng Kho</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Màu Sắc:</label>
                  <input
                    type="color"
                    value={activeFacility.color || '#f8fafc'}
                    onChange={(e) => {
                      const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, color: e.target.value } : f);
                      onUpdateFacilities?.(updated);
                    }}
                    className="w-full h-8 rounded border border-slate-700 cursor-pointer bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Rộng (W): {activeFacility.width || 20}</label>
                  <input
                    type="range"
                    min={4}
                    max={60}
                    value={activeFacility.width || 20}
                    onChange={(e) => {
                      const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, width: Number(e.target.value) } : f);
                      onUpdateFacilities?.(updated);
                    }}
                    className="w-full accent-purple-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Dài (L): {activeFacility.length || 20}</label>
                  <input
                    type="range"
                    min={4}
                    max={60}
                    value={activeFacility.length || 20}
                    onChange={(e) => {
                      const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, length: Number(e.target.value) } : f);
                      onUpdateFacilities?.(updated);
                    }}
                    className="w-full accent-purple-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Cao (H): {activeFacility.height || 20}</label>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    value={activeFacility.height || 20}
                    onChange={(e) => {
                      const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, height: Number(e.target.value) } : f);
                      onUpdateFacilities?.(updated);
                    }}
                    className="w-full accent-purple-400"
                  />
                </div>
              </div>

              {/* Angle Rotation Controls */}
              <div className="pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                  <span>Góc Xoay 3D ({Math.round(activeFacility.rotation || 0)}°):</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, rotation: ((f.rotation || 0) + 90) % 360 } : f);
                      onUpdateFacilities?.(updated);
                    }}
                    className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-[10px] shadow transition-colors"
                  >
                    ↻ Xoay 90°
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={activeFacility.rotation || 0}
                  onChange={(e) => {
                    const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, rotation: Number(e.target.value) } : f);
                    onUpdateFacilities?.(updated);
                  }}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={`fac-rot-${deg}`}
                      type="button"
                      onClick={() => {
                        const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, rotation: deg } : f);
                        onUpdateFacilities?.(updated);
                      }}
                      className={`py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        (activeFacility.rotation || 0) === deg 
                          ? 'bg-purple-600 border-purple-400 text-white' 
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {deg === 0 ? '0° (Chuẩn)' : deg === 90 ? '90° (Ngang)' : `${deg}°`}
                    </button>
                  ))}
                </div>
              </div>

              {activeFacility.type === 'mezzanine' && (
                <label className="flex items-center gap-2 text-slate-300 font-bold text-[11px] pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeFacility.hasStairs !== false}
                    onChange={(e) => {
                      const updated = facilities.map(f => f.id === activeFacility.id ? { ...f, hasStairs: e.target.checked } : f);
                      onUpdateFacilities?.(updated);
                    }}
                    className="accent-purple-500 rounded"
                  />
                  <span>Hiển thị cầu thang lên sàn lửng</span>
                </label>
              )}
            </div>
          )}

          {/* EDIT RACK LENGTH PROPS (5 Bays auto, 3 Tiers) */}
          {activeRack && (
            <div className="space-y-2.5 text-xs">
              <div className="bg-orange-500/10 p-2.5 rounded-lg border border-orange-500/30 text-[11px] text-orange-300 flex items-center justify-between">
                <div>
                  Kệ <strong>{activeRack.id}</strong>: 5 Khoang, 3 Tầng.
                </div>
                <button
                  onClick={() => handleStartInlineEditRack(activeRack)}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black text-[10px] flex items-center gap-1 shadow"
                  title="Kích đúp hoặc bấm đây để sửa tên kệ"
                >
                  <Edit3 className="w-3 h-3" />
                  Sửa Tên
                </button>
              </div>

              {/* Angle Rotation Controls for Rack */}
              <div className="pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                  <span>Góc Xoay Kệ 3D ({Math.round(activeRack.rotation || 0)}°):</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = racks.map(r => r.id === activeRack.id ? { ...r, rotation: ((r.rotation || 0) + 90) % 360 } : r);
                      onUpdateRacks?.(updated);
                    }}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black text-[10px] shadow transition-colors"
                  >
                    ↻ Xoay 90° (Ngang)
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={activeRack.rotation || 0}
                  onChange={(e) => {
                    const updated = racks.map(r => r.id === activeRack.id ? { ...r, rotation: Number(e.target.value) } : r);
                    onUpdateRacks?.(updated);
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={`rack-rot-${deg}`}
                      type="button"
                      onClick={() => {
                        const updated = racks.map(r => r.id === activeRack.id ? { ...r, rotation: deg } : r);
                        onUpdateRacks?.(updated);
                      }}
                      className={`py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        (activeRack.rotation || 0) === deg 
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-black' 
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {deg === 0 ? '0° (Dọc)' : deg === 90 ? '90° (Ngang)' : `${deg}°`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Copy / Paste Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => handleCopyRack(activeRack)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  title="Sao chép Kệ (Ctrl+C)"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  Sao chép (Ctrl+C)
                </button>
                <button
                  onClick={() => handlePasteRack(activeRack)}
                  className="px-2.5 py-1.5 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 border border-cyan-500/40 transition-colors"
                  title="Nhân bản thêm Kệ mới y hệt (Ctrl+V)"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  Nhân bản (Ctrl+V)
                </button>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span className="font-bold">Chiều Dài Kệ (m):</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {((activeRack.bayLength || 4.8) * 5).toFixed(1)}m
                  </span>
                </div>
                <input
                  type="range"
                  min={2.4}
                  max={8.0}
                  step={0.2}
                  value={activeRack.bayLength || 4.8}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const updated = racks.map(r => r.id === activeRack.id ? { ...r, bayLength: val } : r);
                    onUpdateRacks?.(updated);
                  }}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Ngắn (12m)</span>
                  <span>Chuẩn (24m)</span>
                  <span>Dài (40m)</span>
                </div>
              </div>
            </div>
          )}

          {/* Nudge Arrow Buttons & Delete */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="grid grid-cols-3 gap-1 w-28">
              <div />
              <button onClick={() => handleNudge(0, -2)} className="bg-slate-800 hover:bg-slate-700 text-white rounded p-1 text-xs flex items-center justify-center">▲</button>
              <div />
              <button onClick={() => handleNudge(-2, 0)} className="bg-slate-800 hover:bg-slate-700 text-white rounded p-1 text-xs flex items-center justify-center">◀</button>
              <button onClick={() => handleNudge(0, 2)} className="bg-slate-800 hover:bg-slate-700 text-white rounded p-1 text-xs flex items-center justify-center">▼</button>
              <button onClick={() => handleNudge(2, 0)} className="bg-slate-800 hover:bg-slate-700 text-white rounded p-1 text-xs flex items-center justify-center">▶</button>
            </div>

            <button
              onClick={handleDeleteSelected}
              className="px-3 py-2 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-500/40"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      )}

      {/* QUICK INLINE EDIT MODAL FOR RACKS (Triggered on Double-Click or Toolbar) */}
      {quickEditRack && quickEditRack.isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setQuickEditRack(null);
            }
          }}
        >
          <div 
            className="bg-slate-900 border-2 border-amber-500/60 p-5 rounded-2xl w-full max-w-md shadow-2xl space-y-4 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                  {quickEditRack.idValue || quickEditRack.rackId}
                </span>
                <div>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    Sửa Tên & Thông Số Kệ
                  </h3>
                  <p className="text-[10px] text-amber-400/80">Kích đúp để đổi tên nhanh • Nhấn Enter để lưu</p>
                </div>
              </div>
              <button 
                onClick={() => setQuickEditRack(null)} 
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveQuickEditRack} className="space-y-3.5">
              {/* Row 1: ID & Name */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Mã Kệ (ID) *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={quickEditRack.idValue}
                    onChange={(e) => setQuickEditRack(prev => prev ? { ...prev, idValue: e.target.value.toUpperCase() } : null)}
                    className="w-full bg-slate-800 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl p-2.5 text-center text-lg font-black text-amber-400 tracking-wider uppercase focus:outline-none"
                    placeholder="VD: J"
                    autoFocus
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tên Hiển Thị Dãy Kệ *
                  </label>
                  <input
                    type="text"
                    value={quickEditRack.nameValue}
                    onChange={(e) => setQuickEditRack(prev => prev ? { ...prev, nameValue: e.target.value } : null)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none"
                    placeholder="VD: DÃY J (Linh Kiện Bếp Ga)"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Color Palette Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Màu Nhận Diện Quy Hoạch 5S:</span>
                  <span className="text-[10px] text-amber-400 font-semibold">{quickEditRack.colorNameValue}</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { color: '#ea580c', name: 'Cam 5S' },
                    { color: '#dc2626', name: 'Đỏ Vật Tư' },
                    { color: '#16a34a', name: 'Xanh Lá' },
                    { color: '#2563eb', name: 'Xanh Dương' },
                    { color: '#8b5cf6', name: 'Tím Phụ Liệu' },
                    { color: '#eab308', name: 'Vàng Cảnh Báo' },
                    { color: '#06b6d4', name: 'Lam AGV' },
                    { color: '#ec4899', name: 'Hồng Đóng Gói' },
                    { color: '#059669', name: 'Ngọc Bích' },
                    { color: '#475569', name: 'Xám Cơ Khí' },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setQuickEditRack(prev => prev ? { 
                        ...prev, 
                        colorValue: preset.color, 
                        colorNameValue: preset.name 
                      } : null)}
                      className={`h-8 rounded-lg flex items-center justify-center border-2 transition-all transform hover:scale-105 ${
                        quickEditRack.colorValue === preset.color 
                          ? 'border-white ring-2 ring-amber-400 scale-105 shadow-lg' 
                          : 'border-black/30 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    >
                      {quickEditRack.colorValue === preset.color && (
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Rack Length Slider */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="font-bold">Tổng Chiều Dài Kệ:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {((quickEditRack.bayLengthValue || 4.8) * 5).toFixed(1)} mét (5 khoang)
                  </span>
                </div>
                <input
                  type="range"
                  min={2.4}
                  max={8.0}
                  step={0.2}
                  value={quickEditRack.bayLengthValue || 4.8}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setQuickEditRack(prev => prev ? { ...prev, bayLengthValue: val } : null);
                  }}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = racks.find(r => r.id === quickEditRack.rackId);
                      if (cur) {
                        handleCopyRack(cur);
                        setQuickEditRack(null);
                      }
                    }}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                    title="Sao chép kệ này (Ctrl+C)"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = racks.find(r => r.id === quickEditRack.rackId);
                      if (cur) {
                        handlePasteRack(cur);
                        setQuickEditRack(null);
                      }
                    }}
                    className="px-2.5 py-2 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 border border-cyan-500/40 transition-colors"
                    title="Nhân bản thêm Kệ y hệt (Ctrl+V)"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Nhân Bản</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickEditRack(null)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    Hủy (Esc)
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all transform hover:scale-105"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu Thay Đổi (Enter)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION FOR COPY / PASTE / RENAME */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-amber-400/80 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-bounce pointer-events-none backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-spin" />
          <span className="whitespace-nowrap">{toastMessage}</span>
        </div>
      )}

      {/* QUICK SHORTCUT HELPER BADGE AT BOTTOM LEFT */}
      <div className="absolute bottom-3 left-3 z-30 hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>💡 <strong>Kích đúp</strong> vào Kệ/Nhãn để sửa tên • <strong>Ctrl+C</strong> & <strong>Ctrl+V</strong> để nhân bản kệ</span>
      </div>

      {/* QUICK ADD ANNOTATION MODAL POPUP */}
      {isAddAnnotationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-extrabold text-sm text-cyan-400 uppercase flex items-center gap-2">
                <Type className="w-4 h-4" />
                Thêm Nhãn Văn Bản / Tên Khu Vực Mới
              </span>
              <button onClick={() => setIsAddAnnotationModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên Khu Vực (Tiếng Việt) *</label>
                <input
                  type="text"
                  placeholder="VD: KHU VỰC ĐÓNG GÓI, LỐI ĐI 5S..."
                  value={newAnnVi}
                  onChange={(e) => setNewAnnVi(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phụ Đề (Tiếng Anh)</label>
                <input
                  type="text"
                  placeholder="VD: PACKING AREA, MAIN AISLE..."
                  value={newAnnEn}
                  onChange={(e) => setNewAnnEn(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Huy hiệu 5S</label>
                  <input
                    type="text"
                    placeholder="VD: 5S"
                    value={newAnnBadge}
                    onChange={(e) => setNewAnnBadge(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cỡ Chữ (px)</label>
                  <input
                    type="number"
                    min={8}
                    max={26}
                    value={newAnnSize}
                    onChange={(e) => setNewAnnSize(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAddAnnotationModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newAnnVi.trim()) {
                    alert('Vui lòng nhập tên khu vực!');
                    return;
                  }
                  const newAnn: MapTextAnnotation = {
                    id: `ann-${Date.now()}`,
                    textVi: newAnnVi.trim(),
                    textEn: newAnnEn.trim() || undefined,
                    x: 50,
                    y: 50,
                    fontSize: newAnnSize || 12,
                    color: newAnnColor || '#0f172a',
                    badge5s: newAnnBadge.trim() || undefined,
                  };
                  const updated = [...annotations, newAnn];
                  onUpdateAnnotations?.(updated);
                  setSelectedTarget({ type: 'annotation', id: newAnn.id });
                  setIsAddAnnotationModalOpen(false);
                  setNewAnnVi('');
                  setNewAnnEn('');
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-black shadow-lg"
              >
                Tạo Nhãn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD FLOOR MARKING POPUP */}
      {isAddMarkingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-extrabold text-sm text-yellow-400 uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Vẽ & Thêm Vạch Kẻ Vàng 5S Dưới Sàn
              </span>
              <button onClick={() => setIsAddMarkingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên Vạch / Khu Vực Vàng</label>
                <input
                  type="text"
                  placeholder="VD: Vạch Bao Kệ 01, Lối Đi An Toàn..."
                  value={newMarkingName}
                  onChange={(e) => setNewMarkingName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Chiều Rộng (W)</label>
                  <input
                    type="number"
                    value={newMarkingWidth}
                    onChange={(e) => setNewMarkingWidth(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Chiều Dài (L)</label>
                  <input
                    type="number"
                    value={newMarkingLength}
                    onChange={(e) => setNewMarkingLength(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAddMarkingModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const newFm: FloorMarking = {
                    id: `fm-${Date.now()}`,
                    name: newMarkingName.trim() || `Vạch vàng ${floorMarkings.length + 1}`,
                    type: 'box',
                    x: 40,
                    y: 40,
                    width: newMarkingWidth || 25,
                    length: newMarkingLength || 25,
                    color: '#facc15',
                    strokeWidth: 3,
                    fillOpacity: 0.05,
                  };
                  const updated = [...floorMarkings, newFm];
                  onUpdateFloorMarkings?.(updated);
                  setSelectedTarget({ type: 'marking', id: newFm.id });
                  setIsAddMarkingModalOpen(false);
                  setNewMarkingName('');
                }}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-lg text-xs font-black shadow-lg"
              >
                Tạo Vạch Kẻ Vàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN 3D ISOMETRIC WAREHOUSE SVG CANVAS */}
      <svg
        ref={svgRef}
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : isEditMode ? 'cursor-crosshair' : 'cursor-grab'} ${
          isStudioPhotoMode
            ? screenshotBg === 'clean-white' ? 'bg-white' : screenshotBg === 'studio-slate' ? 'bg-slate-100' : 'bg-slate-950'
            : 'bg-slate-200'
        }`}
        viewBox="0 0 1020 680"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleSvgClick}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
          transition: isPanning || isDraggingObject ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <defs>
          {/* Warehouse Floor Gradient */}
          <linearGradient id="concreteFloor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isStudioPhotoMode && screenshotBg === 'clean-white' ? '#ffffff' : '#f8fafc'} />
            <stop offset="100%" stopColor={isStudioPhotoMode && screenshotBg === 'clean-white' ? '#f1f5f9' : '#e2e8f0'} />
          </linearGradient>

          {/* 3D Shadows */}
          <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="6" stdDeviation="4" floodOpacity="0.25" floodColor="#0f172a" />
          </filter>

          {/* Yellow Safety Glow */}
          <filter id="yellowGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodOpacity="0.7" floodColor="#facc15" />
          </filter>

          {/* You Are Here Pin Glow */}
          <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. FACTORY CONCRETE FLOOR SLAB */}
        <g id="warehouse-floor">
          {(() => {
            const p0 = toIso(0, 0, 0);
            const p1 = toIso(100, 0, 0);
            const p2 = toIso(100, 100, 0);
            const p3 = toIso(0, 100, 0);

            return (
              <polygon
                points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
                fill="url(#concreteFloor)"
                stroke="#cbd5e1"
                strokeWidth="2.5"
              />
            );
          })()}

          {/* Subtle 5S Floor Grid Lines */}
          {Array.from({ length: 11 }).map((_, i) => {
            const u = i * 10;
            const start = toIso(u, 0, 0);
            const end = toIso(u, 100, 0);
            return (
              <line
                key={`grid-u-${i}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}
          {Array.from({ length: 11 }).map((_, i) => {
            const v = i * 10;
            const start = toIso(0, v, 0);
            const end = toIso(100, v, 0);
            return (
              <line
                key={`grid-v-${i}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}
        </g>

        {/* 2. DYNAMIC YELLOW 5S FLOOR MARKINGS (VẠCH KẺ CÔNG NGHỆ 5S MÀU VÀNG DƯỚI NỀN) */}
        <g id="floor-markings-5s">
          {floorMarkings.map((fm) => {
            const isSelected = selectedTarget?.type === 'marking' && selectedTarget.id === fm.id;
            const halfW = (fm.width || 20) / 2;
            const halfL = (fm.length || 20) / 2;
            const rot = fm.rotation || 0;
            const rad = (rot * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            if (fm.type === 'box') {
              // Calculate 4 rotated corner coordinates in ground plane
              const c1 = { u: fm.x + (-halfW * cos - -halfL * sin), v: fm.y + (-halfW * sin + -halfL * cos) };
              const c2 = { u: fm.x + (halfW * cos - -halfL * sin), v: fm.y + (halfW * sin + -halfL * cos) };
              const c3 = { u: fm.x + (halfW * cos - halfL * sin), v: fm.y + (halfW * sin + halfL * cos) };
              const c4 = { u: fm.x + (-halfW * cos - halfL * sin), v: fm.y + (-halfW * sin + halfL * cos) };

              const p1 = toIso(c1.u, c1.v, 0);
              const p2 = toIso(c2.u, c2.v, 0);
              const p3 = toIso(c3.u, c3.v, 0);
              const p4 = toIso(c4.u, c4.v, 0);
              const centerIso = toIso(fm.x, fm.y, 0);

              return (
                <g
                  key={fm.id}
                  id={`marking-${fm.id}`}
                  className={isEditMode ? 'cursor-pointer hover:opacity-80' : ''}
                  onClick={(e) => {
                    if (isEditMode) {
                      e.stopPropagation();
                      setSelectedTarget({ type: 'marking', id: fm.id });
                    }
                  }}
                >
                  <polygon
                    points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                    fill={fm.color || '#facc15'}
                    fillOpacity={isSelected ? 0.35 : (fm.fillOpacity || 0.08)}
                    stroke={isSelected ? '#f59e0b' : (fm.color || '#facc15')}
                    strokeWidth={isSelected ? 4 : (fm.strokeWidth || 3)}
                    strokeDasharray={isSelected ? '6,3' : 'none'}
                    filter={isSelected ? 'url(#yellowGlow)' : undefined}
                  />

                  {/* Marking Label */}
                  {isEditMode && (
                    <text
                      x={centerIso.x}
                      y={centerIso.y}
                      fill="#b45309"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {fm.name} {rot !== 0 ? `(${Math.round(rot)}°)` : ''}
                    </text>
                  )}

                  {/* INLINE FLOATING ROTATION & ACTION BAR ON CANVAS */}
                  {isEditMode && isSelected && (
                    <g transform={`translate(${centerIso.x}, ${centerIso.y - 28})`}>
                      <rect x="-80" y="-13" width="160" height="26" rx="13" fill="#020617" stroke="#facc15" strokeWidth="1.2" filter="url(#shadow3d)" />
                      <text x="-60" y="4" fill="#facc15" fontSize="9" fontWeight="bold" textAnchor="middle">✥ Kéo</text>
                      <line x1="-42" y1="-7" x2="-42" y2="7" stroke="#334155" strokeWidth="1" />
                      
                      {/* Rotate -15° */}
                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = floorMarkings.map(m => m.id === fm.id ? { ...m, rotation: ((fm.rotation || 0) - 15 + 360) % 360 } : m);
                          onUpdateFloorMarkings?.(updated);
                        }}
                      >
                        <rect x="-38" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                        <text x="-27" y="3.5" fill="#facc15" fontSize="9" fontWeight="bold" textAnchor="middle">↺</text>
                      </g>

                      {/* Current Angle Display / Reset to 0° */}
                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = floorMarkings.map(m => m.id === fm.id ? { ...m, rotation: 0 } : m);
                          onUpdateFloorMarkings?.(updated);
                        }}
                      >
                        <rect x="-13" y="-9" width="26" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                        <text x="0" y="3.5" fill="#fef08a" fontSize="8" fontWeight="bold" textAnchor="middle">{Math.round(fm.rotation || 0)}°</text>
                      </g>

                      {/* Rotate +15° */}
                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = floorMarkings.map(m => m.id === fm.id ? { ...m, rotation: ((fm.rotation || 0) + 15) % 360 } : m);
                          onUpdateFloorMarkings?.(updated);
                        }}
                      >
                        <rect x="16" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                        <text x="27" y="3.5" fill="#facc15" fontSize="9" fontWeight="bold" textAnchor="middle">↻</text>
                      </g>

                      <line x1="42" y1="-7" x2="42" y2="7" stroke="#334155" strokeWidth="1" />

                      {/* Delete */}
                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = floorMarkings.filter(m => m.id !== fm.id);
                          onUpdateFloorMarkings?.(updated);
                          setSelectedTarget(null);
                        }}
                      >
                        <rect x="46" y="-9" width="28" height="18" rx="4" fill="#e11d48" />
                        <text x="60" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">✕ XÓA</text>
                      </g>
                    </g>
                  )}
                </g>
              );
            } else {
              // Line type with rotation
              const len = fm.length || 20;
              const halfLen = len / 2;
              const pStart = toIso(fm.x - halfLen * Math.cos(rad), fm.y - halfLen * Math.sin(rad), 0);
              const pEnd = toIso(fm.x + halfLen * Math.cos(rad), fm.y + halfLen * Math.sin(rad), 0);
              const centerIso = toIso(fm.x, fm.y, 0);

              return (
                <g
                  key={fm.id}
                  id={`marking-line-${fm.id}`}
                  className={isEditMode ? 'cursor-pointer hover:opacity-80' : ''}
                  onClick={(e) => {
                    if (isEditMode) {
                      e.stopPropagation();
                      setSelectedTarget({ type: 'marking', id: fm.id });
                    }
                  }}
                >
                  <line
                    x1={pStart.x}
                    y1={pStart.y}
                    x2={pEnd.x}
                    y2={pEnd.y}
                    stroke={isSelected ? '#f59e0b' : (fm.color || '#facc15')}
                    strokeWidth={isSelected ? 5 : (fm.strokeWidth || 3)}
                    strokeDasharray="8,4"
                  />

                  {/* INLINE FLOATING ROTATION & ACTION BAR ON CANVAS */}
                  {isEditMode && isSelected && (
                    <g transform={`translate(${centerIso.x}, ${centerIso.y - 28})`}>
                      <rect x="-80" y="-13" width="160" height="26" rx="13" fill="#020617" stroke="#facc15" strokeWidth="1.2" filter="url(#shadow3d)" />
                      <text x="-60" y="4" fill="#facc15" fontSize="9" fontWeight="bold" textAnchor="middle">✥ Kéo</text>
                      <line x1="-42" y1="-7" x2="-42" y2="7" stroke="#334155" strokeWidth="1" />
                      
                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = floorMarkings.map(m => m.id === fm.id ? { ...m, rotation: ((fm.rotation || 0) - 15 + 360) % 360 } : m);
                          onUpdateFloorMarkings?.(updated);
                        }}
                      >
                        <rect x="-38" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                        <text x="-27" y="3.5" fill="#facc15" fontSize="9" fontWeight="bold" textAnchor="middle">↺</text>
                      </g>

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = floorMarkings.map(m => m.id === fm.id ? { ...m, rotation: 0 } : m);
                          onUpdateFloorMarkings?.(updated);
                        }}
                      >
                        <rect x="-13" y="-9" width="26" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                        <text x="0" y="3.5" fill="#fef08a" fontSize="8" fontWeight="bold" textAnchor="middle">{Math.round(fm.rotation || 0)}°</text>
                      </g>

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = floorMarkings.map(m => m.id === fm.id ? { ...m, rotation: ((fm.rotation || 0) + 15) % 360 } : m);
                          onUpdateFloorMarkings?.(updated);
                        }}
                      >
                        <rect x="16" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                        <text x="27" y="3.5" fill="#facc15" fontSize="9" fontWeight="bold" textAnchor="middle">↻</text>
                      </g>

                      <line x1="42" y1="-7" x2="42" y2="7" stroke="#334155" strokeWidth="1" />

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = floorMarkings.filter(m => m.id !== fm.id);
                          onUpdateFloorMarkings?.(updated);
                          setSelectedTarget(null);
                        }}
                      >
                        <rect x="46" y="-9" width="28" height="18" rx="4" fill="#e11d48" />
                        <text x="60" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">✕ XÓA</text>
                      </g>
                    </g>
                  )}
                </g>
              );
            }
          })}
        </g>

        {/* 3. DYNAMIC FACILITY OBJECTS (Sàn Mezzanine, Pallet, Băng tải, AGV, Bàn QC, Cổng, Cây cảnh...) */}
        <g id="warehouse-facilities">
          {facilities.map((fac) => {
            const isBeingEdited = isEditMode && selectedTarget?.type === 'facility' && selectedTarget.id === fac.id;
            const facDeg = fac.rotation || 0;
            const getFacPt = (du: number, dv: number, h: number = 0) =>
              getIsoWithRot(fac.x, fac.y, du, dv, h, facDeg);

            return (
              <g
                key={fac.id}
                id={`fac-${fac.id}`}
                className={isEditMode ? 'cursor-pointer hover:opacity-90' : ''}
                onClick={(e) => {
                  if (isEditMode) {
                    e.stopPropagation();
                    setSelectedTarget({ type: 'facility', id: fac.id });
                  }
                }}
              >
                {/* 1. SÀN GÁC LỬNG / MEZZANINE CANOPY 3D */}
                {fac.type === 'mezzanine' && (() => {
                  const w = fac.width || 30;
                  const l = fac.length || 20;
                  const h = fac.height || 28;

                  const g1 = getFacPt(-w / 2, -l / 2, 0);
                  const g2 = getFacPt(w / 2, -l / 2, 0);
                  const g3 = getFacPt(w / 2, l / 2, 0);
                  const g4 = getFacPt(-w / 2, l / 2, 0);

                  const p1 = getFacPt(-w / 2, -l / 2, h);
                  const p2 = getFacPt(w / 2, -l / 2, h);
                  const p3 = getFacPt(w / 2, l / 2, h);
                  const p4 = getFacPt(-w / 2, l / 2, h);

                  const gMid1 = getFacPt(0, -l / 2, 0);
                  const pMid1 = getFacPt(0, -l / 2, h);
                  const gMid2 = getFacPt(0, l / 2, 0);
                  const pMid2 = getFacPt(0, l / 2, h);

                  const rh = h + 6;
                  const r1 = getFacPt(-w / 2, -l / 2, rh);
                  const r2 = getFacPt(w / 2, -l / 2, rh);
                  const r3 = getFacPt(w / 2, l / 2, rh);
                  const r4 = getFacPt(-w / 2, l / 2, rh);

                  return (
                    <g>
                      {/* Pillars */}
                      <line x1={g1.x} y1={g1.y} x2={p1.x} y2={p1.y} stroke="#334155" strokeWidth="3" />
                      <line x1={g2.x} y1={g2.y} x2={p2.x} y2={p2.y} stroke="#334155" strokeWidth="3" />
                      <line x1={g3.x} y1={g3.y} x2={p3.x} y2={p3.y} stroke="#334155" strokeWidth="3" />
                      <line x1={g4.x} y1={g4.y} x2={p4.x} y2={p4.y} stroke="#334155" strokeWidth="3" />
                      <line x1={gMid1.x} y1={gMid1.y} x2={pMid1.x} y2={pMid1.y} stroke="#475569" strokeWidth="2" />
                      <line x1={gMid2.x} y1={gMid2.y} x2={pMid2.x} y2={pMid2.y} stroke="#475569" strokeWidth="2" />

                      {/* Main Platform Floor */}
                      <polygon
                        points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                        fill={fac.color || '#f8fafc'}
                        fillOpacity="0.88"
                        stroke={isBeingEdited ? '#f59e0b' : '#0284c7'}
                        strokeWidth={isBeingEdited ? 3 : 1.8}
                        filter="url(#shadow3d)"
                      />

                      {/* Floor Grid */}
                      <line x1={(p1.x + p4.x)/2} y1={(p1.y + p4.y)/2} x2={(p2.x + p3.x)/2} y2={(p2.y + p3.y)/2} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1={(p1.x + p2.x)/2} y1={(p1.y + p2.y)/2} x2={(p4.x + p3.x)/2} y2={(p4.y + p3.y)/2} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />

                      {/* Yellow Handrails */}
                      <polyline points={`${r1.x},${r1.y} ${r2.x},${r2.y} ${r3.x},${r3.y} ${r4.x},${r4.y}`} fill="none" stroke="#facc15" strokeWidth="2" />
                      <line x1={p1.x} y1={p1.y} x2={r1.x} y2={r1.y} stroke="#facc15" strokeWidth="1.5" />
                      <line x1={p2.x} y1={p2.y} x2={r2.x} y2={r2.y} stroke="#facc15" strokeWidth="1.5" />
                      <line x1={p3.x} y1={p3.y} x2={r3.x} y2={r3.y} stroke="#facc15" strokeWidth="1.5" />
                      <line x1={p4.x} y1={p4.y} x2={r4.x} y2={r4.y} stroke="#facc15" strokeWidth="1.5" />

                      {/* Stairs */}
                      {fac.hasStairs !== false && (() => {
                        const sTop = getFacPt(-w / 2, 0, h);
                        const sBot = getFacPt(-w / 2 - 6, 0, 0);
                        return (
                          <g>
                            <line x1={sBot.x} y1={sBot.y} x2={sTop.x} y2={sTop.y} stroke="#0284c7" strokeWidth="3" />
                            <line x1={sBot.x + 3} y1={sBot.y + 2} x2={sTop.x + 3} y2={sTop.y + 2} stroke="#0284c7" strokeWidth="3" />
                            {Array.from({ length: 5 }).map((_, stepI) => {
                              const ratio = (stepI + 1) / 6;
                              const stepPt = getFacPt(-w / 2 - 6 + 6 * ratio, 0, h * ratio);
                              return <line key={`st-${fac.id}-${stepI}`} x1={stepPt.x - 2} y1={stepPt.y} x2={stepPt.x + 4} y2={stepPt.y} stroke="#f1f5f9" strokeWidth="1.5" />;
                            })}
                          </g>
                        );
                      })()}

                      {/* Label Badge */}
                      {(() => {
                        const lblPos = getFacPt(0, 0, h + 14);
                        return (
                          <g transform={`translate(${lblPos.x}, ${lblPos.y})`}>
                            <rect x="-65" y="-10" width="130" height="20" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" filter="url(#shadow3d)" />
                            <text x="0" y="3" fill="#38bdf8" fontSize="7.5" fontWeight="900" textAnchor="middle">
                              🏢 {fac.name.toUpperCase()}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })()}

                {/* 2. KHU PALLET / THÙNG CHỨA STAGING 3D */}
                {fac.type === 'pallet_staging' && (() => {
                  const w = fac.width || 12;
                  const l = fac.length || 12;
                  const h = fac.height || 6;

                  const g1 = getFacPt(-w / 2, -l / 2, 0);
                  const g2 = getFacPt(w / 2, -l / 2, 0);
                  const g3 = getFacPt(w / 2, l / 2, 0);
                  const g4 = getFacPt(-w / 2, l / 2, 0);

                  const t1 = getFacPt(-w / 2, -l / 2, h);
                  const t2 = getFacPt(w / 2, -l / 2, h);
                  const t3 = getFacPt(w / 2, l / 2, h);
                  const t4 = getFacPt(-w / 2, l / 2, h);

                  return (
                    <g>
                      {/* Floor Boundary */}
                      <polygon
                        points={`${g1.x},${g1.y} ${g2.x},${g2.y} ${g3.x},${g3.y} ${g4.x},${g4.y}`}
                        fill={fac.color || '#2563eb'}
                        fillOpacity="0.2"
                        stroke={isBeingEdited ? '#f59e0b' : '#facc15'}
                        strokeWidth={isBeingEdited ? 3 : 1.5}
                        strokeDasharray="4 2"
                      />

                      {/* Stacked Cargo Boxes */}
                      <polygon
                        points={`${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y} ${t4.x},${t4.y}`}
                        fill={fac.color || '#2563eb'}
                        fillOpacity="0.85"
                        stroke="#1d4ed8"
                        strokeWidth="1.2"
                        filter="url(#shadow3d)"
                      />
                      <polygon
                        points={`${g2.x},${g2.y} ${g3.x},${g3.y} ${t3.x},${t3.y} ${t2.x},${t2.y}`}
                        fill="#1e40af"
                      />
                      <polygon
                        points={`${g4.x},${g4.y} ${g3.x},${g3.y} ${t3.x},${t3.y} ${t4.x},${t4.y}`}
                        fill="#1e3a8a"
                      />

                      {/* Label Badge */}
                      {(() => {
                        const lblPos = getFacPt(0, 0, h + 10);
                        return (
                          <g transform={`translate(${lblPos.x}, ${lblPos.y})`}>
                            <rect x="-55" y="-9" width="110" height="18" rx="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
                            <text x="0" y="3" fill="#a5b4fc" fontSize="7" fontWeight="bold" textAnchor="middle">
                              📦 {fac.name}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })()}

                {/* 3. BĂNG TẢI CON LĂN / TỰ ĐỘNG */}
                {fac.type === 'conveyor' && (() => {
                  const w = fac.width || 6;
                  const l = fac.length || 24;
                  const h = fac.height || 10;

                  const c1 = getFacPt(-w / 2, -l / 2, h);
                  const c2 = getFacPt(w / 2, -l / 2, h);
                  const c3 = getFacPt(w / 2, l / 2, h);
                  const c4 = getFacPt(-w / 2, l / 2, h);

                  return (
                    <g>
                      <line x1={getFacPt(-w / 2, -l / 2, 0).x} y1={getFacPt(-w / 2, -l / 2, 0).y} x2={c1.x} y2={c1.y} stroke="#475569" strokeWidth="2" />
                      <line x1={getFacPt(w / 2, -l / 2, 0).x} y1={getFacPt(w / 2, -l / 2, 0).y} x2={c2.x} y2={c2.y} stroke="#475569" strokeWidth="2" />
                      <line x1={getFacPt(w / 2, l / 2, 0).x} y1={getFacPt(w / 2, l / 2, 0).y} x2={c3.x} y2={c3.y} stroke="#475569" strokeWidth="2" />
                      <line x1={getFacPt(-w / 2, l / 2, 0).x} y1={getFacPt(-w / 2, l / 2, 0).y} x2={c4.x} y2={c4.y} stroke="#475569" strokeWidth="2" />

                      <polygon
                        points={`${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y} ${c4.x},${c4.y}`}
                        fill="#334155"
                        stroke={isBeingEdited ? '#f59e0b' : '#64748b'}
                        strokeWidth={isBeingEdited ? 2.5 : 1.5}
                        filter="url(#shadow3d)"
                      />

                      {Array.from({ length: 8 }).map((_, rIdx) => {
                        const vPos = -l / 2 + (rIdx + 1) * (l / 9);
                        const rp1 = getFacPt(-w / 2, vPos, h + 1);
                        const rp2 = getFacPt(w / 2, vPos, h + 1);
                        return <line key={`roller-${fac.id}-${rIdx}`} x1={rp1.x} y1={rp1.y} x2={rp2.x} y2={rp2.y} stroke="#94a3b8" strokeWidth="1.8" />;
                      })}

                      {(() => {
                        const lblPos = getFacPt(0, 0, h + 12);
                        return (
                          <g transform={`translate(${lblPos.x}, ${lblPos.y})`}>
                            <rect x="-50" y="-8" width="100" height="16" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
                            <text x="0" y="3" fill="#fbbf24" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                              ⚙️ {fac.name}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })()}

                {/* 4. XE NÂNG AGV TỰ ĐỘNG */}
                {fac.type === 'agv' && (() => {
                  const w = fac.width || 6;
                  const l = fac.length || 8;
                  const h = fac.height || 8;

                  const a1 = getFacPt(-w / 2, -l / 2, h);
                  const a2 = getFacPt(w / 2, -l / 2, h);
                  const a3 = getFacPt(w / 2, l / 2, h);
                  const a4 = getFacPt(-w / 2, l / 2, h);

                  return (
                    <g>
                      <polygon
                        points={`${a1.x},${a1.y} ${a2.x},${a2.y} ${a3.x},${a3.y} ${a4.x},${a4.y}`}
                        fill="#f59e0b"
                        stroke={isBeingEdited ? '#38bdf8' : '#b45309'}
                        strokeWidth={isBeingEdited ? 2.5 : 1.5}
                        filter="url(#shadow3d)"
                      />
                      <circle cx={(a1.x + a3.x)/2} cy={(a1.y + a3.y)/2 - 4} r="3" fill="#ef4444" filter="url(#yellowGlow)" />

                      {(() => {
                        const lblPos = getFacPt(0, 0, h + 12);
                        return (
                          <g transform={`translate(${lblPos.x}, ${lblPos.y})`}>
                            <rect x="-40" y="-8" width="80" height="16" rx="4" fill="#451a03" stroke="#f97316" strokeWidth="1" />
                            <text x="0" y="3" fill="#fdba74" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                              🚚 {fac.name}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })()}

                {/* 5. BÀN THAO TÁC / QC / ĐÓNG GÓI */}
                {fac.type === 'workstation' && (() => {
                  const w = fac.width || 8;
                  const l = fac.length || 5;
                  const h = fac.height || 14;

                  const p1 = getFacPt(-w / 2, -l / 2, h);
                  const p2 = getFacPt(w / 2, -l / 2, h);
                  const p3 = getFacPt(w / 2, l / 2, h);
                  const p4 = getFacPt(-w / 2, l / 2, h);

                  return (
                    <g>
                      <line x1={getFacPt(-w / 2, -l / 2, 0).x} y1={getFacPt(-w / 2, -l / 2, 0).y} x2={p1.x} y2={p1.y} stroke="#0f172a" strokeWidth="2.5" />
                      <line x1={getFacPt(w / 2, -l / 2, 0).x} y1={getFacPt(w / 2, -l / 2, 0).y} x2={p2.x} y2={p2.y} stroke="#0f172a" strokeWidth="2.5" />
                      <line x1={getFacPt(w / 2, l / 2, 0).x} y1={getFacPt(w / 2, l / 2, 0).y} x2={p3.x} y2={p3.y} stroke="#0f172a" strokeWidth="2.5" />
                      <line x1={getFacPt(-w / 2, l / 2, 0).x} y1={getFacPt(-w / 2, l / 2, 0).y} x2={p4.x} y2={p4.y} stroke="#0f172a" strokeWidth="2.5" />

                      <polygon
                        points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                        fill={fac.color || '#10b981'}
                        stroke={isBeingEdited ? '#f59e0b' : '#047857'}
                        strokeWidth={isBeingEdited ? 2.5 : 1.5}
                        filter="url(#shadow3d)"
                      />

                      <line x1={p1.x} y1={p1.y} x2={getFacPt(-w / 2, -l / 2, h + 12).x} y2={getFacPt(-w / 2, -l / 2, h + 12).y} stroke="#0f172a" strokeWidth="2" />
                      <line x1={p2.x} y1={p2.y} x2={getFacPt(w / 2, -l / 2, h + 12).x} y2={getFacPt(w / 2, -l / 2, h + 12).y} stroke="#0f172a" strokeWidth="2" />
                      <line x1={getFacPt(-w / 2, -l / 2, h + 10).x} y1={getFacPt(-w / 2, -l / 2, h + 10).y} x2={getFacPt(w / 2, -l / 2, h + 10).x} y2={getFacPt(w / 2, -l / 2, h + 10).y} stroke="#f59e0b" strokeWidth="1.5" />

                      {(() => {
                        const lblPos = getFacPt(0, 0, h + 16);
                        return (
                          <g transform={`translate(${lblPos.x}, ${lblPos.y})`}>
                            <rect x="-35" y="-8" width="70" height="16" rx="3" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
                            <text x="0" y="3" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                              🛠 {fac.name}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })()}

                {/* 6. BỒN CÂY CẢNH QUAN 5S */}
                {fac.type === 'planter' && (() => {
                  const w = fac.width || 4;
                  const l = fac.length || 16;

                  const p1 = getFacPt(-w / 2, -l / 2, 0);
                  const p2 = getFacPt(w / 2, -l / 2, 0);
                  const p3 = getFacPt(w / 2, l / 2, 0);
                  const p4 = getFacPt(-w / 2, l / 2, 0);
                  const pt1 = getFacPt(-w / 2, -l / 2, 8);
                  const pt2 = getFacPt(w / 2, -l / 2, 8);
                  const pt3 = getFacPt(w / 2, l / 2, 8);
                  const pt4 = getFacPt(-w / 2, l / 2, 8);

                  return (
                    <g>
                      <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`} fill="#475569" />
                      <polygon points={`${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y} ${pt4.x},${pt4.y}`} fill="#334155" stroke={isBeingEdited ? '#f59e0b' : '#1e293b'} strokeWidth="1" />
                      {Array.from({ length: 4 }).map((_, bIdx) => {
                        const bPos = getFacPt(0, -l / 2 + 2 + bIdx * ((l - 4) / 3), 12);
                        return (
                          <g key={`planter-bush-${fac.id}-${bIdx}`} transform={`translate(${bPos.x}, ${bPos.y})`}>
                            <circle cx="0" cy="0" r="7" fill="#15803d" />
                            <circle cx="-2" cy="-2" r="5" fill="#22c55e" />
                            <circle cx="3" cy="-1" r="4" fill="#4ade80" />
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}

                {/* 7. CỔNG XUẤT NHẬP KHO */}
                {fac.type === 'door' && (() => {
                  const l = fac.length || 20;
                  const h = fac.height || 45;
                  const d1 = getFacPt(0, -l / 2, 0);
                  const d2 = getFacPt(0, l / 2, 0);
                  const dt1 = getFacPt(0, -l / 2, h);
                  const dt2 = getFacPt(0, l / 2, h);

                  return (
                    <g>
                      <polygon
                        points={`${d1.x},${d1.y} ${d2.x},${d2.y} ${dt2.x},${dt2.y} ${dt1.x},${dt1.y}`}
                        fill="#1e293b"
                        stroke={isBeingEdited ? '#f59e0b' : '#0284c7'}
                        strokeWidth={isBeingEdited ? 3 : 1.5}
                      />
                      <text x={(d1.x + dt2.x) / 2} y={(d1.y + dt2.y) / 2} fill="#38bdf8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                        🚪 {fac.name}
                      </text>
                    </g>
                  );
                })()}

                {/* Floating action controls above facility when selected in edit mode */}
                {isEditMode && isBeingEdited && (() => {
                  const topPos = getFacPt(0, 0, Math.max(24, fac.height || 20) + 20);
                  return (
                    <g transform={`translate(${topPos.x}, ${topPos.y})`}>
                      <rect x="-80" y="-13" width="160" height="26" rx="13" fill="#020617" stroke="#c084fc" strokeWidth="1.2" filter="url(#shadow3d)" />
                      <text x="-60" y="4" fill="#c084fc" fontSize="9" fontWeight="bold" textAnchor="middle">✥ Kéo</text>
                      <line x1="-42" y1="-7" x2="-42" y2="7" stroke="#334155" strokeWidth="1" />

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = facilities.map(f => f.id === fac.id ? { ...f, rotation: ((fac.rotation || 0) - 15 + 360) % 360 } : f);
                          onUpdateFacilities?.(updated);
                        }}
                      >
                        <rect x="-38" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                        <text x="-27" y="3.5" fill="#c084fc" fontSize="9" fontWeight="bold" textAnchor="middle">↺</text>
                      </g>

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = facilities.map(f => f.id === fac.id ? { ...f, rotation: 0 } : f);
                          onUpdateFacilities?.(updated);
                        }}
                      >
                        <rect x="-13" y="-9" width="26" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                        <text x="0" y="3.5" fill="#e9d5ff" fontSize="8" fontWeight="bold" textAnchor="middle">{Math.round(fac.rotation || 0)}°</text>
                      </g>

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = facilities.map(f => f.id === fac.id ? { ...f, rotation: ((fac.rotation || 0) + 15) % 360 } : f);
                          onUpdateFacilities?.(updated);
                        }}
                      >
                        <rect x="16" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                        <text x="27" y="3.5" fill="#c084fc" fontSize="9" fontWeight="bold" textAnchor="middle">↻</text>
                      </g>

                      <line x1="42" y1="-7" x2="42" y2="7" stroke="#334155" strokeWidth="1" />

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = facilities.filter(f => f.id !== fac.id);
                          onUpdateFacilities?.(updated);
                          setSelectedTarget(null);
                        }}
                      >
                        <rect x="46" y="-9" width="28" height="18" rx="4" fill="#e11d48" />
                        <text x="60" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">✕ XÓA</text>
                      </g>
                    </g>
                  );
                })()}
              </g>
            );
          })}
        </g>

        {/* 4. DYNAMIC RACKS RENDERING (5 KHOANG CỐ ĐỊNH, 3 TẦNG ĐỢT A-B-C NHƯ ẢNH 3) */}
        <g id="warehouse-racks">
          {racks.map((rack) => {
            const isSelected = selectedRackId === rack.id || selectedItem?.rackId === rack.id;
            const isBeingEdited = isEditMode && selectedTarget?.type === 'rack' && selectedTarget.id === rack.id;
            const bayLength = rack.bayLength || 4.8;
            const rackWidth = rack.width || 2.8;
            const baysCount = 5; // AUTO 5 KHOANG THEO YÊU CẦU
            const totalLength = baysCount * bayLength;
            const rackDeg = rack.rotation || 0;

            const getRackPt = (du: number, dv: number, h: number = 0) =>
              getIsoWithRot(rack.x, rack.y, du, dv, h, rackDeg);

            // 3 Tiers (Tầng 1: A - Vàng h=14, Tầng 2: B - Xanh h=30, Tầng 3: C - Đỏ h=46)
            const tiers = [14, 30, 46];

            return (
              <g
                key={rack.id}
                id={`rack-${rack.id}`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditMode) {
                    setSelectedTarget({ type: 'rack', id: rack.id });
                  }
                  onSelectRack(rack.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleStartInlineEditRack(rack);
                }}
              >
                {/* Base Shadow & Selection Highlight */}
                {(() => {
                  const b1 = getRackPt(-rackWidth / 2 - 0.5, -0.5, 0);
                  const b2 = getRackPt(rackWidth / 2 + 0.5, -0.5, 0);
                  const b3 = getRackPt(rackWidth / 2 + 0.5, totalLength + 0.5, 0);
                  const b4 = getRackPt(-rackWidth / 2 - 0.5, totalLength + 0.5, 0);
                  return (
                    <polygon
                      points={`${b1.x},${b1.y} ${b2.x},${b2.y} ${b3.x},${b3.y} ${b4.x},${b4.y}`}
                      fill={isBeingEdited ? '#f59e0b' : isSelected ? '#38bdf8' : '#0f172a'}
                      fillOpacity={isBeingEdited ? 0.45 : isSelected ? 0.35 : 0.15}
                      stroke={isBeingEdited ? '#f59e0b' : isSelected ? '#0284c7' : 'none'}
                      strokeWidth={isBeingEdited ? 3 : isSelected ? 2 : 0}
                      strokeDasharray={isBeingEdited ? '4,3' : 'none'}
                    />
                  );
                })()}

                {/* 5 Bays (Khoang 01 đến 05) */}
                {Array.from({ length: baysCount }).map((_, bayIdx) => {
                  const bayVLocal = bayIdx * bayLength;

                  return (
                    <g key={`rack-${rack.id}-bay-${bayIdx}`}>
                      {/* Black Steel Uprights */}
                      {[-rackWidth / 2, rackWidth / 2].map((du, uIdx) => {
                        const ptFloor = getRackPt(du, bayVLocal, 0);
                        const ptTop = getRackPt(du, bayVLocal, 54);
                        return (
                          <line
                            key={`post-${uIdx}`}
                            x1={ptFloor.x}
                            y1={ptFloor.y}
                            x2={ptTop.x}
                            y2={ptTop.y}
                            stroke="#0f172a"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                        );
                      })}

                      {/* X-Truss Bracing */}
                      {(() => {
                        const pBotL = getRackPt(-rackWidth / 2, bayVLocal, 0);
                        const pBotR = getRackPt(rackWidth / 2, bayVLocal, 0);
                        const pTopL = getRackPt(-rackWidth / 2, bayVLocal, 52);
                        const pTopR = getRackPt(rackWidth / 2, bayVLocal, 52);
                        return (
                          <g opacity="0.6">
                            <line x1={pBotL.x} y1={pBotL.y} x2={pTopR.x} y2={pTopR.y} stroke="#0f172a" strokeWidth="1.2" />
                            <line x1={pBotR.x} y1={pBotR.y} x2={pTopL.x} y2={pTopL.y} stroke="#0f172a" strokeWidth="1.2" />
                          </g>
                        );
                      })()}

                      {/* 3 TIERS OF INDUSTRIAL BEAMS & INVENTORY BOXES (A, B, C) */}
                      {tiers.map((h, tIdx) => {
                        const p1 = getRackPt(-rackWidth / 2, bayVLocal, h);
                        const p2 = getRackPt(rackWidth / 2, bayVLocal, h);
                        const p3 = getRackPt(rackWidth / 2, bayVLocal + bayLength * 0.94, h);
                        const p4 = getRackPt(-rackWidth / 2, bayVLocal + bayLength * 0.94, h);

                        // 3D Cardboard Box Coordinates on this shelf tier
                        const duBase = -rackWidth / 2 + 0.2;
                        const duTop = rackWidth / 2 - 0.2;
                        const dvBase = bayVLocal + 0.2;
                        const dvTop = bayVLocal + bayLength * 0.88;
                        const boxH = 9.0;

                        // Isometric corners of the box
                        const c1 = getRackPt(duBase, dvBase, h + 1.2);
                        const c2 = getRackPt(duTop, dvBase, h + 1.2);
                        const c3 = getRackPt(duTop, dvTop, h + 1.2);
                        const c4 = getRackPt(duBase, dvTop, h + 1.2);

                        const ct1 = getRackPt(duBase, dvBase, h + 1.2 + boxH);
                        const ct2 = getRackPt(duTop, dvBase, h + 1.2 + boxH);
                        const ct3 = getRackPt(duTop, dvTop, h + 1.2 + boxH);
                        const ct4 = getRackPt(duBase, dvTop, h + 1.2 + boxH);

                        return (
                          <g key={`tier-${tIdx}`}>
                            {/* Orange Decking Beam */}
                            <polygon
                              points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                              fill={rack.color || '#ea580c'}
                              stroke="#c2410c"
                              strokeWidth="1.2"
                            />
                            <line
                              x1={p2.x}
                              y1={p2.y}
                              x2={p3.x}
                              y2={p3.y}
                              stroke="#c2410c"
                              strokeWidth="2.8"
                            />

                            {/* Wooden Pallet Base */}
                            {(() => {
                              const pw1 = getRackPt(duBase, dvBase, h + 0.2);
                              const pw2 = getRackPt(duTop, dvBase, h + 0.2);
                              const pw3 = getRackPt(duTop, dvTop, h + 0.2);
                              const pw4 = getRackPt(duBase, dvTop, h + 0.2);
                              return (
                                <polygon
                                  points={`${pw1.x},${pw1.y} ${pw2.x},${pw2.y} ${pw3.x},${pw3.y} ${pw4.x},${pw4.y}`}
                                  fill="#855d36"
                                  stroke="#5c3e21"
                                  strokeWidth="0.6"
                                />
                              );
                            })()}

                            {/* 3D Kraft Cardboard Box */}
                            <g>
                              {/* Front/Left Face */}
                              <polygon
                                points={`${c1.x},${c1.y} ${c4.x},${c4.y} ${ct4.x},${ct4.y} ${ct1.x},${ct1.y}`}
                                fill="#9e703f"
                                stroke="#785329"
                                strokeWidth="0.8"
                              />
                              {/* Right/Side Face */}
                              <polygon
                                points={`${c4.x},${c4.y} ${c3.x},${c3.y} ${ct3.x},${ct3.y} ${ct4.x},${ct4.y}`}
                                fill="#c29158"
                                stroke="#785329"
                                strokeWidth="0.8"
                              />
                              {/* Top Face */}
                              <polygon
                                points={`${ct1.x},${ct1.y} ${ct2.x},${ct2.y} ${ct3.x},${ct3.y} ${ct4.x},${ct4.y}`}
                                fill="#d9a86c"
                                stroke="#9e703f"
                                strokeWidth="0.8"
                              />
                              {/* Tape line */}
                              <line
                                x1={(ct1.x + ct4.x) / 2}
                                y1={(ct1.y + ct4.y) / 2}
                                x2={(ct2.x + ct3.x) / 2}
                                y2={(ct2.y + ct3.y) / 2}
                                stroke="#a87c46"
                                strokeWidth="1.2"
                              />
                            </g>
                          </g>
                        );
                      })}

                      {/* Small Bay Number Badge at bottom */}
                      {(() => {
                        const lblPt = getRackPt(rackWidth / 2 + 1.2, bayVLocal + bayLength / 2, 4);
                        return (
                          <g transform={`translate(${lblPt.x}, ${lblPt.y})`}>
                            <rect x="-7" y="-4" width="14" height="8" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.5" />
                            <text x="0" y="2.5" fill="#f8fafc" fontSize="5" fontWeight="bold" textAnchor="middle">
                              {String(bayIdx + 1).padStart(2, '0')}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}

                {/* Final End Post */}
                {(() => {
                  const ptFloorL = getRackPt(-rackWidth / 2, totalLength, 0);
                  const ptTopL = getRackPt(-rackWidth / 2, totalLength, 54);
                  const ptFloorR = getRackPt(rackWidth / 2, totalLength, 0);
                  const ptTopR = getRackPt(rackWidth / 2, totalLength, 54);
                  return (
                    <g>
                      <line x1={ptFloorL.x} y1={ptFloorL.y} x2={ptTopL.x} y2={ptTopL.y} stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" />
                      <line x1={ptFloorR.x} y1={ptFloorR.y} x2={ptTopR.x} y2={ptTopR.y} stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" />
                    </g>
                  );
                })()}

                {/* 3D Header Aisle Banner on top */}
                {(() => {
                  const topCenter = getRackPt(0, totalLength / 2, 60);
                  return (
                    <g 
                      transform={`translate(${topCenter.x}, ${topCenter.y})`}
                      className="cursor-pointer hover:scale-110 transition-transform"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleStartInlineEditRack(rack);
                      }}
                      title={`Kích đúp để đổi tên / sửa chữ Kệ ${rack.id} • Bấm Ctrl+C / Ctrl+V để copy`}
                    >
                      <rect
                        x="-14"
                        y="-10"
                        width="28"
                        height="18"
                        rx="4"
                        fill={rack.color || '#ea580c'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        filter="url(#shadow3d)"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        {rack.id}
                      </text>
                    </g>
                  );
                })()}

                {/* Floating action bar above selected rack in edit mode */}
                {isEditMode && isBeingEdited && (() => {
                  const floatPos = getRackPt(0, totalLength / 2, 68);
                  return (
                    <g transform={`translate(${floatPos.x}, ${floatPos.y})`}>
                      <rect x="-80" y="-13" width="160" height="26" rx="13" fill="#020617" stroke="#f59e0b" strokeWidth="1.2" filter="url(#shadow3d)" />
                      <text x="-60" y="4" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">✥ Kéo</text>
                      <line x1="-42" y1="-7" x2="-42" y2="7" stroke="#334155" strokeWidth="1" />

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = racks.map(r => r.id === rack.id ? { ...r, rotation: ((rack.rotation || 0) - 15 + 360) % 360 } : r);
                          onUpdateRacks?.(updated);
                        }}
                      >
                        <rect x="-38" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                        <text x="-27" y="3.5" fill="#fbfb24" fontSize="9" fontWeight="bold" textAnchor="middle">↺</text>
                      </g>

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = racks.map(r => r.id === rack.id ? { ...r, rotation: 0 } : r);
                          onUpdateRacks?.(updated);
                        }}
                      >
                        <rect x="-13" y="-9" width="26" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                        <text x="0" y="3.5" fill="#fef08a" fontSize="8" fontWeight="bold" textAnchor="middle">{Math.round(rack.rotation || 0)}°</text>
                      </g>

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = racks.map(r => r.id === rack.id ? { ...r, rotation: ((rack.rotation || 0) + 15) % 360 } : r);
                          onUpdateRacks?.(updated);
                        }}
                      >
                        <rect x="16" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                        <text x="27" y="3.5" fill="#fbfb24" fontSize="9" fontWeight="bold" textAnchor="middle">↻</text>
                      </g>

                      <line x1="42" y1="-7" x2="42" y2="7" stroke="#334155" strokeWidth="1" />

                      <g
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = racks.filter(r => r.id !== rack.id);
                          onUpdateRacks?.(updated);
                          setSelectedTarget(null);
                        }}
                      >
                        <rect x="46" y="-9" width="28" height="18" rx="4" fill="#e11d48" />
                        <text x="60" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">✕ XÓA</text>
                      </g>
                    </g>
                  );
                })()}
              </g>
            );
          })}
        </g>

        {/* 5. DYNAMIC MAP TEXT ANNOTATIONS (CHỈ DẪN VÀ TÊN KHU VỰC TÙY BIẾN) */}
        <g id="map-text-annotations">
          {annotations.map((ann) => {
            const isSelected = selectedTarget?.type === 'annotation' && selectedTarget.id === ann.id;
            const pos = toIso(ann.x, ann.y, 0);
            const approxTextWidth = Math.max(60, (ann.textVi.length * (ann.fontSize || 12)) * 0.65);
            const boxHeight = (ann.fontSize || 12) * (ann.textEn ? 2.4 : 1.6);

            return (
              <g
                key={ann.id}
                id={`ann-${ann.id}`}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${ann.rotation || 0})`}
                className={isEditMode ? 'cursor-move' : 'cursor-pointer'}
                onClick={(e) => {
                  if (isEditMode) {
                    e.stopPropagation();
                    setSelectedTarget({ type: 'annotation', id: ann.id });
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditMode(true);
                  setSelectedTarget({ type: 'annotation', id: ann.id });
                }}
                title="Kích đúp để sửa chữ / đổi góc xoay nhãn"
              >
                {/* Visual Bounding Capsule for easy clicking and moving */}
                <rect
                  x={-approxTextWidth / 2 - 8}
                  y={-boxHeight / 2 - 4}
                  width={approxTextWidth + 16}
                  height={boxHeight + 8}
                  rx="8"
                  fill={isSelected ? '#0f172a' : '#ffffff'}
                  fillOpacity={isSelected ? '0.85' : '0.45'}
                  stroke={isSelected ? '#06b6d4' : '#94a3b8'}
                  strokeWidth={isSelected ? '2' : '0.8'}
                  strokeDasharray={isSelected ? 'none' : '3,2'}
                  filter="url(#shadow3d)"
                />

                {/* Edit Mode Inline Controls above selected annotation */}
                {isEditMode && isSelected && (
                  <g transform={`translate(0, ${-boxHeight / 2 - 20})`}>
                    {/* Floating action pill */}
                    <rect x="-80" y="-13" width="160" height="26" rx="13" fill="#020617" stroke="#38bdf8" strokeWidth="1.2" filter="url(#shadow3d)" />
                    {/* Drag indicator icon */}
                    <text x="-60" y="4" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">✥ Kéo</text>
                    <line x1="-42" y1="-7" x2="-42" y2="7" stroke="#334155" strokeWidth="1" />

                    {/* Rotate -15° */}
                    <g
                      className="cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        const cur = ann.rotation || 0;
                        const updated = annotations.map(a => a.id === ann.id ? { ...a, rotation: (cur - 15 + 360) % 360 } : a);
                        onUpdateAnnotations?.(updated);
                      }}
                    >
                      <rect x="-38" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                      <text x="-27" y="3.5" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">↺</text>
                    </g>

                    {/* Current Angle / Reset to 0° */}
                    <g
                      className="cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = annotations.map(a => a.id === ann.id ? { ...a, rotation: 0 } : a);
                        onUpdateAnnotations?.(updated);
                      }}
                    >
                      <rect x="-13" y="-9" width="26" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                      <text x="0" y="3.5" fill="#e2e8f0" fontSize="8" fontWeight="bold" textAnchor="middle">{Math.round(ann.rotation || 0)}°</text>
                    </g>

                    {/* Rotate +15° */}
                    <g
                      className="cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        const cur = ann.rotation || 0;
                        const updated = annotations.map(a => a.id === ann.id ? { ...a, rotation: (cur + 15) % 360 } : a);
                        onUpdateAnnotations?.(updated);
                      }}
                    >
                      <rect x="16" y="-9" width="22" height="18" rx="4" fill="#1e293b" />
                      <text x="27" y="3.5" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">↻</text>
                    </g>

                    <line x1="42" y1="-7" x2="42" y2="7" stroke="#334155" strokeWidth="1" />

                    {/* Delete button (Xóa) */}
                    <g 
                      className="cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = annotations.filter(a => a.id !== ann.id);
                        onUpdateAnnotations?.(updated);
                        setSelectedTarget(null);
                      }}
                    >
                      <rect x="46" y="-9" width="28" height="18" rx="4" fill="#e11d48" />
                      <text x="60" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">✕ XÓA</text>
                    </g>
                  </g>
                )}

                {/* 5S Badge if present */}
                {ann.badge5s && (
                  <g transform="translate(0, -18)">
                    <rect x="-10" y="-8" width="20" height="15" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" filter="url(#shadow3d)" />
                    <text x="0" y="3" fill="#0284c7" fontSize="8" fontWeight="900" textAnchor="middle">
                      {ann.badge5s}
                    </text>
                  </g>
                )}

                {/* Primary Vietnamese Label */}
                <text
                  x="0"
                  y={ann.textEn ? -2 : 4}
                  fill={isSelected ? '#f8fafc' : (ann.color || '#0f172a')}
                  fontSize={ann.fontSize || 12}
                  fontWeight="900"
                  textAnchor="middle"
                  letterSpacing="0.5"
                  style={{ textShadow: isSelected ? 'none' : '0 1px 3px rgba(255,255,255,0.9)' }}
                >
                  {ann.textVi}
                </text>

                {/* Optional English Subtitle */}
                {ann.textEn && (
                  <text
                    x="0"
                    y={Math.round((ann.fontSize || 12) * 0.95)}
                    fill={isSelected ? '#94a3b8' : '#475569'}
                    fontSize={Math.max(7, Math.round((ann.fontSize || 12) * 0.65))}
                    fontWeight="800"
                    textAnchor="middle"
                    letterSpacing="0.5"
                    style={{ textShadow: isSelected ? 'none' : '0 1px 2px rgba(255,255,255,0.9)' }}
                  >
                    {ann.textEn}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 6. "YOU ARE HERE" PIN (ĐIỂM XANH CHỈ DẪN VỊ TRÍ - CHO PHÉP BẤM & KÉO RÊ THẢ) */}
        <g 
          id="you-are-here-pin" 
          transform={`translate(${currentPinIso.x}, ${currentPinIso.y})`}
          className={`${isDraggingPin ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-110'} transition-transform duration-100`}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingPin(true);
          }}
        >
          <circle cx="0" cy="0" r="32" fill="url(#pinGlow)" className="animate-pulse" />
          <ellipse cx="0" cy="0" rx="14" ry="7" fill="#0284c7" fillOpacity="0.6" />
          
          <g transform="translate(0, -32)">
            <path
              d="M 0 -22 C -11 -22 -18 -13 -18 -2 C -18 10 0 24 0 24 C 0 24 18 10 18 -2 C 18 -13 11 -22 0 -22 Z"
              fill="#0284c7"
              stroke="#38bdf8"
              strokeWidth="2.5"
              filter="url(#shadow3d)"
            />
            <circle cx="0" cy="-3" r="6.5" fill="#ffffff" />
            <circle cx="0" cy="-3" r="3.5" fill="#0284c7" />

            <g transform="translate(0, -32)">
              <rect x="-60" y="-12" width="120" height="24" rx="12" fill="#0f172a" stroke={isDraggingPin ? '#facc15' : '#38bdf8'} strokeWidth="2" />
              <text x="0" y="4" fill={isDraggingPin ? '#facc15' : '#38bdf8'} fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
                {isDraggingPin ? '✊ ĐANG KÉO VỊ TRÍ' : '📍 VỊ TRÍ CỦA BẠN'}
              </text>
            </g>
          </g>
        </g>
      </svg>

      {/* FLOATING MANUAL D-PAD DIRECTIONAL CONTROLLER (IMAGE 2 STYLE) */}
      <div className="absolute bottom-16 right-4 z-30 pointer-events-auto">
        <ManualDPadController
          onMove={handleManualMovePin}
          size="md"
          label="NÚT DI CHUYỂN VỊ TRÍ"
        />
      </div>

      {/* Floating Bottom Bar: Active Location Info */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700 text-white shadow-xl pointer-events-none">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-200">
            {currentPosition.label || 'Vị trí kho chính'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Toạ độ: ({currentPosition.x.toFixed(0)}, {currentPosition.y.toFixed(0)})
          </span>
          {selectedItem && (
            <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 text-[11px] font-bold">
              Đang dẫn đường: {selectedItem.code} ({selectedItem.location})
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
