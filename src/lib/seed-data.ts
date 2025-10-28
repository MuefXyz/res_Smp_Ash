import { db } from '@/lib/db';

export async function seedSubjects() {
  try {
    // Get teachers
    const teachers = await db.user.findMany({
      where: { role: 'GURU' }
    });

    if (teachers.length === 0) {
      console.log('No teachers found, skipping subject seeding');
      return;
    }

    // Create sample subjects
    const subjects = [
      { name: 'Matematika', description: 'Pelajaran matematika dasar', teacherId: teachers[0].id },
      { name: 'Bahasa Indonesia', description: 'Pelajaran bahasa Indonesia', teacherId: teachers[0].id },
      { name: 'Bahasa Inggris', description: 'Pelajaran bahasa Inggris', teacherId: teachers[0].id },
      { name: 'Ilmu Pengetahuan Alam (IPA)', description: 'Pelajaran IPA', teacherId: teachers[0].id },
      { name: 'Ilmu Pengetahuan Sosial (IPS)', description: 'Pelajaran IPS', teacherId: teachers[0].id },
    ];

    for (const subject of subjects) {
      await db.subject.upsert({
        where: { 
          teacherId_name: {
            teacherId: subject.teacherId,
            name: subject.name
          }
        },
        update: {},
        create: subject
      });
    }

    console.log('Subjects seeded successfully');
  } catch (error) {
    console.error('Error seeding subjects:', error);
  }
}

export async function seedTeacherSchedules() {
  try {
    // Get teachers and subjects
    const teachers = await db.user.findMany({
      where: { role: 'GURU' }
    });

    const subjects = await db.subject.findMany();

    if (teachers.length === 0 || subjects.length === 0) {
      console.log('No teachers or subjects found, skipping schedule seeding');
      return;
    }

    // Create sample schedules for first teacher
    const teacher = teachers[0];
    const schedules = [
      {
        teacherId: teacher.id,
        dayOfWeek: 1, // Senin
        startTime: '07:00',
        endTime: '09:00',
        subjectId: subjects[0]?.id, // Matematika
        room: 'Ruang A-1'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 1, // Senin
        startTime: '10:00',
        endTime: '12:00',
        subjectId: subjects[1]?.id, // Bahasa Indonesia
        room: 'Ruang B-2'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 3, // Rabu
        startTime: '07:00',
        endTime: '09:00',
        subjectId: subjects[0]?.id, // Matematika
        room: 'Ruang A-1'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 3, // Rabu
        startTime: '10:00',
        endTime: '12:00',
        subjectId: subjects[2]?.id, // Bahasa Inggris
        room: 'Ruang C-3'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 5, // Jumat
        startTime: '07:00',
        endTime: '09:00',
        subjectId: subjects[0]?.id, // Matematika
        room: 'Ruang A-1'
      },
      {
        teacherId: teacher.id,
        dayOfWeek: 5, // Jumat
        startTime: '10:00',
        endTime: '12:00',
        subjectId: subjects[3]?.id, // IPA
        room: 'Lab IPA'
      }
    ];

    for (const schedule of schedules) {
      if (schedule.subjectId) {
        await db.teacherSchedule.upsert({
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
      }
    }

    console.log('Teacher schedules seeded successfully');
  } catch (error) {
    console.error('Error seeding teacher schedules:', error);
  }
}