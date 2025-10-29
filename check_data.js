import { db } from './src/lib/db';

async function checkData() {
  try {
    // Check users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cardId: true,
      }
    });
    console.log('=== USERS ===');
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.role}) - Card: ${user.cardId || 'None'}`);
    });

    // Check card scans
    const scans = await db.cardScan.findMany({
      include: {
        user: {
          select: {
            name: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log('\n=== CARD SCANS ===');
    console.log(`Total scans: ${scans.length}`);
    scans.forEach(scan => {
      console.log(`- ${scan.user.name} - ${scan.cardId} - ${scan.scanType} - ${scan.createdAt}`);
    });

    // Check absences
    const absences = await db.absence.findMany({
      include: {
        user: {
          select: {
            name: true,
            role: true,
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    });
    console.log('\n=== ABSENCES ===');
    console.log(`Total absences: ${absences.length}`);
    absences.forEach(absence => {
      console.log(`- ${absence.user.name} - ${absence.status} - ${absence.date}`);
    });

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await db.$disconnect();
  }
}

checkData();