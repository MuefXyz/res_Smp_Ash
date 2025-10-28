import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  console.log("=== ASSIGN CARD ID POST REQUEST ===");
  
  try {
    const { userId } = await params;
    console.log("User ID:", userId);
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cardId } = body;

    if (!cardId) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
    }

    const existingCard = await db.user.findUnique({
      where: { cardId: cardId }
    });

    if (existingCard) {
      return NextResponse.json({ error: "Card ID already exists" }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { cardId: cardId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cardId: true,
        isActive: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error assigning card ID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
