#!/bin/bash

echo "=================================="
echo "Installing Ticket System Dependencies"
echo "=================================="
echo ""

# Navigate to frontend directory
cd apps/frontend

echo "📦 Installing qrcode.react..."
npm install qrcode.react

echo "📦 Installing TypeScript types..."
npm install --save-dev @types/qrcode.react

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run database migration in Supabase SQL Editor"
echo "2. Test the ticket purchase flow"
echo "3. Check My Tickets page"
echo "4. Test the scanner"
echo ""
echo "See TICKET_INTEGRATION_COMPLETE.md for full details"
