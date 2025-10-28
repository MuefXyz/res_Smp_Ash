import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'GURU') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch learning posts for this teacher
    const posts = await db.learningPost.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'GURU') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, subjectId } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create learning post
    const newPost = await db.learningPost.create({
      data: {
        title,
        content,
        teacherId: user.id,
        subjectId: subjectId || null,
      },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create notification for all students
    const students = await db.user.findMany({
      where: {
        role: 'SISWA',
        isActive: true,
      },
    });

    await db.notification.createMany({
      data: students.map(student => ({
        userId: student.id,
        title: 'Informasi Pembelajaran Baru',
        message: `${title} - ${content.substring(0, 50)}...`,
        type: 'LEARNING',
      })),
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}