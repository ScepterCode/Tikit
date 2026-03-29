# Environment Setup Guide

## Quick Start

1. **Copy the dummy values**: Both `.env` and `.env.test` files have been created with dummy values
2. **Fill in your real credentials**: Follow the instructions below for each service
3. **Run database migrations**: `npx prisma migrate dev`
4. **Start the server**: `npm run dev`

## Required Configuration

### 1. Database (DATABASE_URL) - REQUIRED

You have two main options:

#### Option A: Supabase (Recommended)
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (or create one)
3. Go to **Settings > Database**
4. Copy the **Connection string** (URI format)
5. Replace in both `.env` and `.env.test`:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

#### Option B: Local PostgreSQL
1. Install PostgreSQL if not already installed
2. Create a database: `createdb tikit`
3. Update both `.env` and `.env.test`:
   ```env
   DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/tikit
   ```

**Important**: Use the **same DATABASE_URL** in both `.env` and `.env.test` files. Tests will clean up after themselves.

### 2. Redis (REDIS_URL) - REQUIRED

#### Option A: Local Redis
1. Install Redis: `brew install redis` (Mac) or download from redis.io
2. Start Redis: `redis-server`
3. Keep the default:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

#### Option B: Upstash (Cloud Redis)
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a Redis database
3. Copy the connection string
4. Update both `.env` and `.env.test`:
   ```env
   REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
   ```

### 3. Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) - REQUIRED

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings > API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
5. Update both `.env` and `.env.test`:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. JWT Secrets (JWT_SECRET, JWT_REFRESH_SECRET) - REQUIRED

Generate random strings for security:

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Update both `.env` and `.env.test`:
```env
JWT_SECRET=your_generated_random_string_here
JWT_REFRESH_SECRET=another_generated_random_string_here
```

### 5. Session Secret (SESSION_SECRET) - REQUIRED

Generate a random string:
```bash
openssl rand -base64 32
```

Update both `.env` and `.env.test`:
```env
SESSION_SECRET=your_generated_random_string_here
```

## Optional Configuration (for production features)

### Africa's Talking (SMS/USSD)

Only needed if you want to test SMS OTP or USSD features:

1. Go to [Africa's Talking](https://account.africastalking.com/)
2. Create an account and get your API key
3. Update `.env`:
   ```env
   AFRICASTALKING_USERNAME=your_username
   AFRICASTALKING_API_KEY=your_api_key
   AFRICASTALKING_SENDER_ID=Tikit
   ```

**Note**: Tests mock this service, so `.env.test` doesn't need real values.

### Paystack (Payment Gateway)

Only needed for payment features:

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
2. Copy your test keys
3. Update `.env`:
   ```env
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   ```

### Flutterwave (Backup Payment Gateway)

Only needed for payment features:

1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com/settings/apis)
2. Copy your test keys
3. Update `.env`:
   ```env
   FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxx
   FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx
   ```

## After Configuration

### 1. Install Dependencies
```bash
cd apps/backend
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Database Migrations
```bash
npx prisma migrate dev
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Run Tests
```bash
npm test
```

## Verification

Test your setup:

```bash
# Check if server starts
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

## Troubleshooting

### "Environment variable not found"
- Make sure `.env` file exists in `apps/backend/`
- Check that all required variables are set

### "Authentication failed against database"
- Verify DATABASE_URL is correct
- Check database server is running
- Ensure database exists

### "Redis connection failed"
- Check Redis server is running: `redis-cli ping` (should return "PONG")
- Verify REDIS_URL is correct

### "Prisma Client not generated"
- Run: `npx prisma generate`

### Tests failing with database errors
- Make sure `.env.test` has the same DATABASE_URL as `.env`
- Run migrations: `npx prisma migrate dev`

## Security Notes

⚠️ **Never commit `.env` files to git!**

The `.gitignore` file should already exclude:
- `.env`
- `.env.test`
- `.env.local`
- `.env.*.local`

✅ **Do commit**: `.env.example` (template with dummy values)
❌ **Don't commit**: `.env` (contains real credentials)
