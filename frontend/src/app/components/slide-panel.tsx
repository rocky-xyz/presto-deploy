import { useState, useRef } from 'react';
import type { Slide, SlideBackground } from './store';
import { ScrollArea } from './ui/scroll-area';
import { GripVertical } from 'lucide-react';

interface SlidePanelProps {
  slides: Slide[];
  currentIndex: number;
  defaultBackground?: SlideBackground;
  onNavigate: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

function getSlideStyle(slide: Slide, defaultBg?: SlideBackground): React.CSSProperties {
  const bg = slide.background || defaultBg;
  if (!bg) return { backgroundColor: '#ffffff' };
  if (bg.type === 'solid') return { backgroundColor: bg.color || '#fff' };
  if (bg.type === 'gradient') return { background: bg.gradient || '#fff' };
  if (bg.type === 'image') return { backgroundImage: `url(${bg.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { backgroundColor: '#fff' };
}

export function SlidePanel({ slides, currentIndex, defaultBackground, onNavigate, onReorder }: SlidePanelProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-3 border-b border-border">
        <p style={{ fontWeight: 600 }}>Slides</p>
        <p className="text-xs text-muted-foreground mt-1">Drag to reorder your deck.</p>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => { setDragIdx(idx); dragRef.current = idx; }}
              onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
              onDrop={() => {
                if (dragRef.current !== null && dragRef.current !== idx) onReorder(dragRef.current, idx);
                setDragIdx(null); setOverIdx(null); dragRef.current = null;
              }}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); dragRef.current = null; }}
              onClick={() => onNavigate(idx)}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                idx === currentIndex ? 'border-primary bg-primary/8 shadow-sm' : 'border-transparent hover:bg-muted'
              } ${overIdx === idx && dragIdx !== idx ? 'border-t-2 border-t-primary' : ''} ${dragIdx === idx ? 'opacity-50' : ''}`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
              <div className="w-16 h-9 rounded border border-border shrink-0 overflow-hidden" style={getSlideStyle(slide, defaultBackground)}>
                <div className="w-full h-full relative" style={{ fontSize: '2px' }}>
                  {slide.elements.map(el => (
                    <div key={el.id} className="absolute" style={{
                      left: `${el.x}%`, top: `${el.y}%`,
                      width: `${el.width}%`, height: `${el.height}%`,
                      backgroundColor: el.type === 'code' ? '#1e1e2e' : el.type === 'text' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
                    }} />
                  ))}
                </div>
              </div>
              <span className="text-sm truncate">Slide {idx + 1}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
