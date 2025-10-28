import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    // Find the user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow deactivating self
    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
    }

    // Toggle user status
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isActive: !targetUser.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Status User Diubah',
        message: `${targetUser.name} (${targetUser.role}) telah ${updatedUser.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
        type: 'SYSTEM',
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}