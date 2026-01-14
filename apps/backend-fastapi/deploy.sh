#!/bin/bash

# Tikit FastAPI Backend Deployment Script
# Supports multiple deployment targets: Railway, Render, DigitalOcean, AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="tikit-fastapi"
DOCKER_IMAGE="tikit/fastapi-backend"
VERSION=$(date +%Y%m%d-%H%M%S)

echo -e "${BLUE}🚀 Tikit FastAPI Backend Deployment${NC}"
echo -e "${BLUE}====================================${NC}"

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

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please update .env with your actual configuration before deploying!"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_KEY" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set!"
        exit 1
    fi
done

print_status "Environment variables validated"

# Function to deploy to Railway
deploy_railway() {
    echo -e "${BLUE}Deploying to Railway...${NC}"
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Install it first: npm install -g @railway/cli"
        exit 1
    fi
    
    # Login to Railway (if not already logged in)
    railway login
    
    # Create or link project
    if [ ! -f "railway.json" ]; then
        railway init
    fi
    
    # Deploy
    railway up
    
    print_status "Deployed to Railway successfully!"
}

# Function to deploy to Render
deploy_render() {
    echo -e "${BLUE}Deploying to Render...${NC}"
    
    # Build Docker image
    docker build -t $DOCKER_IMAGE:$VERSION .
    docker tag $DOCKER_IMAGE:$VERSION $DOCKER_IMAGE:latest
    
    print_status "Docker image built successfully"
    print_warning "Please push the image to your container registry and update your Render service"
    print_warning "Image: $DOCKER_IMAGE:$VERSION"
}

# Function to deploy to DigitalOcean App Platform
deploy_digitalocean() {
    echo -e "${BLUE}Deploying to DigitalOcean App Platform...${NC}"
    
    if ! command -v doctl &> /dev/null; then
        print_error "DigitalOcean CLI (doctl) not found. Install it first."
        exit 1
    fi
    
    # Create app spec if it doesn't exist
    if [ ! -f "app.yaml" ]; then
        cat > app.yaml << EOF
name: tikit-fastapi
services:
- name: api
  source_dir: /
  github:
    repo: your-username/tikit
    branch: main
  run_command: uvicorn main:app --host 0.0.0.0 --port 8000
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 8000
  envs:
  - key: ENVIRONMENT
    value: production
  - key: SUPABASE_URL
    value: ${SUPABASE_URL}
  - key: SUPABASE_SERVICE_KEY
    value: ${SUPABASE_SERVICE_KEY}
    type: SECRET
  - key: JWT_SECRET
    value: ${JWT_SECRET}
    type: SECRET
EOF
        print_warning "Created app.yaml. Please update it with your GitHub repository details."
    fi
    
    # Deploy
    doctl apps create app.yaml
    
    print_status "Deployed to DigitalOcean App Platform successfully!"
}

# Function to deploy to AWS (using Docker)
deploy_aws() {
    echo -e "${BLUE}Deploying to AWS...${NC}"
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Install it first."
        exit 1
    fi
    
    # Build and push to ECR
    AWS_REGION=${AWS_REGION:-us-east-1}
    ECR_REPO="tikit-fastapi"
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build and tag image
    docker build -t $ECR_REPO .
    docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
    docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$VERSION
    
    # Push image
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$VERSION
    
    print_status "Image pushed to ECR successfully!"
    print_warning "Please update your ECS service or Lambda function to use the new image"
}

# Function to run tests
run_tests() {
    echo -e "${BLUE}Running tests...${NC}"
    
    if [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then
        python -m pytest tests/ -v
        print_status "Tests passed!"
    else
        print_warning "No test configuration found. Skipping tests."
    fi
}

# Function to build Docker image locally
build_docker() {
    echo -e "${BLUE}Building Docker image...${NC}"
    
    docker build -t $DOCKER_IMAGE:$VERSION .
    docker tag $DOCKER_IMAGE:$VERSION $DOCKER_IMAGE:latest
    
    print_status "Docker image built: $DOCKER_IMAGE:$VERSION"
}

# Function to start local development
start_dev() {
    echo -e "${BLUE}Starting development environment...${NC}"
    
    # Start with Docker Compose
    docker-compose up -d redis postgres
    
    # Wait for services to be ready
    sleep 5
    
    # Start FastAPI with hot reload
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

# Function to stop local development
stop_dev() {
    echo -e "${BLUE}Stopping development environment...${NC}"
    docker-compose down
    print_status "Development environment stopped"
}

# Main deployment logic
case "${1:-help}" in
    "railway")
        run_tests
        deploy_railway
        ;;
    "render")
        run_tests
        deploy_render
        ;;
    "digitalocean"|"do")
        run_tests
        deploy_digitalocean
        ;;
    "aws")
        run_tests
        deploy_aws
        ;;
    "docker")
        run_tests
        build_docker
        ;;
    "dev")
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "test")
        run_tests
        ;;
    "help"|*)
        echo -e "${BLUE}Tikit FastAPI Deployment Script${NC}"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  railway      Deploy to Railway"
        echo "  render       Deploy to Render"
        echo "  digitalocean Deploy to DigitalOcean App Platform"
        echo "  aws          Deploy to AWS (ECR + ECS/Lambda)"
        echo "  docker       Build Docker image locally"
        echo "  dev          Start development environment"
        echo "  stop         Stop development environment"
        echo "  test         Run tests only"
        echo "  help         Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 railway    # Deploy to Railway"
        echo "  $0 dev        # Start local development"
        echo "  $0 test       # Run tests"
        ;;
esac

print_status "Deployment script completed!"