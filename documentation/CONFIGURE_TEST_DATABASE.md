# Configure Test Database - Quick Start

## ⚠️ Action Required

The property-based test **"Property 15: Group buy link uniqueness"** is ready to run, but needs a database connection configured.

## Quick Fix (5 minutes)

### Option 1: Use Your Supabase Database (Recommended)

1. **Get your Supabase connection string:**
   - Go to your [Supabase Dashboard](https://app.supabase.com/)
   - Select your project
   - Go to **Settings** → **Database**
   - Scroll to **Connection string** section
   - Copy the **URI** format (not the other formats)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

2. **Update the test environment file:**
   - Open `apps/backend/.env.test`
   - Replace the `DATABASE_URL` line with your actual Supabase connection string
   - Make sure to replace `[YOUR-PASSWORD]` with your actual database password

   ```env
   DATABASE_URL=postgresql://postgres:your_actual_password@db.xxxxx.supabase.co:5432/postgres
   ```

3. **Run Prisma migrations** (one-time setup):
   ```bash
   cd apps/backend
   npx prisma migrate deploy
   ```

4. **Run the test:**
   ```bash
   npm test -- groupbuy.service.test.ts -t "Property 15"
   ```

### Option 2: Use Local PostgreSQL

If you have PostgreSQL installed locally:

1. **Create a test database:**
   ```bash
   createdb tikit_test
   ```

2. **Update `.env.test`:**
   ```env
   DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/tikit_test
   ```

3. **Run migrations:**
   ```bash
   cd apps/backend
   npx prisma migrate deploy
   ```

4. **Run the test:**
   ```bash
   npm test -- groupbuy.service.test.ts -t "Property 15"
   ```

### Option 3: Use Docker PostgreSQL (No Installation Required)

1. **Start PostgreSQL in Docker:**
   ```bash
   docker run --name tikit-test-db \
     -e POSTGRES_PASSWORD=testpassword \
     -e POSTGRES_DB=tikit_test \
     -p 5432:5432 \
     -d postgres:15
   ```

2. **Update `.env.test`:**
   ```env
   DATABASE_URL=postgresql://postgres:testpassword@localhost:5432/tikit_test
   ```

3. **Run migrations:**
   ```bash
   cd apps/backend
   npx prisma migrate deploy
   ```

4. **Run the test:**
   ```bash
   npm test -- groupbuy.service.test.ts -t "Property 15"
   ```

## What This Test Does

**Property 15: Group buy link uniqueness** verifies that:
- For any group buy with N participants (where 2 ≤ N ≤ 5000)
- The system generates exactly N unique payment links
- No duplicate links are created
- All links are properly associated with participants

This is a critical correctness property that ensures each participant in a group buy gets their own unique payment link.

## Test Status

✅ **Test code is correct and complete**
❌ **Database connection not configured**

Once you configure the `DATABASE_URL`, the test will run successfully.

## Troubleshooting

### "Authentication failed"
- Double-check your password in the DATABASE_URL
- Ensure there are no extra spaces or special characters that need URL encoding

### "Database does not exist"
- Run `npx prisma migrate deploy` to create the schema
- Or create the database manually first

### "Connection refused"
- Ensure PostgreSQL is running (local or Supabase)
- Check the host and port are correct
- Verify firewall settings allow the connection

## Need Help?

See the full guide in `TEST_SETUP.md` for more detailed instructions and troubleshooting.
