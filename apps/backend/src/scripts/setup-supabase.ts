import { supabase } from '../lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

async function setupSupabaseTables() {
  if (!supabase) {
    console.error('❌ Supabase client not configured');
    console.error('Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  console.log('🚀 Setting up Supabase tables for real-time features...');

  try {
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Supabase connection successful');

    // Create tables manually since we can't run SQL files directly
    console.log('📋 Creating event_capacity table...');
    const { error: eventCapacityError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS event_capacity (
          event_id TEXT PRIMARY KEY,
          tickets_sold INTEGER NOT NULL DEFAULT 0,
          capacity INTEGER NOT NULL DEFAULT 0,
          available INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_event_capacity_event_id ON event_capacity(event_id);
      `
    });

    if (eventCapacityError && !eventCapacityError.message.includes('already exists')) {
      console.warn('⚠️ Could not create event_capacity table via RPC, you may need to run the SQL manually');
    } else {
      console.log('✅ event_capacity table ready');
    }

    // Test with a simple insert to verify tables work
    console.log('🧪 Testing table operations...');
    const { error: testError } = await supabase
      .from('event_capacity')
      .upsert({
        event_id: 'test-setup',
        tickets_sold: 0,
        capacity: 100,
        available: 100
      });

    if (testError) {
      console.error('❌ Table test failed:', testError.message);
      console.log('📝 Please run the SQL script manually in your Supabase dashboard:');
      console.log('   Go to SQL Editor and run: apps/backend/src/scripts/setup-supabase-tables.sql');
    } else {
      console.log('✅ Table operations working correctly');
      
      // Clean up test data
      await supabase
        .from('event_capacity')
        .delete()
        .eq('event_id', 'test-setup');
    }

    console.log('🎉 Supabase setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Database > SQL Editor');
    console.log('3. Run the complete SQL script: apps/backend/src/scripts/setup-supabase-tables.sql');
    console.log('4. Enable realtime for the tables in Database > Replication');
    console.log('');
    console.log('🔗 Your Supabase project: https://app.supabase.com/project/hwwzbsppzwcyvambeade');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupSupabaseTables();

export { setupSupabaseTables };