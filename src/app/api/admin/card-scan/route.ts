import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { Server } from "socket.io";

export async function POST(
  request: NextRequest
) {
  console.log("=== CARD SCAN POST REQUEST ===");
  
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, scanType = "CHECK_IN", location, deviceInfo, notes } = body;

    if (!cardId) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
    }

    // Find user by cardId
    const userWithCard = await db.user.findUnique({
      where: { cardId: cardId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      }
    });

    if (!userWithCard) {
      return NextResponse.json({ error: "Card ID not found" }, { status: 404 });
    }

    if (!userWithCard.isActive) {
      return NextResponse.json({ error: "User is not active" }, { status: 400 });
    }

    // Create card scan record
    const cardScan = await db.cardScan.create({
      data: {
        cardId: cardId,
        userId: userWithCard.id,
        scanType: scanType,
        location: location || "Unknown",
        deviceInfo: deviceInfo || "Manual Scan",
        notes: notes,
        isValid: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    console.log("Card scan created:", {
      id: cardScan.id,
      cardId: cardScan.cardId,
      userId: cardScan.userId,
      userName: cardScan.user.name,
      scanType: cardScan.scanType,
      scanTime: cardScan.scanTime
    });

    // Emit real-time notification to admin room
    try {
      const io = (global as any).io as Server;
      if (io) {
        io.to('admin-room').emit('card-scan-notification', {
          cardId: cardScan.cardId,
          userId: cardScan.userId,
          userName: cardScan.user.name,
          userRole: cardScan.user.role,
          scanType: cardScan.scanType,
          location: cardScan.location,
          scanTime: cardScan.scanTime,
          timestamp: new Date().toISOString(),
          message: `${cardScan.user.name} (${cardScan.user.role}) melakukan ${scanType === 'CHECK_IN' ? 'Check In' : 'Check Out'}${cardScan.location ? ` di ${cardScan.location}` : ''}`
        });
      }
    } catch (socketError) {
      console.error('Error emitting socket notification:', socketError);
    }

    return NextResponse.json({
      success: true,
      message: `Check ${scanType === 'CHECK_IN' ? 'In' : 'Out'} successful for ${userWithCard.name}`,
      data: cardScan
    });

  } catch (error) {
    console.error("Error processing card scan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest
) {
  console.log("=== CARD SCAN GET REQUEST ===");
  
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');
    const scanType = searchParams.get('scanType');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (scanType) {
      where.scanType = scanType;
    }
    
    if (dateFrom || dateTo) {
      where.scanTime = {};
      if (dateFrom) {
        where.scanTime.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.scanTime.lte = new Date(dateTo);
      }
    }

    const [cardScans, total] = await Promise.all([
      db.cardScan.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              nis: true,
              nip: true,
            }
          }
        },
        orderBy: {
          scanTime: 'desc'
        },
        skip,
        take: limit,
      }),
      db.cardScan.count({ where })
    ]);

    return NextResponse.json({
      data: cardScans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching card scans:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}