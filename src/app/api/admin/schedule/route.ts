import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Mendapatkan semua jadwal guru (checklist hari)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const schedules = await db.teacherSchedule.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        attendanceLogs: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 7
        }
      },
      orderBy: [
        { teacher: { name: 'asc' } },
        { dayOfWeek: 'asc' }
      ]
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Membuat jadwal guru baru (checklist hari)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { teacherId, dayOfWeek, subjectId, room } = await request.json();

    // Convert dayOfWeek to number
    const dayOfWeekNum = parseInt(dayOfWeek);

    // Validasi input
    if (!teacherId || !dayOfWeek) {
      return NextResponse.json({ 
        error: 'Teacher ID and day of week are required' 
      }, { status: 400 });
    }

    // Handle "none" value for optional subjectId
    const finalSubjectId = subjectId === 'none' ? null : subjectId;

    // Validasi hari (1-7)
    if (isNaN(dayOfWeekNum) || dayOfWeekNum < 1 || dayOfWeekNum > 7) {
      return NextResponse.json({ 
        error: 'Day of week must be between 1 (Senin) and 7 (Minggu)' 
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

    // Cek apakah subject ada (jika diisi)
    if (finalSubjectId) {
      const subject = await db.subject.findUnique({
        where: { id: finalSubjectId }
      });
      if (!subject) {
        return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
      }
    }

    // Cek apakah jadwal sudah ada
    const existingSchedule = await db.teacherSchedule.findFirst({
      where: {
        teacherId,
        dayOfWeek: dayOfWeekNum
      }
    });

    if (existingSchedule) {
      return NextResponse.json({ 
        error: 'Schedule for this day already exists' 
      }, { status: 409 });
    }

    const schedule = await db.teacherSchedule.create({
      data: {
        teacherId,
        dayOfWeek: dayOfWeekNum,
        subjectId: finalSubjectId,
        room
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
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Buat notifikasi untuk guru
    await db.notification.create({
      data: {
        title: 'Jadwal Mengajar Baru',
        message: `Anda memiliki jadwal mengajar baru pada hari ${getDayName(dayOfWeekNum)}`,
        type: 'SYSTEM',
        userId: teacherId
      }
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      teacherId,
      dayOfWeek,
      subjectId,
      room
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function untuk mendapatkan nama hari
function getDayName(dayOfWeek: number): string {
  const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  return days[dayOfWeek] || '';
}