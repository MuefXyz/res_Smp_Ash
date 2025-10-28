import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'GURU') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const teacherId = decoded.id;
    const now = new Date();
    
    // Set waktu ke start of day untuk comparison
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Cek apakah ada check-in hari ini
    const existingLog = await db.teacherAttendanceLog.findFirst({
      where: {
        teacherId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (!existingLog || !existingLog.checkInTime) {
      return NextResponse.json({ 
        error: 'No check-in found for today' 
      }, { status: 404 });
    }

    if (existingLog.checkOutTime) {
      return NextResponse.json({ 
        error: 'Already checked out today' 
      }, { status: 409 });
    }

    // Update checkout time
    const attendanceLog = await db.teacherAttendanceLog.update({
      where: { id: existingLog.id },
      data: {
        checkOutTime: now
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Check-out successful',
      attendance: attendanceLog
    });

  } catch (error) {
    console.error('Error checking out:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}