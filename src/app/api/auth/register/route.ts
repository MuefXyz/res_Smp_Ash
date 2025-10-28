import { NextRequest, NextResponse } from 'next/server';
import { createUser, createNotification } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, nis, nip, phone, address } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Validate NIS/NIP uniqueness if provided
    if (nis) {
      const existingNis = await db.user.findUnique({
        where: { nis },
      });
      if (existingNis) {
        return NextResponse.json(
          { error: 'NIS already exists' },
          { status: 400 }
        );
      }
    }

    if (nip) {
      const existingNip = await db.user.findUnique({
        where: { nip },
      });
      if (existingNip) {
        return NextResponse.json(
          { error: 'NIP already exists' },
          { status: 400 }
        );
      }
    }

    // Create user
    const user = await createUser({
      email,
      password,
      name,
      role: role as UserRole,
      nis,
      nip,
      phone,
      address,
    });

    // Create notification for admin
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'Pendaftaran Pengguna Baru',
        message: `Pengguna baru dengan nama ${name} dan role ${role} telah mendaftar.`,
        type: 'REGISTRATION',
      });
    }

    // Send welcome notification using ZAI
    try {
      const zai = await ZAI.create();
      
      const welcomeMessage = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for a school system. Generate a welcome message for new users.'
          },
          {
            role: 'user',
            content: `Generate a welcome message for a new ${role} named ${name} who just registered at SMP ASH SOLIHIN.`
          }
        ],
      });

      const welcomeNotification = await createNotification({
        userId: user.id,
        title: 'Selamat Datang di SMP ASH SOLIHIN',
        message: welcomeMessage.choices[0]?.message?.content || 'Selamat bergabung dengan sistem SMP ASH SOLIHIN!',
        type: 'SYSTEM',
      });

    } catch (error) {
      console.error('Error generating welcome message:', error);
    }

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        nis: user.nis,
        nip: user.nip,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}