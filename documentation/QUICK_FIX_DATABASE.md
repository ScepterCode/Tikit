# 🚨 QUICK FIX: Database Connection Issue

## The Problem

Your Supabase database is **not reachable**. This is most likely because:
- ✅ **Your Supabase project is PAUSED** (most common - free tier pauses after 7 days)
- ❌ Network/firewall issue
- ❌ Wrong credentials

## ⚡ Quick Fix (2 minutes)

### Step 1: Resume Your Supabase Project

1. **Go to**: https://app.supabase.com/
2. **Find your project**: Look for `hwwzbsppzwcyvambeade` in your project list
3. **Check status**: 
   - If you see a **"Paused"** badge or **"Resume"** button → Click it!
   - Wait 2-3 minutes for the database to start
4. **Verify**: The project status should show as **"Active"** with a green dot

### Step 2: Test Connection

Once your project is active, run:

```bash
cd apps/backend
npx prisma db push
```

✅ **Success looks like:**
```
✔ Database synchronized with Prisma schema
```

❌ **Still failing?** Continue to Step 3

### Step 3: Get Fresh Connection String

If Step 2 still fails:

1. In Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection string** section
3. Click **URI** tab
4. Copy the connection string
5. **Important**: Replace `[YOUR-PASSWORD]` with your actual password

### Step 4: Update .env Files

Open `apps/backend/.env` and update:

```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres
```

Do the same for `apps/backend/.env.test`

### Step 5: Test Again

```bash
cd apps/backend
npx prisma db push
```

## Alternative: Use Local Database (If Supabase Keeps Pausing)

If you don't want to deal with Supabase pausing, use Docker:

```bash
# Start PostgreSQL in Docker
docker run --name tikit-db -e POSTGRES_PASSWORD=tikit123 -e POSTGRES_DB=tikit -p 5432:5432 -d postgres:15

# Update apps/backend/.env
DATABASE_URL=postgresql://postgres:tikit123@localhost:5432/tikit
DIRECT_URL=postgresql://postgres:tikit123@localhost:5432/tikit

# Run migrations
cd apps/backend
npx prisma migrate deploy
```

## What I Already Fixed

I've already updated your `.env` files to:
1. ✅ Remove brackets from password
2. ✅ Use direct URL instead of pooler URL
3. ✅ Consistent format in both `.env` and `.env.test`

## Next Steps

1. **Check if Supabase is paused** → Resume it
2. **Test connection** → `npx prisma db push`
3. **If still failing** → Get fresh connection string from Supabase
4. **Or switch to local** → Use Docker PostgreSQL

## Need Help?

The most common issue is **Supabase free tier pausing**. Just resume your project and wait 2-3 minutes!
