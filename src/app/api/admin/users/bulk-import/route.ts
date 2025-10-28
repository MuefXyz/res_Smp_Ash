import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('=== BULK IMPORT START ===');
  
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    console.log('Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { users } = body;
    console.log('Users array:', users);

    if (!users || !Array.isArray(users)) {
      console.log('Invalid users format');
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    console.log('Processing', users.length, 'users');
    
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      console.log(`Processing user ${i + 1}:`, userData);
      
      try {
        // Validate required fields
        if (!userData.name || !userData.email || !userData.role) {
          const errorMsg = `Data tidak valid: ${userData.name || 'Unknown'} - Field required missing (name: ${!!userData.name}, email: ${!!userData.email}, role: ${!!userData.role})`;
          errors.push(errorMsg);
          console.error('Validation error:', errorMsg);
          failed++;
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          const errorMsg = `Email tidak valid untuk ${userData.name}: ${userData.email}`;
          errors.push(errorMsg);
          console.error('Invalid email:', errorMsg);
          failed++;
          continue;
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          const errorMsg = `User dengan email ${userData.email} sudah ada`;
          errors.push(errorMsg);
          console.error('Duplicate email:', errorMsg);
          failed++;
          continue;
        }

        // Check if NIS already exists (if provided)
        if (userData.nis && userData.nis.trim()) {
          const existingNis = await db.user.findUnique({
            where: { nis: userData.nis.trim() }
          });

          if (existingNis) {
            const errorMsg = `User dengan NIS ${userData.nis} sudah ada`;
            errors.push(errorMsg);
            console.error('Duplicate NIS:', errorMsg);
            failed++;
            continue;
          }
        }

        // Check if NIP already exists (if provided)
        if (userData.nip && userData.nip.trim()) {
          const existingNip = await db.user.findUnique({
            where: { nip: userData.nip.trim() }
          });

          if (existingNip) {
            const errorMsg = `User dengan NIP ${userData.nip} sudah ada`;
            errors.push(errorMsg);
            console.error('Duplicate NIP:', errorMsg);
            failed++;
            continue;
          }
        }

        // Validate role
        const validRoles = ['ADMIN', 'GURU', 'TU', 'SISWA'];
        if (!validRoles.includes(userData.role)) {
          const errorMsg = `Role tidak valid untuk ${userData.name}: ${userData.role}. Role yang valid: ${validRoles.join(', ')}`;
          errors.push(errorMsg);
          console.error('Invalid role:', errorMsg);
          failed++;
          continue;
        }

        // Hash password
        const hashedPassword = await hashPassword(userData.password || 'password123');

        // Create user
        const newUser = await db.user.create({
          data: {
            name: userData.name.trim(),
            email: userData.email.trim().toLowerCase(),
            password: hashedPassword,
            role: userData.role,
            nis: userData.nis ? userData.nis.trim() : null,
            nip: userData.nip ? userData.nip.trim() : null,
            phone: userData.phone ? userData.phone.trim() : null,
            address: userData.address ? userData.address.trim() : null,
            isActive: true
          }
        });

        console.log('Successfully imported user:', newUser.name, newUser.email);
        imported++;
      } catch (error) {
        console.error('Error importing user:', error, userData);
        const errorMsg = `Gagal import user ${userData.name || 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        failed++;
      }
    }

    const result = {
      message: 'Import completed',
      imported,
      failed,
      errors: errors.slice(0, 20) // Return only first 20 errors
    };
    
    console.log('=== BULK IMPORT RESULT ===');
    console.log('Result:', result);
    console.log('=== BULK IMPORT END ===');

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}