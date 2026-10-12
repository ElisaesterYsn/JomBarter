import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdmin() {
  const emailOrUsername = process.argv[2];

  if (!emailOrUsername) {
    console.error('❌ Usage: npm run set-admin <email-or-username>');
    console.error('   Example: npm run set-admin user@example.com');
    process.exit(1);
  }

  try {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${emailOrUsername}`);
      console.error('   Make sure the user is registered first.');
      process.exit(1);
    }

    // Check if already admin
    if (user.role === 'ADMIN') {
      console.log(`✅ ${user.email} (${user.username}) is already an admin!`);
      process.exit(0);
    }

    // Update to admin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });

    console.log('✅ Successfully promoted user to admin!');
    console.log('');
    console.log('   User Details:');
    console.log(`   • Email:        ${updatedUser.email}`);
    console.log(`   • Username:     ${updatedUser.username}`);
    console.log(`   • Display Name: ${updatedUser.displayName}`);
    console.log(`   • Role:         ${updatedUser.role}`);
    console.log(`   • Status:       ${updatedUser.status}`);
    console.log('');
    console.log('   The user can now access the Admin Panel at /admin');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();
