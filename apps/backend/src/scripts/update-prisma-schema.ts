import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function updatePrismaSchema() {
  const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
  
  console.log('🔄 Updating Prisma schema for Supabase...');
  
  try {
    let schema = readFileSync(schemaPath, 'utf-8');
    
    // Update datasource to use PostgreSQL
    schema = schema.replace(
      /datasource db \{[\s\S]*?\}/,
      `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
    );
    
    // Convert SQLite-specific field names to PostgreSQL snake_case
    const fieldMappings = [
      // User model
      ['phoneNumber', 'phone_number'],
      ['phoneVerified', 'phone_verified'],
      ['firstName', 'first_name'],
      ['lastName', 'last_name'],
      ['preferredLanguage', 'preferred_language'],
      ['walletBalance', 'wallet_balance'],
      ['referralCode', 'referral_code'],
      ['referredBy', 'referred_by'],
      ['organizationName', 'organization_name'],
      ['organizationType', 'organization_type'],
      ['bankDetails', 'bank_details'],
      ['isVerified', 'is_verified'],
      ['verifiedAt', 'verified_at'],
      ['adminLevel', 'admin_level'],
      ['createdAt', 'created_at'],
      ['updatedAt', 'updated_at'],
      
      // Event model
      ['organizerId', 'organizer_id'],
      ['eventType', 'event_type'],
      ['startDate', 'start_date'],
      ['endDate', 'end_date'],
      ['isHidden', 'is_hidden'],
      ['accessCode', 'access_code'],
      ['deepLink', 'deep_link'],
      ['ticketsSold', 'tickets_sold'],
      ['culturalFeatures', 'cultural_features'],
      ['ussdCode', 'ussd_code'],
      
      // Ticket model
      ['eventId', 'event_id'],
      ['userId', 'user_id'],
      ['tierId', 'tier_id'],
      ['qrCode', 'qr_code'],
      ['backupCode', 'backup_code'],
      ['purchaseDate', 'purchase_date'],
      ['usedAt', 'used_at'],
      ['scannedBy', 'scanned_by'],
      ['groupBuyId', 'group_buy_id'],
      ['culturalSelections', 'cultural_selections'],
      
      // Payment model
      ['ticketId', 'ticket_id'],
      ['isInstallment', 'is_installment'],
      ['installmentPlan', 'installment_plan'],
      
      // GroupBuy model
      ['initiatorId', 'initiator_id'],
      ['totalParticipants', 'total_participants'],
      ['currentParticipants', 'current_participants'],
      ['pricePerPerson', 'price_per_person'],
      ['expiresAt', 'expires_at'],
      
      // Referral model
      ['referrerId', 'referrer_id'],
      ['referredUserId', 'referred_user_id'],
      ['rewardAmount', 'reward_amount'],
      ['rewardPaid', 'reward_paid'],
      ['completedAt', 'completed_at'],
      
      // ScanHistory model
      ['ticketId', 'ticket_id'],
      ['scannedBy', 'scanned_by'],
      ['scannedAt', 'scanned_at'],
      ['deviceInfo', 'device_info'],
      
      // EventOrganizer model
      ['eventId', 'event_id'],
      
      // Sponsorship model
      ['requesterId', 'requester_id'],
      ['sponsorPhone', 'sponsor_phone'],
      ['eventId', 'event_id'],
      ['tierId', 'tier_id'],
      ['approvedAt', 'approved_at'],
    ];
    
    // Apply field mappings
    fieldMappings.forEach(([camelCase, snake_case]) => {
      // Update field definitions
      const fieldRegex = new RegExp(`\\b${camelCase}\\s+`, 'g');
      schema = schema.replace(fieldRegex, `${snake_case} `);
      
      // Update @map attributes
      const mapRegex = new RegExp(`@map\\("${camelCase}"\\)`, 'g');
      schema = schema.replace(mapRegex, `@map("${snake_case}")`);
    });
    
    // Add @map attributes for fields that don't have them
    fieldMappings.forEach(([camelCase, snake_case]) => {
      if (camelCase !== snake_case) {
        const fieldWithoutMap = new RegExp(`(\\s+${snake_case}\\s+[^\\n]+)(?!.*@map)`, 'g');
        schema = schema.replace(fieldWithoutMap, `$1 @map("${snake_case}")`);
      }
    });
    
    // Update table names to use snake_case
    const tableNames = [
      ['User', 'users'],
      ['Event', 'events'],
      ['Ticket', 'tickets'],
      ['Payment', 'payments'],
      ['GroupBuy', 'group_buys'],
      ['Referral', 'referrals'],
      ['ScanHistory', 'scan_history'],
      ['EventOrganizer', 'event_organizers'],
      ['Sponsorship', 'sponsorships'],
    ];
    
    tableNames.forEach(([pascalCase, snake_case]) => {
      // Add @@map attribute to models
      const modelRegex = new RegExp(`(model ${pascalCase} \\{[\\s\\S]*?)(\\n\\})`);
      schema = schema.replace(modelRegex, `$1\n  @@map("${snake_case}")$2`);
    });
    
    // Write updated schema
    writeFileSync(schemaPath, schema);
    
    console.log('✅ Prisma schema updated for Supabase PostgreSQL');
    console.log('📝 Next steps:');
    console.log('   1. Update your DATABASE_URL to point to Supabase');
    console.log('   2. Run: npx prisma generate');
    console.log('   3. Run: npx prisma db push');
    
  } catch (error) {
    console.error('❌ Failed to update Prisma schema:', error);
    throw error;
  }
}

if (require.main === module) {
  updatePrismaSchema();
}

export { updatePrismaSchema };