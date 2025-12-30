# Prisma Database Setup

## Prerequisites

- PostgreSQL 15 installed and running
- Database connection string configured in `.env`

## Environment Variables

Create a `.env` file in `apps/backend/` with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tikit?schema=public"
```

## Commands

### Generate Prisma Client

```bash
pnpm --filter @tikit/backend prisma:generate
```

### Create Migration

```bash
pnpm --filter @tikit/backend prisma:migrate
```

This will:
1. Create a new migration file
2. Apply the migration to the database
3. Regenerate the Prisma Client

### Open Prisma Studio

```bash
pnpm --filter @tikit/backend prisma:studio
```

## Database Schema

The schema includes the following models:

- **User**: User accounts with authentication and profile data
- **Event**: Event information including location, capacity, and cultural features
- **Ticket**: Individual tickets with QR codes and backup codes
- **Payment**: Payment transactions with installment support
- **GroupBuy**: Group buying functionality for split payments
- **Referral**: Referral tracking and rewards

## Notes

- The schema uses `cuid()` for primary keys
- Indexes are configured for optimal query performance
- JSON fields are used for flexible data structures (tiers, cultural features, etc.)
- All timestamps are automatically managed by Prisma
