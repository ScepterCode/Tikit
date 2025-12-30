import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Checking for admin users...\n');

    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        adminLevel: true,
        isVerified: true,
        createdAt: true,
      }
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found.');
      console.log('Run "node create-admin.js" to create an admin user.');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      
      adminUsers.forEach((admin, index) => {
        console.log(`Admin ${index + 1}:`);
        console.log(`  📱 Phone: ${admin.phoneNumber}`);
        console.log(`  👤 Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`  📧 Email: ${admin.email || 'Not set'}`);
        console.log(`  🔒 Admin Level: ${admin.adminLevel || 'Not set'}`);
        console.log(`  ✅ Verified: ${admin.isVerified ? 'Yes' : 'No'}`);
        console.log(`  📅 Created: ${admin.createdAt.toLocaleDateString()}`);
        console.log('');
      });

      console.log('🔐 Admin Login Instructions:');
      console.log('1. Go to: http://localhost:3000/admin/login');
      console.log('2. Use the phone number and password from above');
      console.log('3. You will be redirected to the admin dashboard');
    }

  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();