import { Link } from 'react-router';
import { Presentation, Play, LogIn, UserPlus } from 'lucide-react';
import { Button } from './ui/button';

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Presentation className="w-7 h-7 text-primary" />
          <span className="text-xl" style={{ fontWeight: 600 }}>Presto</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm"><LogIn className="w-4 h-4 mr-1.5" />Login</Button>
          </Link>
          <Link to="/register">
            <Button size="sm"><UserPlus className="w-4 h-4 mr-1.5" />Register</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Play className="w-8 h-8 text-primary" />
          </div>
          <h1>Create presentations,<br />effortlessly.</h1>
          <p className="text-muted-foreground">
            Presto is a lightweight online presentation editor. Build slide decks with text, images, video, and code — right in your browser.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border">
        Presto &copy; 2026
      </footer>
    </div>
  );
}
