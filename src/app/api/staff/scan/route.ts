import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  console.log("=== GET SCAN HISTORY ===");
  
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = verifyToken(token);
    
    if (!staff || staff.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const scans = await db.cardScan.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(scans);

  } catch (error) {
    console.error("Error fetching scan history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("=== CARD SCAN REQUEST ===");
  
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = verifyToken(token);
    
    if (!staff || staff.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, scanType, location, deviceInfo } = body;

    if (!cardId) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { cardId: cardId }
    });

    if (!user) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const cardScan = await db.cardScan.create({
      data: {
        cardId: cardId,
        userId: user.id,
        scanType: scanType || "CHECK_IN",
        location: location || "Unknown",
        deviceInfo: deviceInfo || "Staff Scanner",
        isValid: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAbsence = await db.absence.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingAbsence) {
      await db.absence.update({
        where: { id: existingAbsence.id },
        data: { status: "HADIR", reason: null }
      });
    } else {
      await db.absence.create({
        data: {
          userId: user.id,
          status: "HADIR",
          date: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
      scan: cardScan,
    });

  } catch (error) {
    console.error("Error processing card scan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
