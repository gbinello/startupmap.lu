import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://startupmap.lu';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { entity_id, user_id, email, entity_name } = await req.json();
    if (!entity_id || !user_id || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate a secure token and store it (expires in 24h)
    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenErr } = await supabase.from('claim_tokens').insert({
      token, entity_id, user_id, email, expires_at,
    });
    if (tokenErr) throw tokenErr;

    const verifyUrl = `${SITE_URL}/verify-claim?token=${token}`;

    // Send verification email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'startupmap.lu <noreply@startupmap.lu>',
        to: email,
        subject: `Verify your ownership of ${entity_name} on startupmap.lu`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <p style="font-size:14px;color:#6b7280;margin-bottom:24px">startupmap<span style="color:#6366f1">.lu</span></p>
            <h1 style="font-size:20px;font-weight:600;color:#111827;margin:0 0 8px">Verify your ownership</h1>
            <p style="font-size:14px;color:#6b7280;margin:0 0 24px">
              Someone requested to claim <strong style="color:#111827">${entity_name}</strong> on startupmap.lu using this email address.
              Click the button below to confirm you own this listing.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
              Verify &amp; claim listing
            </a>
            <p style="font-size:12px;color:#9ca3af;margin-top:24px">
              This link expires in 24 hours. If you didn't request this, you can safely ignore this email.
            </p>
            <p style="font-size:12px;color:#9ca3af;margin-top:8px">
              Or copy this URL: <a href="${verifyUrl}" style="color:#6366f1">${verifyUrl}</a>
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const body = await emailRes.text();
      throw new Error(`Resend error: ${body}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
