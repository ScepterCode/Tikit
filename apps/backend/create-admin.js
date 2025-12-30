import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('Phone:', existingAdmin.phoneNumber);
      console.log('Name:', existingAdmin.firstName, existingAdmin.lastName);
      
      // Update the existing admin with a known password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          role: 'admin',
          adminLevel: 'super',
          permissions: JSON.stringify(['all']),
          isVerified: true,
        }
      });
      
      console.log('✅ Admin password updated to: admin123');
      console.log('📱 Phone:', existingAdmin.phoneNumber);
      console.log('🔑 Password: admin123');
      return;
    }

    // Generate referral code
    const generateReferralCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    // Hash password
    const password = 'admin123'; // Default admin password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user with a different phone number
    const admin = await prisma.user.create({
      data: {
        phoneNumber: '+2349012345678', // Different admin phone
        password: hashedPassword,
        phoneVerified: true,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@tikit.com',
        state: 'Lagos',
        preferredLanguage: 'en',
        role: 'admin',
        referralCode: generateReferralCode(),
        walletBalance: 0,
        isVerified: true,
        adminLevel: 'super',
        permissions: JSON.stringify(['all']),
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📱 Phone: +2349012345678');
    console.log('🔑 Password: admin123');
    console.log('👤 Name: Admin User');
    console.log('📧 Email: admin@tikit.com');
    console.log('');
    console.log('You can now login with these credentials to access the admin dashboard.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();