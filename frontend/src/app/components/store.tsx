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

  const schedulePersist = useCallback((nextPresentations: Presentation[]) => {
    pendingPresentationsRef.current = nextPresentations;

    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      const queuedPresentations = pendingPresentationsRef.current;
      persistTimerRef.current = null;
      pendingPresentationsRef.current = null;

      if (!queuedPresentations) {
        return;
      }

      void persistStore(queuedPresentations).catch((error: unknown) => {
        console.error('Failed to persist Presto store', error);
      });
    }, 250);
  }, [persistStore]);

  const applyPresentationUpdate = useCallback((updater: (previous: Presentation[]) => Presentation[]) => {
    setPresentations(previous => {
      const next = updater(previous);
      schedulePersist(next);
      return next;
    });
  }, [schedulePersist]);

  const hydrateStore = useCallback(async (activeUser: User) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ store: unknown }>('/store', {
        token: activeUser.token,
      });
      const backendStore = parseBackendStore(response.store);
      const nextUser = {
        ...activeUser,
        name: backendStore.name?.trim() || activeUser.name || activeUser.email,
      };
      setActiveUser(nextUser);
      setPresentations(backendStore.presentations || []);
    } catch (error) {
      setActiveUser(null);
      setPresentations([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setActiveUser]);

  useEffect(() => {
    const activeUser = userRef.current;
    if (!activeUser) {
      setIsLoading(false);
      setPresentations([]);
      return;
    }

    void hydrateStore(activeUser).catch((error: unknown) => {
      console.error('Failed to hydrate Presto store', error);
    });
  }, [hydrateStore]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ token: string }>('/admin/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      await hydrateStore({
        email,
        name: email,
        token: response.token,
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [hydrateStore]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ token: string }>('/admin/auth/register', {
        method: 'POST',
        body: { email, password, name },
      });

      const nextUser = { email, name, token: response.token };
      setActiveUser(nextUser);
      setPresentations([]);
      await apiRequest<Record<string, never>>('/store', {
        method: 'PUT',
        token: response.token,
        body: {
          store: {
            name,
            presentations: [],
          },
        },
      });
    } catch (error) {
      setActiveUser(null);
      setPresentations([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setActiveUser]);

  const logout = useCallback(async () => {
    try {
      await flushPendingPersist();
      const activeUser = userRef.current;
      if (activeUser) {
        await apiRequest<Record<string, never>>('/admin/auth/logout', {
          method: 'POST',
          token: activeUser.token,
        });
      }
    } catch (error) {
      console.error('Failed to log out cleanly', error);
    } finally {
      setActiveUser(null);
      setPresentations([]);
      setIsLoading(false);
    }
  }, [flushPendingPersist, setActiveUser]);

  const createPresentation = useCallback((title: string, description: string, thumbnail: string): string => {
    const id = uuidv4();
    const newPresentation: Presentation = {
      id,
      title,
      description,
      thumbnail,
      slides: [{ id: uuidv4(), elements: [] }],
      history: [],
    };

    applyPresentationUpdate(previous => [...previous, newPresentation]);
    return id;
  }, [applyPresentationUpdate]);

  const deletePresentation = useCallback((id: string) => {
    applyPresentationUpdate(previous => previous.filter(presentation => presentation.id !== id));
  }, [applyPresentationUpdate]);

  const getPresentation = useCallback((id: string) => {
    return presentations.find(presentation => presentation.id === id);
  }, [presentations]);

  const updatePresentation = useCallback((id: string, updates: Partial<Presentation>) => {
    applyPresentationUpdate(previous => previous.map(presentation => (
      presentation.id === id ? { ...presentation, ...updates } : presentation
    )));
  }, [applyPresentationUpdate]);

  const addSlide = useCallback((presentationId: string) => {
    applyPresentationUpdate(previous => previous.map(presentation => (
      presentation.id === presentationId
        ? { ...presentation, slides: [...presentation.slides, { id: uuidv4(), elements: [] }] }
        : presentation
    )));
  }, [applyPresentationUpdate]);

  const deleteSlide = useCallback((presentationId: string, slideId: string): string | null => {
    let result: string | null = null;

    applyPresentationUpdate(previous => previous.map(presentation => {
      if (presentation.id !== presentationId || presentation.slides.length <= 1) {
        return presentation;
      }

      const slideIndex = presentation.slides.findIndex(slide => slide.id === slideId);
      const nextSlides = presentation.slides.filter(slide => slide.id !== slideId);
      const nextIndex = Math.min(slideIndex, nextSlides.length - 1);
      result = nextSlides[nextIndex]?.id || null;

      return { ...presentation, slides: nextSlides };
    }));

    return result;
  }, [applyPresentationUpdate]);

  const updateSlide = useCallback((presentationId: string, slideId: string, updates: Partial<Slide>) => {
    applyPresentationUpdate(previous => previous.map(presentation => {
      if (presentation.id !== presentationId) {
        return presentation;
      }

      return {
        ...presentation,
        slides: presentation.slides.map(slide => (
          slide.id === slideId ? { ...slide, ...updates } : slide
        )),
      };
    }));
  }, [applyPresentationUpdate]);

  const reorderSlides = useCallback((presentationId: string, fromIndex: number, toIndex: number) => {
    applyPresentationUpdate(previous => previous.map(presentation => {
      if (presentation.id !== presentationId) {
        return presentation;
      }

      const slides = [...presentation.slides];
      const [movedSlide] = slides.splice(fromIndex, 1);
      slides.splice(toIndex, 0, movedSlide);
      return { ...presentation, slides };
    }));
  }, [applyPresentationUpdate]);

  const addElement = useCallback((presentationId: string, slideId: string, element: Omit<SlideElement, 'id' | 'zIndex'>) => {
    applyPresentationUpdate(previous => previous.map(presentation => {
      if (presentation.id !== presentationId) {
        return presentation;
      }

      return {
        ...presentation,
        slides: presentation.slides.map(slide => {
          if (slide.id !== slideId) {
            return slide;
          }

          const maxZIndex = slide.elements.reduce((currentMax, existingElement) => Math.max(currentMax, existingElement.zIndex), 0);
          return {
            ...slide,
            elements: [...slide.elements, {
              ...element,
              id: uuidv4(),
              zIndex: maxZIndex + 1,
            } as SlideElement],
          };
        }),
      };
    }));
  }, [applyPresentationUpdate]);

  const updateElement = useCallback((presentationId: string, slideId: string, elementId: string, updates: Partial<SlideElement>) => {
    applyPresentationUpdate(previous => previous.map(presentation => {
      if (presentation.id !== presentationId) {
        return presentation;
      }

      return {
        ...presentation,
        slides: presentation.slides.map(slide => {
          if (slide.id !== slideId) {
            return slide;
          }

          return {
            ...slide,
            elements: slide.elements.map(element => (
              element.id === elementId ? { ...element, ...updates } : element
            )),
          };
        }),
      };
    }));
  }, [applyPresentationUpdate]);

  const deleteElement = useCallback((presentationId: string, slideId: string, elementId: string) => {
    applyPresentationUpdate(previous => previous.map(presentation => {
      if (presentation.id !== presentationId) {
        return presentation;
      }

      return {
        ...presentation,
        slides: presentation.slides.map(slide => {
          if (slide.id !== slideId) {
            return slide;
          }

          return {
            ...slide,
            elements: slide.elements.filter(element => element.id !== elementId),
          };
        }),
      };
    }));
  }, [applyPresentationUpdate]);

  const moveElementLayer = useCallback((presentationId: string, slideId: string, elementId: string, direction: 'forward' | 'backward') => {
    applyPresentationUpdate(previous => previous.map(presentation => {
      if (presentation.id !== presentationId) {
        return presentation;
      }

      return {
        ...presentation,
        slides: presentation.slides.map(slide => {
          if (slide.id !== slideId) {
            return slide;
          }

          const orderedElements = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);
          const currentIndex = orderedElements.findIndex(element => element.id === elementId);
          if (currentIndex === -1) {
            return slide;
          }

          const swapIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
          if (swapIndex < 0 || swapIndex >= orderedElements.length) {
            return slide;
          }

          [orderedElements[currentIndex], orderedElements[swapIndex]] = [orderedElements[swapIndex], orderedElements[currentIndex]];
          return {
            ...slide,
            elements: normalizeElementLayers(orderedElements),
          };
        }),
      };
    }));
  }, [applyPresentationUpdate]);

  const saveHistory = useCallback((presentationId: string) => {
    applyPresentationUpdate(previous => previous.map(presentation => {
      if (presentation.id !== presentationId) {
        return presentation;
      }

      const now = Date.now();
      if (presentation.lastHistorySave && now - presentation.lastHistorySave < 60000) {
        return presentation;
      }

      const snapshot: HistorySnapshot = {
        id: uuidv4(),
        timestamp: now,
        slides: JSON.parse(JSON.stringify(presentation.slides)) as Slide[],
        title: presentation.title,
        thumbnail: presentation.thumbnail,
        description: presentation.description,
        defaultBackground: presentation.defaultBackground,
      };

      return {
        ...presentation,
        history: [...presentation.history, snapshot],
        lastHistorySave: now,
      };
    }));
  }, [applyPresentationUpdate]);

  const restoreHistory = useCallback((presentationId: string, snapshotId: string) => {
    applyPresentationUpdate(previous => previous.map(presentation => {
      if (presentation.id !== presentationId) {
        return presentation;
      }

      const snapshot = presentation.history.find(entry => entry.id === snapshotId);
      if (!snapshot) {
        return presentation;
      }

      return {
        ...presentation,
        slides: JSON.parse(JSON.stringify(snapshot.slides)) as Slide[],
        title: snapshot.title,
        thumbnail: snapshot.thumbnail,
        description: snapshot.description,
        defaultBackground: snapshot.defaultBackground,
      };
    }));
  }, [applyPresentationUpdate]);

  return (
    <StoreContext.Provider value={{
      user,
      presentations,
      isLoading,
      login,
      register,
      logout,
      createPresentation,
      deletePresentation,
      getPresentation,
      updatePresentation,
      addSlide,
      deleteSlide,
      updateSlide,
      reorderSlides,
      addElement,
      updateElement,
      deleteElement,
      moveElementLayer,
      saveHistory,
      restoreHistory,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be inside StoreProvider');
  }

  return context;
}
