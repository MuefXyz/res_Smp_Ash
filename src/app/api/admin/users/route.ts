import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get role from query parameter
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Build where clause
    const whereClause: any = {};
    if (role) {
      whereClause.role = role;
    }

    // Fetch users with optional role filter
    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        nis: true,
        nip: true,
        phone: true,
        address: true,
        cardId: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role, nis, nip, phone, address } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Check if NIS/NIP already exists
    if (nis) {
      const existingNis = await db.user.findUnique({
        where: { nis },
      });
      if (existingNis) {
        return NextResponse.json({ error: 'NIS already exists' }, { status: 400 });
      }
    }

    if (nip) {
      const existingNip = await db.user.findUnique({
        where: { nip },
      });
      if (existingNip) {
        return NextResponse.json({ error: 'NIP already exists' }, { status: 400 });
      }
    }

    // Create user
    const { hashPassword } = await import('@/lib/auth');
    const hashedPassword = await hashPassword(password);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        nis: nis || null,
        nip: nip || null,
        phone: phone || null,
        address: address || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        nis: true,
        nip: true,
        phone: true,
        address: true,
        cardId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create notification for admin
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'User Baru Ditambahkan',
        message: `${name} (${role}) telah ditambahkan ke sistem`,
        type: 'REGISTRATION',
      },
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}