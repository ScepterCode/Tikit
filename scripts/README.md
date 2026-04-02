# Scripts Directory

This directory contains SQL scripts and database-related files.

## Contents

### SQL Scripts
- `database_migration.sql` - Main database migration script

### Prisma Scripts (in apps/backend-fastapi/prisma/)
- Migration files for SQLite database
- Schema definitions
- Database setup scripts

## SQL Scripts

### database_migration.sql
Main database migration script for setting up or updating the database schema.

**Usage**:
```bash
# Run migration (if using PostgreSQL)
psql -U username -d database_name -f scripts/database_migration.sql

# Run migration (if using Supabase)
# Use Supabase SQL Editor to run the script
```

## Prisma Migrations

The project uses Prisma for database management. Prisma migrations are located in:
```
apps/backend-fastapi/prisma/migrations/
```

### Running Prisma Migrations

```bash
# Navigate to backend directory
cd apps/backend-fastapi

# Run migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## Supabase Scripts

For Supabase-specific scripts, see:
```
apps/backend-fastapi/src/scripts/
├── setup-supabase-tables.sql
├── supabase-schema.sql
└── setup-supabase.ts
```

## Best Practices

1. **Always backup** before running migration scripts
2. **Test migrations** on development database first
3. **Version control** all migration scripts
4. **Document changes** in migration files
5. **Use transactions** for complex migrations
6. **Verify data** after migrations

## Migration Workflow

1. Create migration script
2. Test on local database
3. Review changes
4. Backup production database
5. Run migration on production
6. Verify data integrity
7. Monitor for issues

## Rollback Strategy

Always create rollback scripts for migrations:
```sql
-- Migration: Add new column
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

-- Rollback: Remove new column
-- ALTER TABLE users DROP COLUMN new_field;
```

## Database Connections

### Development
- SQLite: `prisma/prisma/dev.db`
- Supabase: See `.env` file

### Production
- Supabase: See `.env.production` file

## Troubleshooting

### Migration Fails
1. Check database connection
2. Verify SQL syntax
3. Check for conflicting data
4. Review error logs
5. Rollback if necessary

### Prisma Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Check migration status
npx prisma migrate status

# View database schema
npx prisma db pull
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase SQL Reference](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
