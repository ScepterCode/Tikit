# Quick Start - Fill Your .env File

## ✅ Step-by-Step Checklist

### 1. Database Setup (5 minutes)

**Using Supabase (Easiest)**:
```bash
# 1. Go to: https://app.supabase.com/
# 2. Select your project
# 3. Settings > Database > Copy "Connection string"
# 4. Paste into both .env and .env.test as DATABASE_URL
```

**Using Local PostgreSQL**:
```bash
# 1. Create database
createdb tikit

# 2. Update .env and .env.test
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/tikit
```

### 2. Redis Setup (2 minutes)

**Local Redis**:
```bash
# 1. Install: brew install redis (Mac) or download from redis.io
# 2. Start: redis-server
# 3. Keep default in .env: redis://localhost:6379
```

### 3. Supabase API Keys (2 minutes)

```bash
# 1. Go to: https://app.supabase.com/
# 2. Settings > API
# 3. Copy Project URL and service_role key
# 4. Paste into both .env and .env.test
```

### 4. Generate Secrets (1 minute)

**Mac/Linux**:
```bash
# Generate 3 random strings
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

**Windows PowerShell**:
```powershell
# Run this 3 times
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Paste into `.env` and `.env.test`:
- First → `JWT_SECRET`
- Second → `JWT_REFRESH_SECRET`
- Third → `SESSION_SECRET`

### 5. Run Setup (2 minutes)

```bash
cd apps/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start server
npm run dev
```

### 6. Verify (30 seconds)

```bash
# Test health endpoint
curl http://localhost:4000/health
```

Should return:
```json
{"status": "ok", "database": "connected", "redis": "connected"}
```

### 7. Run Tests

```bash
npm test
```

## 📝 Your .env Checklist

Copy this and fill in as you go:

```
✅ DATABASE_URL (same in .env and .env.test)
✅ REDIS_URL
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ JWT_SECRET (random string)
✅ JWT_REFRESH_SECRET (random string)
✅ SESSION_SECRET (random string)
⬜ AFRICASTALKING_* (optional - for SMS)
⬜ PAYSTACK_* (optional - for payments)
⬜ FLUTTERWAVE_* (optional - for payments)
```

## 🚨 Common Issues

**"Authentication failed against database"**
→ Check DATABASE_URL is correct and database exists

**"Redis connection failed"**
→ Make sure Redis is running: `redis-cli ping`

**"Environment variable not found"**
→ Make sure you're in `apps/backend/` directory

**Tests failing**
→ Ensure `.env.test` has the same DATABASE_URL as `.env`

## 📚 Need More Help?

- Full guide: `ENV_SETUP.md`
- Test setup: `TEST_SETUP.md`
- Supabase guide: `SUPABASE_SETUP.md`
- Redis guide: `REDIS_SETUP.md`
