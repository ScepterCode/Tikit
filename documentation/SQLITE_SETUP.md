# SQLite Setup for Local Development

## Overview

The project is now configured to use **SQLite** for local development and testing. This provides a zero-configuration database that works immediately without external dependencies.

## Current Configuration

### Database Files

- **Development**: `apps/backend/prisma/dev.db`
- **Testing**: `apps/backend/prisma/test.db`

### Environment Variables

**`.env`** (Development):
```env
DATABASE_URL=file:./prisma/dev.db
```

**`.env.test`** (Testing):
```env
DATABASE_URL=file:./prisma/test.db
```

## Schema Changes for SQLite

SQLite has some limitations compared to PostgreSQL. The following changes were made:

1. **JSON fields → String fields**: All `Json` types converted to `String` (stored as JSON strings)
   - `Event.tiers`
   - `Event.culturalFeatures`
   - `Event.images` (was `String[]`)
   - `Ticket.culturalSelections`
   - `Payment.metadata`
   - `Payment.installmentPlan`
   - `GroupBuy.participants`
   - `EventOrganizer.permissions`

2. **Text fields**: Removed `@db.Text` attribute (SQLite doesn't need it)

## Working with the Database

### View Database

Use a SQLite viewer like:
- **DB Browser for SQLite**: https://sqlitebrowser.org/
- **VS Code Extension**: SQLite Viewer
- **Command line**: `sqlite3 apps/backend/prisma/dev.db`

### Reset Database

```bash
cd apps/backend

# Delete database files
rm prisma/dev.db prisma/test.db

# Recreate with migrations
npx prisma migrate dev
```

### Generate Prisma Client

```bash
cd apps/backend
npx prisma generate
```

## Migrating to Supabase/PostgreSQL

When you're ready to use Supabase or PostgreSQL in production:

### 1. Update Prisma Schema

Edit `apps/backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2. Restore JSON Types

Change String fields back to Json:

```prisma
model Event {
  // ...
  tiers         Json
  culturalFeatures Json?
  images        String[]  // Array type
  // ...
}

model Ticket {
  // ...
  culturalSelections  Json?
  // ...
}

// ... etc for other models
```

### 3. Update Environment Variables

**`.env`**:
```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
```

### 4. Delete SQLite Migrations

```bash
cd apps/backend
rm -rf prisma/migrations
```

### 5. Create New PostgreSQL Migrations

```bash
cd apps/backend
npx prisma migrate dev --name init_postgresql
```

### 6. Update Code (if needed)

If you have code that parses JSON strings, update it to work with native JSON:

**Before (SQLite)**:
```typescript
const tiers = JSON.parse(event.tiers);
```

**After (PostgreSQL)**:
```typescript
const tiers = event.tiers; // Already an object
```

## Advantages of SQLite for Development

✅ **Zero configuration** - No external database server needed
✅ **Fast setup** - Database created instantly
✅ **Portable** - Single file, easy to backup/share
✅ **Perfect for testing** - Isolated test database
✅ **No pausing issues** - Unlike Supabase free tier

## Limitations

⚠️ **Not for production** - Use PostgreSQL/Supabase for production
⚠️ **No concurrent writes** - SQLite locks the entire database
⚠️ **Limited JSON support** - Must serialize/deserialize manually
⚠️ **No array types** - Must store as JSON strings

## Testing

Run tests with:

```bash
cd apps/backend
npm test
```

The test database (`test.db`) is automatically created and used during tests.

## Backup

To backup your development data:

```bash
# Copy the database file
cp apps/backend/prisma/dev.db apps/backend/prisma/dev.db.backup

# Or export to SQL
sqlite3 apps/backend/prisma/dev.db .dump > backup.sql
```

## Questions?

- SQLite is perfect for local development and testing
- When ready for production, follow the migration steps above
- All your code will work the same way (Prisma abstracts the differences)
