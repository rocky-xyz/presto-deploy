import { useRef, useState, useEffect } from 'react';
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
  const { slide, defaultBackground, isPreview = false, slideNumber } = props;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);

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

  return (
    <div
      ref={canvasRef}
      className="relative w-full overflow-hidden select-none"
      style={{ ...getBackground(slide, defaultBackground), aspectRatio: '16/9' }}
    >
      {!isPreview && (
        <div className="absolute bottom-2 left-3 text-xs px-2 py-0.5 rounded bg-black/50 text-white" style={{ zIndex: 1000 }}>
          {slideNumber}
        </div>
      )}
      {isPreview && (
        <div
          className="absolute top-0 left-0"
          style={{
            width: CANVAS_BASE_WIDTH,
            height: CANVAS_BASE_HEIGHT,
            transform: `scale(${canvasScale})`,
            transformOrigin: 'top left',
          }}
        >
          <div className="absolute bottom-18 left-24 text-[20px] px-3 py-1 rounded bg-black/50 text-white" style={{ zIndex: 1000 }}>
            {slideNumber}
          </div>
        </div>
      )}
    </div>
  );
}