# Tikit - Event Ticketing Platform

A progressive web application for event ticketing in Nigeria, featuring offline-first capabilities, USSD integration, and multilingual support.

## Project Structure

```
tikit-monorepo/
├── apps/
│   ├── frontend/          # React PWA with Vite
│   └── backend/           # Node.js/Express API
├── packages/              # Shared packages (future)
└── pnpm-workspace.yaml    # Monorepo configuration
```

## Prerequisites

- Node.js 20 LTS or higher
- pnpm 8.x or higher
- PostgreSQL 15
- Redis 7
- Supabase account (for authentication and realtime)

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

Run both frontend and backend in development mode:

```bash
pnpm dev
```

Or run individually:

```bash
# Frontend only (http://localhost:3000)
pnpm --filter @tikit/frontend dev

# Backend only (http://localhost:4000)
pnpm --filter @tikit/backend dev
```

### Build

Build all apps:

```bash
pnpm build
```

### Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Progressive Web App (PWA) capabilities

### Backend
- Node.js 20 LTS
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Supabase (Authentication & Realtime)

## License

Private - All rights reserved
