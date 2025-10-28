import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'GURU') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already absent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAbsence = await db.absence.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingAbsence) {
      return NextResponse.json({ error: 'Already absent today' }, { status: 400 });
    }

    // Create absence record
    const absence = await db.absence.create({
      data: {
        userId: user.id,
        status: 'HADIR',
        date: new Date(),
      },
    });

    // Create notification for admin
    const admins = await db.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
    });

    await db.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        title: 'Absensi Guru',
        message: `${user.name} telah melakukan absensi hari ini`,
        type: 'ABSENCE',
      })),
    });

    return NextResponse.json(absence);
  } catch (error) {
    console.error('Error recording absence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}