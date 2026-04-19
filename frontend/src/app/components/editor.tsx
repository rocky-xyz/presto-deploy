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