import { AuthLayout } from '@/components/layout/auth-layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = name && email && password && confirm && password === confirm;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    // TODO: integrate backend signup
    setTimeout(() => setLoading(false), 1400);
  };

  return (
    <AuthLayout title="Create account" subtitle="Spin up your first deployment in less than a minute.">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Ada Lovelace" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        {password && confirm && password !== confirm && (
          <p className="text-xs text-red-500">Passwords do not match.</p>
        )}
        <Button type="submit" disabled={loading || !valid} className="w-full gap-2">
          {loading && <span className="h-4 w-4 rounded-full border-2 border-transparent border-t-current animate-spin" />}
          {loading ? 'Creating…' : 'Create account'}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Already have an account? <Link to="/login" className="text-foreground underline-offset-4 hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
