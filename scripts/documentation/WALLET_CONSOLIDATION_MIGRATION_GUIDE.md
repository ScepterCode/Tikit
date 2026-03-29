# 🔄 WALLET SERVICES MIGRATION GUIDE

## OVERVIEW

This guide provides step-by-step instructions for migrating from the fragmented wallet services to the unified wallet service. The migration is designed to be **zero-downtime** with **gradual rollout**.

---

## 📋 PRE-MIGRATION CHECKLIST

### ✅ Prerequisites
- [ ] **Backup all wallet data** from existing services
- [ ] **Test unified service** thoroughly (run `python test_unified_wallet_service.py`)
- [ ] **Set up monitoring** for wallet operations
- [ ] **Prepare rollback plan** in case of issues
- [ ] **Schedule migration** during low-traffic period

### ✅ Files Ready for Migration
- [x] `services/unified_wallet_service.py` - Main unified service
- [x] `services/wallet_models.py` - Data models and enums
- [x] `services/wallet_security.py` - Security module
- [x] `services/wallet_realtime.py` - Real-time module
- [x] `services/wallet_withdrawals.py` - Withdrawals module
- [x] `services/wallet_analytics.py` - Analytics module

---

## 🚀 MIGRATION PHASES

### PHASE 1: PARALLEL DEPLOYMENT (Week 1)

Deploy unified service alongside existing services without changing endpoints.

#### Step 1.1: Deploy New Service Files
```bash
# Copy new service files to production
cp services/unified_wallet_service.py /production/services/
cp services/wallet_models.py /production/services/
cp services/wallet_security.py /production/services/
cp services/wallet_realtime.py /production/services/
cp services/wallet_withdrawals.py /production/services/
cp services/wallet_analytics.py /production/services/
```

#### Step 1.2: Initialize Unified Service
```python
# Add to main.py or app initialization
from services.unified_wallet_service import unified_wallet_service

# Initialize service on startup
@app.on_event("startup")
async def startup_event():
    print("🏦 Unified Wallet Service initialized")
```

#### Step 1.3: Data Migration Script
Create and run data migration script:

```python
# migrate_wallet_data.py
from services.unified_wallet_service import unified_wallet_service
from auth_utils import user_database  # Existing user data

def migrate_existing_data():
    """Migrate data from existing services to unified service"""
    migrated_users = 0
    
    for user_id, user_data in user_database.items():
        try:
            # Initialize wallets for existing users
            result = unified_wallet_service.initialize_user_wallets(user_id, {
                "initial_balance": user_data.get("balance", 0),
                "role": user_data.get("role", "attendee")
            })
            
            if result["success"]:
                migrated_users += 1
                print(f"✅ Migrated user: {user_id}")
            else:
                print(f"❌ Failed to migrate user {user_id}: {result['error']}")
                
        except Exception as e:
            print(f"💥 Error migrating user {user_id}: {str(e)}")
    
    print(f"🎉 Migration complete: {migrated_users} users migrated")

if __name__ == "__main__":
    migrate_existing_data()
```

#### Step 1.4: Validation
```python
# validate_migration.py
def validate_migration():
    """Validate that migration was successful"""
    # Compare balances between old and new systems
    # Verify all users have wallets
    # Check transaction history integrity
    pass
```

### PHASE 2: GRADUAL ENDPOINT MIGRATION (Week 2)

Migrate endpoints one by one, starting with least critical ones.

#### Step 2.1: Update Router Imports
```python
# routers/wallet.py - Add unified service import
from services.unified_wallet_service import unified_wallet_service
```

#### Step 2.2: Migrate Security Endpoints First
```python
# OLD: Using wallet_security_service
@router.post("/security/set-pin")
async def set_pin(request: SetPinRequest, current_user: dict = Depends(get_current_user)):
    return wallet_security_service.set_pin(current_user["id"], request.pin)

# NEW: Using unified service
@router.post("/security/set-pin")
async def set_pin(request: SetPinRequest, current_user: dict = Depends(get_current_user)):
    return unified_wallet_service.set_transaction_pin(current_user["id"], request.pin)
```

#### Step 2.3: Migration Order
1. **Security endpoints** (`/security/*`) - Lowest risk
2. **Analytics endpoints** (`/analytics/*`) - Read-only operations
3. **Transaction history** (`/transactions/*`) - Read-only operations
4. **Withdrawal endpoints** (`/withdraw*`) - Medium risk
5. **Transfer endpoints** (`/transfer*`) - Highest risk (save for last)

#### Step 2.4: A/B Testing Setup
```python
# Feature flag for gradual rollout
USE_UNIFIED_WALLET = os.getenv("USE_UNIFIED_WALLET", "false").lower() == "true"
UNIFIED_WALLET_PERCENTAGE = int(os.getenv("UNIFIED_WALLET_PERCENTAGE", "0"))

def should_use_unified_service(user_id: str) -> bool:
    """Determine if user should use unified service"""
    if USE_UNIFIED_WALLET:
        return True
    
    # Gradual rollout based on user ID hash
    user_hash = hash(user_id) % 100
    return user_hash < UNIFIED_WALLET_PERCENTAGE

@router.get("/balance")
async def get_balance(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    if should_use_unified_service(user_id):
        # Use unified service
        balance = unified_wallet_service.get_wallet_balance(user_id)
        return {"balance": balance, "service": "unified"}
    else:
        # Use old service
        balance = user_database[user_id].get("balance", 0)
        return {"balance": balance, "service": "legacy"}
```

### PHASE 3: COMPLETE MIGRATION (Week 3)

Complete the migration and remove old services.

#### Step 3.1: Migrate Remaining Endpoints
```python
# Complete endpoint migration mapping:

# OLD SERVICE -> NEW SERVICE
wallet_security_service.set_pin() -> unified_wallet_service.set_transaction_pin()
wallet_security_service.verify_pin() -> unified_wallet_service.verify_pin()
wallet_security_service.generate_otp() -> unified_wallet_service.generate_otp()
wallet_security_service.verify_otp() -> unified_wallet_service.verify_otp()

withdrawal_service.initiate_withdrawal() -> unified_wallet_service.initiate_withdrawal()
withdrawal_service.process_withdrawal() -> unified_wallet_service.process_withdrawal()
withdrawal_service.get_user_withdrawals() -> unified_wallet_service.get_user_withdrawals()

multi_wallet_service.get_user_wallets() -> unified_wallet_service.get_user_wallets()
multi_wallet_service.transfer_between_wallets() -> unified_wallet_service.transfer_between_wallets()
multi_wallet_service.get_wallet_analytics() -> unified_wallet_service.get_wallet_analytics()

wallet_realtime_service.connect_user() -> unified_wallet_service.connect_user_realtime()
wallet_realtime_service.broadcast_update() -> unified_wallet_service.broadcast_wallet_update()
```

#### Step 3.2: Update WebSocket Router
```python
# routers/wallet_websocket.py
from services.unified_wallet_service import unified_wallet_service

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await unified_wallet_service.connect_user_realtime(
        websocket, 
        user_id, 
        ["balance", "transactions", "withdrawals"]
    )
```

#### Step 3.3: Remove Feature Flags
```python
# Remove all A/B testing code and feature flags
# All endpoints now use unified service exclusively
```

### PHASE 4: CLEANUP AND OPTIMIZATION (Week 4)

Remove old services and optimize the unified service.

#### Step 4.1: Remove Old Service Files
```bash
# Backup old services first
mkdir backup_services
mv services/multi_wallet_service.py backup_services/
mv services/wallet_security_service.py backup_services/
mv services/wallet_realtime_service.py backup_services/
mv services/withdrawal_service.py backup_services/

# Remove old imports from routers
# Update all test files
# Update documentation
```

#### Step 4.2: Database Integration
```python
# Replace in-memory storage with database
# Add database models for wallets, transactions, etc.
# Implement database persistence layer
```

#### Step 4.3: Performance Optimization
```python
# Add caching layer
# Optimize database queries
# Add connection pooling
# Implement batch operations
```

---

## 🔧 DETAILED MIGRATION STEPS

### Security Endpoints Migration

#### Before (Old Service):
```python
from services.wallet_security_service import wallet_security_service

@router.post("/security/set-pin")
async def set_pin(request: SetPinRequest, current_user: dict = Depends(get_current_user)):
    return wallet_security_service.set_pin(current_user["id"], request.pin, request.confirm_pin)

@router.post("/security/verify-pin")
async def verify_pin(request: VerifyPinRequest, current_user: dict = Depends(get_current_user)):
    return wallet_security_service.verify_pin(current_user["id"], request.pin)
```

#### After (Unified Service):
```python
from services.unified_wallet_service import unified_wallet_service

@router.post("/security/set-pin")
async def set_pin(request: SetPinRequest, current_user: dict = Depends(get_current_user)):
    return unified_wallet_service.set_transaction_pin(current_user["id"], request.pin)

@router.post("/security/verify-pin")
async def verify_pin(request: VerifyPinRequest, current_user: dict = Depends(get_current_user)):
    is_valid = unified_wallet_service.verify_pin(current_user["id"], request.pin)
    return {"success": is_valid, "message": "PIN verified" if is_valid else "Invalid PIN"}
```

### Withdrawal Endpoints Migration

#### Before (Old Service):
```python
from services.withdrawal_service import withdrawal_service

@router.post("/withdraw")
async def initiate_withdrawal(request: WithdrawalRequest, current_user: dict = Depends(get_current_user)):
    return withdrawal_service.initiate_withdrawal(current_user["id"], request.dict())

@router.get("/withdrawals")
async def get_withdrawals(current_user: dict = Depends(get_current_user)):
    return withdrawal_service.get_user_withdrawals(current_user["id"])
```

#### After (Unified Service):
```python
from services.unified_wallet_service import unified_wallet_service

@router.post("/withdraw")
async def initiate_withdrawal(request: WithdrawalRequest, current_user: dict = Depends(get_current_user)):
    return unified_wallet_service.initiate_withdrawal(current_user["id"], request.dict())

@router.get("/withdrawals")
async def get_withdrawals(current_user: dict = Depends(get_current_user)):
    return unified_wallet_service.get_user_withdrawals(current_user["id"])
```

### Multi-Wallet Endpoints Migration

#### Before (Old Service):
```python
from services.multi_wallet_service import multi_wallet_service

@router.get("/multi-wallets")
async def get_wallets(current_user: dict = Depends(get_current_user)):
    return multi_wallet_service.get_user_wallets(current_user["id"])

@router.post("/multi-wallets/transfer")
async def transfer_funds(request: TransferRequest, current_user: dict = Depends(get_current_user)):
    return multi_wallet_service.transfer_between_wallets(current_user["id"], request.dict())
```

#### After (Unified Service):
```python
from services.unified_wallet_service import unified_wallet_service

@router.get("/multi-wallets")
async def get_wallets(current_user: dict = Depends(get_current_user)):
    return unified_wallet_service.get_user_wallets(current_user["id"])

@router.post("/multi-wallets/transfer")
async def transfer_funds(request: TransferRequest, current_user: dict = Depends(get_current_user)):
    return unified_wallet_service.transfer_between_wallets(current_user["id"], request.dict())
```

---

## 🧪 TESTING STRATEGY

### Pre-Migration Testing
```bash
# Test unified service
python test_unified_wallet_service.py

# Test endpoint compatibility
python test_endpoint_migration.py

# Load testing
python test_wallet_load.py
```

### During Migration Testing
```bash
# A/B testing validation
python test_ab_migration.py

# Data consistency checks
python validate_data_consistency.py

# Performance monitoring
python monitor_migration_performance.py
```

### Post-Migration Testing
```bash
# Full system test
python test_complete_migration.py

# Regression testing
python test_wallet_regression.py

# User acceptance testing
python test_user_workflows.py
```

---

## 📊 MONITORING AND ROLLBACK

### Key Metrics to Monitor
- **Response Times**: Wallet operations should remain under 100ms
- **Error Rates**: Should not exceed 0.1%
- **Balance Accuracy**: Zero tolerance for balance discrepancies
- **Transaction Integrity**: All transactions must be recorded correctly

### Rollback Procedure
If issues are detected:

1. **Immediate**: Switch feature flag to disable unified service
2. **Short-term**: Route traffic back to old services
3. **Investigation**: Analyze logs and identify root cause
4. **Fix**: Address issues in unified service
5. **Re-deploy**: Gradual rollout again with fixes

### Rollback Script
```python
# rollback_migration.py
def rollback_to_old_services():
    """Emergency rollback to old services"""
    # Disable unified service
    os.environ["USE_UNIFIED_WALLET"] = "false"
    
    # Restore old service imports
    # Re-enable old endpoints
    # Notify team of rollback
    
    print("🔄 Rolled back to old wallet services")
```

---

## 📈 SUCCESS CRITERIA

### Technical Success Metrics
- [ ] **Zero Data Loss**: All wallet balances preserved
- [ ] **Zero Downtime**: No service interruption during migration
- [ ] **Performance**: Response times improved by 20%
- [ ] **Code Reduction**: 60% reduction in wallet service code
- [ ] **Test Coverage**: >95% test coverage for unified service

### Business Success Metrics
- [ ] **User Experience**: No user-reported issues
- [ ] **Feature Parity**: All existing features working
- [ ] **Reliability**: 99.9% uptime maintained
- [ ] **Maintainability**: Faster development of new wallet features

---

## 🚨 TROUBLESHOOTING

### Common Issues and Solutions

#### Issue: Balance Discrepancies
```python
# Solution: Run balance reconciliation
def reconcile_balances():
    for user_id in user_database:
        old_balance = user_database[user_id].get("balance", 0)
        new_balance = unified_wallet_service.get_wallet_balance(user_id)
        
        if abs(old_balance - new_balance) > 0.01:
            print(f"⚠️ Balance mismatch for {user_id}: {old_balance} vs {new_balance}")
```

#### Issue: Transaction History Missing
```python
# Solution: Migrate transaction history
def migrate_transaction_history():
    # Import transactions from old services
    # Ensure all transactions are in unified service
    pass
```

#### Issue: WebSocket Connections Failing
```python
# Solution: Gradual WebSocket migration
def migrate_websocket_connections():
    # Migrate connections during low-traffic periods
    # Implement graceful connection transfer
    pass
```

---

## 📞 SUPPORT AND CONTACTS

### Migration Team
- **Lead Developer**: Responsible for unified service implementation
- **DevOps Engineer**: Handles deployment and monitoring
- **QA Engineer**: Validates migration at each phase
- **Product Manager**: Coordinates with stakeholders

### Emergency Contacts
- **On-Call Developer**: For immediate technical issues
- **System Administrator**: For infrastructure problems
- **Database Administrator**: For data-related issues

---

## 📝 POST-MIGRATION CHECKLIST

### Immediate (Day 1)
- [ ] All endpoints using unified service
- [ ] Old services removed from codebase
- [ ] Monitoring dashboards updated
- [ ] Documentation updated

### Short-term (Week 1)
- [ ] Performance optimization completed
- [ ] Database integration implemented
- [ ] Caching layer added
- [ ] Load testing passed

### Long-term (Month 1)
- [ ] New wallet features developed using unified service
- [ ] Team trained on unified service architecture
- [ ] Maintenance procedures updated
- [ ] Success metrics achieved

---

## 🎉 CONCLUSION

This migration guide provides a comprehensive, step-by-step approach to consolidating the wallet services. The gradual migration strategy ensures zero downtime while maintaining data integrity and user experience.

**Key Benefits Achieved:**
- **Single Source of Truth** for all wallet operations
- **Reduced Complexity** from 4 services to 1 unified service
- **Improved Maintainability** with modular architecture
- **Enhanced Performance** with optimized operations
- **Better Testing** with comprehensive test coverage

The unified wallet service is now ready to serve as the foundation for future wallet features and improvements.