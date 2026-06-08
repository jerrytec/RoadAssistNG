# Compliance Levy & Deduction System

Add a backend-enforced fee deduction that runs on every completed service payment, routes funds into a compliance ledger + wallet, surfaces the breakdown to providers, and gives admins reporting and remittance controls.

## 1. Database (single migration)

**`compliance_config`** (singleton row, admin-editable)
- `fee_percentage` numeric (0.01–0.05, default 0.03)
- `fee_label` text (default `"State Digital Service Levy"`)
- `platform_service_fee_percentage` numeric (default 0.05 services / parts handled separately)
- `min_fee`, `max_fee` numeric
- `updated_by`, `updated_at`

**`compliance_ledger`** — one row per completed transaction
- `transaction_id` (FK request/order), `transaction_kind` ('service' | 'parts')
- `provider_id`, `buyer_id`
- `gross_amount_kobo`, `platform_fee_kobo`, `compliance_fee_kobo`, `net_payout_kobo`
- `fee_percentage_applied`, `fee_label`
- `remittance_status` ('pending' | 'processing' | 'completed')
- `remittance_batch_id` (nullable)
- `created_at`

**`compliance_remittance_batches`**
- `id`, `total_amount_kobo`, `entry_count`, `status`, `notes`, `processed_at`, `created_at`

**`compliance_wallet`** — singleton view/row
- Derived: `total_collected`, `pending_remittance`, `processing`, `completed_to_date`

All tables: GRANTs, RLS. Ledger/wallet/config readable only by admins (`has_role` super_admin/finance/compliance). Service role writes.

## 2. Edge function: `apply-compliance-fee`

Triggered on payment confirmation (called from `ServicePayment` after mark-paid, and reusable for parts orders / future webhook routes from Paystack/Flutterwave/Monnify).

Logic (server-side only — no client can bypass):
1. Load transaction; reject if already in `compliance_ledger`.
2. Load `compliance_config`.
3. Compute: `compliance_fee = clamp(gross * fee_percentage, gross*min, gross*max)`, `platform_fee = gross * platform_pct`, `net_payout = gross - platform_fee - compliance_fee`.
4. Insert ledger row (`remittance_status='pending'`), update request/order with payout breakdown columns.
5. Return breakdown.

A second function `compliance-remittance` handles admin actions: create batch (move pending → processing), mark batch completed, export CSV.

## 3. Wire deduction into payment flow

- `ServicePayment.tsx`: after the existing `update({ payment_status: 'paid' })`, invoke `apply-compliance-fee`. Show breakdown in success toast.
- `Checkout.tsx` (parts): same hook after order paid.
- Add `payout_breakdown` columns (`platform_fee_kobo`, `compliance_fee_kobo`, `net_payout_kobo`, `fee_label`) on `service_requests` and `parts_orders` so they render without joins.

## 4. Provider transparency

- `ProviderDashboard.tsx` / `ProviderJobsBoard.tsx`: for each completed job show Gross / Platform fee / `{fee_label}` / Net payout pulled from the request row.
- `RequestTracking.tsx`: once paid, render the same 4-line breakdown to the customer.

## 5. Admin

New page **`/admin/compliance`** (linked from `AdminLayout`, gated by `finance` or `super_admin`):
- KPI cards: total collected, pending remittance, processing, completed.
- Config editor (percentage slider 1–5%, label dropdown with 3 presets + custom).
- Ledger table with filters: date range, service type, state/region.
- Charts/totals: daily / weekly / monthly aggregates, by service type, by region.
- Buttons: **Create remittance batch** (moves all pending → processing), **Mark batch completed**, **Export CSV**, **Export PDF**.

## 6. Files

**New**
- `supabase/migrations/<ts>_compliance_levy.sql`
- `supabase/functions/apply-compliance-fee/index.ts`
- `supabase/functions/compliance-remittance/index.ts`
- `src/pages/admin/AdminCompliance.tsx`
- `src/hooks/useComplianceConfig.ts`
- `src/lib/compliance.ts` (client helper to call edge fn + format breakdown)
- `src/components/PayoutBreakdown.tsx` (shared 4-line breakdown component)

**Edited**
- `src/App.tsx` (route)
- `src/pages/admin/AdminLayout.tsx` (nav link)
- `src/pages/ServicePayment.tsx`, `src/pages/Checkout.tsx` (invoke edge fn)
- `src/pages/RequestTracking.tsx` (breakdown for customer)
- `src/components/screens/ProviderDashboard.tsx`, `src/components/screens/ProviderJobsBoard.tsx` (provider view)

## Technical notes

- All amounts stored in **kobo** (integer) — matches existing convention.
- Fee label is never `"tax"`; UI uses `config.fee_label` everywhere.
- Min/max clamp uses **percentage of gross**, not flat values, matching `min_fee`/`max_fee` semantics (0.01–0.05).
- Idempotency: unique index on `(transaction_id, transaction_kind)` in ledger.
- Config changes log via `updated_by` for audit; runtime change only requires a row update — no redeploy.
- CSV export generated client-side from filtered ledger; PDF via `window.print()` of a print-styled report view (keeps deps small).

Ready to implement on approval.
