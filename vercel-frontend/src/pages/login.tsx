import { AuthLayout } from '@/components/layout/auth-layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    // TODO: integrate backend auth
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to deploy & manage your projects.">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading || !email || !password} className="w-full gap-2">
          {loading && <span className="h-4 w-4 rounded-full border-2 border-transparent border-t-current animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          No account? <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
