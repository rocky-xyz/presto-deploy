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

export function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid email or password';
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
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Need an account? <Link to="/register" className="text-primary underline">Register</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
