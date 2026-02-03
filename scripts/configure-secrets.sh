#!/bin/bash

# Notton Secrets Configuration Script
# Configure optional Supabase secrets for integrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Notton Secrets Configuration                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "This script helps you configure optional Supabase secrets for integrations."
echo "Skip any integration you don't need by pressing Enter."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${RED}Error: No Supabase project linked${NC}"
    echo "Run supabase link first"
    exit 1
fi

PROJECT_REF=$(cat supabase/.temp/project-ref)
echo -e "${GREEN}✓ Project linked: ${PROJECT_REF}${NC}"
echo ""

# OpenAI
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  AI Features (OpenAI)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Required for: AI chat, text generation, content improvement"
echo "Get your key from: https://platform.openai.com/api-keys"
echo ""
read -p "Configure OpenAI? [y/N]: " configure_openai

if [[ "$configure_openai" =~ ^[Yy]$ ]]; then
    read -p "OpenAI API Key: " OPENAI_API_KEY
    if [ -n "$OPENAI_API_KEY" ]; then
        supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"
        echo -e "${GREEN}✓ OpenAI configured${NC}"
    fi
fi

echo ""

# xAI (Groq)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  AI Features (xAI / Groq)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Alternative to OpenAI, often faster and cheaper"
echo "Get your key from: https://console.x.ai/"
echo ""
read -p "Configure xAI? [y/N]: " configure_xai

if [[ "$configure_xai" =~ ^[Yy]$ ]]; then
    read -p "xAI API Key: " XAI_API_KEY
    if [ -n "$XAI_API_KEY" ]; then
        supabase secrets set XAI_API_KEY="$XAI_API_KEY"
        echo -e "${GREEN}✓ xAI configured${NC}"
    fi
fi

echo ""

echo -e "${GREEN}✓ Configuration complete!${NC}"
echo ""
echo "To verify secrets are set, run:"
echo "  supabase secrets list"
echo ""
echo "To update secrets, run this script again or use:"
echo "  supabase secrets set SECRET_NAME=value"
