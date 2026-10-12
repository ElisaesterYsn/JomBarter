import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('📭 No users found in the database.');
      console.log('   Register a user first at http://localhost:3000/register');
      process.exit(0);
    }

    console.log(`\n📋 Found ${users.length} user${users.length === 1 ? '' : 's'}:\n`);

    users.forEach((user, index) => {
      const roleIcon = user.role === 'ADMIN' ? '👑' : '👤';
      const statusIcon = user.status === 'ACTIVE' ? '✅' : user.status === 'SUSPENDED' ? '⏸️' : '🚫';

      console.log(`${index + 1}. ${roleIcon} ${user.displayName} (${user.username})`);
      console.log(`   Email:   ${user.email}`);
      console.log(`   Role:    ${user.role}`);
      console.log(`   Status:  ${statusIcon} ${user.status}`);
      console.log(`   Joined:  ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    if (adminCount === 0) {
      console.log('💡 Tip: Promote a user to admin with:');
      console.log(`   npm run set-admin ${users[0].email}\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
