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
DOCKER_PATH="/volume1/docker/bitcorp-erp"
PROJECTS_PATH="/volume1/projects/bitcorp-erp"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BitCorp ERP - NAS Deployment${NC}"
echo -e "${BLUE}Conservative Deployment (Option A)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to run SSH command
run_ssh() {
    local cmd="$1"
    echo -e "${YELLOW}Running: ${cmd}${NC}"
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

# Check which directory exists
echo "Checking for docker directory..."
if run_ssh "[ -d ${DOCKER_PATH} ] && echo 'EXISTS' || echo 'NOT_FOUND'" | grep -q "EXISTS"; then
    DEPLOY_PATH="${DOCKER_PATH}"
    echo -e "${GREEN}✓ Using: ${DOCKER_PATH}${NC}"
else
    echo -e "${YELLOW}Docker path not found, checking projects path...${NC}"
    if run_ssh "[ -d ${PROJECTS_PATH} ] && echo 'EXISTS' || echo 'NOT_FOUND'" | grep -q "EXISTS"; then
        DEPLOY_PATH="${PROJECTS_PATH}"
        echo -e "${GREEN}✓ Using: ${PROJECTS_PATH}${NC}"
    else
        echo -e "${RED}✗ Neither path exists!${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Deployment Path: ${DEPLOY_PATH}${NC}"
echo ""

# Check for docker-compose file
echo "Finding docker-compose file..."
COMPOSE_FILE=$(run_ssh "cd ${DEPLOY_PATH} && ls docker-compose*.yml 2>/dev/null | head -1")
if [ -z "$COMPOSE_FILE" ]; then
    echo -e "${RED}✗ No docker-compose file found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Found: ${COMPOSE_FILE}${NC}"
echo ""

# Show current git status
echo "Current git status:"
run_ssh "cd ${DEPLOY_PATH} && git log --oneline -3"
echo ""

# Show running containers
echo "Current containers:"
run_ssh "cd ${DEPLOY_PATH} && docker-compose ps" || echo "No containers running"
echo ""

echo -e "${BLUE}Phase 2: Backup Current State${NC}"
echo "------------------------------"

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
echo "Creating backup: backup_${BACKUP_DATE}"

# Backup git commit
run_ssh "cd ${DEPLOY_PATH} && git rev-parse HEAD > backup_commit_${BACKUP_DATE}.txt"
check_status

echo -e "${GREEN}✓ Backup created${NC}"
echo ""

echo -e "${BLUE}Phase 3: Pull Latest Changes${NC}"
echo "------------------------------"

echo "Current commit:"
run_ssh "cd ${DEPLOY_PATH} && git rev-parse HEAD"
echo ""

echo "Pulling from origin/main..."
run_ssh "cd ${DEPLOY_PATH} && echo '${NAS_PASSWORD}' | sudo -S git pull origin main"
check_status

echo ""
echo "New commit:"
run_ssh "cd ${DEPLOY_PATH} && git rev-parse HEAD"
echo ""

echo "Commits pulled:"
run_ssh "cd ${DEPLOY_PATH} && git log --oneline -5"
echo ""

echo -e "${BLUE}Phase 4: Rebuild & Restart Containers${NC}"
echo "------------------------------"

echo "Stopping containers..."
run_ssh "cd ${DEPLOY_PATH} && docker-compose down"
check_status
echo ""

echo "Building and starting containers (this may take 5-10 minutes)..."
run_ssh "cd ${DEPLOY_PATH} && docker-compose up -d --build"
check_status
echo ""

echo "Waiting 30 seconds for containers to stabilize..."
sleep 30

echo -e "${BLUE}Phase 5: Verify Deployment${NC}"
echo "------------------------------"

echo "Container status:"
run_ssh "cd ${DEPLOY_PATH} && docker-compose ps"
echo ""

echo "Backend logs (last 50 lines):"
run_ssh "cd ${DEPLOY_PATH} && docker-compose logs --tail=50 backend"
echo ""

echo "Frontend logs (last 30 lines):"
run_ssh "cd ${DEPLOY_PATH} && docker-compose logs --tail=30 frontend"
echo ""

echo "Database status:"
run_ssh "cd ${DEPLOY_PATH} && docker-compose logs postgres | grep 'ready to accept connections' | tail -1"
echo ""

echo -e "${BLUE}Phase 6: Extract Port Configuration${NC}"
echo "------------------------------"

echo "Port mappings:"
run_ssh "cd ${DEPLOY_PATH} && docker-compose ps | grep -E 'bitcorp.*Up' || docker ps | grep bitcorp"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check logs: cd ${DEPLOY_PATH} && docker-compose logs -f"
echo "2. Test backend: curl http://localhost:<backend_port>/health"
echo "3. Test frontend: Open browser to http://bitcorp.mohammadasjad.com"
echo ""
echo -e "${YELLOW}Note: Existing JWT tokens are invalid. Users must re-login.${NC}"
echo ""
