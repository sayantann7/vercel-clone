import { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-grid dark:bg-grid-dark">
      <AuthGradient />
      <header className="z-10 w-full border-b border-border/60 backdrop-blur bg-background/60">
        <div className="max-w-5xl mx-auto h-14 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Rocket className="h-5 w-5 text-primary" /> ZipHub
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-foreground">Login</Link>
            <Link to="/signup" className="text-muted-foreground hover:text-foreground">Signup</Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md relative">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-primary/40 via-primary/10 to-fuchsia-400/30 blur opacity-60" />
          <div className="relative rounded-2xl border bg-background/70 backdrop-blur-xl p-8 shadow-xl">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 dark:from-white dark:to-white/30 bg-clip-text text-transparent">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
            </div>
            <div className="mt-8 space-y-6">
              {children}
            </div>
          </div>
        </div>
      </main>
      <footer className="z-10 mt-auto w-full py-6 text-center text-xs text-muted-foreground border-t border-border/60 bg-background/60 backdrop-blur">
        © {new Date().getFullYear()} ZipHub
      </footer>
      <div className="fixed bottom-4 right-4 z-20"><ThemeToggle /></div>
    </div>
  );
}

function AuthGradient() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-gradient-to-tr from-indigo-500/25 via-sky-400/15 to-fuchsia-400/25 blur-3xl opacity-70 dark:opacity-40" />
      <div className="absolute bottom-[-220px] right-[-180px] h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-fuchsia-500/15 via-violet-500/20 to-amber-400/25 blur-3xl opacity-70 dark:opacity-40" />
    </div>
  );
}
