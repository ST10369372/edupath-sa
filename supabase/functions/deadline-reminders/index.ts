/**
 * EduPath SA — Deadline Reminder Edge Function
 * ─────────────────────────────────────────────
 * Triggered by a Supabase cron job (pg_cron) or manually via HTTP.
 * Finds applications whose deadline is 7 days or 1 day away
 * and sends a reminder email via Resend.
 *
 * SETUP:
 * 1. Add your Resend API key to Supabase secrets:
 *      supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
 * 2. Deploy this function:
 *      supabase functions deploy deadline-reminders
 * 3. Schedule it daily via Supabase Dashboard → Database → Extensions → pg_cron:
 *      select cron.schedule(
 *        'deadline-reminders-daily',
 *        '0 7 * * *',   -- 07:00 UTC every day
 *        $$
 *          select net.http_post(
 *            url := 'https://<your-project>.supabase.co/functions/v1/deadline-reminders',
 *            headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
 *          );
 *        $$
 *      );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL     = 'reminders@edupathsa.co.za'   // change to your verified Resend sender domain

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const today     = new Date()
    const in7Days   = new Date(today); in7Days.setDate(today.getDate() + 7)
    const in1Day    = new Date(today); in1Day.setDate(today.getDate() + 1)

    const fmt = (d: Date) => d.toISOString().slice(0, 10)

    // Fetch applications due in 7 or 1 day with their user's email
    const { data: apps, error } = await supabase
      .from('applications')
      .select(`
        id, institution, programme, deadline, status,
        profiles!inner(full_name, preferred_lang),
        auth_users:user_id(email)
      `)
      .in('deadline', [fmt(in7Days), fmt(in1Day)])
      .not('status', 'in', '("accepted","unsuccessful")')

    if (error) throw error

    let sent = 0
    for (const app of (apps ?? [])) {
      const userEmail  = (app as any).auth_users?.email
      const fullName   = (app as any).profiles?.full_name || 'Student'
      const daysAway   = app.deadline === fmt(in1Day) ? 1 : 7

      if (!userEmail) continue

      const subject = daysAway === 1
        ? `⏰ Final reminder: ${app.institution} deadline is TOMORROW`
        : `📅 Reminder: ${app.institution} application due in 7 days`

      const html = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1c1c1c;">
          <div style="background: #1c1c1c; padding: 20px 28px;">
            <span style="color: #f4f4f0; font-size: 18px; font-weight: 600;">EduPath SA</span>
          </div>
          <div style="padding: 32px 28px; background: #f4f4f0; border: 1px solid #d6d3d1;">
            <p style="margin: 0 0 16px; font-size: 15px;">Hi ${fullName},</p>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
              This is a reminder that your <strong>${app.institution}</strong> application
              for <strong>${app.programme}</strong> has a deadline
              <strong>${daysAway === 1 ? 'tomorrow' : `in ${daysAway} days`}</strong>
              (${new Date(app.deadline).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}).
            </p>
            <div style="background: #fff; border: 1px solid #d6d3d1; padding: 16px 20px; margin-bottom: 24px;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr><td style="padding: 4px 0; color: #78716c;">Institution</td><td style="padding: 4px 0; font-weight: 600;">${app.institution}</td></tr>
                <tr><td style="padding: 4px 0; color: #78716c;">Programme</td><td style="padding: 4px 0;">${app.programme}</td></tr>
                <tr><td style="padding: 4px 0; color: #78716c;">Deadline</td><td style="padding: 4px 0; ${daysAway === 1 ? 'color: #b34040; font-weight: 700;' : ''}">${app.deadline}</td></tr>
                <tr><td style="padding: 4px 0; color: #78716c;">Status</td><td style="padding: 4px 0; text-transform: capitalize;">${app.status.replace('_', ' ')}</td></tr>
              </table>
            </div>
            <p style="margin: 0 0 24px; font-size: 14px; color: #78716c;">
              Log in to EduPath SA to update your application status, upload documents, or mark it as submitted.
            </p>
            <a href="https://edupathsa.co.za/applications"
              style="display: inline-block; background: #1c1c1c; color: #f4f4f0; padding: 10px 24px; font-size: 13px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
              View Application →
            </a>
          </div>
          <div style="padding: 16px 28px; font-size: 11px; color: #a8a29e;">
            You're receiving this because you have a deadline tracked in EduPath SA.
            <a href="https://edupathsa.co.za/profile" style="color: #a8a29e;">Manage notifications</a>
          </div>
        </div>
      `

      const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ from: FROM_EMAIL, to: userEmail, subject, html }),
      })

      if (res.ok) sent++
      else console.error('Resend error for', userEmail, await res.text())
    }

    return new Response(JSON.stringify({ ok: true, checked: apps?.length ?? 0, sent }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
