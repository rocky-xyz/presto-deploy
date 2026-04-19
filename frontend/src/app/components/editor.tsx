import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router';
import { useStore } from './store';
import type { SlideElement, SlideBackground } from './store';
import { SlideCanvas } from './slide-canvas';
import { TextModal, ImageModal, VideoModal, CodeModal, type NewElementInput } from './element-modals';
import { BackgroundModal } from './background-modal';
import { SlidePanel } from './slide-panel';
import { HistoryPanel } from './history-panel';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft, LogOut, Trash2, Plus, ChevronLeft, ChevronRight,
  Type, ImageIcon, Video, Code, Palette, Layers, History, Play, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Editor() {
  const { id, slideNumber } = useParams<{ id: string; slideNumber: string }>();
  const navigate = useNavigate();
  const store = useStore();
  const pres = store.getPresentation(id || '');

  const slideIdx = Math.max(0, (Number(slideNumber) || 1) - 1);
  const slide = pres?.slides[slideIdx];

  const [selectedEl, setSelectedEl] = useState<string | null>(null);
  const [editingEl, setEditingEl] = useState<SlideElement | null>(null);
  const [modalType, setModalType] = useState<'text' | 'image' | 'video' | 'code' | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [thumbVal, setThumbVal] = useState('');

  const [bgModal, setBgModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [desktopSlidePanelOpen, setDesktopSlidePanelOpen] = useState(true);
  const [mobileSlidePanelOpen, setMobileSlidePanelOpen] = useState(false);
  const [historyPanel, setHistoryPanel] = useState(false);
  const [showNavControls, setShowNavControls] = useState(true);
  const hideNavControlsTimeoutRef = useRef<number | null>(null);

  const [direction, setDirection] = useState(0); // -1 left, 1 right

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

  // Save history periodically
  useEffect(() => {
    if (pres) {
      const timer = setTimeout(() => store.saveHistory(pres.id), 2000);
      return () => clearTimeout(timer);
    }
  }, [pres?.slides]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncViewport = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    syncViewport(mediaQuery);
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    scheduleHideNavControls();

    return () => {
      if (hideNavControlsTimeoutRef.current !== null) {
        window.clearTimeout(hideNavControlsTimeoutRef.current);
      }
    };
  }, [scheduleHideNavControls]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!pres) return;
      if (e.key === 'ArrowLeft' && slideIdx > 0) {
        setDirection(-1);
        navigate(`/presentation/${id}/slide/${slideIdx}`, { replace: true });
      }
      if (e.key === 'ArrowRight' && slideIdx < pres.slides.length - 1) {
        setDirection(1);
        navigate(`/presentation/${id}/slide/${slideIdx + 2}`, { replace: true });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pres, slideIdx, id, navigate]);

  const goToSlide = useCallback((idx: number) => {
    setDirection(idx > slideIdx ? 1 : -1);
    navigate(`/presentation/${id}/slide/${idx + 1}`, { replace: true });
    setSelectedEl(null);
  }, [id, navigate, slideIdx]);

  const handleLogout = async () => {
    await store.logout();
    navigate('/');
  };

  if (store.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading presentation...</div>;
  }

  if (!store.user) {
    return <Navigate to="/" replace />;
  }

  if (!pres || !slide) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Presentation not found</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isFirst = slideIdx === 0;
  const isLast = slideIdx === pres.slides.length - 1;
  const slidePanelOpen = isMobile ? mobileSlidePanelOpen : desktopSlidePanelOpen;

  const handleDeletePres = () => { store.deletePresentation(pres.id); navigate('/dashboard'); toast.success('Presentation deleted'); };
  const handleDeleteSlide = () => {
    if (pres.slides.length <= 1) { toast.error('Cannot delete the only slide. Delete the presentation instead.'); return; }
    store.deleteSlide(pres.id, slide.id);
    if (slideIdx >= pres.slides.length - 1) goToSlide(Math.max(0, slideIdx - 1));
    else goToSlide(slideIdx);
    toast.success('Slide deleted');
  };

  const handleAddSlide = () => {
    store.addSlide(pres.id);
    toast.success('New slide added');
  };

  const handleAddElement = (data: NewElementInput) => {
    store.addElement(pres.id, slide.id, {
      type: data.type,
      width: data.width,
      height: data.height,
      x: 0,
      y: 0,
      text: data.text,
      fontSize: data.fontSize,
      color: data.color,
      fontFamily: data.fontFamily,
      src: data.src,
      alt: data.alt,
      videoUrl: data.videoUrl,
      autoplay: data.autoplay,
      code: data.code,
      codeFontSize: data.codeFontSize,
      scaleMode: data.scaleMode || 'stretch',
      contentScaleX: data.contentScaleX ?? 1,
    });
    setModalType(null);
    setEditingEl(null);
  };

  const handleEditElement = (data: Partial<SlideElement>) => {
    if (editingEl) {
      store.updateElement(pres.id, slide.id, editingEl.id, data);
      setEditingEl(null);
      setModalType(null);
    }
  };

  const openEditModal = (elId: string) => {
    const el = slide.elements.find(e => e.id === elId);
    if (!el) return;
    setEditingEl(el);
    setModalType(el.type);
  };

  const handleMoveElement = (elId: string, x: number, y: number) => {
    store.updateElement(pres.id, slide.id, elId, { x, y });
  };

  const handleResizeElement = (
    elId: string,
    x: number,
    y: number,
    w: number,
    h: number,
    contentUpdates?: Partial<Pick<SlideElement, 'fontSize' | 'codeFontSize' | 'contentScaleX'>>,
  ) => {
    store.updateElement(pres.id, slide.id, elId, { x, y, width: w, height: h, ...contentUpdates });
  };

  const handleToggleScaleMode = (elId: string) => {
    const element = slide.elements.find(entry => entry.id === elId);
    if (!element || (element.type !== 'text' && element.type !== 'code' && element.type !== 'image')) {
      return;
    }

    const nextScaleMode = element.scaleMode === 'proportional' ? 'stretch' : 'proportional';
    store.updateElement(pres.id, slide.id, elId, {
      scaleMode: nextScaleMode,
      contentScaleX: 1,
    });
    toast.success(nextScaleMode === 'proportional' ? 'Proportional scaling enabled' : 'Stretch scaling enabled');
  };

  const handleMoveLayer = (elId: string, direction: 'forward' | 'backward') => {
    store.moveElementLayer(pres.id, slide.id, elId, direction);
    toast.success(direction === 'forward' ? 'Moved element forward' : 'Moved element backward');
  };

  const handleDeleteElement = (elId: string) => {
    store.deleteElement(pres.id, slide.id, elId);
    setSelectedEl(null);
    toast.success('Element deleted');
  };

  const handleSaveTitle = () => {
    store.updatePresentation(pres.id, { title: titleVal || pres.title, thumbnail: thumbVal });
    setEditTitle(false);
    toast.success('Updated');
  };

  const handleSetCurrentBg = (bg: SlideBackground | undefined) => {
    store.updateSlide(pres.id, slide.id, { background: bg });
  };

  const handleSetDefaultBg = (bg: SlideBackground) => {
    store.updatePresentation(pres.id, { defaultBackground: bg });
  };

  const toggleSlidePanel = () => {
    if (isMobile) {
      setMobileSlidePanelOpen((open) => !open);
      return;
    }

    setDesktopSlidePanelOpen((open) => !open);
  };

  const toolButtons = [
    { icon: Type, label: 'Text', action: () => { setEditingEl(null); setModalType('text'); } },
    { icon: ImageIcon, label: 'Image', action: () => { setEditingEl(null); setModalType('image'); } },
    { icon: Video, label: 'Video', action: () => { setEditingEl(null); setModalType('video'); } },
    { icon: Code, label: 'Code', action: () => { setEditingEl(null); setModalType('code'); } },
  ];

  return (
    <div
      className="h-screen flex flex-col bg-background overflow-hidden"
      onMouseMove={scheduleHideNavControls}
      onMouseDown={scheduleHideNavControls}
      onTouchStart={scheduleHideNavControls}
      onFocusCapture={scheduleHideNavControls}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-border shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-4 h-4" /></Button>
          <span className="truncate max-w-[140px] sm:max-w-[240px]" style={{ fontWeight: 500 }}>{pres.title}</span>
          <Button variant="ghost" size="sm" onClick={() => { setTitleVal(pres.title); setThumbVal(pres.thumbnail); setEditTitle(true); }}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setHistoryPanel(true)} title="History"><History className="w-4 h-4" /></Button>
          <Button
            variant={slidePanelOpen ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleSlidePanel}
            title="Slides"
            aria-pressed={slidePanelOpen}
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setBgModal(true)} title="Background"><Palette className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => window.open(`/preview/${pres.id}/slide/${slideIdx + 1}`, '_blank')} title="Preview">
            <Play className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteConfirm(true)} title="Delete Presentation">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { void handleLogout(); }}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 sm:px-4 py-1.5 border-b border-border bg-muted/30 shrink-0 flex-wrap">
        {toolButtons.map(t => (
          <Button key={t.label} variant="outline" size="sm" onClick={t.action} className="gap-1.5">
            <t.icon className="w-4 h-4" /><span className="hidden sm:inline">{t.label}</span>
          </Button>
        ))}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleAddSlide} className="gap-1.5">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">New Slide</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleDeleteSlide} className="gap-1.5 text-destructive border-destructive/30">
          <Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Delete Slide</span>
        </Button>
      </div>