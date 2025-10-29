import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for adding members
const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID harus diisi'),
  role: z.enum(['KETUA', 'SEKRETARIS', 'ANGGOTA']),
});

// GET /api/admin/extracurriculars/[id]/members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const skip = (page - 1) * limit;

    // Check if extracurricular exists
    const extracurricular = await db.extracurricular.findUnique({
      where: { id: params.id },
    });

    if (!extracurricular) {
      return NextResponse.json(
        { error: 'Ekstrakurikuler tidak ditemukan' },
        { status: 404 }
      );
    }

    const where: any = {
      extracurricularId: params.id,
    };

    if (search) {
      where.student = {
        OR: [
          {
            name: {
              contains: search,
            },
          },
          {
            nis: {
              contains: search,
            },
          },
        ],
      };
    }

    if (role) {
      where.role = role;
    }

    const [members, total] = await Promise.all([
      db.extracurricularMember.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
              email: true,
              isActive: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { joinedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.extracurricularMember.count({ where }),
    ]);

    return NextResponse.json({
      data: members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching extracurricular members:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data anggota ekstrakurikuler' },
      { status: 500 }
    );
  }
}

// POST /api/admin/extracurriculars/[id]/members
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, role } = addMemberSchema.parse(body);

    // Check if extracurricular exists
    const extracurricular = await db.extracurricular.findUnique({
      where: { id: params.id },
      include: {
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

    // Check capacity
    if (extracurricular._count.members >= extracurricular.capacity) {
      return NextResponse.json(
        { error: 'Kapasitas ekstrakurikuler sudah penuh' },
        { status: 400 }
      );
    }

    // Check if user exists and is a student
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    if (user.role !== 'SISWA') {
      return NextResponse.json(
        { error: 'Hanya siswa yang dapat bergabung dalam ekstrakurikuler' },
        { status: 400 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'User tidak aktif' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await db.extracurricularMember.findUnique({
      where: {
        studentId_extracurricularId: {
          studentId: userId,
          extracurricularId: params.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User sudah menjadi anggota ekstrakurikuler ini' },
        { status: 400 }
      );
    }

    // Check role constraints
    if (role === 'KETUA' || role === 'SEKRETARIS') {
      const existingRole = await db.extracurricularMember.findFirst({
        where: {
          extracurricularId: params.id,
          role,
        },
      });

      if (existingRole) {
        return NextResponse.json(
          { error: `Role ${role.toLowerCase()} sudah dipegang oleh anggota lain` },
          { status: 400 }
        );
      }
    }

    const member = await db.extracurricularMember.create({
      data: {
        studentId: userId,
        extracurricularId: params.id,
        role,
      },
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
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding extracurricular member:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan anggota ekstrakurikuler' },
      { status: 500 }
    );
  }
}