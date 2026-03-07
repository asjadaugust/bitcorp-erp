# BitCorp ERP — Production Deployment (WSL2)

## Architecture

```
GitHub Release → CI (test + build APK) → Webhook → WSL2 deploy.sh
                                                      ↓
                                              pg_dump → git checkout tag → docker compose rebuild → alembic migrate → health check
                                                      ↓
                                              Cloudflare Tunnel → bitcorp.mohammadasjad.com
```

## Initial Setup

### 1. Clone and configure

```bash
cd ~
git clone <repo-url> bitcorp-erp
cd bitcorp-erp/deploy
cp .env.prod.example .env.prod
# Edit .env.prod with real values
```

### 2. Install webhook listener

```bash
# Copy systemd service (replace USERNAME with your WSL user)
sudo cp bitcorp-webhook.service /etc/systemd/system/bitcorp-webhook@.service
sudo systemctl daemon-reload
sudo systemctl enable bitcorp-webhook@$USER
sudo systemctl start bitcorp-webhook@$USER

# Verify
sudo systemctl status bitcorp-webhook@$USER
curl http://localhost:9000/deploy-webhook
```

### 3. Configure Cloudflare Tunnel

In the Cloudflare Zero Trust dashboard, add these public hostname routes:

| Hostname                    | Path              | Service                 |
| --------------------------- | ----------------- | ----------------------- |
| `bitcorp.mohammadasjad.com` | `/`               | `http://localhost:3420` |
| `bitcorp.mohammadasjad.com` | `/api/*`          | `http://localhost:3400` |
| `bitcorp.mohammadasjad.com` | `/deploy-webhook` | `http://localhost:9000` |
| `bitcorp.mohammadasjad.com` | `/pgadmin/*`      | `http://localhost:5050` |

### 4. Configure Cloudflare Access (pgAdmin)

1. Go to Cloudflare Zero Trust → Access → Applications
2. Create application for `bitcorp.mohammadasjad.com/pgadmin*`
3. Add policy: Allow → Email OTP → your email
4. This protects pgAdmin behind authentication (free tier)

### 5. Setup NAS backup sync

```bash
# Add SSH key to NAS
ssh-keygen -t ed25519 -f ~/.ssh/nas_backup
ssh-copy-id -i ~/.ssh/nas_backup user@nas-ip

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/$USER/bitcorp-erp/deploy/sync-backups.sh >> /home/$USER/bitcorp-erp/deploy/logs/sync.log 2>&1
```

### 6. First deploy

```bash
cd ~/bitcorp-erp/deploy
chmod +x deploy.sh sync-backups.sh
./deploy.sh deploy v1.0.0
```

## Operations

### Manual deploy

```bash
./deploy.sh deploy v1.3.0
```

### Manual rollback

```bash
./deploy.sh rollback v1.2.0
```

### View deploy logs

```bash
ls -la logs/
tail -f logs/deploy_*.log
```

### View container logs

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## GitHub Secrets Required

| Secret           | Purpose                            |
| ---------------- | ---------------------------------- |
| `WEBHOOK_SECRET` | HMAC validation for deploy webhook |

## Mobile APK

Production APKs are automatically built and attached to GitHub Releases.

Build manually:

```bash
cd mobile
flutter build apk --release --dart-define=API_URL=https://bitcorp.mohammadasjad.com/api
```
