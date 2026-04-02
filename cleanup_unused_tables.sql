-- ============================================================================
-- CLEANUP: Remove Unused Tables (OPTIONAL)
-- ============================================================================
-- WARNING: Only run this if you're sure these tables are not needed
-- This will permanently delete the tables and all their data


-- Drop conversations table
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop event_organizers table
DROP TABLE IF EXISTS event_organizers CASCADE;

-- Drop referrals table
DROP TABLE IF EXISTS referrals CASCADE;

-- Drop sponsorships table
DROP TABLE IF EXISTS sponsorships CASCADE;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'UNUSED TABLES REMOVED';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Removed: conversations';
  RAISE NOTICE 'Removed: event_organizers';
  RAISE NOTICE 'Removed: referrals';
  RAISE NOTICE 'Removed: sponsorships';
  RAISE NOTICE '============================================================================';
END $$;
