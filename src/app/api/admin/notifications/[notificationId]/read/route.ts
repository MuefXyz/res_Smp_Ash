import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  console.log('=== MARK NOTIFICATION AS READ GET REQUEST ===');
  console.log('Notification ID:', params.notificationId);
  
  try {
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

    const { notificationId } = params;
    console.log('Target notification ID:', notificationId);

    // Check if notification exists and belongs to user
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      console.log('Notification not found:', notificationId);
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    console.log('Notification found:', notification.title, 'Current read status:', notification.isRead);

    // Mark notification as read
    const updatedNotification = await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
      },
    });

    console.log('Notification marked as read:', updatedNotification.id);
    console.log('=== MARK NOTIFICATION AS READ SUCCESS ===');

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  console.log('=== MARK NOTIFICATION AS READ POST REQUEST ===');
  return GET(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  console.log('=== MARK NOTIFICATION AS READ PATCH REQUEST ===');
  return GET(request, { params });
}