## SOS Emergency System — Implementation Plan

Transform the placeholder SOS button into a real emergency dispatch flow with priority routing, live tracking, safety escalation, trusted contacts, and an admin command center.

### 1. Database (migration)

Extend `service_requests` and add supporting tables:

- `service_requests`:
  - `is_sos boolean default false`
  - `sos_status` enum (`dispatching`, `assigned`, `enroute`, `on_scene`, `resolved`, `escalated`, `cancelled`, `false_alarm`)
  - `priority smallint default 0` (SOS = 100)
  - `sos_lat numeric, sos_lng numeric, sos_accuracy_m int`
  - `sos_triggered_at timestamptz`
  - `sos_escalated_at timestamptz`
  - `device_info jsonb`
  - `danger_flag boolean default false`
- New table `sos_events` — audit log (request_id, kind: created/dispatch_attempt/accepted/escalated/danger/resolved, payload jsonb, created_at)
- New table `trusted_contacts` (user_id, name, phone, relation, notify_on_sos boolean)
- New table `sos_share_tokens` (request_id, token, expires_at) for public live-trip share links
- New table `sos_abuse_log` (user_id, reason, created_at) + computed `trust_score` view; block users with >3 false alarms in 24h via trigger
- RLS:
  - SOS requests visible to: buyer, assigned provider, any admin, holders of valid share token (via security definer function)
  - All providers in matching service area can see unassigned SOS requests (broader than normal)
  - `trusted_contacts` — owner only
  - `sos_events` — admin + buyer + assigned provider
- Trigger `notify_sos_created` — fans out notifications to all eligible providers + ops admins; logs `sos_events`
- Trigger `auto_escalate_sos` — runs on update; if `dispatching` for >3 min, sets `sos_status='escalated'`, notifies ops admins (handled via cron edge function actually; trigger only flags timer)

### 2. Edge function `sos-dispatch`

`POST /sos-dispatch` — JWT verified. Body: `{ lat, lng, accuracy, vehicle?, description?, device_info? }`.
- Validates trust score (reject if abuse-flagged)
- Inserts SOS request (`is_sos=true`, priority=100, `sos_status='dispatching'`)
- Logs `sos_events` (created)
- Returns request id immediately (fire-and-forget for matching)
- Background: matches nearest providers (haversine on `provider_availability.base_location` parsed lat/lng + `is_online=true` + role match), starts at 5km, expands to 10/20/50km every 60s until accepted or 5min elapsed → mark `escalated`

`POST /sos-share` — creates share token; returns public URL `/sos/track/:token`.
`POST /sos-resolve` — buyer or provider marks resolved; opens payment.
`POST /sos-danger` — buyer flags danger → instant escalate + ops notified.

### 3. Frontend — User flow

- **`SOSButton` component** (replaces current static button in `NeedHelpScreen`):
  - Long-press 800ms OR tap-confirm 3-2-1 countdown to prevent accidental triggers
  - Captures `navigator.geolocation` + `userAgent` immediately
  - Calls `sos-dispatch`, navigates to `/sos/:id`
- **`/sos/:id` SOSTracking page**:
  - Full-screen, red-alert theme
  - Status banner: "Finding nearest help…" → "Operator assigned" → "Enroute (ETA 4 min)" → "On scene" → "Resolved"
  - Operator card with name, vehicle, rating, phone (tel:) + WhatsApp
  - Live map placeholder with pulsing user marker + provider marker
  - Action row: Call, WhatsApp, Share live trip, **I'm in danger** (red), Cancel
  - Trusted contacts quick-share
  - Auto-shows payment CTA after `resolved`
- **`/sos/track/:token` public share page** — read-only live status for family/friends, no auth
- **`/profile/trusted-contacts`** — manage contacts
- **Floating SOS FAB** on `/`, `/requests/:id`, `/sos/:id` (always-visible bottom-right red button)

### 4. Provider portal

- New "🚨 SOS Alerts" tab at top of `ProviderJobsBoard` — pinned, red-bordered, with sound/vibrate on new
- Single-tap **Accept** (no negotiation, fixed emergency rate from settings)
- Auto-decline after 30s if no response (pass to next provider)

### 5. Admin dashboard

- New `/admin/sos` route in `AdminLayout` sidebar (visible to `super_admin` + `operations`)
- Live SOS table: blinking row for `dispatching`/`escalated`, columns: user, location, status, age, assigned provider, escalation timer
- Manual dispatch: assign any online operator
- Mark false alarm (increments abuse log)
- Stats card on AdminDashboard: "Active SOS" + "Escalated"

### 6. Payment

Reuse existing `/pay/service/:id` flow — payment page already gated by completed status. SOS uses same `payment_status` columns; no changes needed beyond surfacing the Pay CTA on `SOSTracking` after `sos_status='resolved'`.

### 7. Fraud / abuse protection

- Cooldown: max 1 active SOS per user
- Edge function rejects new SOS if user has unresolved one
- After provider/admin marks `false_alarm` 3x in 24h → user blocked from SOS for 24h (UI shows reason + support link)

### Technical notes

- Geolocation: `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy:true, timeout:8000`
- Realtime: subscribe to `service_requests` + `sos_events` filtered by id for tracking page; admin subscribes to all `is_sos=true`
- Sound alert: small `.mp3` in `public/` played on new SOS (provider + admin)
- Web Share API for trusted contacts share, `tel:` and `https://wa.me/` fallbacks
- Map: keep current pulse-ring placeholder for now; structure for Mapbox later

### Out of scope for this iteration

- Real Mapbox/Google Maps integration (stub with pulse animation + lat/lng readout)
- Real SMS to trusted contacts (UI + share link only; SMS later via edge function + Twilio)
- Government agency integration
- Lock-screen shortcuts (native app, post-Capacitor)
