# Tests Directory

This directory contains all test files, utility scripts, and debugging tools.

## Contents

### Test Files

#### Feature Tests
- `test_all_features.py` - Comprehensive feature tests
- `test_create_event.py` - Event creation tests
- `test_endpoints_now.py` - Endpoint tests
- `test_bug_fixes.py` - Bug fix verification tests

#### API Tests
- `test_wallet_api_direct.py` - Direct wallet API tests
- `test_wallet_endpoint.py` - Wallet endpoint tests
- `test_wallet_endpoint_direct.py` - Direct wallet endpoint tests
- `test_flutterwave_api.py` - Flutterwave API tests

#### Withdrawal Tests
- `test_withdrawal_complete.py` - Complete withdrawal tests
- `test_withdrawal_comprehensive.py` - Comprehensive withdrawal tests
- `test_withdrawal_flow.py` - Withdrawal flow tests

#### Backend Tests
- `test_auth.py` - Authentication tests
- `test_complete_api.py` - Complete API tests
- `test_events.py` - Events tests
- `test_schemas.py` - Schema validation tests
- `test_tickets.py` - Tickets tests
- `test_database_connection.py` - Database connection tests

#### Payment Tests
- `comprehensive_payment_test.py` - Comprehensive payment tests

### Check/Debug Scripts

#### Database Checks
- `check_balance_now.py` - Check wallet balance
- `check_events.py` - Check events data
- `check_events_schema.py` - Check events schema
- `check_event_data.py` - Check event data
- `check_payments_schema.py` - Check payments schema
- `check_wallet_and_transactions.py` - Check wallet and transactions
- `check_withdrawal_status.py` - Check withdrawal status

#### Flutterwave Checks
- `check_flutterwave_balance.py` - Check Flutterwave balance
- `check_flutterwave_dashboard.py` - Check Flutterwave dashboard
- `debug_flutterwave_deep.py` - Deep Flutterwave debugging

#### Route Checks
- `check_routes.py` - Check backend routes

### Utility Scripts

#### Data Management
- `create_test_data.py` - Create test data
- `create_missing_transactions.py` - Create missing transactions
- `restore_balance.py` - Restore wallet balance
- `restore_balance_now.py` - Restore balance immediately
- `restore_balance_emergency.py` - Emergency balance restore
- `restore_user_balance.py` - Restore user balance

#### Investigation
- `investigate_withdrawal_issue.py` - Investigate withdrawal issues
- `resolve_duplicate_main_applications.py` - Resolve duplicate main apps
- `get_my_ip.py` - Get IP address for whitelisting

#### Migration
- `database_migration_plan.py` - Database migration planning

### HTML Test Files
- `test_flutterwave_sdk_loading.html` - Test Flutterwave SDK loading
- `test_rls_from_frontend.html` - Test RLS from frontend

## Running Tests

### Python Tests
```bash
# Run all tests
python -m pytest tests/

# Run specific test
python tests/test_all_features.py

# Run with verbose output
python -m pytest tests/ -v
```

### Check Scripts
```bash
# Check wallet balance
python tests/check_balance_now.py

# Check events
python tests/check_events.py

# Check Flutterwave
python tests/check_flutterwave_balance.py
```

### Utility Scripts
```bash
# Create test data
python tests/create_test_data.py

# Restore balance
python tests/restore_balance.py
```

## Organization

- **test_*.py** - Automated test files
- **check_*.py** - Manual check/debug scripts
- **debug_*.py** - Debugging utilities
- **create_*.py** - Data creation utilities
- **restore_*.py** - Data restoration utilities
- **investigate_*.py** - Investigation scripts
- ***.html** - Browser-based tests

## Best Practices

1. Run tests before committing changes
2. Use check scripts to verify system state
3. Use restore scripts carefully (they modify data)
4. Keep test data separate from production data
5. Document new tests in this README
