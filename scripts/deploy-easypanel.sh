#!/bin/bash

# Notton Easypanel Deployment Guide
# Instructions for deploying Notton to Easypanel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Notton Easypanel Deployment Guide                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "This guide will help you deploy Notton to Easypanel."
echo ""

# Check prerequisites
echo -e "${YELLOW}Prerequisites:${NC}"
echo "  - Easypanel account (https://easypanel.io)"
echo "  - Supabase account (https://supabase.com)"
echo "  - GitHub account with access to this repo"
echo ""

echo -e "${GREEN}Step 1: Create Supabase Project${NC}"
echo ""
echo "1. Go to https://supabase.com"
echo "2. Create a new project (free tier available - 2 projects!)"
echo "3. Go to Settings > API to get your credentials"
echo "   - Project URL: https://your-project.supabase.co"
echo "   - Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""

echo -e "${GREEN}Step 2: Set Up Environment Variables${NC}"
echo ""
echo "Create a .env file in the project root:"
echo ""
cat << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
EOF
echo ""

echo -e "${GREEN}Step 3: Run Database Migrations${NC}"
echo ""
echo "1. Install Supabase CLI:"
echo "   npm install -g supabase"
echo ""
echo "2. Link your project:"
echo "   supabase link --project-ref YOUR_PROJECT_REF"
echo ""
echo "3. Run migrations:"
echo "   npx supabase db push"
echo ""
echo "   Or reset database:"
echo "   npx supabase db reset"
echo ""

echo -e "${GREEN}Step 4: Deploy to Easypanel${NC}"
echo ""
echo "1. Log in to your Easypanel dashboard"
echo "2. Click 'Create' → 'App'"
echo "3. Choose 'GitHub' and connect to this repository"
echo "4. Select branch (e.g., main)"
echo "5. Build method: Dockerfile"
echo "6. Set environment variables:"
echo "   - VITE_SUPABASE_URL: https://your-project.supabase.co"
echo "   - VITE_SUPABASE_PUBLISHABLE_KEY: your_anon_key"
echo "7. Port: 80"
echo "8. Click 'Deploy'"
echo ""

echo -e "${GREEN}Step 5: Configure Secrets (Optional)${NC}"
echo ""
echo "If you want to use AI features, configure secrets:"
echo ""
echo "1. Run the secrets configuration script:"
echo "   ./scripts/configure-secrets.sh"
echo ""
echo "2. Or manually set secrets:"
echo "   supabase secrets set OPENAI_API_KEY=your_key"
echo "   supabase secrets set XAI_API_KEY=your_key"
echo ""

echo -e "${GREEN}Step 6: Access Your App${NC}"
echo ""
echo "Your Notton instance will be available at:"
echo "  - http://your-domain.easypanel.io"
echo "  - Or your custom domain if configured"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Troubleshooting${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Issue: App won't start"
echo "  Solution: Check environment variables are set correctly"
echo ""
echo "Issue: Database errors"
echo "  Solution: Run migrations: npx supabase db push"
echo ""
echo "Issue: AI features not working"
echo "  Solution: Configure secrets: ./scripts/configure-secrets.sh"
echo ""
echo "Issue: PWA not installing on iOS"
echo "  Solution: Ensure HTTPS is enabled in Easypanel"
echo ""

echo -e "${GREEN}✓ Deployment guide complete!${NC}"
echo ""
echo "For more information, see the main README.md"
