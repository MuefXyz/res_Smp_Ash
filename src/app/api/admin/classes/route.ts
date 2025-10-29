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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear') || '2024/2025';
    const level = searchParams.get('level');

    let whereClause: any = {
      academicYear,
      isActive: true,
    };

    if (level) {
      whereClause.level = level;
    }

    const classes = await db.class.findMany({
      where: whereClause,
      include: {
        homeroomTeacher: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
          },
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                nis: true,
                email: true,
              },
            },
          },
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            students: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(classes);

  } catch (error) {
    console.error('Error fetching classes:', error);
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, level, academicYear, homeroomTeacherId, room, capacity } = body;

    // Validate required fields
    if (!name || !level || !academicYear) {
      return NextResponse.json({ 
        error: 'Name, level, and academic year are required' 
      }, { status: 400 });
    }

    // Check if class already exists
    const existingClass = await db.class.findFirst({
      where: {
        name,
        academicYear,
      },
    });

    if (existingClass) {
      return NextResponse.json({ 
        error: 'Class with this name already exists for this academic year' 
      }, { status: 400 });
    }

    // Validate homeroom teacher if provided
    if (homeroomTeacherId) {
      const teacher = await db.user.findFirst({
        where: {
          id: homeroomTeacherId,
          role: 'GURU',
          isActive: true,
        },
      });

      if (!teacher) {
        return NextResponse.json({ 
          error: 'Invalid homeroom teacher' 
        }, { status: 400 });
      }
    }

    const newClass = await db.class.create({
      data: {
        name,
        level,
        academicYear,
        homeroomTeacherId,
        room,
        capacity: capacity || 30,
      },
      include: {
        homeroomTeacher: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
          },
        },
        _count: {
          select: {
            students: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Create notification for homeroom teacher
    if (homeroomTeacherId) {
      await db.notification.create({
        data: {
          userId: homeroomTeacherId,
          title: 'Penempatan Wali Kelas',
          message: `Anda telah ditunjuk sebagai wali kelas ${name} untuk tahun ajaran ${academicYear}`,
          type: 'SYSTEM',
        },
      });
    }

    return NextResponse.json({
      message: 'Class created successfully',
      class: newClass,
    });

  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}