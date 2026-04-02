# Tikit Project Structure

## 📁 Directory Organization

```
Tikit/
├── docs/              # 📚 All documentation (66 files)
├── tests/             # 🧪 All tests and utilities (32 files)
├── scripts/           # 📜 SQL scripts and database files (2 files)
├── apps/
│   ├── frontend/      # ⚛️ React frontend application
│   └── backend-fastapi/  # 🚀 FastAPI backend application
├── start_system.py    # 🎬 System startup script
└── README.md          # 📖 Project README
```

---

## 📚 Documentation (docs/)

All project documentation, guides, and status reports.

**Quick Access**:
- Architecture: `docs/BACKEND_ARCHITECTURE_EXPLAINED.md`
- Implementation: `docs/OPTION_A_IMPLEMENTED.md`
- Security: `docs/SECURITY_MIDDLEWARE_EXPLAINED.md`
- Full Index: `docs/README.md`

**Categories**:
- Architecture & Design (8 files)
- Implementation Guides (6 files)
- Feature Documentation (15 files)
- Status Reports (10 files)
- Setup & Configuration (11 files)

---

## 🧪 Tests (tests/)

All test files, utilities, and debugging tools.

**Quick Access**:
- Run all tests: `python -m pytest tests/`
- Check balance: `python tests/check_balance_now.py`
- Test guide: `tests/README.md`

**Categories**:
- Feature Tests (5 files)
- API Tests (4 files)
- Withdrawal Tests (3 files)
- Backend Tests (6 files)
- Check/Debug Scripts (10 files)
- Utility Scripts (10 files)
- HTML Tests (2 files)

---

## 📜 Scripts (scripts/)

SQL scripts and database-related files.

**Quick Access**:
- Database migration: `scripts/database_migration.sql`
- Scripts guide: `scripts/README.md`

**Contents**:
- SQL migration scripts
- Database setup files

---

## 🚀 Applications (apps/)

### Frontend (apps/frontend/)
React-based frontend application.

**Tech Stack**:
- React + TypeScript
- Vite
- TailwindCSS
- Supabase Client

**Key Directories**:
- `src/components/` - React components
- `src/pages/` - Page components
- `src/hooks/` - Custom hooks
- `src/contexts/` - Context providers
- `src/utils/` - Utility functions

### Backend (apps/backend-fastapi/)
FastAPI-based backend application.

**Tech Stack**:
- FastAPI
- Python 3.11+
- Supabase (PostgreSQL)
- Prisma ORM

**Key Directories**:
- `routers/` - API route handlers
- `services/` - Business logic
- `models/` - Data models
- `middleware/` - Middleware components
- `prisma/` - Database schema & migrations

---

## 🎬 Quick Start

### Start Entire System
```bash
python start_system.py
```

### Start Frontend Only
```bash
cd apps/frontend
npm run dev
```

### Start Backend Only
```bash
cd apps/backend-fastapi
uvicorn main:app --reload --port 8001
```

---

## 📖 Documentation Quick Links

### Getting Started
- [Project README](README.md)
- [Backend Architecture](docs/BACKEND_ARCHITECTURE_EXPLAINED.md)
- [Setup Guide](docs/SUPABASE_SETUP_GUIDE.txt)

### Implementation
- [Option A Implementation](docs/OPTION_A_IMPLEMENTED.md)
- [Security Middleware](docs/SECURITY_MIDDLEWARE_EXPLAINED.md)
- [Complete Fix Guide](docs/COMPLETE_FIX_GUIDE.md)

### Features
- [Events System](docs/EVENTS_FIXED.md)
- [Notifications](docs/NOTIFICATIONS_FIXED.md)
- [Withdrawal System](docs/WITHDRAWAL_SYSTEM_STATUS.md)
- [Flutterwave Integration](docs/FLUTTERWAVE_WITHDRAWAL_READY.md)

### Status & Reports
- [System Status](docs/SYSTEM_STATUS_FINAL.md)
- [All Issues Fixed](docs/ALL_ISSUES_FIXED.md)
- [Test Results](docs/TEST_RESULTS_FINAL.md)

---

## 🧪 Testing Quick Links

### Run Tests
```bash
# All tests
python -m pytest tests/

# Specific test
python tests/test_all_features.py

# With verbose output
python -m pytest tests/ -v
```

### Check System
```bash
# Check balance
python tests/check_balance_now.py

# Check events
python tests/check_events.py

# Check Flutterwave
python tests/check_flutterwave_balance.py
```

### Utilities
```bash
# Create test data
python tests/create_test_data.py

# Restore balance
python tests/restore_balance.py
```

---

## 📜 Database Scripts

### Run Migration
```bash
# Using Prisma
cd apps/backend-fastapi
npx prisma migrate deploy

# Using SQL directly
psql -U username -d database -f scripts/database_migration.sql
```

---

## 🔧 Development Workflow

### 1. Check Documentation
```bash
# Find relevant docs
ls docs/ | grep -i "topic"

# Read documentation
cat docs/FILENAME.md
```

### 2. Run Tests
```bash
# Before making changes
python -m pytest tests/

# After making changes
python tests/check_balance_now.py
```

### 3. Start Development
```bash
# Start system
python start_system.py

# Or start individually
cd apps/frontend && npm run dev
cd apps/backend-fastapi && uvicorn main:app --reload
```

### 4. Verify Changes
```bash
# Run specific tests
python tests/test_create_event.py

# Check system status
python tests/check_routes.py
```

---

## 📊 Project Statistics

| Category | Count | Location |
|----------|-------|----------|
| Documentation | 66 files | `docs/` |
| Tests | 32 files | `tests/` |
| Scripts | 2 files | `scripts/` |
| Frontend Components | 100+ | `apps/frontend/src/` |
| Backend Routes | 9 routers | `apps/backend-fastapi/routers/` |
| Backend Services | 35+ | `apps/backend-fastapi/services/` |

---

## 🎯 Key Features

### Backend (Port 8001)
- ✅ 8/9 routers active
- ✅ Admin dashboard (7 endpoints)
- ✅ Rate limiting (4 critical endpoints)
- ✅ Supabase integration
- ✅ JWT authentication
- ✅ Wallet system
- ✅ Event management
- ✅ Ticket system
- ✅ Payment processing

### Frontend (Port 3000)
- ✅ React + TypeScript
- ✅ Responsive design
- ✅ Real-time updates
- ✅ Secure authentication
- ✅ Payment integration
- ✅ Event browsing
- ✅ Ticket purchasing
- ✅ Wallet management

---

## 📞 Need Help?

### Documentation
- Check `docs/README.md` for full documentation index
- Search docs: `ls docs/ | grep -i "keyword"`

### Testing
- Check `tests/README.md` for test guide
- Run tests: `python -m pytest tests/`

### Scripts
- Check `scripts/README.md` for script usage
- View SQL: `cat scripts/database_migration.sql`

### Issues
- Check `docs/TROUBLESHOOTING_LOGIN.txt`
- Check `docs/QUICK_DIAGNOSIS.txt`
- Check `docs/ALL_ISSUES_FIXED.md`

---

## 🎊 Recent Updates

### Codebase Cleanup (Latest)
- ✅ Organized 100 files into proper directories
- ✅ Created docs/, tests/, scripts/ directories
- ✅ Added README files for navigation
- ✅ Cleaned up root directory

See `docs/CODEBASE_CLEANUP_COMPLETE.md` for details.

### Option A Implementation
- ✅ Enabled admin dashboard (7 endpoints)
- ✅ Added rate limiting (4 endpoints)
- ✅ 8/9 routers now active

See `docs/OPTION_A_IMPLEMENTED.md` for details.

---

## 🚀 Next Steps

1. **Read Documentation**: Start with `docs/README.md`
2. **Run Tests**: Verify system with `python -m pytest tests/`
3. **Start Development**: Use `python start_system.py`
4. **Check Status**: Review `docs/SYSTEM_STATUS_FINAL.md`

---

**For detailed information, see the README files in each directory!**
