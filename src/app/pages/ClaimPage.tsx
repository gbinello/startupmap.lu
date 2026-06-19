import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '@/lib/supabase';
import type { Entity } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

export default function ClaimPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [entityId]);

  async function loadData() {
    const [{ data: userData }, { data: entityData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('entities').select('*').eq('id', entityId).single(),
    ]);
    setUser(userData.user);
    setEntity(entityData as Entity);
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return navigate(`/auth?redirect=/claim/${entityId}`);
    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('claim_requests').insert({
      entity_id: entityId,
      user_id: user.id,
      evidence,
    });

    if (err) setError('Something went wrong. Please try again.');
    else setSubmitted(true);
    setLoading(false);
  }

  if (submitted) return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={24} />
      </div>
      <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Claim request sent</h1>
      <p className="text-sm text-[var(--foreground-secondary)] mb-5">
        We'll review your claim and get back to you within 2 business days.
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-sm flex items-center justify-center">
              {getInitials(entity.name)}
            </div>
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
            <Button asChild>
              <Link to={`/auth?redirect=/claim/${entityId}`}>Sign in to continue</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleClaim} className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                How can you prove you're associated with {entity.name}?
              </label>
              <textarea
                value={evidence}
                onChange={e => setEvidence(e.target.value)}
                placeholder="e.g. I'm the CEO — my work email is john@company.com. LinkedIn: linkedin.com/in/johndoe"
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
    </>
  );
}
