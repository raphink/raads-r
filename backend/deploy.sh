#!/bin/bash

# RAADS-R PDF Service Deployment Script
set -e

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-raads-r-467121}"
SERVICE_NAME="${SERVICE_NAME:-raads-pdf-service}"
REGION="${REGION:-europe-west6}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying RAADS-R PDF Service to Cloud Run${NC}"
echo "=================================="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Set project
echo -e "${YELLOW}🔧 Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    storage.googleapis.com \
    artifactregistry.googleapis.com

# Build and submit to Cloud Build
echo -e "${YELLOW}🏗️  Building container image...${NC}"
gcloud builds submit --config cloudbuild.yaml .

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 2 \
    --timeout 300 \
    --concurrency 10 \
    --min-instances 0 \
    --max-instances 10 \
    --set-secrets "CLAUDE_API_KEY=claude-raadsr-key:latest" \
    --set-env-vars "GIN_MODE=release"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --format="value(status.url)")

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=================================="
echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"
 echo ""

echo -e "${BLUE}📋 To test the service:${NC}"
echo "curl -X GET $SERVICE_URL/health"
echo ""
echo -e "${BLUE}📊 To monitor the service:${NC}"
echo "gcloud run services logs tail $SERVICE_NAME --platform=managed --region=$REGION"
echo ""
echo -e "${YELLOW}💡 Environment variables set:${NC}"
echo "- CLAUDE_API_KEY: [HIDDEN]"
echo "- GOOGLE_CLOUD_PROJECT: $PROJECT_ID"

# Optional: Open service URL in browser
if command -v open &> /dev/null; then
    echo ""
    read -p "Open service URL in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$SERVICE_URL/health"
    fi
fi
