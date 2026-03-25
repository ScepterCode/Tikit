"""
Database Migration Plan - Replace In-Memory Databases
Identifies all in-memory databases and provides migration strategy
"""

import os
from pathlib import Path
from typing import Dict, List, Any

class DatabaseMigrationPlan:
    """Plan for migrating from in-memory to persistent databases"""
    
    def __init__(self):
        self.in_memory_databases = {
            # User Management
            "user_database": {
                "files": ["simple_main.py", "auth_utils.py"],
                "structure": "Dict[str, Dict[str, Any]]",
                "description": "User accounts and authentication data",
                "priority": "CRITICAL",
                "migration_table": "users"
            },
            
            # Event Management  
            "events_database": {
                "files": ["simple_main.py"],
                "structure": "Dict[str, Dict[str, Any]]", 
                "description": "Event data and configurations",
                "priority": "CRITICAL",
                "migration_table": "events"
            },
            
            # Ticket Management
            "tickets_database": {
                "files": ["simple_main.py"],
                "structure": "List[Dict[str, Any]]",
                "description": "Ticket sales and reservations", 
                "priority": "CRITICAL",
                "migration_table": "tickets"
            },
            
            # Wallet System (Already Fixed)
            "wallet_balances": {
                "files": ["unified_wallet_service.py"],
                "structure": "Dict[str, float]",
                "description": "User wallet balances",
                "priority": "FIXED",
                "migration_table": "wallet_balances"
            },
            
            # Notifications
            "notifications_database": {
                "files": ["notification_service.py"],
                "structure": "Dict[str, List[Dict]]",
                "description": "User notifications and alerts",
                "priority": "HIGH", 
                "migration_table": "notifications"
            },
            
            # Analytics
            "analytics_data": {
                "files": ["analytics_service.py"],
                "structure": "Dict[str, Any]",
                "description": "Event and user analytics",
                "priority": "MEDIUM",
                "migration_table": "analytics"
            },
            
            # Chat/Messages
            "chat_messages": {
                "files": ["anonymous_chat_service.py"],
                "structure": "Dict[str, List[Dict]]", 
                "description": "Chat messages and conversations",
                "priority": "HIGH",
                "migration_table": "chat_messages"
            },
            
            # Secret Events
            "secret_events": {
                "files": ["secret_events_service.py"],
                "structure": "Dict[str, Dict[str, Any]]",
                "description": "Private event data",
                "priority": "HIGH", 
                "migration_table": "secret_events"
            },
            
            # Membership Data
            "membership_data": {
                "files": ["membership_service.py"],
                "structure": "Dict[str, Dict[str, Any]]",
                "description": "Premium membership information",
                "priority": "HIGH",
                "migration_table": "memberships"
            },
            
            # Session Management
            "active_sessions": {
                "files": ["simple_main.py"],
                "structure": "Dict[str, Dict[str, Any]]",
                "description": "Active user sessions",
                "priority": "MEDIUM",
                "migration_table": "sessions"
            },
            
            # WebSocket Connections
            "websocket_connections": {
                "files": ["realtime_service.py", "websocket.py"],
                "structure": "Dict[str, WebSocket]",
                "description": "Active WebSocket connections",
                "priority": "LOW",
                "migration_table": "N/A (Runtime only)"
            }
        }
    
    def generate_migration_sql(self) -> str:
        """Generate SQL for creating persistent database tables"""
        sql_statements = []
        
        # Users table
        sql_statements.append("""
-- Users table (replaces user_database)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'attendee',
    state VARCHAR(100),
    organization_name VARCHAR(255),
    organization_type VARCHAR(100),
    wallet_balance DECIMAL(10,2) DEFAULT 10000.00,
    is_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
""")
        
        # Events table
        sql_statements.append("""
-- Events table (replaces events_database)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organizer_id UUID REFERENCES users(id),
    date_time TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    ticket_price DECIMAL(10,2),
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    is_secret BOOLEAN DEFAULT FALSE,
    access_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
""")
        
        # Tickets table
        sql_statements.append("""
-- Tickets table (replaces tickets_database)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES users(id),
    ticket_type VARCHAR(100),
    price DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active',
    qr_code VARCHAR(255),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
""")
        
        # Wallet balances table
        sql_statements.append("""
-- Wallet balances table (replaces wallet_balances)
CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    wallet_type VARCHAR(50) DEFAULT 'main',
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'NGN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_type)
);
""")
        
        # Notifications table
        sql_statements.append("""
-- Notifications table (replaces notifications_database)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
""")
        
        # Chat messages table
        sql_statements.append("""
-- Chat messages table (replaces chat_messages)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    anonymous_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
""")
        
        # Secret events table
        sql_statements.append("""
-- Secret events table (replaces secret_events)
CREATE TABLE IF NOT EXISTS secret_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    access_code VARCHAR(50) UNIQUE NOT NULL,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
""")
        
        # Memberships table
        sql_statements.append("""
-- Memberships table (replaces membership_data)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    membership_type VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(50) DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
""")
        
        # Sessions table
        sql_statements.append("""
-- Sessions table (replaces active_sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
""")
        
        # Analytics table
        sql_statements.append("""
-- Analytics table (replaces analytics_data)
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
""")
        
        # Indexes for performance
        sql_statements.append("""
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(date_time);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_event ON chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
""")
        
        return "\n".join(sql_statements)
    
    def generate_migration_report(self) -> str:
        """Generate a detailed migration report"""
        report = []
        report.append("# 🗄️ DATABASE MIGRATION REPORT")
        report.append("## In-Memory Database Analysis")
        report.append("")
        
        critical_count = sum(1 for db in self.in_memory_databases.values() if db["priority"] == "CRITICAL")
        high_count = sum(1 for db in self.in_memory_databases.values() if db["priority"] == "HIGH")
        fixed_count = sum(1 for db in self.in_memory_databases.values() if db["priority"] == "FIXED")
        
        report.append(f"**Total In-Memory Databases Found**: {len(self.in_memory_databases)}")
        report.append(f"- 🔴 Critical Priority: {critical_count}")
        report.append(f"- 🟡 High Priority: {high_count}")
        report.append(f"- ✅ Already Fixed: {fixed_count}")
        report.append("")
        
        # Detailed breakdown
        for db_name, db_info in self.in_memory_databases.items():
            priority_emoji = {
                "CRITICAL": "🔴",
                "HIGH": "🟡", 
                "MEDIUM": "🟠",
                "LOW": "🟢",
                "FIXED": "✅"
            }.get(db_info["priority"], "❓")
            
            report.append(f"### {priority_emoji} {db_name}")
            report.append(f"- **Files**: {', '.join(db_info['files'])}")
            report.append(f"- **Structure**: `{db_info['structure']}`")
            report.append(f"- **Description**: {db_info['description']}")
            report.append(f"- **Migration Table**: `{db_info['migration_table']}`")
            report.append("")
        
        # Migration strategy
        report.append("## 🚀 MIGRATION STRATEGY")
        report.append("")
        report.append("### Phase 1: Critical Data (Immediate)")
        report.append("1. **Users Database** - User accounts and authentication")
        report.append("2. **Events Database** - Event data and configurations") 
        report.append("3. **Tickets Database** - Ticket sales and reservations")
        report.append("")
        report.append("### Phase 2: High Priority (This Week)")
        report.append("1. **Notifications** - User notifications and alerts")
        report.append("2. **Chat Messages** - Chat and messaging data")
        report.append("3. **Secret Events** - Private event information")
        report.append("4. **Memberships** - Premium membership data")
        report.append("")
        report.append("### Phase 3: Medium/Low Priority (Next Week)")
        report.append("1. **Analytics** - Event and user analytics")
        report.append("2. **Sessions** - Active user sessions")
        report.append("")
        report.append("## 📋 IMPLEMENTATION STEPS")
        report.append("")
        report.append("1. **Create Database Schema** - Run migration SQL")
        report.append("2. **Update Service Layer** - Replace in-memory with database calls")
        report.append("3. **Data Migration** - Migrate existing data (if any)")
        report.append("4. **Testing** - Comprehensive testing of all features")
        report.append("5. **Deployment** - Deploy with persistent database")
        
        return "\n".join(report)

def main():
    """Generate migration plan and SQL"""
    migration_plan = DatabaseMigrationPlan()
    
    # Generate migration SQL
    sql_content = migration_plan.generate_migration_sql()
    with open("database_migration.sql", "w", encoding='utf-8') as f:
        f.write(sql_content)
    
    # Generate migration report
    report_content = migration_plan.generate_migration_report()
    with open("DATABASE_MIGRATION_REPORT.md", "w", encoding='utf-8') as f:
        f.write(report_content)
    
    print("✅ Database migration plan generated!")
    print("   📄 database_migration.sql - SQL schema for persistent database")
    print("   📋 DATABASE_MIGRATION_REPORT.md - Detailed migration report")

if __name__ == "__main__":
    main()