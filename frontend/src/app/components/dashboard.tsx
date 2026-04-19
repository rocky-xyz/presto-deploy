import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useStore } from './store';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Plus, LogOut, Presentation, FileSliders } from 'lucide-react';

export function Dashboard() {
  const { user, presentations, logout, createPresentation, isLoading } = useStore();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [thumb, setThumb] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleCreate = () => {
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    const id = createPresentation(title.trim(), desc.trim(), thumb.trim());
    setModalOpen(false);
    setTitle(''); setDesc(''); setThumb('');
    toast.success('Presentation created');
    navigate(`/presentation/${id}/slide/1`);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading presentations...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background/95 backdrop-blur shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Presentation className="w-6 h-6 text-primary shrink-0" />
          <div className="min-w-0">
            <span className="block text-lg truncate" style={{ fontWeight: 600 }}>Presto</span>
            <span className="block text-xs text-muted-foreground truncate">{user?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="min-w-0">My Presentations</h2>
          <Button onClick={() => setModalOpen(true)} size="sm" className="shrink-0">
            <Plus className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">New Presentation</span>
          </Button>
        </div>

        {presentations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileSliders className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">No presentations yet</p>
            <p className="text-sm text-muted-foreground">Click New Presentation to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {presentations.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/presentation/${p.id}/slide/1`)}
                className="group text-left rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              >
                {/* 2:1 thumbnail */}
                <div className="relative w-full" style={{ aspectRatio: '2/1' }}>
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Presentation className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    {p.slides.length} slide{p.slides.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate" style={{ fontWeight: 500 }}>{p.title}</p>
                  {p.description && <p className="text-sm text-muted-foreground truncate mt-0.5">{p.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Presentation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="np-title">Title *</Label>
              <Input id="np-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="My Presentation" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-desc">Description</Label>
              <Textarea id="np-desc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-thumb">Thumbnail URL</Label>
              <Input id="np-thumb" value={thumb} onChange={e => setThumb(e.target.value)} placeholder="https://example.com/image.jpg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
