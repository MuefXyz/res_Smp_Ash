import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  console.log("=== GET USER CARD ===");
  
  try {
    const { userId } = await params;
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cardId: true,
        isActive: true,
      },
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userRecord);
  } catch (error) {
    console.error("Error fetching user card:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      data: { 
        cardId: cardId,
        isActive: true  // Automatically activate user when card is assigned
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cardId: true,
        isActive: true,
      },
    });

    console.log("User updated successfully:", {
      id: updatedUser.id,
      name: updatedUser.name,
      cardId: updatedUser.cardId,
      isActive: updatedUser.isActive
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error assigning card ID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  console.log("=== DELETE USER CARD ===");
  
  try {
    const { userId } = await params;
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { 
        cardId: null,
        isActive: false  // Deactivate user when card is removed
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cardId: true,
        isActive: true,
      },
    });

    console.log("User card deleted successfully:", {
      id: updatedUser.id,
      name: updatedUser.name,
      cardId: updatedUser.cardId,
      isActive: updatedUser.isActive
    });

    return NextResponse.json({ message: "Card ID removed successfully", user: updatedUser });
  } catch (error) {
    console.error("Error removing card ID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
