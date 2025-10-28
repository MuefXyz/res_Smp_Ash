import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  nis?: string;
  nip?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      nis: user.nis,
      nip: user.nip,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  nis?: string;
  nip?: string;
  phone?: string;
  address?: string;
}) {
  const hashedPassword = await hashPassword(data.password);
  
  const user = await db.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      nis: true,
      nip: true,
      phone: true,
      address: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
}

export async function authenticateUser(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
      nis: true,
      nip: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  // Remove password from returned object
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: 'REGISTRATION' | 'ABSENCE' | 'PAYMENT' | 'LEARNING' | 'SYSTEM';
}) {
  return await db.notification.create({
    data,
  });
}

export async function getUserNotifications(userId: string, unreadOnly = false) {
  return await db.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function markNotificationAsRead(notificationId: string) {
  return await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}