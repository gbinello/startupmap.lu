import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, FlaskConical } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '@/lib/supabase';

const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate('/profile');
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (err) setError(err.message);
      else setSent(true);
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else navigate('/profile');
    }
    setLoading(false);
  }

  async function handleMagicLink() {
    if (!email.trim()) return setError('Enter your email first');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  }

  if (sent) return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={24} />
      </div>
      <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Check your email</h1>
      <p className="text-sm text-[var(--foreground-secondary)]">
        We sent a {mode === 'signup' ? 'confirmation' : 'magic link'} to <strong>{email}</strong>
      </p>
    </div>
  );

  return (
    <>
      <Helmet><title>{mode === 'signup' ? 'Create account' : 'Sign in'} — startupmap.lu</title></Helmet>

      <div className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center px-4 pt-16 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link to="/" className="text-sm font-semibold">
              startupmap<span className="text-[var(--primary)]">.lu</span>
            </Link>
            <h1 className="text-xl font-semibold text-[var(--foreground)] mt-6 mb-1">
              {mode === 'signup' ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              {mode === 'signup' ? 'Join to claim and manage profiles' : 'Sign in to your account'}
            </p>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Full name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Password</label>
                <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Loading…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
              <div className="relative flex justify-center"><span className="px-2 bg-white text-xs text-[var(--foreground-muted)]">or</span></div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={loading}>
              Send magic link
            </Button>

            {isDemo && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
                  <div className="relative flex justify-center"><span className="px-2 bg-white text-xs text-[var(--foreground-muted)]">demo mode</span></div>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-dashed text-[var(--foreground-secondary)]"
                  onClick={async () => {
                    await (supabase.auth as any).signInAsDemo();
                    navigate('/profile');
                  }}
                >
                  <FlaskConical size={14} />
                  Continue as demo user
                </Button>
              </>
            )}
          </div>

          <p className="text-center text-sm text-[var(--foreground-secondary)] mt-5">
            {mode === 'signup' ? (
              <>Already have an account? <button onClick={() => setMode('signin')} className="text-[var(--primary)] hover:underline font-medium">Sign in</button></>
            ) : (
              <>Don't have an account? <button onClick={() => setMode('signup')} className="text-[var(--primary)] hover:underline font-medium">Sign up</button></>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
