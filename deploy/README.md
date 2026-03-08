# BitCorp ERP — Production Deployment (WSL2)

## Architecture

```
GitHub Release → CI (test + build APK) → Webhook → WSL2 deploy.sh
                                                      ↓
                                              pg_dump → git checkout tag → docker compose rebuild → alembic migrate → health check
                                                      ↓
                                              Cloudflare Tunnel → bitcorp.mohammadasjad.com
```

## Branch Strategy

```
feature/xyz  →  develop  →  main  →  GitHub Release (triggers deploy)
```

- Feature branches merge into `develop` (CI runs automatically on push)
- Merge `develop` → `main` via PR (CI runs again as gate)
- Create a **GitHub Release** (e.g. `v1.2.0`) from main — triggers the production deploy

CI workflow is wired to:

- Run on every **push to `develop`**
- Run on every **PR targeting `develop` or `main`**

---

## Prerequisites (WSL2)

```bash
# Install Docker Engine in WSL2 (Ubuntu)
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect

# Verify
docker --version
docker compose version
```

---

## Initial Setup

### 1. Clone and configure

```bash
cd ~
git clone <repo-url> bitcorp-erp
cd bitcorp-erp
git checkout main
```

### 2. Create `.env.prod`

```bash
cd ~/bitcorp-erp/deploy
cp .env.prod.example .env.prod
nano .env.prod
```

Fill in every value — see the [Secret Sources table](#secret-sources) below.

### 3. Install webhook listener (systemd)

```bash
# Copy systemd service (replace USERNAME with your WSL user)
sudo cp ~/bitcorp-erp/deploy/bitcorp-webhook.service /etc/systemd/system/bitcorp-webhook@.service
sudo systemctl daemon-reload
sudo systemctl enable bitcorp-webhook@$USER
sudo systemctl start bitcorp-webhook@$USER

# Verify
sudo systemctl status bitcorp-webhook@$USER
curl http://localhost:9000/deploy-webhook
# Expected: "Webhook listener active"
```

### 4. Configure Cloudflare Tunnel

In the [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com) → Networks → Tunnels → your tunnel → Public Hostnames, add:

| Hostname                    | Path              | Service               |
| --------------------------- | ----------------- | --------------------- |
| `bitcorp.mohammadasjad.com` | `/`               | `http://frontend:80`  |
| `bitcorp.mohammadasjad.com` | `/api/*`          | `http://backend:3400` |
| `bitcorp.mohammadasjad.com` | `/deploy-webhook` | `http://webhook:9000` |
| `bitcorp.mohammadasjad.com` | `/pgadmin/*`      | `http://pgadmin:80`   |

### 5. Build and start production services

```bash
cd ~/bitcorp-erp

# Build production images
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod build

# Start all services (detached)
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d

# Run DB migrations (first time and after each deploy)
docker compose -f deploy/docker-compose.prod.yml exec backend alembic upgrade head

# Check logs
docker compose -f deploy/docker-compose.prod.yml logs -f backend
docker compose -f deploy/docker-compose.prod.yml logs -f frontend
```

---

## GitHub Secrets to Configure

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret name      | What it is                                            |
| ---------------- | ----------------------------------------------------- |
| `WEBHOOK_SECRET` | HMAC key — must match `WEBHOOK_SECRET` in `.env.prod` |

Generate the value:

```bash
openssl rand -hex 32
```

Use the **same value** in both GitHub Secrets and `deploy/.env.prod`.

---

## Secret Sources

| Variable                  | Where to get it                                                                  |
| ------------------------- | -------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`       | `openssl rand -base64 24`                                                        |
| `REDIS_PASSWORD`          | `openssl rand -base64 24`                                                        |
| `JWT_SECRET`              | `openssl rand -hex 32`                                                           |
| `JWT_REFRESH_SECRET`      | `openssl rand -hex 32` (different from `JWT_SECRET`)                             |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare Zero Trust → Networks → Tunnels → your tunnel → Configure → token     |
| `DECOLECTA_API_TOKEN`     | Your Decolecta account dashboard / API settings                                  |
| `WEBHOOK_SECRET`          | `openssl rand -hex 32` — same value in GitHub Secrets **and** `deploy/.env.prod` |

---

## End-to-End Deployment Flow

```
Developer push to feature branch
        ↓
PR to develop → CI runs (lint + tests)
        ↓
Merge to develop (CI runs on push)
        ↓
PR to main → CI runs again as final gate
        ↓
Merge to main
        ↓
Create GitHub Release (v1.x.x)
        ↓
release.yml triggers:
  - Run tests
  - Build Flutter APK → upload to release
  - POST to /deploy-webhook on server
        ↓
Server: verify HMAC → git checkout tag → rebuild → alembic migrate → health check
        ↓
Site live at https://bitcorp.mohammadasjad.com
```

---

## Rollback

The `deploy.sh` script automatically rolls back on health check failure.
To manually rollback to a previous tag:

```bash
~/bitcorp-erp/deploy/deploy.sh rollback v1.2.0
```

---

## Operations

```bash
# Check webhook listener status
sudo systemctl status bitcorp-webhook@$USER

# View deploy logs
ls ~/bitcorp-erp/deploy/logs/
tail -f ~/bitcorp-erp/deploy/logs/deploy_*.log

# View webhook journal logs
sudo journalctl -u bitcorp-webhook@$USER -f

# Manual deploy (without GitHub Release)
~/bitcorp-erp/deploy/deploy.sh deploy v1.3.0
```

---

## NAS Backup Sync (Optional)

DB backups are stored locally in `deploy/backups/`. To sync them to the Synology NAS:

### One-time: trust the NAS host key

```bash
ssh-keyscan -p 2230 192.168.0.13 >> ~/.ssh/known_hosts
```

### Set env vars in `deploy/.env.prod`

```env
NAS_SSH_TARGET=mohammad@192.168.0.13:/volume1/web/bitcorp-backup
NAS_SSH_PORT=2230
NAS_SSH_KEY=~/.ssh/nas_backup
```

### Run manually

```bash
~/bitcorp-erp/deploy/sync-backups.sh
```

### Or schedule with cron (daily at 3am)

```bash
crontab -e
# Add:
0 3 * * * /home/$USER/bitcorp-erp/deploy/sync-backups.sh >> /home/$USER/bitcorp-erp/deploy/logs/nas-sync.log 2>&1
```

---

## Setup Checklist

- [ ] Create `develop` branch: `git checkout main && git checkout -b develop && git push -u origin develop`
- [ ] Generate `WEBHOOK_SECRET`: `openssl rand -hex 32`
- [ ] Add `WEBHOOK_SECRET` to GitHub Secrets (repo Settings → Secrets → Actions)
- [ ] On WSL2: install Docker Engine (`sudo apt install docker.io docker-compose-plugin`)
- [ ] On WSL2: clone repo, create `deploy/.env.prod` with all values filled
- [ ] On WSL2: install and start `bitcorp-webhook@$USER` systemd service
- [ ] On WSL2: configure Cloudflare Tunnel routes in Zero Trust dashboard
- [ ] On WSL2: `docker compose ... up -d` (first production start)
- [ ] On WSL2: `alembic upgrade head` (first-time DB migrations)
- [ ] Verify `https://bitcorp.mohammadasjad.com` loads correctly
- [ ] Create a test GitHub Release and confirm the deploy webhook fires
