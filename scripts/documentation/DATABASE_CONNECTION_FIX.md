# Database Connection Fix Guide

## Problem Identified

Your application is trying to connect to Supabase but getting this error:
```
Error: P1001: Can't reach database server at `db.hwwzbsppzwcyvambeade.supabase.co:5432`
```

## Root Causes (One or More May Apply)

1. **Supabase project is paused** (most common for free tier)
2. **Incorrect database credentials**
3. **Network/firewall blocking the connection**
4. **Database password contains special characters that need URL encoding**

## Solution Steps

### Step 1: Check if Supabase Project is Active

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Find your project: `hwwzbsppzwcyvambeade`
3. Check the project status:
   - If it says **"Paused"** → Click **"Restore"** or **"Resume"**
   - Free tier projects pause after 1 week of inactivity
   - Wait 2-3 minutes for the database to fully start

### Step 2: Get Fresh Connection Strings

Once your project is active:

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string
5. **Important**: Click "Show password" or replace `[YOUR-PASSWORD]` with your actual database password

The connection string should look like:
```
postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres
```

### Step 3: Update Your Environment Files

#### Update `apps/backend/.env`:

```env
# Replace these lines with your fresh connection strings
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres
```

#### Update `apps/backend/.env.test`:

```env
# Use the same connection strings for tests
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres
```

### Step 4: Handle Special Characters in Password

If your password contains special characters like `@`, `#`, `!`, `%`, etc., you need to URL-encode them:

| Character | URL Encoded |
|-----------|-------------|
| `@` | `%40` |
| `#` | `%23` |
| `!` | `%21` |
| `%` | `%25` |
| `&` | `%26` |
| `=` | `%3D` |
| `+` | `%2B` |
| ` ` (space) | `%20` |

**Example:**
- Original password: `MyP@ss#123!`
- URL-encoded: `MyP%40ss%23123%21`
- Full URL: `postgresql://postgres:MyP%40ss%23123%21@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres`

### Step 5: Test the Connection

```bash
cd apps/backend
npx prisma db push
```

If successful, you should see:
```
✔ Database synchronized with Prisma schema
```

### Step 6: Run Migrations (If Needed)

```bash
cd apps/backend
npx prisma migrate deploy
```

### Step 7: Verify Connection in Code

```bash
cd apps/backend
npm test -- whatsapp.test.ts
```

This should run successfully if the database connection is working.

## Alternative: Use Local PostgreSQL

If Supabase continues to have issues, you can use a local PostgreSQL database:

### Option A: Install PostgreSQL Locally

1. **Download PostgreSQL**: https://www.postgresql.org/download/windows/
2. **Install** with default settings
3. **Create database**:
   ```bash
   createdb tikit
   ```
4. **Update `.env`**:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/tikit
   DIRECT_URL=postgresql://postgres:your_password@localhost:5432/tikit
   ```

### Option B: Use Docker (Easiest)

1. **Install Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. **Start PostgreSQL container**:
   ```bash
   docker run --name tikit-postgres -e POSTGRES_PASSWORD=tikit123 -e POSTGRES_DB=tikit -p 5432:5432 -d postgres:15
   ```
3. **Update `.env`**:
   ```env
   DATABASE_URL=postgresql://postgres:tikit123@localhost:5432/tikit
   DIRECT_URL=postgresql://postgres:tikit123@localhost:5432/tikit
   ```
4. **Run migrations**:
   ```bash
   cd apps/backend
   npx prisma migrate deploy
   ```

## Troubleshooting

### Error: "Authentication failed"
- Double-check your password
- Ensure password is URL-encoded if it contains special characters
- Try resetting your database password in Supabase Dashboard

### Error: "Database does not exist"
- The database name should be `postgres` for Supabase
- For local PostgreSQL, create the database first: `createdb tikit`

### Error: "Connection timeout"
- Check your internet connection
- Verify Supabase project is not paused
- Try disabling VPN if you're using one
- Check Windows Firewall settings

### Error: "SSL connection required"
- Supabase requires SSL by default
- Add `?sslmode=require` to the end of your connection string:
  ```
  postgresql://postgres:password@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres?sslmode=require
  ```

## Quick Test Commands

After fixing the connection, test with these commands:

```bash
# Test database connection
cd apps/backend
npx prisma db push

# Test with a simple query
npx prisma studio
# This opens a GUI to browse your database

# Run a simple test
npm test -- whatsapp.test.ts
```

## Current Connection String Analysis

Looking at your `.env` file, I see you're using:
```
DATABASE_URL=postgresql://postgres.hwwzbsppzwcyvambeade:[lVmQ11AQzFq6YVLO]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Issues I notice:**
1. Password is in brackets `[lVmQ11AQzFq6YVLO]` - remove the brackets
2. Using pooler URL for DATABASE_URL (should use direct URL)
3. DIRECT_URL looks correct

**Corrected version:**
```env
DATABASE_URL=postgresql://postgres:lVmQ11AQzFq6YVLO@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:lVmQ11AQzFq6YVLO@db.hwwzbsppzwcyvambeade.supabase.co:5432/postgres
```

## Recommended Fix (Start Here)

1. **Remove brackets from password** in both `.env` and `.env.test`
2. **Use direct URL** (not pooler) for DATABASE_URL
3. **Check Supabase project status** - make sure it's not paused
4. **Test connection**: `npx prisma db push`

## Need More Help?

If you're still having issues after trying these steps, please share:
1. The exact error message you're seeing
2. Whether your Supabase project is active (not paused)
3. Whether you can access Supabase Dashboard successfully
