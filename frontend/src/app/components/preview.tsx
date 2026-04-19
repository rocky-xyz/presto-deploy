import { useEffect, useState, useCallback, useRef } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router';
import { useStore } from './store';
import { SlideCanvas } from './slide-canvas';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Preview() {
  const { id, slideNumber } = useParams<{ id: string; slideNumber: string }>();
  const navigate = useNavigate();
  const store = useStore();
  const pres = store.getPresentation(id || '');
  const slideIdx = Math.max(0, (Number(slideNumber) || 1) - 1);
  const slide = pres?.slides[slideIdx];
  const [direction, setDirection] = useState(0);
  const [showNavControls, setShowNavControls] = useState(true);
  const hideNavControlsTimeoutRef = useRef<number | null>(null);

  const scheduleHideNavControls = useCallback(() => {
    setShowNavControls(true);

    if (hideNavControlsTimeoutRef.current !== null) {
      window.clearTimeout(hideNavControlsTimeoutRef.current);
    }

    hideNavControlsTimeoutRef.current = window.setTimeout(() => {
      setShowNavControls(false);
      hideNavControlsTimeoutRef.current = null;
    }, 2000);
  }, []);

  const goTo = (idx: number) => {
    setDirection(idx > slideIdx ? 1 : -1);
    navigate(`/preview/${id}/slide/${idx + 1}`, { replace: true });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!pres) return;
      if (e.key === 'ArrowLeft' && slideIdx > 0) goTo(slideIdx - 1);
      if (e.key === 'ArrowRight' && slideIdx < pres.slides.length - 1) goTo(slideIdx + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pres, slideIdx]);

  useEffect(() => {
    scheduleHideNavControls();

    return () => {
      if (hideNavControlsTimeoutRef.current !== null) {
        window.clearTimeout(hideNavControlsTimeoutRef.current);
      }
    };
  }, [scheduleHideNavControls]);

  if (store.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading preview...</div>;
  }

  if (!store.user) {
    return <Navigate to="/" replace />;
  }

  if (!pres || !slide) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Presentation not found</div>;
  }

  const isFirst = slideIdx === 0;
  const isLast = slideIdx === pres.slides.length - 1;

  return (
    <div
      className={`h-screen w-screen bg-black flex items-center justify-center relative overflow-hidden ${showNavControls ? '' : 'cursor-none [&_*]:cursor-none'}`}
      onMouseMove={scheduleHideNavControls}
      onMouseDown={scheduleHideNavControls}
      onTouchStart={scheduleHideNavControls}
      onFocusCapture={scheduleHideNavControls}
    >
      <Button
        variant="ghost" size="sm"
        className={`absolute left-4 sm:left-6 z-10 h-10 w-10 rounded-full bg-black/35 p-0 text-white shadow-md backdrop-blur-sm transition-opacity duration-300 hover:bg-black/50 hover:text-white disabled:bg-black/10 disabled:text-white/30 ${showNavControls ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0 disabled:opacity-0'}`}
        disabled={isFirst}
        onClick={() => goTo(slideIdx - 1)}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <div className="w-full h-full flex items-center justify-center p-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            className="w-full max-h-full"
            style={{ maxWidth: '100%', aspectRatio: '16/9' }}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <SlideCanvas
              slide={slide}
              defaultBackground={pres.defaultBackground}
              slideNumber={slideIdx + 1}
              isPreview
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <Button
        variant="ghost" size="sm"
        className={`absolute right-4 sm:right-6 z-10 h-10 w-10 rounded-full bg-black/35 p-0 text-white shadow-md backdrop-blur-sm transition-opacity duration-300 hover:bg-black/50 hover:text-white disabled:bg-black/10 disabled:text-white/30 ${showNavControls ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0 disabled:opacity-0'}`}
        disabled={isLast}
        onClick={() => goTo(slideIdx + 1)}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
}
