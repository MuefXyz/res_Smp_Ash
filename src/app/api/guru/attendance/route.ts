import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Guru melihat jadwal dan kehadirannya
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'GURU') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    // Get current week schedule
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Get teacher's schedule
    const schedules = await db.teacherSchedule.findMany({
      where: {
        teacherId: decoded.userId,
        isActive: true
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Get attendance logs for the week
    const attendanceLogs = await db.teacherAttendanceLog.findMany({
      where: {
        teacherId: decoded.userId,
        date: {
          gte: currentWeekStart,
          lte: currentWeekEnd
        }
      },
      orderBy: { date: 'asc' }
    });

    // Generate week data with schedule and attendance
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(currentWeekStart);
      currentDate.setDate(currentWeekStart.getDate() + i);
      
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
      const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
      const attendanceLog = attendanceLogs.find(log => 
        log.date.toDateString() === currentDate.toDateString()
      );

      weekData.push({
        date: currentDate.toISOString(),
        dayName: getDayName(dayOfWeek),
        dayOfWeek,
        schedule: daySchedule,
        attendance: attendanceLog,
        isToday: currentDate.toDateString() === today.toDateString()
      });
    }

    return NextResponse.json({
      weekData,
      schedules,
      currentWeekStart: currentWeekStart.toISOString(),
      currentWeekEnd: currentWeekEnd.toISOString()
    });
  } catch (error) {
    console.error('Error fetching teacher attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Guru check-in/check-out otomatis
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'GURU') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { action, notes } = await request.json(); // action: 'check-in' or 'check-out'

    if (!action || !['check-in', 'check-out'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be either "check-in" or "check-out"' 
      }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance log exists for today
    let attendanceLog = await db.teacherAttendanceLog.findFirst({
      where: {
        teacherId: decoded.userId,
        date: today
      }
    });

    if (action === 'check-in') {
      if (attendanceLog && attendanceLog.checkInTime) {
        return NextResponse.json({ 
          error: 'Already checked in today' 
        }, { status: 409 });
      }

      // Check if teacher has schedule today
      const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
      const schedule = await db.teacherSchedule.findFirst({
        where: {
          teacherId: decoded.userId,
          dayOfWeek,
          isActive: true
        }
      });

      const isScheduled = !!schedule;

      if (attendanceLog) {
        // Update existing log
        attendanceLog = await db.teacherAttendanceLog.update({
          where: { id: attendanceLog.id },
          data: {
            checkInTime: new Date(),
            status: 'HADIR',
            notes,
            isScheduled
          }
        });
      } else {
        // Create new log
        attendanceLog = await db.teacherAttendanceLog.create({
          data: {
            teacherId: decoded.userId,
            date: today,
            checkInTime: new Date(),
            status: 'HADIR',
            notes,
            isScheduled
          }
        });
      }

      return NextResponse.json({
        message: 'Check-in successful',
        attendanceLog
      });

    } else if (action === 'check-out') {
      if (!attendanceLog || !attendanceLog.checkInTime) {
        return NextResponse.json({ 
          error: 'Must check in first' 
        }, { status: 400 });
      }

      if (attendanceLog.checkOutTime) {
        return NextResponse.json({ 
          error: 'Already checked out today' 
        }, { status: 409 });
      }

      // Calculate overtime if applicable
      let overtimeHours = 0;
      if (attendanceLog.isScheduled) {
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        const schedule = await db.teacherSchedule.findFirst({
          where: {
            teacherId: decoded.userId,
            dayOfWeek,
            isActive: true
          }
        });

        if (schedule) {
          const scheduledEndTime = new Date(`${today.toISOString().split('T')[0]}T${schedule.endTime}:00`);
          const actualCheckOutTime = new Date();
          
          if (actualCheckOutTime > scheduledEndTime) {
            overtimeHours = (actualCheckOutTime.getTime() - scheduledEndTime.getTime()) / (1000 * 60 * 60);
          }
        }
      }

      attendanceLog = await db.teacherAttendanceLog.update({
        where: { id: attendanceLog.id },
        data: {
          checkOutTime: new Date(),
          notes,
          overtimeHours
        }
      });

      return NextResponse.json({
        message: 'Check-out successful',
        attendanceLog
      });
    }
  } catch (error) {
    console.error('Error processing attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function untuk mendapatkan nama hari
function getDayName(dayOfWeek: number): string {
  const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  return days[dayOfWeek] || '';
}