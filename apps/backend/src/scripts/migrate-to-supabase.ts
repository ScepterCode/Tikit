import { PrismaClient } from '@prisma/client';
import { supabase } from '../lib/supabase';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface MigrationStats {
  users: number;
  events: number;
  tickets: number;
  payments: number;
  groupBuys: number;
  referrals: number;
  scanHistory: number;
  eventOrganizers: number;
  sponsorships: number;
}

class SupabaseMigration {
  private stats: MigrationStats = {
    users: 0,
    events: 0,
    tickets: 0,
    payments: 0,
    groupBuys: 0,
    referrals: 0,
    scanHistory: 0,
    eventOrganizers: 0,
    sponsorships: 0,
  };

  async exportSQLiteData() {
    console.log('🔄 Exporting data from SQLite...');

    try {
      // Export Users
      const users = await prisma.user.findMany();
      this.stats.users = users.length;
      this.saveToFile('users.json', users);
      console.log(`✅ Exported ${users.length} users`);

      // Export Events
      const events = await prisma.event.findMany();
      this.stats.events = events.length;
      this.saveToFile('events.json', events);
      console.log(`✅ Exported ${events.length} events`);

      // Export Tickets
      const tickets = await prisma.ticket.findMany();
      this.stats.tickets = tickets.length;
      this.saveToFile('tickets.json', tickets);
      console.log(`✅ Exported ${tickets.length} tickets`);

      // Export Payments
      const payments = await prisma.payment.findMany();
      this.stats.payments = payments.length;
      this.saveToFile('payments.json', payments);
      console.log(`✅ Exported ${payments.length} payments`);

      // Export GroupBuys
      const groupBuys = await prisma.groupBuy.findMany();
      this.stats.groupBuys = groupBuys.length;
      this.saveToFile('groupBuys.json', groupBuys);
      console.log(`✅ Exported ${groupBuys.length} group buys`);

      // Export Referrals
      const referrals = await prisma.referral.findMany();
      this.stats.referrals = referrals.length;
      this.saveToFile('referrals.json', referrals);
      console.log(`✅ Exported ${referrals.length} referrals`);

      // Export ScanHistory
      const scanHistory = await prisma.scanHistory.findMany();
      this.stats.scanHistory = scanHistory.length;
      this.saveToFile('scanHistory.json', scanHistory);
      console.log(`✅ Exported ${scanHistory.length} scan history records`);

      // Export EventOrganizers
      const eventOrganizers = await prisma.eventOrganizer.findMany();
      this.stats.eventOrganizers = eventOrganizers.length;
      this.saveToFile('eventOrganizers.json', eventOrganizers);
      console.log(`✅ Exported ${eventOrganizers.length} event organizers`);

      // Export Sponsorships
      const sponsorships = await prisma.sponsorship.findMany();
      this.stats.sponsorships = sponsorships.length;
      this.saveToFile('sponsorships.json', sponsorships);
      console.log(`✅ Exported ${sponsorships.length} sponsorships`);

      console.log('📊 Export Summary:', this.stats);
      this.saveToFile('migration-stats.json', this.stats);

    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }

  async importToSupabase() {
    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    console.log('🔄 Importing data to Supabase...');

    try {
      // Import Users first (other tables depend on users)
      await this.importUsers();
      
      // Import Events (tickets depend on events)
      await this.importEvents();
      
      // Import other tables
      await this.importTickets();
      await this.importPayments();
      await this.importGroupBuys();
      await this.importReferrals();
      await this.importScanHistory();
      await this.importEventOrganizers();
      await this.importSponsorships();

      console.log('🎉 Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }

  private async importUsers() {
    const users = this.loadFromFile('users.json');
    console.log(`📥 Importing ${users.length} users...`);

    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('users')
        .insert(batch.map(user => ({
          id: user.id,
          phone_number: user.phoneNumber,
          phone_verified: user.phoneVerified,
          password: user.password,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          preferred_language: user.preferredLanguage,
          state: user.state,
          lga: user.lga,
          role: user.role,
          wallet_balance: user.walletBalance,
          referral_code: user.referralCode,
          referred_by: user.referredBy,
          organization_name: user.organizationName,
          organization_type: user.organizationType,
          bank_details: user.bankDetails,
          is_verified: user.isVerified,
          verified_at: user.verifiedAt,
          admin_level: user.adminLevel,
          permissions: user.permissions,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        })));

      if (error) {
        console.error(`❌ Error importing users batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Imported users batch ${i / batchSize + 1}/${Math.ceil(users.length / batchSize)}`);
    }
  }

  private async importEvents() {
    const events = this.loadFromFile('events.json');
    console.log(`📥 Importing ${events.length} events...`);

    const batchSize = 50;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('events')
        .insert(batch.map(event => ({
          id: event.id,
          organizer_id: event.organizerId,
          title: event.title,
          description: event.description,
          event_type: event.eventType,
          start_date: event.startDate,
          end_date: event.endDate,
          venue: event.venue,
          state: event.state,
          lga: event.lga,
          latitude: event.latitude,
          longitude: event.longitude,
          is_hidden: event.isHidden,
          access_code: event.accessCode,
          deep_link: event.deepLink,
          capacity: event.capacity,
          tickets_sold: event.ticketsSold,
          tiers: event.tiers,
          cultural_features: event.culturalFeatures,
          images: event.images,
          ussd_code: event.ussdCode,
          status: event.status,
          created_at: event.createdAt,
          updated_at: event.updatedAt,
        })));

      if (error) {
        console.error(`❌ Error importing events batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Imported events batch ${i / batchSize + 1}/${Math.ceil(events.length / batchSize)}`);
    }
  }

  private async importTickets() {
    const tickets = this.loadFromFile('tickets.json');
    console.log(`📥 Importing ${tickets.length} tickets...`);

    const batchSize = 100;
    for (let i = 0; i < tickets.length; i += batchSize) {
      const batch = tickets.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('tickets')
        .insert(batch.map(ticket => ({
          id: ticket.id,
          event_id: ticket.eventId,
          user_id: ticket.userId,
          tier_id: ticket.tierId,
          qr_code: ticket.qrCode,
          backup_code: ticket.backupCode,
          status: ticket.status,
          purchase_date: ticket.purchaseDate,
          used_at: ticket.usedAt,
          scanned_by: ticket.scannedBy,
          group_buy_id: ticket.groupBuyId,
          cultural_selections: ticket.culturalSelections,
          created_at: ticket.createdAt,
          updated_at: ticket.updatedAt,
        })));

      if (error) {
        console.error(`❌ Error importing tickets batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Imported tickets batch ${i / batchSize + 1}/${Math.ceil(tickets.length / batchSize)}`);
    }
  }

  private async importPayments() {
    const payments = this.loadFromFile('payments.json');
    console.log(`📥 Importing ${payments.length} payments...`);

    const batchSize = 100;
    for (let i = 0; i < payments.length; i += batchSize) {
      const batch = payments.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('payments')
        .insert(batch.map(payment => ({
          id: payment.id,
          user_id: payment.userId,
          ticket_id: payment.ticketId,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          provider: payment.provider,
          reference: payment.reference,
          metadata: payment.metadata,
          is_installment: payment.isInstallment,
          installment_plan: payment.installmentPlan,
          created_at: payment.createdAt,
          updated_at: payment.updatedAt,
        })));

      if (error) {
        console.error(`❌ Error importing payments batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Imported payments batch ${i / batchSize + 1}/${Math.ceil(payments.length / batchSize)}`);
    }
  }

  private async importGroupBuys() {
    const groupBuys = this.loadFromFile('groupBuys.json');
    console.log(`📥 Importing ${groupBuys.length} group buys...`);

    const batchSize = 50;
    for (let i = 0; i < groupBuys.length; i += batchSize) {
      const batch = groupBuys.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('group_buys')
        .insert(batch.map(groupBuy => ({
          id: groupBuy.id,
          event_id: groupBuy.eventId,
          initiator_id: groupBuy.initiatorId,
          total_participants: groupBuy.totalParticipants,
          current_participants: groupBuy.currentParticipants,
          price_per_person: groupBuy.pricePerPerson,
          expires_at: groupBuy.expiresAt,
          status: groupBuy.status,
          participants: groupBuy.participants,
          created_at: groupBuy.createdAt,
          updated_at: groupBuy.updatedAt,
        })));

      if (error) {
        console.error(`❌ Error importing group buys batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Imported group buys batch ${i / batchSize + 1}/${Math.ceil(groupBuys.length / batchSize)}`);
    }
  }

  private async importReferrals() {
    const referrals = this.loadFromFile('referrals.json');
    console.log(`📥 Importing ${referrals.length} referrals...`);

    const batchSize = 100;
    for (let i = 0; i < referrals.length; i += batchSize) {
      const batch = referrals.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('referrals')
        .insert(batch.map(referral => ({
          id: referral.id,
          referrer_id: referral.referrerId,
          referred_user_id: referral.referredUserId,
          status: referral.status,
          reward_amount: referral.rewardAmount,
          reward_paid: referral.rewardPaid,
          created_at: referral.createdAt,
          completed_at: referral.completedAt,
        })));

      if (error) {
        console.error(`❌ Error importing referrals batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Imported referrals batch ${i / batchSize + 1}/${Math.ceil(referrals.length / batchSize)}`);
    }
  }

  private async importScanHistory() {
    const scanHistory = this.loadFromFile('scanHistory.json');
    console.log(`📥 Importing ${scanHistory.length} scan history records...`);

    const batchSize = 100;
    for (let i = 0; i < scanHistory.length; i += batchSize) {
      const batch = scanHistory.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('scan_history')
        .insert(batch.map(scan => ({
          id: scan.id,
          ticket_id: scan.ticketId,
          scanned_by: scan.scannedBy,
          scanned_at: scan.scannedAt,
          location: scan.location,
          device_info: scan.deviceInfo,
          result: scan.result,
        })));

      if (error) {
        console.error(`❌ Error importing scan history batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Imported scan history batch ${i / batchSize + 1}/${Math.ceil(scanHistory.length / batchSize)}`);
    }
  }

  private async importEventOrganizers() {
    const eventOrganizers = this.loadFromFile('eventOrganizers.json');
    console.log(`📥 Importing ${eventOrganizers.length} event organizers...`);

    const batchSize = 100;
    for (let i = 0; i < eventOrganizers.length; i += batchSize) {
      const batch = eventOrganizers.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('event_organizers')
        .insert(batch.map(organizer => ({
          id: organizer.id,
          event_id: organizer.eventId,
          user_id: organizer.userId,
          role: organizer.role,
          permissions: organizer.permissions,
          created_at: organizer.createdAt,
          updated_at: organizer.updatedAt,
        })));

      if (error) {
        console.error(`❌ Error importing event organizers batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Imported event organizers batch ${i / batchSize + 1}/${Math.ceil(eventOrganizers.length / batchSize)}`);
    }
  }

  private async importSponsorships() {
    const sponsorships = this.loadFromFile('sponsorships.json');
    console.log(`📥 Importing ${sponsorships.length} sponsorships...`);

    const batchSize = 100;
    for (let i = 0; i < sponsorships.length; i += batchSize) {
      const batch = sponsorships.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('sponsorships')
        .insert(batch.map(sponsorship => ({
          id: sponsorship.id,
          requester_id: sponsorship.requesterId,
          sponsor_phone: sponsorship.sponsorPhone,
          code: sponsorship.code,
          event_id: sponsorship.eventId,
          tier_id: sponsorship.tierId,
          amount: sponsorship.amount,
          status: sponsorship.status,
          created_at: sponsorship.createdAt,
          approved_at: sponsorship.approvedAt,
          expires_at: sponsorship.expiresAt,
        })));

      if (error) {
        console.error(`❌ Error importing sponsorships batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Imported sponsorships batch ${i / batchSize + 1}/${Math.ceil(sponsorships.length / batchSize)}`);
    }
  }

  private saveToFile(filename: string, data: any) {
    const filePath = join(process.cwd(), 'migration-data', filename);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  private loadFromFile(filename: string): any[] {
    const filePath = join(process.cwd(), 'migration-data', filename);
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async validateMigration() {
    console.log('🔍 Validating migration...');

    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    const validationResults = {
      users: { sqlite: 0, supabase: 0, match: false },
      events: { sqlite: 0, supabase: 0, match: false },
      tickets: { sqlite: 0, supabase: 0, match: false },
      payments: { sqlite: 0, supabase: 0, match: false },
      groupBuys: { sqlite: 0, supabase: 0, match: false },
      referrals: { sqlite: 0, supabase: 0, match: false },
      scanHistory: { sqlite: 0, supabase: 0, match: false },
      eventOrganizers: { sqlite: 0, supabase: 0, match: false },
      sponsorships: { sqlite: 0, supabase: 0, match: false },
    };

    try {
      // Count SQLite records
      validationResults.users.sqlite = await prisma.user.count();
      validationResults.events.sqlite = await prisma.event.count();
      validationResults.tickets.sqlite = await prisma.ticket.count();
      validationResults.payments.sqlite = await prisma.payment.count();
      validationResults.groupBuys.sqlite = await prisma.groupBuy.count();
      validationResults.referrals.sqlite = await prisma.referral.count();
      validationResults.scanHistory.sqlite = await prisma.scanHistory.count();
      validationResults.eventOrganizers.sqlite = await prisma.eventOrganizer.count();
      validationResults.sponsorships.sqlite = await prisma.sponsorship.count();

      // Count Supabase records
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
      const { count: ticketsCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true });
      const { count: paymentsCount } = await supabase.from('payments').select('*', { count: 'exact', head: true });
      const { count: groupBuysCount } = await supabase.from('group_buys').select('*', { count: 'exact', head: true });
      const { count: referralsCount } = await supabase.from('referrals').select('*', { count: 'exact', head: true });
      const { count: scanHistoryCount } = await supabase.from('scan_history').select('*', { count: 'exact', head: true });
      const { count: eventOrganizersCount } = await supabase.from('event_organizers').select('*', { count: 'exact', head: true });
      const { count: sponsorshipsCount } = await supabase.from('sponsorships').select('*', { count: 'exact', head: true });

      validationResults.users.supabase = usersCount || 0;
      validationResults.events.supabase = eventsCount || 0;
      validationResults.tickets.supabase = ticketsCount || 0;
      validationResults.payments.supabase = paymentsCount || 0;
      validationResults.groupBuys.supabase = groupBuysCount || 0;
      validationResults.referrals.supabase = referralsCount || 0;
      validationResults.scanHistory.supabase = scanHistoryCount || 0;
      validationResults.eventOrganizers.supabase = eventOrganizersCount || 0;
      validationResults.sponsorships.supabase = sponsorshipsCount || 0;

      // Check matches
      Object.keys(validationResults).forEach(key => {
        const result = validationResults[key as keyof typeof validationResults];
        result.match = result.sqlite === result.supabase;
      });

      console.log('📊 Validation Results:');
      console.table(validationResults);

      const allMatch = Object.values(validationResults).every(result => result.match);
      
      if (allMatch) {
        console.log('✅ Migration validation successful! All record counts match.');
      } else {
        console.log('❌ Migration validation failed! Some record counts do not match.');
      }

      return { success: allMatch, results: validationResults };

    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const migration = new SupabaseMigration();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'export':
        await migration.exportSQLiteData();
        break;
      
      case 'import':
        await migration.importToSupabase();
        break;
      
      case 'migrate':
        await migration.exportSQLiteData();
        await migration.importToSupabase();
        await migration.validateMigration();
        break;
      
      case 'validate':
        await migration.validateMigration();
        break;
      
      default:
        console.log('Usage: npx tsx migrate-to-supabase.ts [export|import|migrate|validate]');
        console.log('');
        console.log('Commands:');
        console.log('  export   - Export data from SQLite to JSON files');
        console.log('  import   - Import data from JSON files to Supabase');
        console.log('  migrate  - Full migration (export + import + validate)');
        console.log('  validate - Validate migration by comparing record counts');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { SupabaseMigration };