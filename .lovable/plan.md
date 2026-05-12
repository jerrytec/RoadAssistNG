# Roadmap: Marketplace + Workflow Audit

This is a large body of work. I'll enable Lovable Cloud first, then ship in 4 milestones so you can review each one before the next.

## Milestone 0 — Enable Lovable Cloud (foundation)
- Provision Postgres, Auth, Storage, Edge Functions.
- Replace the current localStorage-only auth screen with real email/password + Google sign-in (defaults).
- Add a `profiles` table (full_name, role, phone, avatar_url) auto-created on signup via trigger.
- Add a `user_roles` table (`buyer`, `vendor`, `tow_operator`, `vulcanizer`, `mechanic`, `admin`) with `has_role()` security-definer function.

## Milestone 1 — Spare Parts marketplace (buyer side)
**New tab:** "Parts" added between Mechanic and Support.

Tables:
- `parts_categories` (battery, tyres, brakes, filters, lights, fluids, body, engine, electrical, accessories)
- `parts` — vendor_id, category_id, title, brand, description, price_kobo, stock, condition (new/refurb/used), compatibility (text[]), images (storage paths), status (draft/active/out_of_stock), created_at
- `parts_carts` (one per user) and `parts_cart_items` (cart_id, part_id, qty)
- `parts_orders` + `parts_order_items` — captures snapshot price & vendor at checkout, status (pending_payment/paid/packed/shipped/delivered/cancelled), delivery_address_id, escrow_status

Storage bucket: `parts-images` (public read, vendor-only write).

Pages/components:
- `PartsBrowseScreen` — categories grid, search bar, filter chips (brand, condition, price range), product grid.
- `/parts/:id` — `PartDetailPage` with image carousel, vendor card, stock, qty selector, "Add to cart" + "Buy now".
- `/cart` — `CartPage` with line items, qty controls, vendor grouping, totals.
- `/checkout` — `CheckoutPage` with delivery address (reuses GPS or manual), payment via existing escrow flow (`WorkflowModal` pattern: hold → ship → confirm receipt → release).
- `/orders` — `MyOrdersPage` with status timeline per order.

## Milestone 2 — Vendor portal
- Vendor signup path on the Auth screen ("I sell spare parts") creating `vendor` role + `vendors` table (business_name, address, phone, BVN, verification_status, payout_account).
- `/vendor` dashboard route, gated by `has_role('vendor')`:
  - Stats (active listings, pending orders, revenue this week)
  - "My parts" CRUD with image upload (drag-drop multi-image), stock & price editing, draft/publish toggle.
  - "Orders" inbox: accept → mark packed → mark shipped (with tracking note) → see "delivered & released".
  - "Payouts" log (read-only ledger).

## Milestone 3 — Missing pages (promote modals to routes)
- `/booking/:id/receipt` — `ReceiptPage` (printable, shareable URL).
- `/booking/:id/track` — `LiveTrackingPage` (map placeholder + phase timeline + chat link).
- `/booking/:id/payment` — `PaymentStatusPage` (escrow state, transaction ref, dispute CTA).
- `/profile` — name, phone, avatar upload, saved addresses, vehicle profile.
- `/settings` — notifications, theme, sign out, delete account.
- `/support` — promote the current panel to a real page with ticket history (table `support_tickets`).

History "View details" / "Receipt" / "Track live" / "Payment" buttons all link to these new routes (deep-linkable).

## Milestone 4 — Dead-button audit pass
Inventory and wire up across:
- `AppHeader` (notifications panel → mark-as-read writes to DB; bell badge from query).
- `NeedHelpScreen` SOS button → creates an emergency `sos_alerts` row + broadcasts to nearby providers.
- Filter chips already work; add empty-state CTAs.
- `ProviderCard` rating → opens reviews dialog.
- `MechanicScreen` fault chips → pre-fill booking description.
- `BookingHistoryScreen` "Try again" / "Contact provider" → real chat thread.
- `ContactSupportPanel` "WhatsApp / Call / Email" → real `tel:`/`mailto:`/`https://wa.me` with validated numbers + ticket creation.
- `WorkflowModal` "Raise a dispute" → creates `disputes` row, support ticket, freezes escrow.
- All toasts replaced with real success/error states tied to mutations (loading spinners, retry on failure).

## Technical notes
- React Query for all data fetching; mutations show loading + toast + invalidate.
- All tables use RLS; helper `has_role()` for authorization.
- Escrow stays simulated for parts in M1 (status transitions only); real payment provider can be enabled later — call `recommend_payment_provider` before that step.
- Routes added to `App.tsx`; SPA fallback already handled by Lovable hosting.
- Mobile-first; existing Tailwind tokens reused (no new colors).

## What I'll do right after you approve
1. Enable Lovable Cloud.
2. Run migrations for profiles, user_roles, parts catalog, carts, orders, storage bucket.
3. Ship Milestone 1 (buyer-side marketplace) end-to-end.
4. Pause for your review, then continue with M2 → M3 → M4.

## Out of scope for now (call out)
- Real payment processor (kept simulated; we can enable Stripe Payments later).
- Real GPS / live driver tracking (UI + status timeline only; no Mapbox yet).
- Push notifications / SMS (in-app + email only).
