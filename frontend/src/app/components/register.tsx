import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useStore } from './store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export function Register() {
  const { register } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { toast.error('Please fill in all fields'); return; }
    if (password !== confirm) { setPasswordError('Passwords do not match'); return; }
    setPasswordError('');
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 w-fit">
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Link>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Sign up to start creating presentations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Name</Label>
              <Input id="reg-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <Input id="reg-confirm" type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setPasswordError(''); }} placeholder="Confirm password" />
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary underline">Sign In</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
