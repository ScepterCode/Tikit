#!/bin/bash

# 🚀 Supabase Email Function Deployment Script
# This script deploys the email processing Edge Function to Supabase

echo "📧 Supabase Email Function Deployment"
echo "======================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if user is logged in
echo "🔐 Checking authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Please login first:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Project not linked!"
    echo ""
    echo "Please link your project first:"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "Get your project ref from:"
    echo "  https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general"
    echo ""
    exit 1
fi

echo "✅ Project linked"
echo ""

# Deploy the function
echo "📤 Deploying send-emails function..."
echo ""

if supabase functions deploy send-emails; then
    echo ""
    echo "✅ Function deployed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo ""
    echo "1. Set up cron job to process emails every 5 minutes:"
    echo "   - Go to: https://supabase.com/dashboard"
    echo "   - Navigate to: Database > Cron Jobs"
    echo "   - Create new cron job with schedule: */5 * * * *"
    echo ""
    echo "2. Test the function:"
    echo "   supabase functions invoke send-emails --no-verify-jwt"
    echo ""
    echo "3. View logs:"
    echo "   supabase functions logs send-emails --tail"
    echo ""
    echo "4. Queue test emails:"
    echo "   python test_supabase_email.py"
    echo ""
    echo "📖 Full documentation: SUPABASE_EMAIL_DEPLOYMENT.md"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check your internet connection"
    echo "2. Verify project is linked: supabase link --project-ref YOUR_REF"
    echo "3. Check function code for syntax errors"
    echo "4. View detailed logs above"
    echo ""
    exit 1
fi
