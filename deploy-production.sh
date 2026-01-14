#!/bin/bash

# Tikit Production Deployment Script
# Deploys to Railway (backend) + Vercel (frontend)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Tikit Production Deployment${NC}"
echo -e "${BLUE}==============================${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required CLIs are installed
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    print_status "Dependencies checked"
}

# Deploy backend to Railway
deploy_backend() {
    echo -e "${BLUE}Deploying backend to Railway...${NC}"
    
    cd apps/backend-fastapi
    
    # Check if railway.json exists
    if [ ! -f "railway.json" ]; then
        print_warning "Creating railway.json configuration..."
        cat > railway.json << EOF
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port \$PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
    fi
    
    # Check if project is initialized
    if [ ! -f ".railway" ]; then
        print_warning "Railway project not initialized. Please run 'railway init' first."
        railway init
    fi
    
    # Deploy
    railway up
    
    # Get the deployment URL
    BACKEND_URL=$(railway domain)
    print_status "Backend deployed to: $BACKEND_URL"
    
    cd ../..
    echo "$BACKEND_URL" > .backend-url
}

# Deploy frontend to Vercel
deploy_frontend() {
    echo -e "${BLUE}Deploying frontend to Vercel...${NC}"
    
    cd apps/frontend
    
    # Read backend URL
    if [ -f "../../.backend-url" ]; then
        BACKEND_URL=$(cat ../../.backend-url)
        print_status "Using backend URL: $BACKEND_URL"
    else
        print_warning "Backend URL not found. Please set VITE_API_BASE_URL manually."
        BACKEND_URL="https://your-backend.railway.app"
    fi
    
    # Check if project is linked
    if [ ! -f ".vercel/project.json" ]; then
        print_warning "Vercel project not linked. Please run 'vercel' first to link."
        vercel
    fi
    
    # Set environment variables (if not already set)
    echo -e "${YELLOW}Setting environment variables...${NC}"
    echo "Please ensure these environment variables are set in Vercel dashboard:"
    echo "- VITE_API_BASE_URL: $BACKEND_URL"
    echo "- VITE_SUPABASE_URL: https://your-project.supabase.co"
    echo "- VITE_SUPABASE_ANON_KEY: your-supabase-anon-key"
    
    read -p "Press Enter to continue with deployment..."
    
    # Deploy to production
    vercel --prod
    
    # Get the deployment URL
    FRONTEND_URL=$(vercel ls --scope $(vercel whoami) | grep "$(basename $(pwd))" | head -1 | awk '{print $2}')
    print_status "Frontend deployed to: https://$FRONTEND_URL"
    
    cd ../..
    echo "https://$FRONTEND_URL" > .frontend-url
}

# Update CORS settings
update_cors() {
    echo -e "${BLUE}Updating CORS settings...${NC}"
    
    if [ -f ".frontend-url" ]; then
        FRONTEND_URL=$(cat .frontend-url)
        print_warning "Please update CORS settings in your backend to include: $FRONTEND_URL"
        print_warning "Add this URL to the allow_origins list in apps/backend-fastapi/main.py"
    fi
}

# Run health checks
health_check() {
    echo -e "${BLUE}Running health checks...${NC}"
    
    if [ -f ".backend-url" ]; then
        BACKEND_URL=$(cat .backend-url)
        echo "Checking backend health..."
        if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
            print_status "Backend health check passed"
        else
            print_error "Backend health check failed"
        fi
    fi
    
    if [ -f ".frontend-url" ]; then
        FRONTEND_URL=$(cat .frontend-url)
        echo "Checking frontend..."
        if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
            print_status "Frontend health check passed"
        else
            print_error "Frontend health check failed"
        fi
    fi
}

# Main deployment flow
main() {
    check_dependencies
    
    echo -e "${YELLOW}Starting production deployment...${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 1
    fi
    
    deploy_backend
    deploy_frontend
    update_cors
    
    echo -e "${BLUE}Waiting for deployments to stabilize...${NC}"
    sleep 30
    
    health_check
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}Your Tikit system is now live:${NC}"
    
    if [ -f ".frontend-url" ]; then
        echo -e "Frontend: ${GREEN}$(cat .frontend-url)${NC}"
    fi
    
    if [ -f ".backend-url" ]; then
        echo -e "Backend: ${GREEN}$(cat .backend-url)${NC}"
    fi
    
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update your DNS records (if using custom domain)"
    echo "2. Test all functionality"
    echo "3. Set up monitoring and alerts"
    echo "4. Configure backup procedures"
    
    # Cleanup
    rm -f .backend-url .frontend-url
}

# Run main function
main "$@"