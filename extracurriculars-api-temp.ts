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
    const isActive = searchParams.get('isActive');

    let whereClause: any = {};
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    const extracurriculars = await db.extracurricular.findMany({
      where: whereClause,
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
          },
        },
        members: {
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
            members: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(extracurriculars);

  } catch (error) {
    console.error('Error fetching extracurriculars:', error);
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
    const { name, description, coachId, schedule, venue, maxMembers } = body;

    // Validate required fields
    if (!name || !coachId) {
      return NextResponse.json({ 
        error: 'Name and coach are required' 
      }, { status: 400 });
    }

    // Validate coach
    const coach = await db.user.findFirst({
      where: {
        id: coachId,
        role: { in: ['GURU', 'STAFF'] },
        isActive: true,
      },
    });

    if (!coach) {
      return NextResponse.json({ 
        error: 'Invalid coach. Coach must be an active teacher or staff.' 
      }, { status: 400 });
    }

    // Check if extracurricular already exists
    const existingExtracurricular = await db.extracurricular.findFirst({
      where: {
        name,
        coachId,
      },
    });

    if (existingExtracurricular) {
      return NextResponse.json({ 
        error: 'Extracurricular with this name and coach already exists' 
      }, { status: 400 });
    }

    const newExtracurricular = await db.extracurricular.create({
      data: {
        name,
        description,
        coachId,
        schedule,
        venue,
        maxMembers: maxMembers || 30,
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
          },
        },
        _count: {
          select: {
            members: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Create notification for coach
    await db.notification.create({
      data: {
        userId: coachId,
        title: 'Penugasan Pembina Ekstrakurikuler',
        message: `Anda telah ditunjuk sebagai pembina ekstrakurikuler ${name}`,
        type: 'SYSTEM',
      },
    });

    return NextResponse.json({
      message: 'Extracurricular created successfully',
      extracurricular: newExtracurricular,
    });

  } catch (error) {
    console.error('Error creating extracurricular:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}