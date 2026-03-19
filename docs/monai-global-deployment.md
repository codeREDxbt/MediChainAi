# MONAI Global Deployment Runbook (UI-Safe)

This runbook deploys MONAI remotely for global usage while keeping existing frontend routes and UI behavior unchanged.

## Objectives

- Keep existing UI flows intact.
- Run MONAI on a remote VM, not local machine.
- Protect free-tier resources with quotas/rate limits.
- Avoid exposing MONAI inference endpoint publicly.

## Current UI Contracts To Preserve

- Upload flow calls `POST /api/scans/upload`.
- Results page calls `POST /api/scans/{id}/analyze`.
- Existing status values rendered by UI: `Pending Review`, `Processing`, `Analyzed`.
- Scan image retrieval path remains `/api/scans/{id}/image`.

Do not rename these routes during backend migration.

## Remote Topology

1. Next.js app (global host, e.g. Vercel) handles user auth and API endpoints.
2. MONAI service runs on Oracle Cloud Always Free VM using Docker.
3. Next.js server routes call MONAI service over private/protected channel.
4. Browser never calls MONAI directly.

## Oracle VM Setup

```bash
# Ubuntu VM
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Re-login after `usermod`.

## Deploy MONAI Service

```bash
git clone <your-repo-url> medichainai
cd medichainai/monai-service
docker build -t medichain-monai:latest .
```

Create runtime env:

```bash
cat > .env << 'EOF'
PORT=8000
RELOAD=false
MONAI_PRELOAD_MODEL=true
NEXTJS_ORIGIN=https://your-site.example
MONAI_SHARED_SECRET=replace-with-long-random-secret
EOF
```

Run container:

```bash
docker run -d \
  --name medichain-monai \
  --restart unless-stopped \
  -p 127.0.0.1:8000:8000 \
  --env-file .env \
  -v monai_model_cache:/app/.model_cache \
  medichain-monai:latest
```

## Reverse Proxy (Nginx)

Use Nginx with TLS in front of MONAI. Allow only backend origin calls where possible.

Recommended:
- Keep `/analyze` blocked from public internet (IP allowlist or private networking).
- Keep `/health` optionally public if sanitized.

## Backend Environment Variables

Set in Next.js deployment:

- `MONAI_SERVICE_URL=https://monai.yourdomain.example`
- `MONAI_SHARED_SECRET=<same-secret-as-vm>`
- `SUPABASE_SERVICE_ROLE_KEY=<required in production>`
- `JWT_SECRET=<required in production>`

The Next.js backend sends `x-monai-shared-secret` to `POST /analyze`.
When `MONAI_SHARED_SECRET` is configured in the MONAI container, requests without a matching header are rejected.

## Required Hardening Already Started

- Server routes now use `supabaseServer` for DB calls.
- Open RLS policies replaced with owner-scoped policies.
- Rate limits added on upload and analysis trigger routes.
- Upload size/type checks added in upload route.

## Next Migration (Async Worker)

Current analysis routes still perform synchronous work. For higher reliability:

1. Create `analysis_jobs` table.
2. `POST /api/scans/{id}/analyze` enqueues job and returns accepted state.
3. Worker on VM pulls job, executes MONAI, writes `analysis_results`.
4. UI polls existing scan endpoints and keeps status rendering unchanged.

## Suggested Free-Tier Quotas

- 10 analyses/hour per user
- 20 analyses/hour per IP
- 30 uploads/hour per IP
- Max upload size: 50 MB

Adjust once latency metrics are collected.

## Verification Checklist

1. Upload still works from patient upload page.
2. Results page still transitions to analyzed state using existing status values.
3. `GET /api/ai/health` shows MONAI online.
4. Unauthorized direct calls to MONAI `/analyze` fail.
5. Cross-user data reads are denied under RLS.

## Rollback Plan

If deployment fails:

1. Keep existing UI and routes unchanged.
2. Set `MONAI_SERVICE_URL` to previous endpoint.
3. Revert only backend env/config, not frontend pages.
4. Re-run health checks and route smoke tests.
