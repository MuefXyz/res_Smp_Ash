import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

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

    // Get teachers
    const teachers = await db.user.findMany({
      where: { role: 'GURU' }
    });

    if (teachers.length === 0) {
      return NextResponse.json({ error: 'No teachers found' }, { status: 400 });
    }

    // Create sample subjects
    const subjects = [
      { name: 'Matematika', description: 'Pelajaran matematika dasar', teacherId: teachers[0].id },
      { name: 'Bahasa Indonesia', description: 'Pelajaran bahasa Indonesia', teacherId: teachers[0].id },
      { name: 'Bahasa Inggris', description: 'Pelajaran bahasa Inggris', teacherId: teachers[0].id },
      { name: 'Ilmu Pengetahuan Alam (IPA)', description: 'Pelajaran IPA', teacherId: teachers[0].id },
      { name: 'Ilmu Pengetahuan Sosial (IPS)', description: 'Pelajaran IPS', teacherId: teachers[0].id },
    ];

    const createdSubjects = [];
    for (const subject of subjects) {
      const createdSubject = await db.subject.upsert({
        where: { 
          teacherId_name: {
            teacherId: subject.teacherId,
            name: subject.name
          }
        },
        update: {},
        create: subject
      });
      createdSubjects.push(createdSubject);
    }

    // Create sample schedules for first teacher
    const teacher = teachers[0];
    const schedules = [
      {
        teacherId: teacher.id,
        dayOfWeek: 1, // Senin
        startTime: '07:00',
        endTime: '09:00',
        subjectId: createdSubjects[0]?.id, // Matematika
        room: 'Ruang A-1'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 1, // Senin
        startTime: '10:00',
        endTime: '12:00',
        subjectId: createdSubjects[1]?.id, // Bahasa Indonesia
        room: 'Ruang B-2'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 3, // Rabu
        startTime: '07:00',
        endTime: '09:00',
        subjectId: createdSubjects[0]?.id, // Matematika
        room: 'Ruang A-1'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 3, // Rabu
        startTime: '10:00',
        endTime: '12:00',
        subjectId: createdSubjects[2]?.id, // Bahasa Inggris
        room: 'Ruang C-3'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 5, // Jumat
        startTime: '07:00',
        endTime: '09:00',
        subjectId: createdSubjects[0]?.id, // Matematika
        room: 'Ruang A-1'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 5, // Jumat
        startTime: '10:00',
        endTime: '12:00',
        subjectId: createdSubjects[3]?.id, // IPA
        room: 'Lab IPA'
      }
    ];

    const createdSchedules = [];
    for (const schedule of schedules) {
      if (schedule.subjectId) {
        const createdSchedule = await db.teacherSchedule.upsert({
          where: {
            teacherId_dayOfWeek_startTime: {
              teacherId: schedule.teacherId,
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime
            }
          },
          update: {},
          create: schedule
        });
        createdSchedules.push(createdSchedule);
      }
    }

    return NextResponse.json({
      message: 'Data seeded successfully',
      subjects: createdSubjects.length,
      schedules: createdSchedules.length
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}