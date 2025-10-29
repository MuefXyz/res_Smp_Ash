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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required' },
        { status: 400 }
      );
    }

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

    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month

    // Get all teachers
    const teachers = await db.user.findMany({
      where: {
        role: 'GURU',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        nip: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get all attendance records for the month
    const attendanceRecords = await db.teacherAttendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            nip: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { teacher: { name: 'asc' } }
      ]
    });

    // Transform attendance data
    const attendance = attendanceRecords.map(record => ({
      teacherId: record.teacherId,
      date: record.date.toISOString().split('T')[0],
      checkIn: record.checkIn?.toISOString().split('T')[1]?.substring(0, 5),
      checkOut: record.checkOut?.toISOString().split('T')[1]?.substring(0, 5),
      status: record.status,
      notes: record.notes
    }));

    const response = {
      teachers,
      attendance,
      month: monthNum,
      year
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching monthly attendance recap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}