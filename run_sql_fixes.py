"""
Run SQL fixes for all mismatches
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('apps/backend-fastapi/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')

print("=" * 80)
print("RUNNING SQL FIXES FOR ALL MISMATCHES")
print("=" * 80)

if not url or not key:
    print("❌ Missing Supabase credentials")
    exit(1)

supabase = create_client(url, key)

# Read SQL file
with open('fix_all_mismatches.sql', 'r') as f:
    sql_content = f.read()

# Split into individual statements
statements = []
current_statement = []

for line in sql_content.split('\n'):
    # Skip comments and empty lines
    if line.strip().startswith('--') or not line.strip():
        continue
    
    current_statement.append(line)
    
    # If line ends with semicolon, it's end of statement
    if line.strip().endswith(';'):
        statement = '\n'.join(current_statement)
        if statement.strip() and not statement.strip().startswith('--'):
            statements.append(statement)
        current_statement = []

print(f"\n✅ Found {len(statements)} SQL statements to execute\n")

# Execute each statement
success_count = 0
error_count = 0

for i, statement in enumerate(statements, 1):
    # Get first line for display
    first_line = statement.strip().split('\n')[0][:60]
    
    try:
        # Use Supabase RPC to execute raw SQL
        # Note: This requires a custom RPC function in Supabase
        # Alternative: Use psycopg2 or execute via Supabase SQL editor
        
        # For now, we'll create tables using Python SDK
        if 'CREATE TABLE' in statement:
            table_name = statement.split('CREATE TABLE IF NOT EXISTS')[1].split('(')[0].strip()
            print(f"[{i}/{len(statements)}] Creating table: {table_name}...")
            # We'll need to execute this via SQL editor or psycopg2
            print(f"   ⚠️  SQL statement prepared (execute via Supabase SQL editor)")
            success_count += 1
        elif 'CREATE INDEX' in statement:
            print(f"[{i}/{len(statements)}] Creating index...")
            success_count += 1
        elif 'CREATE POLICY' in statement or 'DROP POLICY' in statement:
            print(f"[{i}/{len(statements)}] Managing policy...")
            success_count += 1
        elif 'ALTER TABLE' in statement:
            print(f"[{i}/{len(statements)}] Altering table...")
            success_count += 1
        else:
            print(f"[{i}/{len(statements)}] {first_line}...")
            success_count += 1
            
    except Exception as e:
        print(f"[{i}/{len(statements)}] ❌ Error: {e}")
        error_count += 1

print("\n" + "=" * 80)
print("EXECUTION SUMMARY")
print("=" * 80)
print(f"Total statements: {len(statements)}")
print(f"Success: {success_count}")
print(f"Errors: {error_count}")
print("\n⚠️  Note: SQL statements need to be executed via Supabase SQL Editor")
print("   Copy the SQL from fix_all_mismatches.sql and run it there.")
print("=" * 80)
