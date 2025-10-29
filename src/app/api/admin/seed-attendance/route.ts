import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get all teachers
    const teachers = await db.user.findMany({
      where: {
        role: 'GURU',
        isActive: true
      }
    });

    if (teachers.length === 0) {
      return NextResponse.json(
        { error: 'No teachers found' },
        { status: 404 }
      );
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Generate sample attendance data for the current month
    const attendanceData = [];
    
    for (const teacher of teachers) {
      // Generate attendance for each day of the current month
      for (let day = 1; day <= 30; day++) {
        const attendanceDate = new Date(currentYear, currentMonth, day);
        const dayOfWeek = attendanceDate.getDay();
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }

        // Random status generation
        const random = Math.random();
        let status: 'HADIR' | 'ALPHA' | 'TERLAMBAT' | 'IZIN' | 'SAKIT';
        let checkInTime: Date | undefined;
        let checkOutTime: Date | undefined;

        if (random < 0.7) {
          // 70% chance of being present
          status = 'HADIR';
          checkInTime = new Date(currentYear, currentMonth, day, 7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
          checkOutTime = new Date(currentYear, currentMonth, day, 15 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        } else if (random < 0.8) {
          // 10% chance of being late
          status = 'TERLAMBAT';
          checkInTime = new Date(currentYear, currentMonth, day, 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
          checkOutTime = new Date(currentYear, currentMonth, day, 15 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        } else if (random < 0.9) {
          // 10% chance of being absent
          status = 'ALPHA';
        } else if (random < 0.95) {
          // 5% chance of being on leave
          status = 'IZIN';
        } else {
          // 5% chance of being sick
          status = 'SAKIT';
        }

        attendanceData.push({
          teacherId: teacher.id,
          date: attendanceDate,
          checkInTime,
          checkOutTime,
          status,
          notes: status === 'IZIN' ? 'Izin pribadi' : status === 'SAKIT' ? 'Sakit demam' : undefined,
          isScheduled: true
        });
      }
    }

    // Insert attendance data in batches
    const batchSize = 50;
    for (let i = 0; i < attendanceData.length; i += batchSize) {
      const batch = attendanceData.slice(i, i + batchSize);
      
      await db.teacherAttendanceLog.createMany({
        data: batch,
        skipDuplicates: true
      });
    }

    return NextResponse.json({
      message: 'Sample attendance data seeded successfully',
      totalRecords: attendanceData.length,
      teachersCount: teachers.length
    });

  } catch (error) {
    console.error('Error seeding attendance data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}