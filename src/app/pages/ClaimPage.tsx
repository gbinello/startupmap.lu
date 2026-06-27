import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Lock, Mail, FileText, Pencil } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '@/lib/supabase';
import type { Entity } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

function getDomain(website?: string): string | null {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

type Method = 'email' | 'manual';
type SuccessType = 'email' | 'email_verified' | 'manual';

export default function ClaimPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [method, setMethod] = useState<Method>('email');
  const [companyEmail, setCompanyEmail] = useState('');
  const [evidence, setEvidence] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<SuccessType | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, [entityId]);

  async function loadData() {
    const [{ data: userData }, { data: entityData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('entities').select('*').eq('id', entityId).single(),
    ]);
    setUser(userData.user);
    setEntity(entityData as Entity);
  }

  const domain = getDomain(entity?.website);

  function validateEmail(): boolean {
    if (!companyEmail.trim()) { setEmailError('Enter your company email'); return false; }
    if (domain && !companyEmail.toLowerCase().endsWith(`@${domain}`)) {
      setEmailError(`Must end with @${domain}`);
      return false;
    }
    if (!companyEmail.includes('@')) { setEmailError('Enter a valid email address'); return false; }
    setEmailError('');
    return true;
  }

  async function handleEmailClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return navigate(`/auth?redirect=/claim/${entityId}`);
    if (!validateEmail()) return;
    setLoading(true);
    setError('');

    if (isDemo) {
      // Demo: auto-claim immediately via mockClient side-effect
      const { error: err } = await supabase.from('claim_requests').insert({
        entity_id: entityId,
        user_id: user.id,
        evidence: `Email verification: ${companyEmail}`,
        method: 'email',
      });
      if (err) setError('Something went wrong. Please try again.');
      else setSubmitted('email_verified');
    } else {
      // Production: call edge function to send a verification link
      const { error: err } = await (supabase as any).functions.invoke('send-claim-verification', {
        body: {
          entity_id: entityId,
          user_id: user.id,
          email: companyEmail,
          entity_name: entity?.name,
        },
      });
      if (err) setError('Failed to send verification email. Please try again.');
      else setSubmitted('email');
    }
    setLoading(false);
  }

  async function handleManualClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return navigate(`/auth?redirect=/claim/${entityId}`);
    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('claim_requests').insert({
      entity_id: entityId,
      user_id: user.id,
      evidence,
      method: 'manual',
    });

    if (err) setError('Something went wrong. Please try again.');
    else setSubmitted('manual');
    setLoading(false);
  }

  if (submitted === 'email_verified') return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={24} />
      </div>
      <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Profile claimed!</h1>
      <p className="text-sm text-[var(--foreground-secondary)] mb-6">
        <strong>{entity?.name}</strong> is now linked to your account. You can edit and manage it from the listing page.
      </p>
      <div className="flex flex-col gap-2">
        <Button asChild>
          <Link to={`/entity/${entity?.slug || entity?.id}`} className="gap-1.5">
            <Pencil size={13} /> Go to your listing
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/profile">View profile</Link>
        </Button>
      </div>
    </div>
  );

  if (submitted === 'email') return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
        <Mail size={22} />
      </div>
      <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Check your email</h1>
      <p className="text-sm text-[var(--foreground-secondary)] mb-1">
        We sent a verification link to
      </p>
      <p className="text-sm font-medium text-[var(--foreground)] mb-5">{companyEmail}</p>
      <p className="text-xs text-[var(--foreground-muted)] mb-6">
        Click the link in the email to verify ownership. It expires in 24 hours.
      </p>
      <Button variant="outline" asChild>
        <Link to={`/entity/${entity?.slug || entity?.id}`}>Back to profile</Link>
      </Button>
    </div>
  );

  if (submitted === 'manual') return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={24} />
      </div>
      <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Claim request sent</h1>
      <p className="text-sm text-[var(--foreground-secondary)] mb-5">
        We'll review your request and get back to you within 2 business days.
      </p>
      <Button variant="outline" asChild>
        <Link to={`/entity/${entity?.slug || entity?.id}`}>Back to profile</Link>
      </Button>
    </div>
  );

  if (!entity) return null;

  return (
    <>
      <Helmet><title>Claim {entity.name} — startupmap.lu</title></Helmet>

      <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
        {/* Entity header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {entity.logo_url ? (
              <img src={entity.logo_url} alt={entity.name} className="w-10 h-10 rounded-[var(--radius)] border border-[var(--border)] object-contain p-0.5 bg-white" />
            ) : (
              <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-sm flex items-center justify-center">
                {getInitials(entity.name)}
              </div>
            )}
            <div>
              <h1 className="text-base font-semibold text-[var(--foreground)]">{entity.name}</h1>
              <p className="text-xs text-[var(--foreground-secondary)] capitalize">{entity.type.replace('_', ' ')}</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Claim this profile</h2>
          <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
            Verified owners can edit their profile, add team members, post jobs, and respond to inquiries.
          </p>
        </div>

        {!user ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 text-center">
            <Lock size={20} className="mx-auto text-[var(--foreground-muted)] mb-3" />
            <p className="text-sm text-[var(--foreground-secondary)] mb-4">You need to be signed in to claim a profile.</p>
            <Button asChild><Link to={`/auth?redirect=/claim/${entityId}`}>Sign in to continue</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Method selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('email')}
                className={`flex items-start gap-3 p-4 rounded-[var(--radius-xl)] border-2 text-left transition-colors ${
                  method === 'email'
                    ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                    : 'border-[var(--border)] bg-white hover:border-[var(--border-strong)]'
                }`}
              >
                <span className={`w-8 h-8 rounded-[var(--radius)] flex items-center justify-center shrink-0 ${method === 'email' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--foreground-muted)]'}`}>
                  <Mail size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">Email</p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5 leading-snug">Verify with your company email</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('manual')}
                className={`flex items-start gap-3 p-4 rounded-[var(--radius-xl)] border-2 text-left transition-colors ${
                  method === 'manual'
                    ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                    : 'border-[var(--border)] bg-white hover:border-[var(--border-strong)]'
                }`}
              >
                <span className={`w-8 h-8 rounded-[var(--radius)] flex items-center justify-center shrink-0 ${method === 'manual' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--foreground-muted)]'}`}>
                  <FileText size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">Manual</p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5 leading-snug">Explain how you're connected</p>
                </div>
              </button>
            </div>

            {/* Email verification form */}
            {method === 'email' && (
              <form onSubmit={handleEmailClaim} className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
                  <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--primary-light)] flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Email Verification</p>
                    <p className="text-xs text-[var(--foreground-muted)]">Fastest — verify with your company email</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Your company email
                  </label>
                  <Input
                    type="email"
                    value={companyEmail}
                    onChange={e => { setCompanyEmail(e.target.value); setEmailError(''); }}
                    placeholder={domain ? `you@${domain}` : 'you@company.com'}
                  />
                  {domain && !emailError && (
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">Must end with @{domain}</p>
                  )}
                  {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full gap-2">
                  <Mail size={14} />
                  {loading ? 'Sending…' : 'Send Verification Email'}
                </Button>
              </form>
            )}

            {/* Manual claim form */}
            {method === 'manual' && (
              <form onSubmit={handleManualClaim} className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
                  <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-[var(--foreground-muted)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Manual Review</p>
                    <p className="text-xs text-[var(--foreground-muted)]">We'll verify within 2 business days</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    How are you connected to {entity.name}?
                  </label>
                  <textarea
                    value={evidence}
                    onChange={e => setEvidence(e.target.value)}
                    placeholder={`e.g. I'm the CEO — my LinkedIn is linkedin.com/in/yourname`}
                    rows={4}
                    className="w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent resize-none"
                    required
                  />
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">We'll verify using public information.</p>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Submitting…' : 'Send claim request'}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
