import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Create teacher user
  const teacherPassword = await hashPassword('guru123');
  const teacher = await prisma.user.upsert({
    where: { email: 'guru@demo.com' },
    update: {},
    create: {
      email: 'guru@demo.com',
      password: teacherPassword,
      name: 'Budi Santoso, S.Pd',
      role: 'GURU',
      nip: '198001012005011001',
      phone: '08123456789',
      address: 'Jakarta Selatan',
      isActive: true,
    },
  });

  // Create student user
  const studentPassword = await hashPassword('siswa123');
  const student = await prisma.user.upsert({
    where: { email: 'siswa@demo.com' },
    update: {},
    create: {
      email: 'siswa@demo.com',
      password: studentPassword,
      name: 'Ahmad Rizki',
      role: 'SISWA',
      nis: '2024001',
      phone: '08123456788',
      address: 'Jakarta Timur',
      isActive: true,
    },
  });

  // Create TU user
  const tuPassword = await hashPassword('tu123');
  const tu = await prisma.user.upsert({
    where: { email: 'tu@demo.com' },
    update: {},
    create: {
      email: 'tu@demo.com',
      password: tuPassword,
      name: 'Siti Nurhaliza',
      role: 'TU',
      nip: '198502022010022001',
      phone: '08123456787',
      address: 'Jakarta Pusat',
      isActive: true,
    },
  });

  // Create some sample subjects
  const mathSubject = await prisma.subject.upsert({
    where: { id: 'math-subject' },
    update: {},
    create: {
      id: 'math-subject',
      name: 'Matematika',
      description: 'Pelajaran Matematika untuk kelas 7-9',
      teacherId: teacher.id,
    },
  });

  const scienceSubject = await prisma.subject.upsert({
    where: { id: 'science-subject' },
    update: {},
    create: {
      id: 'science-subject',
      name: 'IPA',
      description: 'Pelajaran Ilmu Pengetahuan Alam',
      teacherId: teacher.id,
    },
  });

  // Create some sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: 'User Baru Mendaftar',
        message: 'Siswa baru telah mendaftar ke sistem',
        type: 'REGISTRATION',
        isRead: false,
      },
      {
        userId: admin.id,
        title: 'Absensi Guru',
        message: 'Budi Santoso telah melakukan absensi hari ini',
        type: 'ABSENCE',
        isRead: false,
      },
      {
        userId: admin.id,
        title: 'Pembayaran SPP',
        message: 'Ahmad Rizki telah membayar SPP bulan ini',
        type: 'PAYMENT',
        isRead: true,
      },
    ],
  });

  // Create some sample absences
  await prisma.absence.createMany({
    data: [
      {
        userId: teacher.id,
        status: 'HADIR',
        date: new Date(),
      },
      {
        userId: student.id,
        status: 'HADIR',
        date: new Date(),
      },
    ],
  });

  // Create some sample payments
  await prisma.payment.createMany({
    data: [
      {
        studentId: student.id,
        type: 'SPP',
        amount: 150000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'PENDING',
        description: 'SPP Bulan Januari 2024',
      },
    ],
  });

  // Create some sample learning posts
  await prisma.learningPost.createMany({
    data: [
      {
        title: 'Tugas Matematika Kelas 7',
        content: 'Kerjakan soal-soal di halaman 45-47 tentang operasi bilangan bulat',
        teacherId: teacher.id,
        subjectId: mathSubject.id,
      },
      {
        title: 'Praktikum IPA',
        content: 'Besok akan ada praktikum tentang sifat-sifat cahaya. Jangan lupa bawa alat tulis',
        teacherId: teacher.id,
        subjectId: scienceSubject.id,
      },
    ],
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });