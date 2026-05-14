# RoadAssistNG — Premium Redesign & Workflow Completion

This is a large, multi-area effort. I'll break it into focused phases so you can review and approve before I start building.

## Phase 1 — Design system & typography
- Switch global font to **Inter** (via Google Fonts in `index.html`, wired through Tailwind config and `body`).
- Tighten typography scale (display / h1 / h2 / section / body / caption) and spacing tokens in `index.css` + `tailwind.config.ts`.
- Introduce premium tokens: subtle gradients, elevated shadow tiers (`shadow-card`, `shadow-elevated`, `shadow-premium`), refined radii, and focus-ring tokens for accessibility.
- Audit existing components to remove arbitrary colors and use semantic tokens only.

## Phase 2 — Authentication redesign + real auth
- Rebuild `AuthScreen` as a centered card (max-width ~460px) with:
  - Vertical+horizontal centering, branded gradient background, compact roadside hero illustration on desktop split-pane (hidden on mobile).
  - Animated Sign In ↔ Sign Up tab transition.
  - Inter typography, modern inputs, premium "Continue with Google" button.
  - Loading / success / error states + toasts, inline validation (zod).
- Add **Forgot password** flow + new `/reset-password` page.
- Wire **Google OAuth** via Lovable Cloud managed social login (`supabase--configure_social_auth` with `providers: ["google"]`), using `lovable.auth.signInWithOAuth("google", ...)`.
- Session persistence already handled by `useAuth`; add explicit Logout entry in header menu.

## Phase 3 — Responsive shell
- Constrain main app shell so desktop feels compact (max-width container ~720–960 depending on screen), with sidebar/nav balance instead of stretched single column.
- Mobile-first stacking; tablet breakpoints; touch-friendly tap targets (min 44px).
- Polish `AppHeader`, `TabBar`, and panels for desktop (persistent side nav on ≥lg) while keeping bottom tab bar on mobile.

## Phase 4 — Booking workflow completion
Audit current routes and fill gaps. Target route map:

```
/                    Home / dashboard
/services            Service selection
/services/:type      Service details
/match               Provider matching (searching state)
/providers           Nearby results
/providers/:id       Provider profile
/requests/:id        Active request hub
  ├─ chat drawer     Live chat / call
  ├─ negotiate       Price negotiation / accept offer
  ├─ tracking        Live provider tracking
  ├─ progress        Service in-progress
  └─ complete        Service completion confirmation
/requests/:id/review Review + summary
/requests/:id/invoice Invoice / receipt
/requests/:id/pay    Payment (AFTER completion)
/pay/success         Payment success
/pay/failure         Payment failure + retry
/orders              Booking history (existing, refresh)
/profile             User profile / settings
/notifications       Full notifications page (panel exists)
/support             Support page (panel exists)
```
- Wire every CTA; remove dead-ends.
- Add loading skeletons + empty states throughout.

## Phase 5 — Payment-after-service flow
- Update `service_requests` lifecycle so `payment` step only unlocks after `completed_at` is set and buyer confirms completion.
- New columns (migration): `payment_status` (pending/paid/failed), `payment_reference`, `paid_at`, `amount_kobo`.
- Generate payment reference client-side at checkout; store on row; show invoice/receipt page.
- Retry handling on `/pay/failure`.
- Use existing **Lovable built-in Stripe payments** (`payments--enable_stripe_payments`) for backend payment-intent creation. *(Confirm before enabling.)*
- Parts checkout flow remains as-is for now unless you want it migrated too.

## Phase 6 — UX polish & accessibility
- Toasts on every async action (success/error).
- Form validation with zod everywhere.
- Focus-visible rings, ARIA labels on icon buttons, semantic landmarks (`<main>`, `<nav>`).
- Keyboard navigation across modals and tabs.
- Skeleton loaders for lists, empty states with CTAs.

## Technical notes
- New files: `src/pages/ResetPassword.tsx`, `src/pages/Match.tsx`, `src/pages/Providers.tsx`, `src/pages/ProviderProfile.tsx`, `src/pages/Negotiate.tsx`, `src/pages/Tracking.tsx`, `src/pages/Progress.tsx`, `src/pages/Complete.tsx`, `src/pages/Review.tsx`, `src/pages/Invoice.tsx`, `src/pages/Pay.tsx`, `src/pages/PaySuccess.tsx`, `src/pays/PayFailure.tsx`, `src/pages/Profile.tsx`, `src/pages/Notifications.tsx`, `src/pages/Support.tsx`.
- Edited: `App.tsx` routes, `index.html`, `index.css`, `tailwind.config.ts`, `AuthScreen.tsx`, `AppHeader.tsx`, `TabBar.tsx`, `Index.tsx`.
- DB migration: add payment columns to `service_requests`.
- Edge function (later phase): `create-payment-intent` after Stripe is enabled.

## Questions before I start
1. **Google OAuth** — OK to enable Lovable's managed Google sign-in now? (No setup needed on your side.)
2. **Payments** — should I enable Lovable's built-in Stripe payments (recommended, no Stripe account needed) or skip payment integration for now and just build the UI scaffolding?
3. **Scope** — this is large. Do you want me to ship it in **one big pass**, or split into staged PRs (Phase 1+2 first, then 3, then 4–6)?
4. **Hero illustration** — OK to generate a custom roadside-assistance illustration for the auth desktop split-pane, or prefer pure gradient/abstract?
