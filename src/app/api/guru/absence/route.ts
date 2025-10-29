import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Build where clause
    let whereClause: any = {
      userId: user.id,
    };

    if (dateParam) {
      const date = new Date(dateParam);
      const today = new Date(date);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      whereClause.date = {
        gte: today,
        lt: tomorrow,
      };
    }

    // Fetch absences
    const absences = await db.absence.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(absences);

  } catch (error) {
    console.error('Error fetching absences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { status, reason } = body;

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

    let absence;
    if (existingAbsence) {
      // Update existing absence
      absence = await db.absence.update({
        where: { id: existingAbsence.id },
        data: {
          status: status || 'HADIR',
          reason: reason || null
        }
      });
    } else {
      // Create new absence record
      absence = await db.absence.create({
        data: {
          userId: user.id,
          status: status || 'HADIR',
          date: new Date(),
          reason: reason || null
        },
      });
    }

    // Create notification for admin
    const admins = await db.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
    });

    const action = existingAbsence ? 'mengupdate' : 'melakukan';
    await db.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        title: 'Absensi Guru',
        message: `${user.name} telah ${action} absensi (${status || 'HADIR'}) hari ini`,
        type: 'ABSENCE',
      })),
    });

    return NextResponse.json({
      message: existingAbsence ? 'Absence updated successfully' : 'Absence recorded successfully',
      absence,
      action: existingAbsence ? 'updated' : 'created'
    });
  } catch (error) {
    console.error('Error recording absence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}