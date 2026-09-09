## Plan: Delivery Tracking Platform SRS

Produce a comprehensive, implementation-ready SRS, system architecture, and deployment plan for a B2B cosmetics superstockist delivery tracking and notification layer. The system will not own inventory, product, pricing, buyer master, or order-management data; the existing inventory system remains the source of truth and sends Ready for Dispatch events.

**Steps**
1. Establish scope, actors, assumptions, exclusions, and success criteria. Document the legacy inventory system, operations/admin users, drivers, buyers, notification providers, and tracking-link recipients. Explicitly identify open integration decisions: webhook schema/authentication, driver assignment source, buyer contact/consent source, WhatsApp Business vs Twilio, retention, and region/compliance requirements.
2. Define the target architecture and technology choices: API bridge in Node.js with TypeScript and Express, PostgreSQL with Prisma, Redis/queue worker, object storage for PoD media, React Native driver app, React/Next.js tracking page, and a provider adapter for WhatsApp Business/Twilio SMS. Include service boundaries, synchronous versus asynchronous flows, idempotency, retries, observability, and a text-based component/data-flow description.
3. Implement Sprint 1 foundation in the empty workspace: initialize a strict TypeScript Node.js project; add Express, Helmet, CORS, Zod, Prisma, dotenv, structured logging, and test tooling; create modular `src/config`, `src/middleware`, `src/controllers`, `src/routes`, `src/schemas`, `src/services`, and `src/lib` boundaries; add startup validation, health endpoint, not-found handling, and global error handling.
4. Implement the Sprint 1 PostgreSQL schema using Prisma and generate an initial migration. Include only `Drivers`, `Deliveries`, `Delivery_Status_Logs`, and `Webhook_Receipts` for this phase, with PostgreSQL-safe naming or mapped model names, enums for driver/delivery status, foreign keys, timestamps, indexes, and a unique payload hash for idempotency. Preserve the requested fields while adding only operationally necessary created/updated timestamps and receipt metadata needed to distinguish replayed, processed, and failed requests.
5. Implement the webhook contract and `POST /api/v1/webhooks/orders/dispatch`: validate the API key using constant-time comparison, validate the legacy payload with Zod, derive or accept a stable payload hash, and execute receipt creation plus delivery creation in one Prisma transaction. A duplicate hash must return a deterministic idempotent response without creating another delivery; concurrent duplicate requests must be protected by the database unique constraint and transaction handling. Return clear 2xx/4xx/409/5xx responses, avoid leaking secrets, and log correlation/request identifiers.
6. Add focused automated tests before broadening scope: valid ingestion creates one delivery and receipt; same payload replay creates no duplicate; concurrent replay remains single-write; malformed payload is rejected; missing/incorrect API key is rejected; database failure returns a safe error. Add a Prisma test/reset strategy that does not depend on production data.
7. Add local development assets: `Dockerfile`, `docker-compose.yml` with persistent PostgreSQL volume and API container, health checks, startup migration command, `.env.example`, `.gitignore`, README setup/run instructions, and scripts for development, build, migration, test, and production start. Keep secrets out of source control and make the API wait for database readiness.
8. Design the remaining tracking-only schema and broader API contract for later sprints. Include delivery status logs, assignments/manifests, tracking tokens, notification attempts, and PoD metadata in the architecture plan, but do not implement frontend/mobile/notification functionality in Sprint 1. Make future status updates transactional and notification work asynchronous.
9. Specify non-functional requirements: availability, latency, event delivery, consistency, security, privacy, auditability, accessibility, mobile resilience/offline behavior, rate limits, observability, backup/restore, disaster recovery, and PoD access controls. Define the secure tracking-link model using opaque expiring tokens and avoid exposing sequential IDs or unnecessary buyer data.
10. Define cloud-native deployment: Docker images, GitHub Actions CI/CD, infrastructure-as-code, managed PostgreSQL, secrets manager, queue/cache, object storage, WAF/load balancer, API and worker autoscaling, and frontend hosting. Recommend AWS as the reference topology (ECS/Fargate or EKS, RDS PostgreSQL, ElastiCache/SQS, S3, CloudFront, WAF, Secrets Manager, CloudWatch), with OCI equivalents and a lighter Render/Vercel option clearly separated by production criticality. Include environments, migrations, rollback, blue/green or rolling release, TLS, private networking, backups, alarms, and runbooks.
11. Create a four-sprint Agile roadmap with independently verifiable outcomes: Sprint 1 foundation and integration contracts, Sprint 2 driver workflow and tracking page, Sprint 3 notifications/reliability/security hardening, Sprint 4 UAT, operational readiness, pilot, and production launch. Identify dependencies, acceptance criteria, test strategy, and UAT participants/data.
12. Finish with risks, decisions needed before build, and a concise recommended MVP versus post-MVP boundary. Keep buyer-facing tracking read-only, ensure status authority belongs to the driver/operations workflow, and make outbound notifications asynchronous and retryable.

**Relevant files**
- Workspace is currently empty; no repository files or existing conventions were found.
- `/memories/session/plan.md` — persistent plan for drafting the architecture deliverable.

**Verification**
1. Check that every requested deliverable is present: stack, data flow, relational schema, REST contracts, deployment/DevOps strategy, and four-sprint plan.
2. Check scope boundaries: no inventory/product tables or replacement order-management behavior; legacy system is the source of truth for dispatch input.
3. Check that every external event and notification path has idempotency, authentication, retries, failure handling, and observability defined.
4. Check that PoD media, buyer tracking links, status transitions, data retention, and access control are specified.
5. Check deployment coverage across Docker, GitHub Actions, cloud hosting, managed data services, secrets, migrations, rollback, backup/DR, and monitoring.
6. Check sprint dependencies and UAT exit criteria against the API and architecture decisions.

**Decisions**
- Deliverable is documentation/architecture planning only; no application code is to be created in the empty workspace during this planning phase.
- PostgreSQL is the system of record for tracking entities; object storage is preferred for photo/signature binaries.
- Use an asynchronous queue/worker for notifications so driver status updates do not depend on provider latency.
- Use opaque, expiring tracking tokens and least-privilege roles; buyer app installation is out of scope.
- AWS is the primary reference deployment, with alternatives documented rather than mixed into the core design.
- Sprint 1 uses npm and an assumed webhook payload containing `orderRef`, `customerPhone`, `deliveryAddress`, `assignedDriverId`, and optional initial status until the legacy contract is supplied.

**Further Considerations**
1. Confirm whether the client requires WhatsApp templates and opt-in evidence. Recommendation: support WhatsApp through a provider adapter, retain SMS fallback, and block promotional content from this transactional service.
2. Confirm whether drivers need offline operation. Recommendation: MVP supports retry-safe queued updates in the mobile client with conflict rules; full route optimization and background GPS tracking are excluded.
3. Confirm retention, residency, and PoD legal requirements before production. Recommendation: define configurable retention and deletion workflows rather than hard-coding a jurisdiction-specific policy.
