import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Mendapatkan log kehadiran guru
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const date = searchParams.get('date');

    let whereClause: any = {};
    
    if (teacherId) {
      whereClause.teacherId = teacherId;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      whereClause.date = {
        gte: startDate,
        lt: endDate
      };
    }

    const attendanceLogs = await db.teacherAttendanceLog.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true
          }
        },
        schedule: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(attendanceLogs);
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Mencatat kehadiran guru
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { teacherId, scheduleId, status, notes, checkInTime, checkOutTime } = await request.json();

    // Validasi input
    if (!teacherId || !status) {
      return NextResponse.json({ 
        error: 'Teacher ID and status are required' 
      }, { status: 400 });
    }

    // Cek apakah guru ada
    const teacher = await db.user.findFirst({
      where: {
        id: teacherId,
        role: 'GURU'
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Cek apakah ada log untuk hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingLog = await db.teacherAttendanceLog.findFirst({
      where: {
        teacherId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingLog) {
      return NextResponse.json({ 
        error: 'Attendance for today already recorded' 
      }, { status: 409 });
    }

    const attendanceLog = await db.teacherAttendanceLog.create({
      data: {
        teacherId,
        scheduleId,
        status,
        notes,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        isScheduled: !!scheduleId
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true
          }
        },
        schedule: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Buat notifikasi untuk guru
    await db.notification.create({
      data: {
        title: 'Kehadiran Dicatat',
        message: `Kehadiran Anda telah dicatat: ${status}`,
        type: 'SYSTEM',
        userId: teacherId
      }
    });

    return NextResponse.json(attendanceLog, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}