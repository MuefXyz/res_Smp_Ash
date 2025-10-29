import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    const { teacherId, dayOfWeek, subjectId, room } = await request.json();

    // Convert dayOfWeek to number
    const dayOfWeekNum = parseInt(dayOfWeek);

    // Validate input
    if (!teacherId || !dayOfWeek) {
      return NextResponse.json({ 
        error: 'Teacher ID and day of week are required' 
      }, { status: 400 });
    }

    // Handle "none" value for optional subjectId
    const finalSubjectId = subjectId === 'none' ? null : subjectId;

    // Check if schedule exists
    const existingSchedule = await db.teacherSchedule.findUnique({
      where: { id }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Check for conflicts (excluding current schedule)
    const conflictSchedule = await db.teacherSchedule.findFirst({
      where: {
        teacherId,
        dayOfWeek: dayOfWeekNum,
        id: { not: id }
      }
    });

    if (conflictSchedule) {
      return NextResponse.json({ 
        error: 'Schedule for this day already exists' 
      }, { status: 409 });
    }

    const updatedSchedule = await db.teacherSchedule.update({
      where: { id },
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

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;

    // Check if schedule exists
    const existingSchedule = await db.teacherSchedule.findUnique({
      where: { id }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    await db.teacherSchedule.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}