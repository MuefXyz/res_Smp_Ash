import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'TU') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all payments with student info
    const payments = await db.payment.findMany({
      include: {
        student: {
          select: {
            name: true,
            nis: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'TU') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, type, amount, dueDate, description } = body;

    // Validate required fields
    if (!studentId || !type || !amount || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create payment
    const newPayment = await db.payment.create({
      data: {
        studentId,
        type,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        description: description || null,
      },
      include: {
        student: {
          select: {
            name: true,
            nis: true,
          },
        },
      },
    });

    // Create notification for student
    await db.notification.create({
      data: {
        userId: studentId,
        title: 'Pembayaran Baru',
        message: `${type} - Rp ${amount.toLocaleString()} - Jatuh tempo: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'PAYMENT',
      },
    });

    // Create notification for admin
    const admins = await db.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
    });

    await db.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        title: 'Pembayaran Baru Ditambahkan',
        message: `${newPayment.student.name} - ${type} Rp ${amount.toLocaleString()}`,
        type: 'PAYMENT',
      })),
    });

    return NextResponse.json(newPayment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}