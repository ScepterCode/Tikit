# SQLite to PostgreSQL Migration Guide

## Overview

This guide helps you migrate from SQLite (development) to PostgreSQL/Supabase (production).

## Quick Summary

**What changed for SQLite:**
- JSON fields → String fields (stored as JSON strings)
- String arrays → String fields (stored as JSON arrays)
- Need to use `JSON.stringify()` and `JSON.parse()` for these fields

**When migrating back:**
- Restore native JSON and array types in schema
- Remove JSON serialization code
- Run new migrations

## Step-by-Step Migration

### 1. Update Prisma Schema

Edit `apps/backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2. Restore Native Types

Change these fields back to their original types:

```prisma
model Event {
  // Change from:
  tiers         String    // JSON string
  culturalFeatures String?    // JSON string
  images        String?   // JSON array as string
  
  // To:
  tiers         Json
  culturalFeatures Json?
  images        String[]
}

model Ticket {
  // Change from:
  culturalSelections  String?   // JSON string
  
  // To:
  culturalSelections  Json?
}

model Payment {
  // Change from:
  metadata        String?   // JSON string
  installmentPlan String?   // JSON string
  
  // To:
  metadata        Json?
  installmentPlan Json?
}

model GroupBuy {
  // Change from:
  participants        String    // JSON string
  
  // To:
  participants        Json
}

model EventOrganizer {
  // Change from:
  permissions String    // JSON string
  
  // To:
  permissions Json
}
```

Also restore the `@db.Text` attribute:

```prisma
model Event {
  description   String    @db.Text
}
```

### 3. Update Environment Variables

**`.env`**:
```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
```

**`.env.test`**:
```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
```

### 4. Delete SQLite Migrations

```bash
cd apps/backend
rm -rf prisma/migrations
rm prisma/dev.db prisma/test.db
```

### 5. Create PostgreSQL Migrations

```bash
cd apps/backend
npx prisma migrate dev --name init_postgresql
```

### 6. Update Code

Remove JSON serialization code. Here are the main changes needed:

#### Event Service

**Before (SQLite)**:
```typescript
const event = await prisma.event.create({
  data: {
    tiers: JSON.stringify(tiers),
    culturalFeatures: JSON.stringify(culturalFeatures),
    images: JSON.stringify(images),
    // ...
  }
});

// When reading
const tiers = JSON.parse(event.tiers);
```

**After (PostgreSQL)**:
```typescript
const event = await prisma.event.create({
  data: {
    tiers: tiers,  // Direct assignment
    culturalFeatures: culturalFeatures,
    images: images,
    // ...
  }
});

// When reading
const tiers = event.tiers;  // Already an object
```

#### Files to Update

Search for these patterns and update:

1. **Event tiers**:
   - `apps/backend/src/services/event.service.ts`
   - `apps/backend/src/services/groupbuy.service.ts`
   - `apps/backend/src/services/organizer.service.ts`

2. **Ticket cultural selections**:
   - `apps/backend/src/services/ticket.service.ts`

3. **Payment metadata**:
   - `apps/backend/src/services/payment.service.ts`
   - `apps/backend/src/services/groupbuy.service.ts`
   - `apps/backend/src/services/sponsorship.service.ts`

4. **GroupBuy participants**:
   - `apps/backend/src/services/groupbuy.service.ts`

5. **EventOrganizer permissions**:
   - `apps/backend/src/services/rbac.service.ts`

### 7. Update Tests

Remove JSON serialization from test files:

**Before**:
```typescript
tiers: JSON.stringify([
  { id: '1', name: 'General', price: 5000, quantity: 100, sold: 0 }
])
```

**After**:
```typescript
tiers: [
  { id: '1', name: 'General', price: 5000, quantity: 100, sold: 0 }
]
```

### 8. Test the Migration

```bash
cd apps/backend

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Run tests
npm test

# Start server
npm run dev
```

## Using Helper Functions (Optional)

If you want to keep code compatible with both SQLite and PostgreSQL, use the helper functions in `src/lib/json-helpers.ts`:

```typescript
import { toJsonString, fromJsonString, toJsonArray, fromJsonArray } from '../lib/json-helpers';

// When creating
const event = await prisma.event.create({
  data: {
    tiers: process.env.DATABASE_URL?.includes('sqlite') 
      ? toJsonString(tiers) 
      : tiers,
  }
});

// When reading
const tiers = process.env.DATABASE_URL?.includes('sqlite')
  ? fromJsonString(event.tiers)
  : event.tiers;
```

## Data Migration

If you have data in SQLite that you want to migrate to PostgreSQL:

### Option 1: Export/Import via JSON

```bash
# Export from SQLite
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function exportData() {
  const users = await prisma.user.findMany();
  const events = await prisma.event.findMany();
  const tickets = await prisma.ticket.findMany();
  
  fs.writeFileSync('data-export.json', JSON.stringify({
    users,
    events,
    tickets
  }, null, 2));
  
  await prisma.\$disconnect();
}

exportData();
"

# Then import to PostgreSQL after switching
# (You'll need to write an import script)
```

### Option 2: Manual Data Entry

For small datasets, manually recreate the data in PostgreSQL.

## Troubleshooting

### Issue: Migrations fail

**Solution**: Make sure you've deleted all SQLite migrations before creating PostgreSQL ones.

### Issue: Type errors after migration

**Solution**: Run `npx prisma generate` to regenerate the Prisma client with correct types.

### Issue: JSON parsing errors

**Solution**: Check that you've removed all `JSON.parse()` and `JSON.stringify()` calls for fields that are now native JSON.

### Issue: Array type errors

**Solution**: Change `String?` back to `String[]` for array fields like `Event.images`.

## Checklist

- [ ] Update `datasource` in `schema.prisma`
- [ ] Restore JSON and array types in models
- [ ] Update environment variables
- [ ] Delete SQLite migrations and database files
- [ ] Create new PostgreSQL migrations
- [ ] Remove JSON serialization code
- [ ] Update test files
- [ ] Run tests to verify
- [ ] Test in development environment
- [ ] Deploy to production

## Need Help?

- Check Prisma docs: https://www.prisma.io/docs/concepts/database-connectors/postgresql
- Supabase docs: https://supabase.com/docs/guides/database
- Compare this file with `SQLITE_SETUP.md` to see what changed

## Summary

The main difference is:
- **SQLite**: Store JSON as strings, manually serialize/deserialize
- **PostgreSQL**: Native JSON support, no serialization needed

Once you migrate, your code will be cleaner and more type-safe!
