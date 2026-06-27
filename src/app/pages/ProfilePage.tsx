import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { LogOut, Building2, ChevronRight, Bookmark, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '@/lib/supabase';
import type { Entity } from '@/lib/supabase';
import { ENTITY_TYPE_LABELS, getInitials } from '@/lib/utils';
import { EntityLogo, TypeBadge } from '../components/EntityCard';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name?: string;
  role?: string;
  entity_id?: string;
  is_admin?: boolean;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [claimedEntity, setClaimedEntity] = useState<Entity | null>(null);
  const [shortlist, setShortlist] = useState<Entity[]>([]);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return navigate('/auth');
    setUser(u);

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', u.id).single();

    if (profileData) {
      setProfile(profileData as Profile);
      setFullName(profileData.full_name || '');
      setRole(profileData.role || '');

      if (profileData.entity_id) {
        const { data: entityData } = await supabase.from('entities').select('*').eq('id', profileData.entity_id).single();
        if (entityData) setClaimedEntity(entityData as Entity);
      }
    } else {
      setFullName((u.user_metadata?.full_name as string) || '');
    }

    // Load shortlist
    const { data: savedRows } = await supabase.from('saved_entities').select('entity_id').eq('user_id', u.id);
    if (savedRows && (savedRows as any[]).length > 0) {
      const ids = (savedRows as any[]).map((r: any) => r.entity_id);
      const { data: entities } = await supabase.from('entities').select('*, startup_details(*), investor_details(*)').in('id', ids).eq('visible', true);
      if (entities) setShortlist(entities as Entity[]);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').upsert({ id: user.id, full_name: fullName, role });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  async function removeFromShortlist(entityId: string) {
    if (!user) return;
    await supabase.from('saved_entities').delete().eq('user_id', user.id).eq('entity_id', entityId);
    setShortlist(prev => prev.filter(e => e.id !== entityId));
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (!user) return null;

  return (
    <>
      <Helmet><title>Profile — startupmap.lu</title></Helmet>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Account</h1>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-[var(--foreground-secondary)]">
            <LogOut size={14} /> Sign out
          </Button>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Profile</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-base flex items-center justify-center">
                  {fullName ? getInitials(fullName) : user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{fullName || 'Unnamed user'}</p>
                  <p className="text-xs text-[var(--foreground-secondary)]">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Full name</label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Role</label>
                  <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Founder, Investor" />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={saving}>
                {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </section>

          {/* Claimed entity */}
          <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Your listing</h2>
            {claimedEntity ? (
              <Link
                to={`/entity/${claimedEntity.slug || claimedEntity.id}`}
                className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[var(--radius-lg)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <EntityLogo entity={claimedEntity} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{claimedEntity.name}</p>
                  <p className="text-xs text-[var(--foreground-secondary)] capitalize">{ENTITY_TYPE_LABELS[claimedEntity.type]}</p>
                </div>
                <ChevronRight size={14} className="text-[var(--foreground-muted)]" />
              </Link>
            ) : (
              <div className="text-center py-6">
                <Building2 size={24} className="mx-auto text-[var(--foreground-muted)] mb-3" />
                <p className="text-sm text-[var(--foreground-secondary)] mb-3">You haven't claimed a profile yet</p>
                <div className="flex justify-center gap-2">
                  <Button size="sm" asChild><Link to="/directory">Find your company</Link></Button>
                  <Button size="sm" variant="outline" asChild><Link to="/submit">Submit new listing</Link></Button>
                </div>
              </div>
            )}
          </section>

          {/* Shortlist */}
          <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bookmark size={14} className="text-[var(--foreground-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Shortlist</h2>
              {shortlist.length > 0 && (
                <span className="ml-auto text-xs text-[var(--foreground-muted)]">{shortlist.length} saved</span>
              )}
            </div>
            {shortlist.length === 0 ? (
              <div className="text-center py-6">
                <Bookmark size={24} className="mx-auto text-[var(--foreground-muted)] mb-3" />
                <p className="text-sm text-[var(--foreground-secondary)] mb-3">No saved entities yet</p>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/directory">Browse directory</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {shortlist.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[var(--radius-lg)] group">
                    <EntityLogo entity={e} size="sm" />
                    <Link to={`/entity/${e.slug || e.id}`} className="flex-1 min-w-0 hover:text-[var(--primary)] transition-colors">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{e.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TypeBadge type={e.type} />
                        {e.city && <span className="text-xs text-[var(--foreground-muted)]">· {e.city}</span>}
                      </div>
                    </Link>
                    <button
                      onClick={() => removeFromShortlist(e.id)}
                      className="size-7 flex items-center justify-center rounded hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from shortlist"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
