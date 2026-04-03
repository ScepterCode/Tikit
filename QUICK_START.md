# 🚀 Quick Start - Ticket System

## ⚡ 3 Steps to Launch

### Step 1: Run Database Migration (2 minutes)

1. Open https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor"
4. Paste and run:

```sql
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(12) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);
```

### Step 2: Start Servers (1 minute)

```bash
# Terminal 1 - Backend
cd apps/backend-fastapi
python main.py

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

### Step 3: Test (5 minutes)

1. Go to http://localhost:5173
2. Login as attendee
3. Purchase a ticket
4. Go to "My Tickets" page
5. Verify ticket code and QR code

## ✅ Done!

Your ticket system is now live with:
- ✅ Unique ticket codes
- ✅ QR codes
- ✅ Email confirmations
- ✅ Scanner validation

---

## 📖 Full Documentation

- **IMPLEMENTATION_SUMMARY.md** - What was built
- **FINAL_DEPLOYMENT_CHECKLIST.md** - Detailed testing
- **TICKET_INTEGRATION_COMPLETE.md** - Technical details

---

## 🆘 Need Help?

### Issue: Dependencies not installed
```bash
cd apps/frontend
npm install qrcode.react
npm install --save-dev @types/qrcode.react
```

### Issue: Database migration failed
- Check if you're using the correct Supabase project
- Verify you have admin access
- Try running each SQL statement separately

### Issue: Tickets not showing
- Verify database migration ran successfully
- Check backend logs for errors
- Ensure ticket_code column exists

---

## 🎉 You're Ready!

Start testing and enjoy your world-class ticketing system! 🚀
