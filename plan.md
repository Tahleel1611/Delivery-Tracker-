## Order Management System: Technical Specification and Implementation Plan

### 1. Product scope and ownership

The application becomes the operational system of record for B2B order workflow, assignment, delivery status, proof of delivery (PoD), and buyer communication. Sellers are tenant administrators (the current superstockists); buyers are their shop customers; drivers are delivery partners. Product catalog, price, tax, inventory, and accounting remain external integrations unless explicitly added later.

The API remains Node.js/Express with TypeScript, PostgreSQL/Prisma, and the existing worker boundary. The web experience moves from a tracking-only Next.js app to a role-aware Next.js App Router application. The React Native mobile app remains the driver client. S3-compatible object storage holds PoD binaries; PostgreSQL stores metadata and audit history.

### 2. Architecture and request flows

```text
Browser / Driver mobile app
				| HTTPS, Auth.js session or driver access token
Next.js App Router (role-aware UI and BFF actions)
				| server-to-server API calls
Express API -> Prisma -> PostgreSQL
				|                         |
				|                         +-- status logs, audit, notification outbox
				+-- object-storage signed uploads for PoD
Worker -> notification provider adapter (email; optional SMS/WhatsApp)
Legacy ERP/POS -> authenticated, idempotent dispatch webhook
```

All API requests carry a request ID. Controllers validate input with Zod, services own authorization and transactions, and repositories/Prisma own persistence. A status update and its `StatusLog` are one transaction. The notification worker consumes an outbox/attempt record after commit, so provider latency never blocks the driver response or rolls back the status change.

### 3. Authentication and RBAC

Use Auth.js (NextAuth.js) in the Next.js application with the Prisma adapter and Email provider. `signIn("email", { email, callbackUrl })` creates a single-use, expiring `VerificationToken`; the configured email transport sends the magic link. On callback, normalize and verify the email, reject disabled users, and create or update the unified `User`. Do not allow arbitrary self-registration: buyer invitations and seller/driver provisioning are admin-controlled.

Use JWT sessions for the browser. The `jwt` callback adds `user.id`, `user.role`, and `user.sellerId` to the token; the `session` callback exposes only those claims needed by the UI. Extend Auth.js types so `session.user.role` is the `Role` enum. Rotate/expire sessions, set secure HTTP-only cookies, and never trust a role supplied by the browser. The Express API validates the signed Auth.js token through a shared secret or a short-lived internal API token issued by the Next.js BFF. Driver mobile tokens remain a separate, short-lived access/refresh flow until the mobile app is migrated to Auth.js-compatible login.

Roles are enforced at both layers:

- `ADMIN`: manage buyers, drivers, orders, assignments, status overrides, and operational dashboards within their seller tenant.
- `BUYER`: read only their own orders/deliveries and notification history; no assignment, status mutation, or cross-buyer query.
- `DRIVER`: read only assigned deliveries/routes and mutate permitted delivery states; upload PoD for assigned deliveries only.

Every service query includes tenant and ownership predicates. A role check in middleware is necessary but not sufficient because object-level authorization must also be applied in the service transaction.

### 4. Target Prisma schema

This is the target model shape; existing `Driver`, `DriverCredential`, and custom `DriverSession` records should be migrated into `User` and retired after the mobile cutover.

```prisma
enum Role { ADMIN BUYER DRIVER }
enum UserStatus { ACTIVE INVITED DISABLED }
enum OrderStatus { DRAFT CONFIRMED READY_FOR_DISPATCH OUT_FOR_DELIVERY DELIVERED FAILED CANCELLED }
enum NotificationState { PENDING PROCESSING SENT FAILED DEAD_LETTER }

model User {
	id              String             @id @default(uuid()) @db.Uuid
	email           String             @unique @db.VarChar(320)
	name            String?            @db.VarChar(160)
	phone           String?            @db.VarChar(32)
	role            Role
	status          UserStatus         @default(INVITED)
	sellerId        String?            @map("seller_id") @db.Uuid
	seller          User?              @relation("SellerUsers", fields: [sellerId], references: [id], onDelete: SetNull)
	members         User[]             @relation("SellerUsers")
	sellerOrders    Order[]            @relation("SellerOrders")
	orders          Order[]            @relation("BuyerOrders")
	assigned        Delivery[]         @relation("DriverDeliveries")
	statusLogs      StatusLog[]
	accounts        Account[]
	sessions        Session[]
	createdAt       DateTime           @default(now()) @map("created_at")
	updatedAt       DateTime           @updatedAt @map("updated_at")
	@@index([sellerId, role, status])
}

model Order {
	id              String       @id @default(uuid()) @db.Uuid
	orderRef        String       @unique @map("order_ref") @db.VarChar(120)
	sellerId        String       @map("seller_id") @db.Uuid
	buyerId         String       @map("buyer_id") @db.Uuid
	status          OrderStatus  @default(DRAFT)
	deliveryAddress String       @map("delivery_address") @db.Text
	createdAt       DateTime     @default(now()) @map("created_at")
	updatedAt       DateTime     @updatedAt @map("updated_at")
	seller          User         @relation("SellerOrders", fields: [sellerId], references: [id])
	buyer           User         @relation("BuyerOrders", fields: [buyerId], references: [id])
	items           OrderItem[]
	delivery        Delivery?
	@@index([sellerId, status])
	@@index([buyerId, createdAt])
}

model OrderItem {
	id String @id @default(uuid()) @db.Uuid
	orderId String @map("order_id") @db.Uuid
	sku String @db.VarChar(120)
	description String @db.VarChar(240)
	quantity Int
	order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
	@@index([orderId])
}

model Delivery {
	id String @id @default(uuid()) @db.Uuid
	orderId String @unique @map("order_id") @db.Uuid
	driverId String? @map("driver_id") @db.Uuid
	status OrderStatus @default(READY_FOR_DISPATCH)
	podObjectKey String? @map("pod_object_key") @db.Text
	podUploadedAt DateTime? @map("pod_uploaded_at")
	order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
	driver User? @relation("DriverDeliveries", fields: [driverId], references: [id], onDelete: SetNull)
	statusLogs StatusLog[]
	notifications NotificationAttempt[]
	@@index([driverId, status])
	@@index([status, updatedAt])
	updatedAt DateTime @updatedAt @map("updated_at")
}

model StatusLog {
	id String @id @default(uuid()) @db.Uuid
	deliveryId String @map("delivery_id") @db.Uuid
	actorId String? @map("actor_id") @db.Uuid
	status OrderStatus
	note String? @db.Text
	lat Decimal? @db.Decimal(9, 6)
	lng Decimal? @db.Decimal(9, 6)
	createdAt DateTime @default(now()) @map("created_at")
	delivery Delivery @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
	actor User? @relation(fields: [actorId], references: [id], onDelete: SetNull)
	@@index([deliveryId, createdAt])
}

model Account {
	id String @id @default(cuid())
	userId String @map("user_id") @db.Uuid
	type String
	provider String
	providerAccountId String @map("provider_account_id")
	refresh_token String? @db.Text
	access_token String? @db.Text
	expires_at Int?
	token_type String?
	scope String?
	id_token String? @db.Text
	session_state String?
	user User @relation(fields: [userId], references: [id], onDelete: Cascade)
	@@unique([provider, providerAccountId])
}

model Session {
	sessionToken String @unique @map("session_token")
	userId String @map("user_id") @db.Uuid
	expires DateTime
	user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
	identifier String
	token String @unique
	expires DateTime
	@@unique([identifier, token])
}

model NotificationAttempt {
	id String @id @default(uuid()) @db.Uuid
	deliveryId String @map("delivery_id") @db.Uuid
	status OrderStatus
	state NotificationState @default(PENDING)
	attemptCount Int @default(0) @map("attempt_count")
	idempotencyKey String @unique @map("idempotency_key")
	lastError String? @map("last_error") @db.Text
	nextAttemptAt DateTime @default(now()) @map("next_attempt_at")
	sentAt DateTime? @map("sent_at")
	delivery Delivery @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
	@@unique([deliveryId, status])
	@@index([state, nextAttemptAt])
}
```

For Prisma relation clarity, add the inverse `seller` relation on `Order` as a named relation if the generated client reports ambiguity; the migration should be generated and reviewed rather than applied blindly. Keep `WebhookReceipt` and `TrackingToken` from the current schema, adding `sellerId`, event IDs, and expiry/indexes as required.

### 5. Next.js App Router and middleware

```text
tracking-web/app/
	(auth)/login/page.tsx
	(auth)/verify/page.tsx
	admin/layout.tsx
	admin/page.tsx
	admin/buyers/page.tsx
	admin/orders/page.tsx
	admin/orders/new/page.tsx
	admin/deliveries/page.tsx
	admin/drivers/page.tsx
	buyer/layout.tsx
	buyer/page.tsx
	buyer/orders/page.tsx
	buyer/orders/[orderId]/page.tsx
	driver/layout.tsx
	driver/page.tsx
	driver/routes/[date]/page.tsx
	driver/deliveries/[deliveryId]/page.tsx
	api/auth/[...nextauth]/route.ts
	api/orders/route.ts
	api/deliveries/[deliveryId]/status/route.ts
	api/deliveries/[deliveryId]/pod/route.ts
	lib/auth.ts
	lib/authorization.ts
middleware.ts
```

`middleware.ts` calls `auth()` and redirects unauthenticated users to `/login`. It maps `/admin/*`, `/buyer/*`, and `/driver/*` to the corresponding role and returns a redirect or `403` for mismatches. Layouts repeat the check for defense in depth. Route handlers and Express middleware enforce the same policy from the signed session claims; never rely on pathname checks alone. Public tracking links remain a separate, read-only token route and are not a substitute for buyer authentication.

### 6. Orders, statuses, PoD, and notifications

Admin order creation supports one or many `OrderItem` rows, validates the buyer belongs to the seller, and optionally assigns a driver. Driver status transitions are an explicit state machine: `READY_FOR_DISPATCH -> OUT_FOR_DELIVERY -> DELIVERED`, with `FAILED` and `CANCELLED` controlled by permitted actors. Each accepted transition writes the delivery, status log, and one idempotent notification attempt in one transaction. Retries use a client idempotency key and reject stale state versions.

PoD uses a signed upload URL issued only after driver ownership is checked. The API validates MIME type, size, checksum, and malware-scan result; only the private object key is persisted. Buyers do not receive the raw object URL by default. A separate, expiring signed read URL can be issued under policy.

After commit, a worker claims pending `NotificationAttempt` rows with a lease, sends a templated transactional email to the buyer, records provider message ID/result, and retries exponential backoff. Permanent failures move to `DEAD_LETTER` and alert operations. Provider adapters isolate SMTP/SES and future WhatsApp/SMS choices. The status API returns before dispatch; an outbox poller or queue publish must be observable and idempotent.

### 7. API boundaries

Core contracts are `POST /api/v1/orders`, `GET /api/v1/orders`, `POST /api/v1/orders/:id/assign`, `GET /api/v1/drivers/me/routes`, `PATCH /api/v1/deliveries/:id/status`, `POST /api/v1/deliveries/:id/pod/upload-url`, and `GET /api/v1/buyer/orders/:id`. The existing authenticated dispatch webhook remains `POST /api/v1/webhooks/orders/dispatch` during migration. All mutating endpoints require authentication, role plus ownership authorization, schema validation, request IDs, and idempotency keys where retries are possible.

### 8. Four-phase delivery roadmap

**Phase 1, foundation and identity:** finalize tenant/integration decisions, migrate Prisma schema, seed seller/admin, implement Auth.js Email provider and JWT typing, add RBAC middleware, and introduce compatibility mapping for existing driver sessions. Acceptance: invited users can sign in, roles are present in JWT/session, cross-tenant and cross-role requests are denied, and migrations roll forward/back in a test database.

**Phase 2, OMS and driver workflow:** implement buyer CRUD/invitations, single and bulk order creation, assignment, route views, transactional status state machine, PoD signed uploads, and buyer order history. Acceptance: an admin creates and assigns an order; the assigned driver can complete it with PoD; buyer sees only their own order and its full status history.

**Phase 3, notifications and reliability:** add outbox/worker processing, email templates, retries/dead letters, webhook idempotency, rate limits, audit logs, observability, and offline-safe mobile retry behavior. Acceptance: a status transition returns without provider dependency, exactly one logical email is sent per status, replayed updates do not duplicate state or mail, and failures are visible and recoverable.

**Phase 4, dashboards and launch:** build admin delivery/order dashboards, buyer polish, driver route usability, accessibility and security testing, load testing, backup/restore rehearsal, UAT, pilot rollout, runbooks, and production cutover. Exit requires signed UAT from a seller, buyer, and driver, zero critical security defects, verified rollback, and agreed notification deliverability metrics.

### 9. Security, operations, and decisions

Use tenant-scoped queries, least privilege, secure cookies, TLS, CSRF protection for browser mutations, rate limiting on email and auth endpoints, constant-time webhook key comparison, encrypted secrets, and structured audit events. Do not log OTPs, tokens, PoD contents, or full addresses unnecessarily. Retain status/audit data and PoD according to a configurable legal policy; provide deletion/anonymization workflows. Monitor API latency/error rate, auth failures, queue age, dead letters, provider failures, upload failures, and database capacity. Back up PostgreSQL, test restores, and use private networking plus a WAF in production.

Reference deployment: Next.js on Vercel or ECS, Express API and worker on ECS/Fargate, RDS PostgreSQL, SQS/Redis for work dispatch, S3 for PoD, CloudFront/WAF, Secrets Manager, and CloudWatch. OCI equivalents are Object Storage, Autonomous/PostgreSQL service, Queue, Vault, Load Balancer, and Logging. GitHub Actions runs typecheck, Prisma validation, tests, image scan, migration checks, and deploys with expand/migrate/contract ordering and rolling or blue/green rollback.

Decisions required before implementation: seller tenancy boundaries, buyer invitation and email consent rules, authoritative order-number/ERP contract, driver mobile authentication cutover, email provider and sender domain, status transition policy for failed deliveries, PoD retention/residency, and whether buyers may see PoD. MVP excludes route optimization, inventory accounting, promotional messaging, and background GPS tracking.

### Verification checklist

- Unified `User`/`Role`, Auth.js Email provider, JWT claims, and route/API RBAC are specified.
- Orders, deliveries, status logs, notification attempts, PoD metadata, and Auth.js tables are relationally mapped.
- Status updates are transactional; notification delivery is asynchronous, retryable, idempotent, and observable.
- Four phases have outcomes, acceptance criteria, and migration dependencies.
- Security, tenant isolation, retention, backups, deployment, rollback, and UAT exit conditions are explicit.
