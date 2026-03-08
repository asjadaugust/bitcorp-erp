#!/bin/bash

# BitCorp ERP - NAS Deployment Script
# Conservative Deployment (Option A)

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAS_HOST="192.168.0.13"
NAS_PORT="2230"
NAS_USER="mohammad"
NAS_PASSWORD="R5dV%PztBj3CsRL*"
SOURCE_PATH="/volume1/projects/bitcorp-erp"
DOCKER_PATH="/volume1/docker/bitcorp-erp"
GIT_BIN="/usr/local/bin/git"
DOCKER_BIN="/usr/local/bin/docker"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BitCorp ERP - NAS Deployment${NC}"
echo -e "${BLUE}Conservative Deployment (Option A)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to run SSH command
run_ssh() {
    local cmd="$1"
    sshpass -p "${NAS_PASSWORD}" ssh -o StrictHostKeyChecking=no -p ${NAS_PORT} ${NAS_USER}@${NAS_HOST} "${cmd}"
}

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        exit 1
    fi
}

echo -e "${BLUE}Phase 1: Environment Discovery${NC}"
echo "------------------------------"

# Verify source code path
echo "Verifying source code location..."
if run_ssh "[ -d ${SOURCE_PATH}/.git ]" 2>/dev/null; then
    echo -e "${GREEN}✓ Git repository found at: ${SOURCE_PATH}${NC}"
else
    echo -e "${RED}✗ Git repository not found!${NC}"
    exit 1
fi

# Verify docker path
echo "Verifying docker-compose location..."
if run_ssh "[ -f ${DOCKER_PATH}/docker-compose.yml ]" 2>/dev/null; then
    echo -e "${GREEN}✓ Docker config found at: ${DOCKER_PATH}${NC}"
else
    echo -e "${RED}✗ Docker config not found!${NC}"
    exit 1
fi
echo ""

# Show current git status
echo "Current git status:"
run_ssh "cd ${SOURCE_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${GIT_BIN} log --oneline -3"
echo ""

# Show running containers
echo "Current containers:"
run_ssh "cd ${DOCKER_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${DOCKER_BIN} compose ps 2>/dev/null || echo 'No containers running'"
echo ""

echo -e "${BLUE}Phase 2: Backup Current State${NC}"
echo "------------------------------"

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
echo "Creating backup: backup_${BACKUP_DATE}"

# Backup git commit
echo "Current commit hash:"
CURRENT_COMMIT=$(run_ssh "cd ${SOURCE_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${GIT_BIN} rev-parse HEAD" | tail -1)
echo "${CURRENT_COMMIT}"
echo "${CURRENT_COMMIT}" > "/tmp/nas_backup_${BACKUP_DATE}.txt"
echo -e "${GREEN}✓ Backup saved locally: /tmp/nas_backup_${BACKUP_DATE}.txt${NC}"
echo ""

echo -e "${BLUE}Phase 3: Pull Latest Changes${NC}"
echo "------------------------------"

echo "Resetting any local changes..."
run_ssh "cd ${SOURCE_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${GIT_BIN} reset --hard HEAD 2>&1 | tail -3"
echo ""

echo "Fetching from origin..."
run_ssh "cd ${SOURCE_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${GIT_BIN} fetch origin main 2>&1 | tail -5"
check_status
echo ""

echo "Pulling from origin/main..."
run_ssh "cd ${SOURCE_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${GIT_BIN} pull origin main 2>&1 | tail -10"
check_status
echo ""

echo "New commit:"
NEW_COMMIT=$(run_ssh "cd ${SOURCE_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${GIT_BIN} rev-parse HEAD" | tail -1)
echo "${NEW_COMMIT}"
echo ""

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    echo -e "${YELLOW}⚠ No new commits pulled. Already up to date.${NC}"
else
    echo -e "${GREEN}✓ New commits pulled${NC}"
    echo "Commits added:"
    run_ssh "cd ${SOURCE_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${GIT_BIN} log --oneline ${CURRENT_COMMIT}..${NEW_COMMIT}"
fi
echo ""

echo -e "${BLUE}Phase 4: Rebuild & Restart Containers${NC}"
echo "------------------------------"

echo "Stopping containers..."
run_ssh "cd ${DOCKER_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${DOCKER_BIN} compose down 2>&1 | tail -10"
check_status
echo ""

echo "Building and starting containers (this may take 5-10 minutes)..."
echo -e "${YELLOW}This will rebuild backend and frontend from ${SOURCE_PATH}${NC}"
echo ""

# Run docker compose up with sudo
run_ssh "cd ${DOCKER_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${DOCKER_BIN} compose up -d --build 2>&1 | tail -20"
check_status
echo ""

echo "Waiting 30 seconds for containers to stabilize..."
sleep 30

echo -e "${BLUE}Phase 5: Verify Deployment${NC}"
echo "------------------------------"

echo "Container status:"
run_ssh "cd ${DOCKER_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${DOCKER_BIN} compose ps"
echo ""

echo "Backend logs (last 50 lines):"
run_ssh "cd ${DOCKER_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${DOCKER_BIN} compose logs --tail=50 backend 2>&1 | grep -E '(error|Error|ERROR|listening|Listening|started|Started)' || sudo ${DOCKER_BIN} compose logs --tail=30 backend"
echo ""

echo "Frontend logs (last 30 lines):"
run_ssh "cd ${DOCKER_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${DOCKER_BIN} compose logs --tail=30 frontend 2>&1 | grep -E '(error|Error|ERROR|ready|Ready|compiled|Compiled)' || sudo ${DOCKER_BIN} compose logs --tail=20 frontend"
echo ""

echo "Database status:"
run_ssh "cd ${DOCKER_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${DOCKER_BIN} compose logs postgres 2>&1 | grep 'ready to accept connections' | tail -1 || echo 'Database status unclear'"
echo ""

echo -e "${BLUE}Phase 6: Health Check${NC}"
echo "------------------------------"

echo "Testing backend health endpoint..."
HEALTH_CHECK=$(run_ssh "curl -s http://localhost:3400/health 2>&1 || echo 'FAILED'")
if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
    echo "$HEALTH_CHECK"
else
    echo -e "${YELLOW}⚠ Backend health check unclear:${NC}"
    echo "$HEALTH_CHECK"
fi
echo ""

echo "Port mappings:"
run_ssh "cd ${DOCKER_PATH} && echo '${NAS_PASSWORD}' | sudo -S ${DOCKER_BIN} compose ps | grep -E 'Up|bitcorp'"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Deployment Summary:"
echo "  Source:  ${SOURCE_PATH}"
echo "  Docker:  ${DOCKER_PATH}"
echo "  Old commit: ${CURRENT_COMMIT:0:7}"
echo "  New commit: ${NEW_COMMIT:0:7}"
echo ""
echo "Service URLs:"
echo "  Frontend: https://bitcorp.app (Port 3421)"
echo "  Backend:  http://192.168.0.13:3400"
echo "  PgAdmin:  http://192.168.0.13:3450"
echo ""
echo "Next steps:"
  echo "  1. Test login: Open browser to https://bitcorp.app"
  echo "  2. Check logs: ssh -p 2230 mohammad@192.168.0.13 'cd ${DOCKER_PATH} && ${DOCKER_BIN} compose logs -f'"
  echo "  3. Verify JWT: Login and check browser console for new JWT structure"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT: Existing JWT tokens are now invalid. All users must re-login.${NC}"
echo ""

# Save deployment log
echo "Deployment log saved to: /tmp/nas_deploy_${BACKUP_DATE}.log"
