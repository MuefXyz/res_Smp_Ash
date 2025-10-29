import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

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

    // Get existing users for seeding
    const teachers = await db.user.findMany({
      where: { role: 'GURU', isActive: true },
    });

    const students = await db.user.findMany({
      where: { role: 'SISWA', isActive: true },
    });

    if (teachers.length === 0 || students.length === 0) {
      return NextResponse.json({ 
        error: 'No teachers or students found. Please create users first.' 
      }, { status: 400 });
    }

    const seededData = {
      classes: [] as any[],
      extracurriculars: [] as any[],
      classStudents: [] as any[],
      extracurricularMembers: [] as any[],
    };

    // 1. Seed Classes
    const classData = [
      { name: 'VII-A', level: 'VII', room: 'Ruang 101' },
      { name: 'VII-B', level: 'VII', room: 'Ruang 102' },
      { name: 'VIII-A', level: 'VIII', room: 'Ruang 201' },
      { name: 'VIII-B', level: 'VIII', room: 'Ruang 202' },
      { name: 'IX-A', level: 'IX', room: 'Ruang 301' },
      { name: 'IX-B', level: 'IX', room: 'Ruang 302' },
    ];

    for (const classInfo of classData) {
      const homeroomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
      
      const newClass = await db.class.create({
        data: {
          name: classInfo.name,
          level: classInfo.level,
          academicYear: '2024/2025',
          homeroomTeacherId: homeroomTeacher.id,
          room: classInfo.room,
          capacity: 30,
        },
      });

      seededData.classes.push(newClass);

      // 2. Assign students to classes
      const levelStudents = students.filter((student, index) => {
        if (classInfo.level === 'VII') return index < 20;
        if (classInfo.level === 'VIII') return index >= 20 && index < 40;
        if (classInfo.level === 'IX') return index >= 40;
        return false;
      });

      for (const student of levelStudents.slice(0, 15)) {
        const classStudent = await db.classStudent.create({
          data: {
            classId: newClass.id,
            studentId: student.id,
          },
        });
        seededData.classStudents.push(classStudent);
      }
    }

    // 3. Seed Extracurriculars
    const extracurricularData = [
      { 
        name: 'Pramuka', 
        description: 'Kegiatan kepramukaan untuk pembentuk karakter',
        schedule: 'Sabtu, 07:00-09:00',
        venue: 'Lapangan Sekolah'
      },
      { 
        name: 'Basket', 
        description: 'Olahraga basket untuk kesehatan dan kerjasama tim',
        schedule: 'Selasa & Kamis, 15:00-17:00',
        venue: 'Lapangan Basket'
      },
      { 
        name: 'Paduan Suara', 
        description: 'Kegiatan musik vokal untuk pengembangan bakat',
        schedule: 'Rabu, 14:00-16:00',
        venue: 'Ruang Musik'
      },
      { 
        name: 'PMR', 
        description: 'Palang Merah Remaja untuk keterampilan pertolongan pertama',
        schedule: 'Jumat, 13:00-15:00',
        venue: 'Ruang UKS'
      },
      { 
        name: 'Komputer', 
        description: 'Klub komputer untuk pengembangan teknologi',
        schedule: 'Senin, 15:00-17:00',
        venue: 'Lab Komputer'
      },
    ];

    for (const extracurricularInfo of extracurricularData) {
      const coach = teachers[Math.floor(Math.random() * teachers.length)];
      
      const newExtracurricular = await db.extracurricular.create({
        data: {
          name: extracurricularInfo.name,
          description: extracurricularInfo.description,
          coachId: coach.id,
          schedule: extracurricularInfo.schedule,
          venue: extracurricularInfo.venue,
          maxMembers: 30,
        },
      });

      seededData.extracurriculars.push(newExtracurricular);

      // 4. Assign students to extracurriculars
      const shuffledStudents = [...students].sort(() => 0.5 - Math.random());
      const selectedStudents = shuffledStudents.slice(0, 20);

      for (let i = 0; i < selectedStudents.length; i++) {
        const student = selectedStudents[i];
        const role = i === 0 ? 'Ketua' : i === 1 ? 'Sekretaris' : 'Anggota';
        
        const member = await db.extracurricularMember.create({
          data: {
            extracurricularId: newExtracurricular.id,
            studentId: student.id,
            role: role,
          },
        });
        seededData.extracurricularMembers.push(member);
      }
    }

    return NextResponse.json({
      message: 'School management data seeded successfully',
      data: {
        classesCreated: seededData.classes.length,
        extracurricularsCreated: seededData.extracurriculars.length,
        classStudentsAssigned: seededData.classStudents.length,
        extracurricularMembersAssigned: seededData.extracurricularMembers.length,
      },
    });

  } catch (error) {
    console.error('Error seeding school management data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}