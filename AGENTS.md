# Agent Workflow

See `CLAUDE.md` for environment details (ports, credentials, commands, tech stack).

## Steps

1. **Pull latest code**

   ```bash
   git pull origin main
   ```

2. **Check application status**
   - Verify `docker-compose` is running
   - If not: `docker-compose up -d --build`
   - Restart a single service: `docker-compose restart backend`

3. **Check logs before committing**

   ```bash
   docker-compose logs --tail=50 backend
   docker-compose logs --tail=50 frontend
   ```

4. **Commit & Push**
   ```bash
   git config user.name "Mohammad Asjad"
   git config user.email "asjad.august@gmail.com"
   git add <files>
   git commit -m "type(scope): description"
   git push
   ```
