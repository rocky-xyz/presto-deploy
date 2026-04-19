import { useRef, useState, useEffect, useCallback } from 'react';
import type { MouseEvent as RMouseEvent } from 'react';
import type { Slide, SlideElement, SlideBackground } from './store';

const CANVAS_BASE_WIDTH = 1600;
const CANVAS_BASE_HEIGHT = 900;

interface SlideCanvasProps {
  slide: Slide;
  defaultBackground?: SlideBackground;
  isPreview?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onDoubleClickElement?: (id: string) => void;
  onDeleteElement?: (id: string) => void;
  onMoveElement?: (id: string, x: number, y: number) => void;
  onResizeElement?: (
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    contentUpdates?: Partial<Pick<SlideElement, 'fontSize' | 'codeFontSize' | 'contentScaleX'>>
  ) => void;
  onToggleScaleMode?: (id: string) => void;
  onMoveLayer?: (id: string, direction: 'forward' | 'backward') => void;
  slideNumber: number;
}

function getBackground(slide: Slide, defaultBg?: SlideBackground): React.CSSProperties {
  const bg = slide.background || defaultBg;
  if (!bg) return { backgroundColor: '#ffffff' };
  if (bg.type === 'solid') return { backgroundColor: bg.color || '#ffffff' };
  if (bg.type === 'gradient') return { background: bg.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
  if (bg.type === 'image') return { backgroundImage: `url(${bg.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { backgroundColor: '#ffffff' };
}

export function SlideCanvas(props: SlideCanvasProps) {
  const {
    slide,
    defaultBackground,
    isPreview = false,
    slideNumber,
    selectedElementId,
    onSelectElement,
    onDoubleClickElement,
    onDeleteElement,
    onMoveElement,
  } = props;

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);

  const getCanvasRect = () => canvasRef.current?.getBoundingClientRect();

  useEffect(() => {
    if (!canvasRef.current) return;

    const node = canvasRef.current;
    const updateScale = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width) return;
      setCanvasScale(rect.width / CANVAS_BASE_WIDTH);
    };

    updateScale();

    const observer = new ResizeObserver(() => updateScale());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    const rect = getCanvasRect();
    if (!rect) return;

    if (!dragging) return;

    const dx = ((e.clientX - dragging.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragging.startY) / rect.height) * 100;
    const el = slide.elements.find(el => el.id === dragging.id);
    if (!el) return;
    const newX = Math.max(0, Math.min(100 - el.width, dragging.elX + dx));
    const newY = Math.max(0, Math.min(100 - el.height, dragging.elY + dy));
    onMoveElement?.(dragging.id, newX, newY);
  }, [dragging, slide.elements, onMoveElement]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: RMouseEvent, el: SlideElement) => {
    if (isPreview) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = getCanvasRect();
    if (!rect) return;
    onSelectElement?.(el.id);
    setDragging({ id: el.id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  };

  const handleContextMenu = (e: RMouseEvent, el: SlideElement) => {
    if (isPreview) return;
    e.preventDefault();
    e.stopPropagation();
    onDeleteElement?.(el.id);
  };

  const sortedElements = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);

  const renderDragPlaceholders = () => sortedElements.map(el => {
    const isSelected = selectedElementId === el.id && !isPreview;
    return (
      <div
        key={el.id}
        className="absolute min-w-0 flex items-center justify-center overflow-hidden border border-dashed border-muted-foreground/40 bg-muted/20 text-[10px] text-muted-foreground"
        style={{
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.width}%`,
          height: `${el.height}%`,
          zIndex: el.zIndex,
          outline: isSelected ? '2px solid #3b82f6' : undefined,
          cursor: isPreview ? 'inherit' : (dragging?.id === el.id ? 'grabbing' : 'grab'),
        }}
        onClick={e => { e.stopPropagation(); if (!isPreview) onSelectElement?.(el.id); }}
        onDoubleClick={e => { e.stopPropagation(); if (!isPreview) onDoubleClickElement?.(el.id); }}
        onContextMenu={e => handleContextMenu(e, el)}
        onMouseDown={e => { if (e.button === 0 && !isPreview) handleMouseDown(e, el); }}
      >
        {el.type}
      </div>
    );
  });

  return (
    <div
      ref={canvasRef}
      className="relative w-full overflow-hidden select-none"
      style={{ ...getBackground(slide, defaultBackground), aspectRatio: '16/9' }}
      onClick={() => { if (!isPreview) onSelectElement?.(null); }}
    >
      {isPreview ? (
        <div
          className="absolute top-0 left-0"
          style={{
            width: CANVAS_BASE_WIDTH,
            height: CANVAS_BASE_HEIGHT,
            transform: `scale(${canvasScale})`,
            transformOrigin: 'top left',
          }}
        >
          {renderDragPlaceholders()}
          <div className="absolute bottom-18 left-24 text-[20px] px-3 py-1 rounded bg-black/50 text-white" style={{ zIndex: 1000 }}>
            {slideNumber}
          </div>
        </div>
      ) : (
        <>
          {renderDragPlaceholders()}
          <div className="absolute bottom-2 left-3 text-xs px-2 py-0.5 rounded bg-black/50 text-white" style={{ zIndex: 1000 }}>
            {slideNumber}
          </div>
        </>
      )}
    </div>
  );
}