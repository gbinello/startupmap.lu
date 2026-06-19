import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '@/lib/supabase';
import { SECTORS } from '@/lib/utils';

const ENTITY_TYPES = [
  { value: 'startup', label: 'Startup' },
  { value: 'investor', label: 'Investor / VC' },
  { value: 'accelerator', label: 'Accelerator / Incubator' },
  { value: 'service_provider', label: 'Service Provider' },
];

export default function SubmitPage() {
  const [form, setForm] = useState({
    entity_name: '',
    entity_type: 'startup',
    website: '',
    description: '',
    submitter_email: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.entity_name.trim()) return setError('Name is required');
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    const { error: err } = await supabase.from('submissions').insert({
      ...form,
      submitted_by: user?.id ?? null,
    });

    if (err) setError('Something went wrong. Please try again.');
    else setSubmitted(true);
    setLoading(false);
  }

  if (submitted) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={24} />
      </div>
      <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Submission received</h1>
      <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
        Thanks for contributing to startupmap.lu. We'll review your submission and add it to the directory within a few days.
      </p>
    </div>
  );

  return (
    <>
      <Helmet><title>Submit a listing — startupmap.lu</title></Helmet>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Submit a listing</h1>
          <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
            Know a startup, investor or accelerator we're missing? Tell us about it and we'll add it to the directory.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ENTITY_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, entity_type: t.value }))}
                  className={`px-3 py-2.5 text-sm rounded-[var(--radius-lg)] border text-left transition-all ${
                    form.entity_type === t.value
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                      : 'border-[var(--border-strong)] text-[var(--foreground-secondary)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Name <span className="text-red-500">*</span></label>
            <Input
              value={form.entity_name}
              onChange={set('entity_name')}
              placeholder="Company name"
              required
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Website</label>
            <Input
              value={form.website}
              onChange={set('website')}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="What does this company do? Any additional context you'd like to share."
              rows={4}
              className="w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent resize-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Your email <span className="text-[var(--foreground-muted)] font-normal">(optional)</span></label>
            <Input
              value={form.submitter_email}
              onChange={set('submitter_email')}
              placeholder="you@example.com"
              type="email"
            />
            <p className="text-xs text-[var(--foreground-muted)] mt-1">We'll only use this to follow up on your submission.</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting…' : 'Submit listing'}
          </Button>
        </form>
      </div>
    </>
  );
}
