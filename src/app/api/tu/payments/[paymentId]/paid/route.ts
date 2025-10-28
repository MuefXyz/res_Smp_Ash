import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
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

    const { paymentId } = params;

    // Find the payment
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
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
        userId: payment.student.id,
        title: 'Pembayaran Dikonfirmasi',
        message: `Pembayaran ${payment.type} Anda telah dikonfirmasi`,
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
        title: 'Pembayaran Dikonfirmasi',
        message: `${payment.student.name} - ${payment.type} Rp ${payment.amount.toLocaleString()}`,
        type: 'PAYMENT',
      })),
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}