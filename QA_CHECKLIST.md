# OMS QA Checklist

## Test setup

- [ ] Start the stack: `docker compose up -d --build`.
- [ ] Confirm the API readiness endpoint returns `200`: `http://localhost:3000/ready`.
- [ ] Open the web app: `http://localhost:3001/`.
- [ ] Run the automated validator from the repository root: `npm run validate:system`.
- [ ] Confirm the validator reports PASS for the admin, buyer, driver, order, status log, and notification outbox checks.

## Authentication and root redirect

- [ ] Open `/` in a private browser window.
- [ ] Confirm `/` redirects to `/login`.
- [ ] Enter the seeded admin email, or create one with `npm run db:seed`.
- [ ] Submit the magic-link form.
- [ ] Check the Next.js server/container logs for the printed magic-link URL.
- [ ] Open the link and confirm the session lands on the requested dashboard.
- [ ] Confirm refreshing the page preserves the authenticated session.
- [ ] Confirm signing out removes access to protected pages.

## Admin RBAC and order management

- [ ] While signed in as ADMIN, open `/admin` and confirm the overview metrics render.
- [ ] Open `/admin/buyers` and create a buyer with a unique email.
- [ ] Confirm the buyer appears in the seller's buyer table.
- [ ] Open `/admin/orders/new`.
- [ ] Create an order with an order reference, buyer, delivery address, and at least one item.
- [ ] Optionally assign a driver during creation.
- [ ] Confirm the order appears in `/admin/orders` with `READY FOR DISPATCH`.
- [ ] Confirm `/admin/deliveries` shows the delivery, buyer, status, and assignment.
- [ ] Reassign the delivery to another driver and confirm the change persists after refresh.
- [ ] Attempt to open `/buyer` and `/driver` while signed in as ADMIN; confirm middleware redirects to `/403`.

## Driver workflow and Server Actions

- [ ] Sign out as ADMIN.
- [ ] Sign in using the driver email through the magic-link flow.
- [ ] Open `/driver` and confirm only deliveries assigned to that driver are listed.
- [ ] Open a delivery and confirm the buyer name, contact phone, address, and items render.
- [ ] Click `Start Route (Out for Delivery)`.
- [ ] Confirm the status changes to `OUT FOR DELIVERY` after refresh.
- [ ] Confirm the driver cannot access another driver's delivery URL.
- [ ] Click `Mark Delivered`.
- [ ] Confirm the status changes to `DELIVERED`.
- [ ] Retry the same transition or refresh; confirm no duplicate status log or duplicate outbox record is created.
- [ ] Confirm a delivered delivery exposes the PoD upload control.
- [ ] Upload a permitted JPG, PNG, or PDF and confirm the upload completes.
- [ ] Try an oversized or unsupported file and confirm it is rejected before upload.

## Buyer isolation and order history

- [ ] Sign out as DRIVER.
- [ ] Sign in using the buyer email created by the admin.
- [ ] Open `/buyer` and confirm only that buyer's orders appear.
- [ ] Confirm another buyer's order does not appear in the list.
- [ ] Open `/buyer/orders/:orderId` for the buyer's order.
- [ ] Confirm the order reference, address, items, and timeline render without errors.
- [ ] Confirm the timeline shows `READY FOR DISPATCH`, `OUT FOR DELIVERY`, and `DELIVERED` in order.
- [ ] Confirm the delivered PoD viewer appears only when PoD has been finalized.
- [ ] Attempt to open another buyer's order ID directly; confirm the result is not exposed.
- [ ] Confirm `/admin` and `/driver` are blocked for the BUYER role.

## Notification outbox

- [ ] After the driver transitions to `OUT FOR DELIVERY`, inspect `notification_attempts` and confirm one `PENDING` record exists.
- [ ] After the driver transitions to `DELIVERED`, confirm a second logical notification record exists for that status.
- [ ] Run the notification worker with `npm run worker:notifications` or the configured worker process.
- [ ] Confirm successful attempts become `SENT` and store a provider message ID.
- [ ] Temporarily break SMTP configuration and confirm failures retry with increasing `nextAttemptAt` values.
- [ ] Confirm repeated worker processes do not claim the same leased record concurrently.
- [ ] Confirm attempts reach `DEAD_LETTER` after the configured retry limit.

## Responsive and accessibility checks

- [ ] Test admin pages at desktop width and confirm tables remain horizontally usable.
- [ ] Test buyer pages at a narrow mobile width and confirm cards, timeline, and PoD viewer fit without horizontal overflow.
- [ ] Test driver pages at a narrow mobile width with touch-sized status buttons.
- [ ] Navigate login and role dashboards with keyboard only.
- [ ] Confirm every form control has a visible label or accessible name.
- [ ] Confirm status badges are accompanied by readable status text, not color alone.
- [ ] Confirm loading skeletons appear during slow navigations.
- [ ] Trigger a route error and confirm the user sees a friendly retry state without a stack trace.
- [ ] Open an invalid order ID and confirm the friendly not-found state appears.

## Production readiness

- [ ] Run `npm run build` in `tracking-web`.
- [ ] Run `npm start` from `tracking-web` and confirm the standalone server starts cleanly.
- [ ] Verify production secrets are present: `AUTH_SECRET`, `DATABASE_URL`, OCI/S3 credentials, `EMAIL_SERVER`, and `EMAIL_FROM`.
- [ ] Confirm secrets and `.env.local` are not tracked by Git.
- [ ] Confirm `docker compose ps` shows PostgreSQL healthy, API healthy, and web running.
- [ ] Confirm `http://localhost:3000/ready` returns `200`.
- [ ] Confirm `http://localhost:3001/` redirects to `/login`.
- [ ] Record test evidence, failed cases, and the release decision before deployment.
