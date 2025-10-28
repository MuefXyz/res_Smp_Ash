import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all subjects
    const subjects = await db.subject.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            nip: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, teacherId } = body;

    // Validate required fields
    if (!name || !teacherId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if teacher exists and is a GURU
    const teacher = await db.user.findFirst({
      where: {
        id: teacherId,
        role: 'GURU'
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found or not a GURU' }, { status: 404 });
    }

    // Create subject
    const newSubject = await db.subject.create({
      data: {
        name,
        description: description || null,
        teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            nip: true
          }
        }
      }
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}