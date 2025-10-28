import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Cek jadwal hari ini
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Minggu = 7
    const schedule = await db.teacherSchedule.findFirst({
      where: {
        teacherId,
        dayOfWeek,
        isActive: true
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Cek log kehadiran hari ini
    const attendanceLog = await db.teacherAttendanceLog.findFirst({
      where: {
        teacherId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get attendance history for the week
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Start from Monday
    
    const weekLogs = await db.teacherAttendanceLog.findMany({
      where: {
        teacherId,
        date: {
          gte: weekStart,
          lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    return NextResponse.json({
      today: {
        date: now.toISOString(),
        hasSchedule: !!schedule,
        schedule: schedule ? {
          dayOfWeek: schedule.dayOfWeek,
          dayName: getDayName(schedule.dayOfWeek),
          subject: schedule.subject?.name || 'Umum',
          room: schedule.room
        } : null,
        attendance: attendanceLog ? {
          status: attendanceLog.status,
          checkInTime: attendanceLog.checkInTime,
          checkOutTime: attendanceLog.checkOutTime,
          notes: attendanceLog.notes
        } : null,
        canCheckIn: !attendanceLog?.checkInTime,
        canCheckOut: attendanceLog?.checkInTime && !attendanceLog?.checkOutTime
      },
      weekHistory: weekLogs.map(log => ({
        date: log.date,
        status: log.status,
        checkInTime: log.checkInTime,
        checkOutTime: log.checkOutTime,
        notes: log.notes
      }))
    });

  } catch (error) {
    console.error('Error fetching attendance status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];