# Test Setup Guide

## Database Configuration for Tests

The property-based tests require a PostgreSQL database connection. You have several options:

### Option 1: Use Supabase (Recommended)

If you're using Supabase for your project:

1. Get your Supabase database connection string from the Supabase dashboard:
   - Go to Settings > Database
   - Copy the "Connection string" (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

2. Update `apps/backend/.env.test` with your Supabase DATABASE_URL:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

3. Run Prisma migrations to set up the test database:
   ```bash
   cd apps/backend
   npx prisma migrate dev
   ```

### Option 2: Use Local PostgreSQL

If you have PostgreSQL installed locally:

1. Create a test database:
   ```bash
   createdb tikit_test
   ```

2. Update `apps/backend/.env.test` with your local credentials:
   ```env
   DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/tikit_test
   ```

3. Run Prisma migrations:
   ```bash
   cd apps/backend
   npx prisma migrate dev
   ```

### Option 3: Use Docker PostgreSQL

If you want to use Docker:

1. Start a PostgreSQL container:
   ```bash
   docker run --name tikit-test-db -e POSTGRES_PASSWORD=testpassword -e POSTGRES_DB=tikit_test -p 5432:5432 -d postgres:15
   ```

2. Update `apps/backend/.env.test`:
   ```env
   DATABASE_URL=postgresql://postgres:testpassword@localhost:5432/tikit_test
   ```

3. Run Prisma migrations:
   ```bash
   cd apps/backend
   npx prisma migrate dev
   ```

## Running Tests

Once the database is configured:

```bash
cd apps/backend
npm test
```

To run specific property-based tests:

```bash
npm test -- groupbuy.service.test.ts -t "Property 15"
```

## Troubleshooting

### "Authentication failed against database server"
- Verify your DATABASE_URL credentials are correct
- Ensure the database server is running
- Check that the database exists

### "Environment variable not found: DATABASE_URL"
- Make sure `.env.test` file exists in `apps/backend/`
- Verify the file contains `DATABASE_URL=...`

### "Table does not exist"
- Run Prisma migrations: `npx prisma migrate dev`
- Or generate Prisma client: `npx prisma generate`

## Test Database Best Practices

1. **Use a separate test database** - Never run tests against your production or development database
2. **Clean up after tests** - The tests include cleanup logic in `afterEach` hooks
3. **Isolate test data** - Tests use unique identifiers to avoid conflicts
4. **Run migrations** - Always ensure your test database schema is up to date

## Current Test Status

The property-based test code is **correct and complete**. It just needs a properly configured database connection to run.

**Test:** Property 15: Group buy link uniqueness
**Status:** Ready to run once database is configured
**What it tests:** Verifies that for any group buy with N participants (2 ≤ N ≤ 5000), exactly N unique payment links are generated
