import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiRequest } from '../backend';

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'code';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  text?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  fontFamily?: string;
  src?: string;
  alt?: string;
  videoUrl?: string;
  autoplay?: boolean;
  code?: string;
  codeFontSize?: number;
  scaleMode?: 'stretch' | 'proportional';
  contentScaleX?: number;
}

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: string;
  imageUrl?: string;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background?: SlideBackground;
}

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  slides: Slide[];
  title: string;
  thumbnail: string;
  description: string;
  defaultBackground?: SlideBackground;
}

export interface Presentation {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  slides: Slide[];
  defaultBackground?: SlideBackground;
  history: HistorySnapshot[];
  lastHistorySave?: number;
}

export interface User {
  email: string;
  name: string;
  token: string;
}

interface StoreContextType {
  user: User | null;
  presentations: Presentation[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  createPresentation: (title: string, description: string, thumbnail: string) => string;
  deletePresentation: (id: string) => void;
  getPresentation: (id: string) => Presentation | undefined;
  updatePresentation: (id: string, updates: Partial<Presentation>) => void;
  addSlide: (presId: string) => void;
  deleteSlide: (presId: string, slideId: string) => string | null;
  updateSlide: (presId: string, slideId: string, updates: Partial<Slide>) => void;
  reorderSlides: (presId: string, fromIndex: number, toIndex: number) => void;
  addElement: (presId: string, slideId: string, element: Omit<SlideElement, 'id' | 'zIndex'>) => void;
  updateElement: (presId: string, slideId: string, elementId: string, updates: Partial<SlideElement>) => void;
  deleteElement: (presId: string, slideId: string, elementId: string) => void;
  moveElementLayer: (presId: string, slideId: string, elementId: string, direction: 'forward' | 'backward') => void;
  saveHistory: (presId: string) => void;
  restoreHistory: (presId: string, snapshotId: string) => void;
}

interface BackendStore {
  name?: string;
  presentations?: Presentation[];
}

const StoreContext = createContext<StoreContextType | null>(null);

const SESSION_KEY = 'presto_user';

function loadSessionUser(): User | null {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const value = storage.getItem(SESSION_KEY);
      if (value) {
        return JSON.parse(value) as User;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function persistSessionUser(user: User | null) {
  if (user) {
    const value = JSON.stringify(user);
    localStorage.setItem(SESSION_KEY, value);
    sessionStorage.setItem(SESSION_KEY, value);
    return;
  }

  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function parseBackendStore(store: unknown): BackendStore {
  if (!store || typeof store !== 'object') {
    return { presentations: [] };
  }

  const record = store as Record<string, unknown>;
  return {
    name: typeof record.name === 'string' ? record.name : undefined,
    presentations: Array.isArray(record.presentations) ? record.presentations as Presentation[] : [],
  };
}

function normalizeElementLayers(elements: SlideElement[]) {
  return elements.map((element, index) => ({ ...element, zIndex: index + 1 }));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadSessionUser());
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(() => !!loadSessionUser());

  const userRef = useRef<User | null>(loadSessionUser());
  const persistTimerRef = useRef<number | null>(null);
  const pendingPresentationsRef = useRef<Presentation[] | null>(null);

  const setActiveUser = useCallback((nextUser: User | null) => {
    userRef.current = nextUser;
    setUser(nextUser);
    persistSessionUser(nextUser);
  }, []);

  const persistStore = useCallback(async (nextPresentations: Presentation[]) => {
    const activeUser = userRef.current;
    if (!activeUser) {
      return;
    }

    await apiRequest<Record<string, never>>('/store', {
      method: 'PUT',
      token: activeUser.token,
      body: {
        store: {
          name: activeUser.name,
          presentations: nextPresentations,
        },
      },
    });
  }, []);

  const flushPendingPersist = useCallback(async () => {
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }

    if (pendingPresentationsRef.current) {
      const nextPresentations = pendingPresentationsRef.current;
      pendingPresentationsRef.current = null;
      await persistStore(nextPresentations);
    }
  }, [persistStore]);
