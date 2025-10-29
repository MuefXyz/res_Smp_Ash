import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'GURU' && user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const extracurricularId = searchParams.get('extracurricularId');
    const coachId = searchParams.get('coachId');

    // Build where clause
    let whereClause: any = {};

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

    if (extracurricularId) {
      whereClause.extracurricularId = extracurricularId;
    }

    // If user is coach/staff, only show their own absences
    if (user.role === 'GURU' || user.role === 'STAFF') {
      whereClause.coachId = user.id;
    } else if (coachId) {
      whereClause.coachId = coachId;
    }

    const coachAbsences = await db.coachAbsence.findMany({
      where: whereClause,
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
            role: true,
          },
        },
        extracurricular: {
          select: {
            id: true,
            name: true,
            schedule: true,
            venue: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(coachAbsences);

  } catch (error) {
    console.error('Error fetching coach absences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'GURU' && user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { extracurricularId, status, reason, notes, startTime, endTime, participantCount } = body;

    // Validate required fields
    if (!extracurricularId || !status) {
      return NextResponse.json({ 
        error: 'Extracurricular ID and status are required' 
      }, { status: 400 });
    }

    // Get extracurricular to verify coach
    const extracurricular = await db.extracurricular.findUnique({
      where: { id: extracurricularId },
    });

    if (!extracurricular) {
      return NextResponse.json({ 
        error: 'Extracurricular not found' 
      }, { status: 404 });
    }

    // Check if user is the assigned coach or admin
    const actualCoachId = user.role === 'ADMIN' ? extracurricular.coachId : user.id;
    
    if (user.role !== 'ADMIN' && extracurricular.coachId !== user.id) {
      return NextResponse.json({ 
        error: 'You are not assigned as coach for this extracurricular' 
      }, { status: 403 });
    }

    // Check if already recorded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAbsence = await db.coachAbsence.findFirst({
      where: {
        coachId: actualCoachId,
        extracurricularId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    let coachAbsence;
    if (existingAbsence) {
      // Update existing absence
      coachAbsence = await db.coachAbsence.update({
        where: { id: existingAbsence.id },
        data: {
          status: status || 'HADIR',
          reason: reason || null,
          notes: notes || null,
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          participantCount: participantCount || null,
        },
      });
    } else {
      // Create new absence record
      coachAbsence = await db.coachAbsence.create({
        data: {
          coachId: actualCoachId,
          extracurricularId,
          status: status || 'HADIR',
          reason: reason || null,
          notes: notes || null,
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          participantCount: participantCount || null,
        },
      });
    }

    // Create notification for admin if not admin
    if (user.role !== 'ADMIN') {
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
          title: 'Absensi Pembina',
          message: `${user.name} telah ${action} absensi pembina ${extracurricular.name} (${status})`,
          type: 'ABSENCE',
        })),
      });
    }

    return NextResponse.json({
      message: existingAbsence ? 'Coach absence updated successfully' : 'Coach absence recorded successfully',
      coachAbsence,
      action: existingAbsence ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('Error recording coach absence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}