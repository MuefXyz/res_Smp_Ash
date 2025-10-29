import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating coach absence records
const createCoachAbsenceSchema = z.object({
  extracurricularId: z.string().min(1, 'ID ekstrakurikuler harus diisi'),
  date: z.string().min(1, 'Tanggal harus diisi'),
  status: z.enum(['HADIR', 'SAKIT', 'IZIN', 'ALPHA']),
  reason: z.string().optional(),
  notes: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  participantCount: z.number().min(0, 'Jumlah peserta tidak boleh negatif').optional(),
});

// Schema for updating coach absence records
const updateCoachAbsenceSchema = createCoachAbsenceSchema.partial();

// GET /api/admin/coach-absence
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const extracurricularId = searchParams.get('extracurricularId') || '';
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

    if (extracurricularId) {
      where.extracurricularId = extracurricularId;
    }

    if (date) {
      where.date = {
        gte: new Date(date + 'T00:00:00.000Z'),
        lt: new Date(date + 'T23:59:59.999Z'),
      };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom + 'T00:00:00.000Z');
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    const [absences, total] = await Promise.all([
      db.coachAbsence.findMany({
        where,
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              nip: true,
              email: true,
              role: true,
            },
          },
          extracurricular: {
            select: {
              id: true,
              name: true,
              schedule: true,
              venue: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      db.coachAbsence.count({ where }),
    ]);

    return NextResponse.json(absences);
  } catch (error) {
    console.error('Error fetching coach absences:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data absensi pembina' },
      { status: 500 }
    );
  }
}

// POST /api/admin/coach-absence
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCoachAbsenceSchema.parse(body);

    // Check if extracurricular exists and get coach info
    const extracurricular = await db.extracurricular.findUnique({
      where: { id: validatedData.extracurricularId },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            nip: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!extracurricular) {
      return NextResponse.json(
        { error: 'Ekstrakurikuler tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!extracurricular.isActive) {
      return NextResponse.json(
        { error: 'Ekstrakurikuler tidak aktif' },
        { status: 400 }
      );
    }

    if (!extracurricular.coach.isActive) {
      return NextResponse.json(
        { error: 'Pembina tidak aktif' },
        { status: 400 }
      );
    }

    // Check if absence record already exists for this extracurricular and date
    const existingAbsence = await db.coachAbsence.findFirst({
      where: {
        extracurricularId: validatedData.extracurricularId,
        date: {
          gte: new Date(validatedData.date + 'T00:00:00.000Z'),
          lt: new Date(validatedData.date + 'T23:59:59.999Z'),
        },
      },
    });

    if (existingAbsence) {
      return NextResponse.json(
        { error: 'Data absensi untuk ekstrakurikuler dan tanggal ini sudah ada' },
        { status: 400 }
      );
    }

    // Validate time format and logic
    if (validatedData.startTime && validatedData.endTime) {
      const startTime = new Date(`2000-01-01T${validatedData.startTime}`);
      const endTime = new Date(`2000-01-01T${validatedData.endTime}`);
      
      if (endTime <= startTime) {
        return NextResponse.json(
          { error: 'Waktu selesai harus lebih dari waktu mulai' },
          { status: 400 }
        );
      }
    }

    // If status is not HADIR, reason is required
    if (validatedData.status !== 'HADIR' && !validatedData.reason) {
      return NextResponse.json(
        { error: 'Alasan harus diisi untuk status tidak hadir' },
        { status: 400 }
      );
    }

    const absence = await db.coachAbsence.create({
      data: {
        coachId: extracurricular.coachId,
        extracurricularId: validatedData.extracurricularId,
        date: new Date(validatedData.date + 'T12:00:00.000Z'), // Set to noon to avoid timezone issues
        status: validatedData.status,
        reason: validatedData.reason,
        notes: validatedData.notes,
        startTime: validatedData.startTime ? 
          new Date(`2000-01-01T${validatedData.startTime}`) : null,
        endTime: validatedData.endTime ? 
          new Date(`2000-01-01T${validatedData.endTime}`) : null,
        participantCount: validatedData.participantCount,
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            nip: true,
            email: true,
            role: true,
          },
        },
        extracurricular: {
          select: {
            id: true,
            name: true,
            schedule: true,
            venue: true,
          },
        },
      },
    });

    return NextResponse.json(absence, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating coach absence:', error);
    return NextResponse.json(
      { error: 'Gagal mencatat absensi pembina' },
      { status: 500 }
    );
  }
}