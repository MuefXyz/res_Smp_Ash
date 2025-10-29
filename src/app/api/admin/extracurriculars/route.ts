import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating extracurricular activities
const createExtracurricularSchema = z.object({
  name: z.string().min(1, 'Nama ekstrakurikuler harus diisi'),
  description: z.string().min(1, 'Deskripsi harus diisi'),
  schedule: z.string().min(1, 'Jadwal harus diisi'),
  venue: z.string().min(1, 'Lokasi harus diisi'),
  maxMembers: z.number().min(1, 'Kapasitas minimal 1'),
  coachId: z.string().min(1, 'Pembimbing harus dipilih'),
});

// Schema for updating extracurricular activities
const updateExtracurricularSchema = createExtracurricularSchema.partial();

// Schema for adding members
const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID harus diisi'),
  role: z.enum(['KETUA', 'SEKRETARIS', 'ANGGOTA']),
});

// GET /api/admin/extracurriculars
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};

    const [extracurriculars, total] = await Promise.all([
      db.extracurricular.findMany({
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
        orderBy: {
          name: 'asc',
        },
        skip,
        take: limit,
      }),
      db.extracurricular.count({ where }),
    ]);

    return NextResponse.json(extracurriculars);
  } catch (error) {
    console.error('Error fetching extracurriculars:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data ekstrakurikuler' },
      { status: 500 }
    );
  }
}

// POST /api/admin/extracurriculars
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createExtracurricularSchema.parse(body);

    // Check if coach exists and is a teacher or staff
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

    // Check if extracurricular name already exists
    const existingExtracurricular = await db.extracurricular.findFirst({
      where: {
        name: {
          equals: validatedData.name,
        },
      },
    });

    if (existingExtracurricular) {
      return NextResponse.json(
        { error: 'Nama ekstrakurikuler sudah ada' },
        { status: 400 }
      );
    }

    const extracurricular = await db.extracurricular.create({
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
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json(extracurricular, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating extracurricular:', error);
    return NextResponse.json(
      { error: 'Gagal membuat ekstrakurikuler' },
      { status: 500 }
    );
  }
}