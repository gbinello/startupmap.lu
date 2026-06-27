import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, XCircle, Loader2, Pencil } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '@/lib/supabase';
import type { Entity } from '@/lib/supabase';

type State = 'verifying' | 'success' | 'expired' | 'invalid' | 'already_claimed';

export default function VerifyClaimPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<State>('verifying');
  const [entity, setEntity] = useState<Entity | null>(null);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    verifyClaim(token);
  }, [token]);

  async function verifyClaim(tok: string) {
    // 1. Look up the token
    const { data: tokenRow, error } = await supabase
      .from('claim_tokens')
      .select('*')
      .eq('token', tok)
      .single();

    if (error || !tokenRow) { setState('invalid'); return; }
    if (tokenRow.used_at) { setState('already_claimed'); return; }
    if (new Date(tokenRow.expires_at) < new Date()) { setState('expired'); return; }

    // 2. Fetch entity for display
    const { data: entityData } = await supabase
      .from('entities')
      .select('*')
      .eq('id', tokenRow.entity_id)
      .single();
    if (entityData) setEntity(entityData as Entity);

    // 3. Mark entity as claimed + link profile
    const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
      supabase.from('entities').update({ claimed: true, claimed_by: tokenRow.user_id }).eq('id', tokenRow.entity_id),
      supabase.from('profiles').upsert({ id: tokenRow.user_id, entity_id: tokenRow.entity_id }),
      supabase.from('claim_tokens').update({ used_at: new Date().toISOString() }).eq('token', tok),
    ]);

    if (e1 || e2 || e3) { setState('invalid'); return; }
    setState('success');
  }

  return (
    <>
      <Helmet><title>Verify claim — startupmap.lu</title></Helmet>
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        {state === 'verifying' && (
          <>
            <Loader2 size={32} className="mx-auto text-[var(--primary)] animate-spin mb-4" />
            <p className="text-sm text-[var(--foreground-secondary)]">Verifying your ownership…</p>
          </>
        )}

        {state === 'success' && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} />
            </div>
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Profile claimed!</h1>
            <p className="text-sm text-[var(--foreground-secondary)] mb-6">
              <strong>{entity?.name ?? 'Your listing'}</strong> is now linked to your account.
              You can edit and manage it from the listing page.
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
        )}

        {state === 'expired' && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <XCircle size={24} />
            </div>
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Link expired</h1>
            <p className="text-sm text-[var(--foreground-secondary)] mb-5">
              This verification link expired after 24 hours. Go back and request a new one.
            </p>
            <Button variant="outline" asChild>
              <Link to="/directory">Back to directory</Link>
            </Button>
          </div>
        )}

        {state === 'already_claimed' && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} />
            </div>
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Already verified</h1>
            <p className="text-sm text-[var(--foreground-secondary)] mb-5">
              This listing has already been claimed. Sign in to manage it.
            </p>
            <Button asChild><Link to="/profile">Go to profile</Link></Button>
          </div>
        )}

        {state === 'invalid' && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <XCircle size={24} />
            </div>
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Invalid link</h1>
            <p className="text-sm text-[var(--foreground-secondary)] mb-5">
              This verification link is invalid or has already been used.
            </p>
            <Button variant="outline" asChild>
              <Link to="/directory">Back to directory</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
