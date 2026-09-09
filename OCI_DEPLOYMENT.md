# OCI Production Deployment

This deployment keeps PostgreSQL, the Express API, the Next.js tracking site, and PoD object storage separate. The API remains the system of record for tracking state; the existing inventory system remains the source of truth for dispatch data.

## OCI resources

Create these resources in one OCI region and VCN:

1. **OCI Database with PostgreSQL** in a private subnet. Permit inbound PostgreSQL traffic only from the API container subnet/security list. Store the private connection string in OCI Vault or the deployment secret store.
2. **OCI Object Storage bucket** for PoD images. Keep the bucket private and use a pre-authenticated request or CDN/private delivery strategy if buyers must view PoD media later. Create an OCI Customer Secret Key for the S3-compatible API and never commit it.
3. **Container Instances** for the API and tracking web for the smallest managed deployment, or **OKE** deployments/services for autoscaling and rolling releases. Build and push the API and `tracking-web/Dockerfile` images to OCI Container Registry.
4. **OCI Load Balancer** with HTTPS termination. Route `/api/*` to the API container on port 3000 and all buyer web traffic to Next.js on port 3001. Redirect HTTP to HTTPS and restrict the API origin with CORS.

## API configuration

Set these as runtime secrets/environment variables, not Docker build arguments:

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
LEGACY_WEBHOOK_API_KEY=<vault-secret>
CORS_ORIGIN=https://tracking.example.com
TRACKING_WEB_BASE_URL=https://tracking.example.com
TRACKING_TOKEN_TTL_DAYS=30
OCI_S3_ENDPOINT=https://<namespace>.compat.objectstorage.<region>.oraclecloud.com
OCI_S3_REGION=<region>
OCI_S3_NAMESPACE=<namespace>
OCI_S3_BUCKET=<private-pod-bucket>
OCI_S3_ACCESS_KEY=<customer-secret-key-id>
OCI_S3_SECRET_KEY=<customer-secret-key>
OCI_S3_PUBLIC_BASE_URL=https://<cdn-or-approved-object-host>
POD_MAX_FILE_SIZE_BYTES=5242880
```

The OCI S3 endpoint and credentials are used by `@aws-sdk/client-s3`; OCI Object Storage supports this S3-compatible request style. Prefer a private bucket and a signed delivery mechanism before exposing PoD media publicly.

## Build and release

Use GitHub Actions with OCI authentication via short-lived federated credentials or a narrowly scoped repository secret:

```text
checkout -> npm ci -> npm test -> npm run build
         -> npm --prefix tracking-web ci
         -> npm --prefix tracking-web run build
         -> docker build/push API image
         -> docker build/push tracking-web image
         -> deploy image digests to Container Instances or OKE
```

The API image runs `prisma migrate deploy` before starting. For OKE, run migrations as a one-shot deployment job using the same image before shifting traffic. Take a PostgreSQL backup before migration and use rolling or blue/green deployment so the previous image can be restored if health checks fail.

## Network and operations

- Put the database and containers in private subnets where possible; expose only the load balancer.
- Allow the legacy inventory system's fixed egress IPs to reach the webhook listener, or place an API gateway/WAF in front of it.
- Configure load-balancer health checks against `GET /health` and alert on 5xx rate, latency, database connection failures, migration failures, container restarts, and Object Storage upload errors.
- Use OCI Logging and Monitoring with request IDs from the API responses. Never log API keys, PoD bytes, customer phone numbers, or tracking tokens.
- Enable automated PostgreSQL backups, test point-in-time restore, and document recovery point and recovery time objectives with the client.
- Rotate the webhook key and OCI customer secret keys. Use least-privilege policies limited to the PoD bucket and object operations required by the API.
- Keep tracking tokens opaque and expiring. Do not expose order references as authorization credentials.

## Local production-image check

From the repository root:

```powershell
docker compose up --build
```

The API is available at `http://localhost:3000`, and the standalone tracking web container is available at `http://localhost:3001`. Local PoD uploads remain disabled until the OCI variables are supplied.
