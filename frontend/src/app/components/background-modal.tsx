import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { SlideBackground } from './store';

interface BackgroundModalProps {
  open: boolean;
  onClose: () => void;
  currentBg?: SlideBackground;
  defaultBg?: SlideBackground;
  onSetCurrent: (bg: SlideBackground | undefined) => void;
  onSetDefault: (bg: SlideBackground) => void;
}

const DEFAULT_SOLID_COLOR = '#ffffff';
const DEFAULT_GRADIENT_ANGLE = 135;
const DEFAULT_GRADIENT_START = '#667eea';
const DEFAULT_GRADIENT_END = '#764ba2';

function buildGradient(angle: number, startColor: string, endColor: string) {
  return `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
}

function normalizeAngle(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_GRADIENT_ANGLE;
  }

  const normalized = Math.round(value) % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function parseGradient(gradient?: string) {
  const fallback = {
    angle: DEFAULT_GRADIENT_ANGLE,
    startColor: DEFAULT_GRADIENT_START,
    endColor: DEFAULT_GRADIENT_END,
  };

  if (!gradient) {
    return fallback;
  }

  const match = gradient.match(
    /linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg\s*,\s*(#[0-9a-fA-F]{3,8})[^,]*,\s*(#[0-9a-fA-F]{3,8})[^)]*\)/,
  );

  if (!match) {
    return fallback;
  }

  return {
    angle: normalizeAngle(Number(match[1])),
    startColor: match[2],
    endColor: match[3],
  };
}

function BgEditor({ value, onChange }: { value: SlideBackground; onChange: (bg: SlideBackground) => void }) {
  const gradient = parseGradient(value.gradient);

  const updateGradient = (updates: Partial<typeof gradient>) => {
    const next = {
      ...gradient,
      ...updates,
    };

    onChange({
      ...value,
      gradient: buildGradient(
        normalizeAngle(next.angle),
        next.startColor,
        next.endColor,
      ),
    });
  };

  const handleTypeChange = (type: string) => {
    if (type === 'solid' || type === 'gradient' || type === 'image') {
      if (type === 'solid') {
        onChange({ ...value, type, color: value.color || DEFAULT_SOLID_COLOR });
        return;
      }

      if (type === 'gradient') {
        onChange({
          ...value,
          type,
          gradient: value.gradient || buildGradient(DEFAULT_GRADIENT_ANGLE, DEFAULT_GRADIENT_START, DEFAULT_GRADIENT_END),
        });
        return;
      }

      onChange({ ...value, type });
    }
  };

  return (
    <div className="space-y-3">
      <Tabs value={value.type} onValueChange={handleTypeChange}>
        <TabsList className="w-full">
          <TabsTrigger value="solid" className="flex-1">Solid</TabsTrigger>
          <TabsTrigger value="gradient" className="flex-1">Gradient</TabsTrigger>
          <TabsTrigger value="image" className="flex-1">Image</TabsTrigger>
        </TabsList>
        <TabsContent value="solid" className="mt-3">
          <Label>Color</Label>
          <div className="flex gap-2 items-center mt-1">
            <Input type="color" value={value.color || DEFAULT_SOLID_COLOR} onChange={e => onChange({ ...value, color: e.target.value })} className="w-12 h-10 p-1" />
            <Input value={value.color || DEFAULT_SOLID_COLOR} onChange={e => onChange({ ...value, color: e.target.value })} className="flex-1" />
          </div>
        </TabsContent>
        <TabsContent value="gradient" className="mt-3 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="gradient-angle">Angle</Label>
              <div className="w-24">
                <Input
                  id="gradient-angle"
                  type="number"
                  min={0}
                  max={360}
                  value={gradient.angle}
                  onChange={e => updateGradient({ angle: normalizeAngle(Number(e.target.value)) })}
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={gradient.angle}
              onChange={e => updateGradient({ angle: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={gradient.startColor}
                  onChange={e => updateGradient({ startColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={gradient.startColor}
                  onChange={e => updateGradient({ startColor: e.target.value || DEFAULT_GRADIENT_START })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>End Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={gradient.endColor}
                  onChange={e => updateGradient({ endColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={gradient.endColor}
                  onChange={e => updateGradient({ endColor: e.target.value || DEFAULT_GRADIENT_END })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Preview</Label>
            <div
              className="h-20 rounded-lg border border-border"
              style={{ background: value.gradient || buildGradient(DEFAULT_GRADIENT_ANGLE, DEFAULT_GRADIENT_START, DEFAULT_GRADIENT_END) }}
            />
            <p className="text-xs text-muted-foreground break-all">
              {value.gradient || buildGradient(DEFAULT_GRADIENT_ANGLE, DEFAULT_GRADIENT_START, DEFAULT_GRADIENT_END)}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="image" className="mt-3">
          <Label>Image URL</Label>
          <Input value={value.imageUrl || ''} onChange={e => onChange({ ...value, imageUrl: e.target.value })} className="mt-1" placeholder="https://..." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function BackgroundModal({ open, onClose, currentBg, defaultBg, onSetCurrent, onSetDefault }: BackgroundModalProps) {
  const [tab, setTab] = useState<'current' | 'default'>('current');
  const [curBg, setCurBg] = useState<SlideBackground>(currentBg || { type: 'solid', color: DEFAULT_SOLID_COLOR });
  const [defBg, setDefBg] = useState<SlideBackground>(defaultBg || { type: 'solid', color: DEFAULT_SOLID_COLOR });
  const [useCustom, setUseCustom] = useState(!!currentBg);

  useEffect(() => {
    if (open) {
      setCurBg(currentBg || defaultBg || { type: 'solid', color: DEFAULT_SOLID_COLOR });
      setDefBg(defaultBg || { type: 'solid', color: DEFAULT_SOLID_COLOR });
      setUseCustom(!!currentBg);
    }
  }, [open, currentBg, defaultBg]);

  const handleTabChange = (value: string) => {
    if (value === 'current' || value === 'default') {
      setTab(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Background & Theme</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="current" className="flex-1">This Slide</TabsTrigger>
            <TabsTrigger value="default" className="flex-1">Default (All)</TabsTrigger>
          </TabsList>
          <TabsContent value="current" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="use-custom" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} className="rounded" />
              <Label htmlFor="use-custom">Custom background for this slide</Label>
            </div>
            {useCustom && <BgEditor value={curBg} onChange={setCurBg} />}
            {!useCustom && <p className="text-sm text-muted-foreground">This slide uses the default background.</p>}
          </TabsContent>
          <TabsContent value="default" className="mt-3">
            <p className="text-sm text-muted-foreground mb-3">Applies to new slides and any slide without a custom background.</p>
            <BgEditor value={defBg} onChange={setDefBg} />
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (tab === 'current') onSetCurrent(useCustom ? curBg : undefined);
            else onSetDefault(defBg);
            onClose();
          }}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}