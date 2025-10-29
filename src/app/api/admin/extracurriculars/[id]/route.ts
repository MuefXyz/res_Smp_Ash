import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for updating extracurricular activities
const updateExtracurricularSchema = z.object({
  name: z.string().min(1, 'Nama ekstrakurikuler harus diisi').optional(),
  description: z.string().min(1, 'Deskripsi harus diisi').optional(),
  schedule: z.string().min(1, 'Jadwal harus diisi').optional(),
  venue: z.string().min(1, 'Lokasi harus diisi').optional(),
  maxMembers: z.number().min(1, 'Kapasitas minimal 1').optional(),
  coachId: z.string().min(1, 'Pembimbing harus dipilih').optional(),
});

// Schema for adding members
const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID harus diisi'),
  role: z.enum(['KETUA', 'SEKRETARIS', 'ANGGOTA']),
});

// GET /api/admin/extracurriculars/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const extracurricular = await db.extracurricular.findUnique({
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
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                nis: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
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

    return NextResponse.json(extracurricular);
  } catch (error) {
    console.error('Error fetching extracurricular:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data ekstrakurikuler' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/extracurriculars/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateExtracurricularSchema.parse(body);

    // Check if extracurricular exists
    const existingExtracurricular = await db.extracurricular.findUnique({
      where: { id: params.id },
    });

    if (!existingExtracurricular) {
      return NextResponse.json(
        { error: 'Ekstrakurikuler tidak ditemukan' },
        { status: 404 }
      );
    }

    // If coach is being updated, validate the new coach
    if (validatedData.coachId) {
      const coach = await db.user.findUnique({
        where: { id: validatedData.coachId },
      });

      if (!coach) {
        return NextResponse.json(
          { error: 'Pembimbing tidak ditemukan' },
          { status: 404 }
        );
      }

      if (!['GURU', 'STAFF'].includes(coach.role)) {
        return NextResponse.json(
          { error: 'Pembimbing harus berupa guru atau staff' },
          { status: 400 }
        );
      }
    }

    // If name is being updated, check for duplicates
    if (validatedData.name && validatedData.name !== existingExtracurricular.name) {
      const duplicateExtracurricular = await db.extracurricular.findFirst({
        where: {
          name: {
            equals: validatedData.name,
          },
          id: { not: params.id },
        },
      });

      if (duplicateExtracurricular) {
        return NextResponse.json(
          { error: 'Nama ekstrakurikuler sudah ada' },
          { status: 400 }
        );
      }
    }

    const extracurricular = await db.extracurricular.update({
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
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                nis: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json(extracurricular);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating extracurricular:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate ekstrakurikuler' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/extracurriculars/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if extracurricular exists
    const existingExtracurricular = await db.extracurricular.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!existingExtracurricular) {
      return NextResponse.json(
        { error: 'Ekstrakurikuler tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if there are active members
    if (existingExtracurricular._count.members > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus ekstrakurikuler yang memiliki anggota aktif' },
        { status: 400 }
      );
    }

    await db.extracurricular.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Ekstrakurikuler berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting extracurricular:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus ekstrakurikuler' },
      { status: 500 }
    );
  }
}