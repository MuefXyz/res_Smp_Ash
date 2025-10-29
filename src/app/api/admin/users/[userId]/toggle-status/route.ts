import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  console.log('=== TOGGLE STATUS GET REQUEST ===');
  
  try {
    const { userId } = await params;
    console.log('User ID:', userId);
    
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    console.log('Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    console.log('Decoded user:', user);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Target user ID:', userId);

    // Find the user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      console.log('User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Target user found:', targetUser.name, 'Current status:', targetUser.isActive);

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

    console.log('User status updated:', updatedUser);

    // Create notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Status User Diubah',
        message: `${targetUser.name} (${targetUser.role}) telah ${updatedUser.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
        type: 'SYSTEM',
      },
    });

    console.log('=== TOGGLE STATUS SUCCESS ===');
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  console.log('=== TOGGLE STATUS POST REQUEST ===');
  return GET(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  console.log('=== TOGGLE STATUS PATCH REQUEST ===');
  return GET(request, { params });
}