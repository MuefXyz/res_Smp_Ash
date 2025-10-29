import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/coach-attendance/coaches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const where: any = {
      isActive: true,
      role: {
        in: ['GURU', 'STAFF'],
      },
    };

    if (search) {
      where.OR = [
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
        {
          email: {
            contains: search,
          },
        },
      ];
    }

    if (role && ['GURU', 'STAFF'].includes(role)) {
      where.role = role;
    }

    const coaches = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        nip: true,
        email: true,
        role: true,
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(coaches);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pelatih' },
      { status: 500 }
    );
  }
}