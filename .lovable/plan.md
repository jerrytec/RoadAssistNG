# Plan — Go-live milestone

## 1. Database (single migration)
- `service_requests` (buyer creates job for tow/vulcanizer/mechanic; columns: buyer_id, service_type, vehicle, description, location, price_estimate_kobo, status [`pending`,`offered`,`accepted`,`enroute`,`arrived`,`in_progress`,`completed`,`cancelled`], assigned_provider_id, accepted_at, completed_at).
- `service_offers` (request_id, provider_id, price_kobo, eta_minutes, message, status [`pending`,`accepted`,`declined`,`withdrawn`]).
- `provider_availability` (user_id, is_online, weekly_schedule jsonb, service_radius_km, base_location, updated_at).
- `chat_messages` (thread_type [`request`|`order`], thread_id, sender_id, body, created_at).
- `notifications` (user_id, kind, title, body, link, read_at).
- `vendor_onboarding` (user_id, step, payload jsonb, completed bool) — track wizard progress for all provider roles.
- RLS: buyers see their requests + offers on them; providers see open requests matching their role + their offers + assigned jobs; chat visible to thread participants; notifications private; availability private to owner.
- Realtime: enable for `service_requests`, `service_offers`, `chat_messages`, `notifications`, `parts_orders`, `parts_order_items`.

## 2. Hooks & libs (`src/hooks`)
- `useServiceRequests` — CRUD + realtime list.
- `useProviderJobs(role)` — open requests + my offers + active jobs.
- `useAvailability` — get/update online toggle + weekly schedule.
- `useChat(threadType, threadId)` — load + send + subscribe.
- `useNotifications` — list + markRead + realtime.
- `useOnboarding` — read/update vendor_onboarding.

## 3. Role routing
- `src/lib/roleRoutes.ts` — `primaryRoleHome(roles)` returning `/vendor`, `/provider`, or `/`.
- `RequireRole` wrapper for protected routes.
- After login, route to onboarding if incomplete, else role home.

## 4. Buyer side
- `NeedHelpScreen` / Service lists: "Request now" creates `service_requests` row instead of the local mock; opens `RequestTrackingScreen` showing live offers, accept offer → status flow → chat → complete + rate.
- New page `/requests/:id` with status timeline, map placeholder, chat drawer.

## 5. Provider side
- New `/provider` route with `ProviderDashboard` (already exists) wired to real data:
  - Online toggle → updates `provider_availability.is_online`.
  - Incoming requests list (filtered by role + radius) — Accept opens quote modal → creates offer; Decline hides.
  - Active job card → status advance buttons (`enroute`→`arrived`→`in_progress`→`completed`) + Chat button.
- `AvailabilityScreen` (weekly schedule editor).

## 6. Vendor / technician onboarding wizard
- `OnboardingWizard` component with role-specific steps:
  - Vendor (parts): Business info → Payout account → KYC (NIN/BVN) → First listing → Done.
  - Tow/Vulcanizer/Mechanic: Profile → Documents (NIN, licence) → Service area → Pricing baseline → Availability → Done.
- Stored in `vendor_onboarding`; portal blocks core actions until completed (soft-block with banner).

## 7. Realtime order & chat updates
- VendorPortal Orders inbox subscribes to `parts_order_items` changes.
- Buyer `MyOrders` subscribes to status changes; toast on update.
- Per order/request chat thread accessible from both sides.

## 8. Notifications
- DB triggers insert notifications on: new offer, offer accepted, status change, new chat message, new order, order status change.
- `NotificationsPanel` rewired to real data + realtime; bell unread count from query.

## 9. Wire dead buttons
- Header sign-out, cart, notifications: ✓ exists.
- TabBar Support → opens panel ✓.
- WorkflowModal "Confirm" now creates a real `service_request`.
- Booking history "Use again" prefills new request.
- All "Track", "Chat", "Cancel", "Rate" buttons connected.

## 10. Go-live polish
- 404 page, loading skeletons, empty states.
- Error boundary.
- SEO: title/meta/H1 on Index + key pages.
- Sign-out clears `portal-redirected`.
- Toast feedback on every mutation.

## Scope note
This is large — I'll ship it in one pass focused on the spine (DB + hooks + buyer request flow + provider dashboard wired + onboarding gate + realtime notifications + chat). Cosmetic polish on every existing screen will be done where it intersects these flows.

Ready to proceed?
