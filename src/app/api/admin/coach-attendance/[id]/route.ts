import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for updating coach attendance records
const updateCoachAttendanceSchema = z.object({
  coachId: z.string().min(1, 'ID pelatih harus diisi').optional(),
  date: z.string().min(1, 'Tanggal harus diisi').optional(),
  startTime: z.string().min(1, 'Waktu mulai harus diisi').optional(),
  endTime: z.string().min(1, 'Waktu selesai harus diisi').optional(),
  status: z.enum(['HADIR', 'SAKIT', 'IZIN', 'ALPA']).optional(),
  participantsCount: z.number().min(0, 'Jumlah peserta tidak boleh negatif').optional(),
  trainingContent: z.string().min(1, 'Materi latihan harus diisi').optional(),
  notes: z.string().optional(),
});

// GET /api/admin/coach-attendance/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attendance = await db.coachAttendance.findUnique({
      where: { id: params.id },
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

    if (!attendance) {
      return NextResponse.json(
        { error: 'Data kehadiran pelatih tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching coach attendance:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data kehadiran pelatih' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/coach-attendance/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateCoachAttendanceSchema.parse(body);

    // Check if attendance record exists
    const existingAttendance = await db.coachAttendance.findUnique({
      where: { id: params.id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: 'Data kehadiran pelatih tidak ditemukan' },
        { status: 404 }
      );
    }

    // If coach is being updated, validate the new coach
    if (validatedData.coachId && validatedData.coachId !== existingAttendance.coachId) {
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
    }

    // If date is being updated, check for duplicates
    if (validatedData.date && validatedData.date !== existingAttendance.date) {
      const duplicateAttendance = await db.coachAttendance.findFirst({
        where: {
          coachId: validatedData.coachId || existingAttendance.coachId,
          date: validatedData.date,
          id: { not: params.id },
        },
      });

      if (duplicateAttendance) {
        return NextResponse.json(
          { error: 'Data kehadiran untuk pelatih dan tanggal ini sudah ada' },
          { status: 400 }
        );
      }
    }

    // Validate time logic if both times are provided
    const startTime = validatedData.startTime || existingAttendance.startTime;
    const endTime = validatedData.endTime || existingAttendance.endTime;
    
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

    const attendance = await db.coachAttendance.update({
      where: { id: params.id },
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

    return NextResponse.json(attendance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating coach attendance:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate data kehadiran pelatih' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coach-attendance/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if attendance record exists
    const existingAttendance = await db.coachAttendance.findUnique({
      where: { id: params.id },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            nip: true,
          },
        },
      },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: 'Data kehadiran pelatih tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.coachAttendance.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { 
        message: `Data kehadiran pelatih ${existingAttendance.coach.name} (${existingAttendance.coach.nip}) pada tanggal ${existingAttendance.date} berhasil dihapus` 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting coach attendance:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data kehadiran pelatih' },
      { status: 500 }
    );
  }
}