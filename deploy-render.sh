#!/bin/bash

# Tikit Render Deployment Script
# Deploys FastAPI backend to Render + Frontend to Vercel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Tikit Render + Vercel Deployment${NC}"
echo -e "${BLUE}===================================${NC}"

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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required CLIs are installed
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is required but not found. Please install Git."
        exit 1
    fi
    
    print_status "Dependencies checked"
}

# Prepare backend for Render
prepare_backend() {
    echo -e "${BLUE}Preparing backend for Render deployment...${NC}"
    
    cd apps/backend-fastapi
    
    # Ensure render.yaml exists
    if [ ! -f "render.yaml" ]; then
        print_error "render.yaml not found. Please ensure it exists in apps/backend-fastapi/"
        exit 1
    fi
    
    # Ensure requirements.txt is up to date
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found"
        exit 1
    fi
    
    # Create .env.example if it doesn't exist
    if [ ! -f ".env.example" ]; then
        cat > .env.example << EOF
# Render Environment Variables Template
ENVIRONMENT=production
DEBUG=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
FRONTEND_URL=https://your-frontend.vercel.app
REDIS_URL=redis://localhost:6379
EOF
        print_status "Created .env.example"
    fi
    
    cd ../..
    print_status "Backend prepared for Render"
}

# Deploy to Render (manual steps)
deploy_render() {
    echo -e "${BLUE}Setting up Render deployment...${NC}"
    
    print_info "To deploy to Render, follow these steps:"
    echo ""
    echo "1. Push your code to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for Render deployment'"
    echo "   git push origin main"
    echo ""
    echo "2. Go to https://render.com and sign in"
    echo ""
    echo "3. Click 'New +' and select 'Blueprint'"
    echo ""
    echo "4. Connect your GitHub repository"
    echo ""
    echo "5. Render will automatically detect the render.yaml file"
    echo ""
    echo "6. Set the following environment variables in Render dashboard:"
    echo "   - SUPABASE_URL: https://your-project.supabase.co"
    echo "   - SUPABASE_SERVICE_KEY: your-service-key"
    echo "   - SUPABASE_ANON_KEY: your-anon-key"
    echo "   - FRONTEND_URL: https://your-frontend.vercel.app"
    echo ""
    echo "7. Click 'Apply' to deploy"
    echo ""
    
    read -p "Press Enter when you've completed the Render deployment..."
    
    echo ""
    print_warning "Please provide your Render backend URL:"
    read -p "Backend URL (e.g., https://tikit-fastapi-backend.onrender.com): " BACKEND_URL
    
    if [ -z "$BACKEND_URL" ]; then
        print_error "Backend URL is required"
        exit 1
    fi
    
    echo "$BACKEND_URL" > .backend-url
    print_status "Backend URL saved: $BACKEND_URL"
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
        print_error "Backend URL not found. Please deploy backend first."
        exit 1
    fi
    
    # Check if project is linked
    if [ ! -f ".vercel/project.json" ]; then
        print_warning "Vercel project not linked. Linking now..."
        vercel
    fi
    
    # Set environment variables
    echo -e "${YELLOW}Setting Vercel environment variables...${NC}"
    
    # Set API base URL
    vercel env add VITE_API_BASE_URL production << EOF
$BACKEND_URL
EOF
    
    print_info "Please set the following environment variables in Vercel dashboard:"
    echo "- VITE_SUPABASE_URL: https://your-project.supabase.co"
    echo "- VITE_SUPABASE_ANON_KEY: your-supabase-anon-key"
    echo ""
    echo "You can set them at: https://vercel.com/dashboard -> Your Project -> Settings -> Environment Variables"
    echo ""
    
    read -p "Press Enter when you've set the environment variables..."
    
    # Deploy to production
    print_info "Deploying to Vercel production..."
    vercel --prod
    
    cd ../..
    print_status "Frontend deployed to Vercel"
}

# Update CORS settings
update_cors() {
    echo -e "${BLUE}Updating CORS settings...${NC}"
    
    if [ -f ".backend-url" ]; then
        BACKEND_URL=$(cat .backend-url)
        
        print_warning "IMPORTANT: Update CORS settings in your backend"
        print_info "In apps/backend-fastapi/simple_main.py, update the allow_origins list to include:"
        echo "- https://your-frontend.vercel.app"
        echo "- https://your-custom-domain.com (if applicable)"
        echo ""
        print_info "Then redeploy your backend to Render"
        echo ""
    fi
}

# Run health checks
health_check() {
    echo -e "${BLUE}Running health checks...${NC}"
    
    if [ -f ".backend-url" ]; then
        BACKEND_URL=$(cat .backend-url)
        echo "Checking backend health at: $BACKEND_URL/health"
        
        # Wait for deployment to be ready
        echo "Waiting for backend to be ready..."
        sleep 30
        
        if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
            print_status "Backend health check passed"
        else
            print_warning "Backend health check failed - this is normal for new deployments"
            print_info "Please check your Render dashboard for deployment status"
        fi
    fi
}

# Create GitHub Actions workflow for automatic deployments
create_github_actions() {
    echo -e "${BLUE}Creating GitHub Actions workflow...${NC}"
    
    mkdir -p .github/workflows
    
    cat > .github/workflows/deploy-render.yml << 'EOF'
name: Deploy to Render + Vercel

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-frontend:
    name: Deploy Frontend to Vercel
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
          cache-dependency-path: apps/frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd apps/frontend
          npm ci
      
      - name: Build frontend
        run: |
          cd apps/frontend
          npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: apps/frontend
          scope: ${{ secrets.VERCEL_ORG_ID }}

  notify:
    name: Notify Deployment
    runs-on: ubuntu-latest
    needs: [deploy-frontend]
    if: always()
    
    steps:
      - name: Deployment Status
        run: |
          echo "Frontend deployment: ${{ needs.deploy-frontend.result }}"
          echo "Backend deploys automatically via Render when code is pushed"
EOF
    
    print_status "GitHub Actions workflow created"
    print_info "Add these secrets to your GitHub repository:"
    echo "- VERCEL_TOKEN"
    echo "- VERCEL_ORG_ID"
    echo "- VERCEL_PROJECT_ID"
    echo "- VITE_API_BASE_URL"
    echo "- VITE_SUPABASE_URL"
    echo "- VITE_SUPABASE_ANON_KEY"
}

# Main deployment flow
main() {
    check_dependencies
    
    echo -e "${YELLOW}This script will help you deploy to Render + Vercel${NC}"
    echo -e "${YELLOW}Make sure you have:${NC}"
    echo "1. A GitHub repository with your code"
    echo "2. A Render account (https://render.com)"
    echo "3. A Vercel account (https://vercel.com)"
    echo "4. Your Supabase credentials ready"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 1
    fi
    
    prepare_backend
    deploy_render
    deploy_frontend
    update_cors
    create_github_actions
    
    echo -e "${BLUE}Waiting for deployments to stabilize...${NC}"
    sleep 10
    
    health_check
    
    echo -e "${GREEN}🎉 Deployment setup completed!${NC}"
    echo -e "${BLUE}Your Tikit system deployment:${NC}"
    
    if [ -f ".backend-url" ]; then
        echo -e "Backend (Render): ${GREEN}$(cat .backend-url)${NC}"
    fi
    
    echo -e "Frontend (Vercel): ${GREEN}Check your Vercel dashboard${NC}"
    echo -e "Database: ${GREEN}Supabase (already hosted)${NC}"
    
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Verify both services are running"
    echo "2. Test your application end-to-end"
    echo "3. Set up custom domain (optional)"
    echo "4. Configure monitoring and alerts"
    echo "5. Set up automated backups"
    
    # Cleanup
    rm -f .backend-url
    
    print_status "Deployment script completed!"
}

# Run main function
main "$@"