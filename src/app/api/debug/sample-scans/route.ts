import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log("=== CREATING SAMPLE SCAN DATA ===");
    
    // Get users with card IDs
    const users = await db.user.findMany({
      where: {
        cardId: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        role: true,
        cardId: true,
      }
    });

    console.log(`Found ${users.length} users with cards:`, users);

    if (users.length === 0) {
      return NextResponse.json({ error: "No users with card IDs found" }, { status: 404 });
    }

    // Create sample scan data for the last few days
    const sampleScans = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const scanDate = new Date(today);
      scanDate.setDate(today.getDate() - i);
      
      for (const user of users.slice(0, 3)) { // Only use first 3 users
        // Check IN in the morning
        const checkInTime = new Date(scanDate);
        checkInTime.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
        
        sampleScans.push({
          cardId: user.cardId!,
          userId: user.id,
          scanType: 'CHECK_IN' as const,
          scanTime: checkInTime,
          location: ['Gerbang Utama', 'Gerbang Belakang', 'Kelas 7A'][Math.floor(Math.random() * 3)],
          deviceInfo: 'Sample Data Generator',
          isValid: true,
        });

        // Check OUT in the afternoon
        const checkOutTime = new Date(scanDate);
        checkOutTime.setHours(14 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
        
        sampleScans.push({
          cardId: user.cardId!,
          userId: user.id,
          scanType: 'CHECK_OUT' as const,
          scanTime: checkOutTime,
          location: ['Gerbang Utama', 'Gerbang Belakang', 'Kelas 7A'][Math.floor(Math.random() * 3)],
          deviceInfo: 'Sample Data Generator',
          isValid: true,
        });
      }
    }

    // Insert sample scans
    const insertedScans = await db.cardScan.createMany({
      data: sampleScans,
      skipDuplicates: true,
    });

    // Also create/update absence records
    for (const user of users.slice(0, 3)) {
      for (let i = 0; i < 5; i++) {
        const absenceDate = new Date(today);
        absenceDate.setDate(today.getDate() - i);
        absenceDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(absenceDate);
        nextDay.setDate(absenceDate.getDate() + 1);

        await db.absence.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date: absenceDate,
            }
          },
          update: {
            status: 'HADIR',
            reason: null,
          },
          create: {
            userId: user.id,
            date: absenceDate,
            status: 'HADIR',
          },
        });
      }
    }

    console.log(`Created ${insertedScans.count} sample scan records`);

    return NextResponse.json({
      message: "Sample data created successfully",
      scansCreated: insertedScans.count,
      users: users.map(u => ({ name: u.name, role: u.role, cardId: u.cardId }))
    });

  } catch (error) {
    console.error("Error creating sample data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}