import { useState } from 'react';
import type { HistorySnapshot } from './store';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { X, RotateCcw, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  history: HistorySnapshot[];
  onRestore: (id: string) => void;
}

export function HistoryPanel({ open, onClose, history, onRestore }: HistoryPanelProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative ml-auto w-80 max-w-[85vw] bg-card border-l border-border h-full flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span style={{ fontWeight: 600 }}>Revision History</span>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
          <ScrollArea className="flex-1 p-3">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No revision history yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Snapshots are saved automatically as you edit (at least 1 minute apart).</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...history].reverse().map(snap => (
                  <div key={snap.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ fontWeight: 500 }}>{snap.title}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(snap.timestamp), 'MMM d, yyyy h:mm a')}</p>
                        <p className="text-xs text-muted-foreground">{snap.slides.length} slide{snap.slides.length !== 1 ? 's' : ''}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setConfirmId(snap.id)}>
                        <RotateCcw className="w-3 h-3 mr-1" />Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <Dialog open={!!confirmId} onOpenChange={v => { if (!v) setConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Restore Version?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will replace the current presentation with this saved version. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (confirmId) { onRestore(confirmId); setConfirmId(null); } }}>
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
