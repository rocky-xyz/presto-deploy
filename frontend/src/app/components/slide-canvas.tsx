
import { useRef, useState, useEffect } from 'react';
import type { MouseEvent as RMouseEvent } from 'react';
import type { Slide, SlideElement, SlideBackground } from './store';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import c from 'highlight.js/lib/languages/c';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('c', c);

const CANVAS_BASE_WIDTH = 1600;
const CANVAS_BASE_HEIGHT = 900;
const CANVAS_BASE_FONT_SIZE = 16;

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

function highlightCode(code: string): string {
  try {
    const result = hljs.highlightAuto(code, ['javascript', 'python', 'c']);
    return result.value;
  } catch { return code; }
}

export function SlideCanvas({
  slide, defaultBackground, isPreview = false,
  selectedElementId, onSelectElement, onDoubleClickElement, onDeleteElement,
  onMoveElement, onResizeElement, onToggleScaleMode, onMoveLayer, slideNumber,
}: SlideCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{
    id: string;
    corner: string;
    startX: number;
    startY: number;
    elX: number;
    elY: number;
    elW: number;
    elH: number;
    textFontSize?: number;
    codeFontSize?: number;
    contentScaleX?: number;
  } | null>(null);
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

  const handleMouseDown = (e: RMouseEvent, el: SlideElement, corner?: string) => {
    if (isPreview) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = getCanvasRect();
    if (!rect) return;

    if (corner) {
      setResizing({
        id: el.id,
        corner,
        startX: e.clientX,
        startY: e.clientY,
        elX: el.x,
        elY: el.y,
        elW: el.width,
        elH: el.height,
        textFontSize: el.fontSize,
        codeFontSize: el.codeFontSize,
        contentScaleX: el.contentScaleX ?? 1,
      });
    } else {
      onSelectElement?.(el.id);
      setDragging({ id: el.id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
    }
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    const rect = getCanvasRect();
    if (!rect) return;

    if (dragging) {
      const dx = ((e.clientX - dragging.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragging.startY) / rect.height) * 100;
      const el = slide.elements.find(el => el.id === dragging.id);
      if (!el) return;
      const newX = Math.max(0, Math.min(100 - el.width, dragging.elX + dx));
      const newY = Math.max(0, Math.min(100 - el.height, dragging.elY + dy));
      onMoveElement?.(dragging.id, newX, newY);
    }

    if (resizing) {
      const dx = ((e.clientX - resizing.startX) / rect.width) * 100;
      const dy = ((e.clientY - resizing.startY) / rect.height) * 100;
      let { elX: x, elY: y, elW: w, elH: h } = resizing;
      const { corner } = resizing;
      const contentUpdates: Partial<Pick<SlideElement, 'fontSize' | 'codeFontSize' | 'contentScaleX'>> = {};

      if (corner.includes('r')) { w = Math.max(1, Math.min(100 - x, w + dx)); }
      if (corner.includes('l')) { const nw = Math.max(1, w - dx); x = x + (w - nw); w = nw; x = Math.max(0, x); }
      if (corner.includes('b')) { h = Math.max(1, Math.min(100 - y, h + dy)); }
      if (corner.includes('t')) { const nh = Math.max(1, h - dy); y = y + (h - nh); h = nh; y = Math.max(0, y); }

      const originalDiagonal = Math.hypot(resizing.elW, resizing.elH);
      const resizedDiagonal = Math.hypot(w, h);
      const contentScale = originalDiagonal > 0
        ? Math.max(0.1, resizedDiagonal / originalDiagonal)
        : 1;
      const element = slide.elements.find(el => el.id === resizing.id);

      if (element?.type === 'text' || element?.type === 'code') {
        if ((element.scaleMode || 'stretch') === 'proportional') {
          if (element.type === 'text' && resizing.textFontSize !== undefined) {
            contentUpdates.fontSize = Math.max(0.1, resizing.textFontSize * contentScale);
          }

          if (element.type === 'code' && resizing.codeFontSize !== undefined) {
            contentUpdates.codeFontSize = Math.max(0.1, resizing.codeFontSize * contentScale);
          }

          contentUpdates.contentScaleX = 1;
        } else {
          const widthScale = resizing.elW > 0 ? w / resizing.elW : 1;
          const heightScale = resizing.elH > 0 ? h / resizing.elH : 1;

          if (element.type === 'text' && resizing.textFontSize !== undefined) {
            contentUpdates.fontSize = Math.max(0.1, resizing.textFontSize * heightScale);
          }

          if (element.type === 'code' && resizing.codeFontSize !== undefined) {
            contentUpdates.codeFontSize = Math.max(0.1, resizing.codeFontSize * heightScale);
          }

          contentUpdates.contentScaleX = Math.max(0.1, (resizing.contentScaleX ?? 1) * (widthScale / Math.max(heightScale, 0.1)));
        }
      }

      onResizeElement?.(
        resizing.id,
        x,
        y,
        w,
        h,
        Object.keys(contentUpdates).length ? contentUpdates : undefined,
      );
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  const handleContextMenu = (e: RMouseEvent, el: SlideElement) => {
    if (isPreview) return;
    e.preventDefault();
    e.stopPropagation();
    onDeleteElement?.(el.id);
  };

  const sortedElements = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);

  const corners = ['tl', 'tr', 'bl', 'br'];
  const cornerPos: Record<string, React.CSSProperties> = {
    tl: { top: -3, left: -3, cursor: 'nwse-resize' },
    tr: { top: -3, right: -3, cursor: 'nesw-resize' },
    bl: { bottom: -3, left: -3, cursor: 'nesw-resize' },
    br: { bottom: -3, right: -3, cursor: 'nwse-resize' },
  };
  const cornerResize: Record<string, string> = { tl: 'tl', tr: 'tr', bl: 'bl', br: 'br' };

  const renderElements = (scaleFonts: boolean) => sortedElements.map(el => {
    const isSelected = selectedElementId === el.id && !isPreview;
    const isHovered = hoveredElementId === el.id && !isPreview;
    const textFontSize = scaleFonts
      ? `${(el.fontSize || 1) * CANVAS_BASE_FONT_SIZE * canvasScale}px`
      : `${el.fontSize || 1}em`;
    const codeFontSize = scaleFonts
      ? `${(el.codeFontSize || 0.8) * CANVAS_BASE_FONT_SIZE * canvasScale}px`
      : `${el.codeFontSize || 0.8}em`;
    const contentScaleX = el.contentScaleX ?? 1;
    const isStretchMode = (el.scaleMode || 'stretch') === 'stretch';

    return (
      <div
        key={el.id}
        className="absolute min-w-0"
        style={{
          left: `${el.x}%`, top: `${el.y}%`,
          width: `${el.width}%`, height: `${el.height}%`,
          zIndex: el.zIndex,
          outline: isSelected ? '2px solid #3b82f6' : (isPreview ? 'none' : '1px solid rgba(0,0,0,0.1)'),
          cursor: isPreview ? 'inherit' : (dragging?.id === el.id ? 'grabbing' : 'grab'),
        }}
        onClick={e => { e.stopPropagation(); if (!isPreview) onSelectElement?.(el.id); }}
        onDoubleClick={e => { e.stopPropagation(); if (!isPreview) onDoubleClickElement?.(el.id); }}
        onContextMenu={e => handleContextMenu(e, el)}
        onMouseDown={e => { if (e.button === 0 && !isPreview) handleMouseDown(e, el); }}
        onMouseEnter={() => { if (!isPreview) setHoveredElementId(el.id); }}
        onMouseLeave={() => { if (!isPreview) setHoveredElementId(current => current === el.id ? null : current); }}
      >
        {el.type === 'text' && (
          <div className="w-full h-full overflow-auto p-1" style={{
            fontSize: textFontSize,
            color: el.color || '#000000',
            fontFamily: el.fontFamily || 'Inter, sans-serif',
            whiteSpace: 'pre-wrap', textAlign: el.textAlign || 'center',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            minWidth: 0,
            border: isPreview ? 'none' : '1px solid #e5e7eb',
            cursor: 'inherit',
          }}>
            <div
              style={isStretchMode ? {
                width: `${100 / contentScaleX}%`,
                minHeight: '100%',
                transform: `scaleX(${contentScaleX})`,
                transformOrigin: 'top left',
              } : { minHeight: '100%' }}
              className="flex h-full items-center justify-center"
            >
              <div className="w-full">
                {el.text}
              </div>
            </div>
          </div>
        )}
        {el.type === 'image' && (
          <div className="w-full h-full flex items-center justify-center overflow-hidden"
            style={{ border: isPreview ? 'none' : '1px solid #e5e7eb', cursor: 'inherit' }}>
            {el.src ? (
              <img
                src={el.src}
                alt={el.alt || ''}
                className={isStretchMode ? 'h-full w-full object-fill' : 'max-w-full max-h-full object-contain'}
                style={{ cursor: 'inherit' }}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
            )}
          </div>
        )}
        {el.type === 'video' && (
          <div className="w-full h-full" style={{ border: isPreview ? 'none' : '1px solid #e5e7eb', cursor: 'inherit' }}>
            {el.videoUrl ? (
              <iframe
                src={`${el.videoUrl}${el.autoplay ? '?autoplay=1&mute=1' : ''}`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Video"
                style={{ pointerEvents: isPreview ? 'auto' : 'none', cursor: 'inherit' }}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No video</div>
            )}
          </div>
        )}
        {el.type === 'code' && (
          <div className="w-full h-full overflow-auto p-2" style={{
            fontSize: codeFontSize,
            fontFamily: "'Fira Code', monospace",
            backgroundColor: '#1e1e2e',
            color: '#cdd6f4',
            border: isPreview ? 'none' : '1px solid #e5e7eb',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            minWidth: 0,
            cursor: 'inherit',
          }}>
            <div
              style={isStretchMode ? {
                width: `${100 / contentScaleX}%`,
                minHeight: '100%',
                transform: `scaleX(${contentScaleX})`,
                transformOrigin: 'top left',
              } : undefined}
            >
              <pre style={{ margin: 0 }}>
                <code className="syntax-highlight" dangerouslySetInnerHTML={{ __html: highlightCode(el.code || '') }} />
              </pre>
            </div>
          </div>
        )}

        {isSelected && corners.map(c => (
          <div
            key={c}
            className="absolute bg-blue-500"
            style={{ ...cornerPos[c], width: 7, height: 7, zIndex: 999 }}
            onMouseDown={e => {
              e.stopPropagation();
              handleMouseDown(e, el, cornerResize[c]);
            }}
          />
        ))}
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
          {renderElements(false)}
          <div className="absolute bottom-18 left-24 text-[20px] px-3 py-1 rounded bg-black/50 text-white" style={{ zIndex: 1000 }}>
            {slideNumber}
          </div>
        </div>
      ) : (
        <>
          {renderElements(true)}
          <div className="absolute bottom-2 left-3 text-xs px-2 py-0.5 rounded bg-black/50 text-white" style={{ zIndex: 1000 }}>
            {slideNumber}
          </div>
        </>
      )}
    </div>
  );
}