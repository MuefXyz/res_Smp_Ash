import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating coach attendance records
const createCoachAttendanceSchema = z.object({
  coachId: z.string().min(1, 'ID pelatih harus diisi'),
  date: z.string().min(1, 'Tanggal harus diisi'),
  startTime: z.string().min(1, 'Waktu mulai harus diisi'),
  endTime: z.string().min(1, 'Waktu selesai harus diisi'),
  status: z.enum(['HADIR', 'SAKIT', 'IZIN', 'ALPA']),
  participantsCount: z.number().min(0, 'Jumlah peserta tidak boleh negatif'),
  trainingContent: z.string().min(1, 'Materi latihan harus diisi'),
  notes: z.string().optional(),
});

// Schema for updating coach attendance records
const updateCoachAttendanceSchema = createCoachAttendanceSchema.partial();

// GET /api/admin/coach-attendance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const coachId = searchParams.get('coachId') || '';
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.coach = {
        OR: [
          {
            name: {
              contains: search,
            },
          },
          {
            nip: {
              contains: search,
            },
          },
        ],
      };
    }

    if (status) {
      where.status = status;
    }

    if (coachId) {
      where.coachId = coachId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = dateFrom;
      }
      if (dateTo) {
        where.date.lte = dateTo;
      }
    }

    const [attendances, total] = await Promise.all([
      db.coachAttendance.findMany({
        where,
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              nip: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      db.coachAttendance.count({ where }),
    ]);

    return NextResponse.json({
      data: attendances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching coach attendances:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data kehadiran pelatih' },
      { status: 500 }
    );
  }
}

// POST /api/admin/coach-attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCoachAttendanceSchema.parse(body);

    // Check if coach exists and is a teacher or staff
    const coach = await db.user.findUnique({
      where: { id: validatedData.coachId },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Pelatih tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!['GURU', 'STAFF'].includes(coach.role)) {
      return NextResponse.json(
        { error: 'Pelatih harus berupa guru atau staff' },
        { status: 400 }
      );
    }

    if (!coach.isActive) {
      return NextResponse.json(
        { error: 'Pelatih tidak aktif' },
        { status: 400 }
      );
    }

    // Check if attendance record already exists for this coach and date
    const existingAttendance = await db.coachAttendance.findFirst({
      where: {
        coachId: validatedData.coachId,
        date: validatedData.date,
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Data kehadiran untuk pelatih dan tanggal ini sudah ada' },
        { status: 400 }
      );
    }

    // Validate time format and logic
    const startTime = new Date(`2000-01-01T${validatedData.startTime}`);
    const endTime = new Date(`2000-01-01T${validatedData.endTime}`);
    
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'Waktu selesai harus lebih dari waktu mulai' },
        { status: 400 }
      );
    }

    const attendance = await db.coachAttendance.create({
      data: validatedData,
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            nip: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating coach attendance:', error);
    return NextResponse.json(
      { error: 'Gagal mencatat kehadiran pelatih' },
      { status: 500 }
    );
  }
}