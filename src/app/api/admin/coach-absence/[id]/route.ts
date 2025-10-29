import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for updating coach absence records
const updateCoachAbsenceSchema = z.object({
  extracurricularId: z.string().min(1, 'ID ekstrakurikuler harus diisi').optional(),
  date: z.string().min(1, 'Tanggal harus diisi').optional(),
  status: z.enum(['HADIR', 'SAKIT', 'IZIN', 'ALPHA']).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  participantCount: z.number().min(0, 'Jumlah peserta tidak boleh negatif').optional(),
});

// GET /api/admin/coach-absence/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const absence = await db.coachAbsence.findUnique({
      where: { id: params.id },
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

    if (!absence) {
      return NextResponse.json(
        { error: 'Data absensi pembina tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(absence);
  } catch (error) {
    console.error('Error fetching coach absence:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data absensi pembina' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/coach-absence/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateCoachAbsenceSchema.parse(body);

    // Check if absence record exists
    const existingAbsence = await db.coachAbsence.findUnique({
      where: { id: params.id },
    });

    if (!existingAbsence) {
      return NextResponse.json(
        { error: 'Data absensi pembina tidak ditemukan' },
        { status: 404 }
      );
    }

    // If extracurricular is being updated, validate it
    if (validatedData.extracurricularId && validatedData.extracurricularId !== existingAbsence.extracurricularId) {
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
    }

    // If date is being updated, check for duplicates
    if (validatedData.date && validatedData.date !== existingAbsence.date.toISOString().split('T')[0]) {
      const duplicateAbsence = await db.coachAbsence.findFirst({
        where: {
          extracurricularId: validatedData.extracurricularId || existingAbsence.extracurricularId,
          date: {
            gte: new Date(validatedData.date + 'T00:00:00.000Z'),
            lt: new Date(validatedData.date + 'T23:59:59.999Z'),
          },
          id: { not: params.id },
        },
      });

      if (duplicateAbsence) {
        return NextResponse.json(
          { error: 'Data absensi untuk ekstrakurikuler dan tanggal ini sudah ada' },
          { status: 400 }
        );
      }
    }

    // Validate time logic if both times are provided
    const startTime = validatedData.startTime || existingAbsence.startTime;
    const endTime = validatedData.endTime || existingAbsence.endTime;
    
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (end <= start) {
        return NextResponse.json(
          { error: 'Waktu selesai harus lebih dari waktu mulai' },
          { status: 400 }
        );
      }
    }

    // If status is being updated to not HADIR, reason is required
    if (validatedData.status && validatedData.status !== 'HADIR' && !validatedData.reason) {
      return NextResponse.json(
        { error: 'Alasan harus diisi untuk status tidak hadir' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date + 'T12:00:00.000Z');
    }
    
    if (validatedData.startTime) {
      updateData.startTime = new Date(`2000-01-01T${validatedData.startTime}`);
    }
    
    if (validatedData.endTime) {
      updateData.endTime = new Date(`2000-01-01T${validatedData.endTime}`);
    }

    // If extracurricular is being updated, update coachId as well
    if (validatedData.extracurricularId && validatedData.extracurricularId !== existingAbsence.extracurricularId) {
      const extracurricular = await db.extracurricular.findUnique({
        where: { id: validatedData.extracurricularId },
        select: { coachId: true },
      });
      updateData.coachId = extracurricular?.coachId;
    }

    const absence = await db.coachAbsence.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(absence);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating coach absence:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate data absensi pembina' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coach-absence/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if absence record exists
    const existingAbsence = await db.coachAbsence.findUnique({
      where: { id: params.id },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            nip: true,
          },
        },
        extracurricular: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingAbsence) {
      return NextResponse.json(
        { error: 'Data absensi pembina tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.coachAbsence.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { 
        message: `Data absensi pembina ${existingAbsence.coach.name} untuk ekstrakurikuler ${existingAbsence.extracurricular.name} berhasil dihapus` 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting coach absence:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data absensi pembina' },
      { status: 500 }
    );
  }
}