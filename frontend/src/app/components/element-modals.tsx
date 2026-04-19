import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { SlideElement } from './store';

export type NewElementInput = Omit<SlideElement, 'id' | 'zIndex' | 'x' | 'y'>;

function getSuggestedTextBoxSize(text: string, fontSize: number) {
  const lines = Math.max(1, text.split('\n').length);
  const longestLine = Math.max(6, ...text.split('\n').map(line => line.trim().length || 0));
  const width = Math.min(80, Math.max(24, Math.round(fontSize * 10 + longestLine * 1.6)));
  const height = Math.min(55, Math.max(12, Math.round(fontSize * 5 + lines * 4)));
  return { width, height };
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewElementInput) => void;
  initial?: Partial<SlideElement>;
}

export function TextModal({ open, onClose, onSubmit, initial }: ModalProps) {
  const [width, setWidth] = useState(initial?.width?.toString() || '36');
  const [height, setHeight] = useState(initial?.height?.toString() || '18');
  const [text, setText] = useState(initial?.text || '');
  const [fontSize, setFontSize] = useState(initial?.fontSize?.toString() || '2');
  const [color, setColor] = useState(initial?.color || '#000000');
  const [fontFamily, setFontFamily] = useState(initial?.fontFamily || 'Inter, sans-serif');
  const [textAlign, setTextAlign] = useState<SlideElement['textAlign']>(initial?.textAlign || 'center');
  const [sizeEdited, setSizeEdited] = useState(false);

  useEffect(() => {
    if (open) {
      const suggested = getSuggestedTextBoxSize(initial?.text || '', initial?.fontSize || 2);
      setWidth(initial?.width?.toString() || suggested.width.toString());
      setHeight(initial?.height?.toString() || suggested.height.toString());
      setText(initial?.text || '');
      setFontSize(initial?.fontSize?.toString() || '2');
      setColor(initial?.color || '#000000');
      setFontFamily(initial?.fontFamily || 'Inter, sans-serif');
      setTextAlign(initial?.textAlign || 'center');
      setSizeEdited(!!initial?.width || !!initial?.height);
    }
  }, [open, initial]);

  useEffect(() => {
    if (sizeEdited) {
      return;
    }

    const suggested = getSuggestedTextBoxSize(text, Number(fontSize) || 2);
    setWidth(suggested.width.toString());
    setHeight(suggested.height.toString());
  }, [text, fontSize, sizeEdited]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initial?.text !== undefined ? 'Edit Text' : 'Add Text'}</DialogTitle></DialogHeader>
        <div className="space-y-3 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0"><Label>Width (%)</Label><Input type="number" min={1} max={100} value={width} onChange={e => { setSizeEdited(true); setWidth(e.target.value); }} /></div>
            <div className="min-w-0"><Label>Height (%)</Label><Input type="number" min={1} max={100} value={height} onChange={e => { setSizeEdited(true); setHeight(e.target.value); }} /></div>
          </div>
          <div className="min-w-0"><Label>Text Content</Label><Textarea value={text} onChange={e => setText(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0"><Label>Font Size (em)</Label><Input type="number" step={0.1} min={0.1} value={fontSize} onChange={e => setFontSize(e.target.value)} /></div>
            <div className="min-w-0"><Label>Color (HEX)</Label><Input type="color" value={color} onChange={e => setColor(e.target.value)} /></div>
          </div>
          <div className="min-w-0">
            <Label>Text Align</Label>
            <Select value={textAlign || 'center'} onValueChange={value => setTextAlign(value as SlideElement['textAlign'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0">
            <Label>Font Family</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter, sans-serif">Inter (Sans-serif)</SelectItem>
                <SelectItem value="Georgia, serif">Georgia (Serif)</SelectItem>
                <SelectItem value="'Comic Neue', cursive">Comic Neue (Casual)</SelectItem>
                <SelectItem value="'Fira Code', monospace">Fira Code (Mono)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ type: 'text', width: Number(width), height: Number(height), text, fontSize: Number(fontSize), textAlign, color, fontFamily, scaleMode: initial?.scaleMode || 'stretch', contentScaleX: initial?.contentScaleX ?? 1 })}>
            {initial?.text !== undefined ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ImageModal({ open, onClose, onSubmit, initial }: ModalProps) {
  const [width, setWidth] = useState(initial?.width?.toString() || '30');
  const [height, setHeight] = useState(initial?.height?.toString() || '30');
  const [src, setSrc] = useState(initial?.src || '');
  const [alt, setAlt] = useState(initial?.alt || '');

  useEffect(() => {
    if (open) { setWidth(initial?.width?.toString() || '30'); setHeight(initial?.height?.toString() || '30'); setSrc(initial?.src || ''); setAlt(initial?.alt || ''); }
  }, [open, initial]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initial?.src !== undefined ? 'Edit Image' : 'Add Image'}</DialogTitle></DialogHeader>
        <div className="space-y-3 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0"><Label>Width (%)</Label><Input type="number" min={1} max={100} value={width} onChange={e => setWidth(e.target.value)} /></div>
            <div className="min-w-0"><Label>Height (%)</Label><Input type="number" min={1} max={100} value={height} onChange={e => setHeight(e.target.value)} /></div>
          </div>
          <div className="min-w-0"><Label>Image URL</Label><Input value={src} onChange={e => setSrc(e.target.value)} placeholder="https://..." /></div>
          <div className="min-w-0"><Label>Or upload file</Label><Input type="file" accept="image/*" onChange={handleFile} /></div>
          <div className="min-w-0"><Label>Alt Text / Description *</Label><Input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Describe the image" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ type: 'image', width: Number(width), height: Number(height), src, alt })}>
            {initial?.src !== undefined ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

